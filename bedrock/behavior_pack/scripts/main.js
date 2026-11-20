// 极简小地图 · 基岩版行为包入口
//
// 只使用两份已核对的稳定模块（见 VERSION-EVIDENCE.md / docs/02-API白名单.md）：
//   @minecraft/server    2.4.0 -> world / system / Dimension / Player / 动态属性 / 自定义命令
//   @minecraft/server-ui 2.0.0 -> ActionFormData / ModalFormData
//
// 与 Java(Fabric) 端的已知差距（详见 docs/03-不可对齐项声明.md）：
//   1) 基岩脚本 API 没有按键绑定，M 键无法映射，改用脚本注册的聊天命令 simplemap:markers；
//   2) 没有逐帧屏幕像素画布，地形用 actionbar 文本通道的 7×7 离散色块网格表达，
//      位置在动作栏而非屏幕角落，分辨率远低于 Fabric 的 64×64 逐像素；
//   3) 没有纯客户端本机文件存储，探索与标记写在玩家实体动态属性上，
//      只保证「按玩家隔离、同一存档内不与其他玩家共享」。

import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandStatus,
} from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const MARKER_PROPERTY = "simplemap:markers";
const EXPLORED_PREFIX = "simplemap:exp:";

const MAX_MARKERS = 32;
const MARKER_NAME_LIMIT = 32;

const GRID_RADIUS = 3;
const GRID_SIZE = GRID_RADIUS * 2 + 1;
const CHUNK_SIDE = 16;
const CHUNK_CELLS = CHUNK_SIDE * CHUNK_SIDE;

const SAMPLE_INTERVAL_TICKS = 4;
// 渲染每 4 tick 一次，这里按「渲染次数」计数：25 次 ≈ 5 秒做一次批量落盘。
const FLUSH_EVERY_SAMPLE = 25;
// 每个玩家最多持久化多少个区块的探索记录（跨维度合计），超出按写入顺序逐出最旧的。
const MAX_CHUNK_PROPS = 96;

const CELL = "█";
const PLAYER_CELL = "+";

// 固定调色板。写进存档的是这里的下标，顺序不能改动，否则旧存档的颜色会整体错位。
const PALETTE = [
    "§b", // 1 水 / 冰
    "§c", // 2 岩浆 / 熔岩块
    "§a", // 3 草方块 / 草地
    "§2", // 4 树叶 / 藤蔓
    "§e", // 5 沙子 / 末地石
    "§f", // 6 雪
    "§6", // 7 泥土类 / 木头类
    "§4", // 8 基岩 / 下界岩
    "§8", // 9 黑石 / 黑曜石
    "§7", // 10 石头类（默认）
];
// 下标 0 表示「未探索」，1..PALETTE.length 依次对应 PALETTE 中的颜色码。
const INDEX_CHARS = ".123456789a";
const UNKNOWN_INDEX = 0;

// playerId -> 会话状态
const sessions = new Map();

function sessionFor(player) {
    let session = sessions.get(player.id);
    if (!session) {
        // 写入顺序表必须从存档里已有的探索键回填，否则每次重进世界都从零计数，
        // 上限只在单次会话内成立，跨会话会无限累积动态属性。
        let writtenKeys = [];
        try {
            writtenKeys = player.getDynamicPropertyIds().filter((key) => key.startsWith(EXPLORED_PREFIX));
        } catch (error) {
            writtenKeys = [];
        }
        session = {
            playerId: player.id,
            chunks: new Map(),
            writtenKeys: writtenKeys,
            dirtyCount: 0,
            ticks: 0,
        };
        sessions.set(player.id, session);
    }
    return session;
}

// 缓存键必须带维度：同一 (cx,cz) 在主世界/下界/末地是不同区块，
// 不区分维度会串色，并把颜色写到别的维度的属性键上。
function chunkKey(dimensionId, cx, cz) {
    return dimensionId + "|" + cx + "," + cz;
}

function exploredPropertyKey(dimensionId, cx, cz) {
    return EXPLORED_PREFIX + dimensionId + ":" + cx + ":" + cz;
}

function decodeExplored(raw) {
    const cells = new Uint8Array(CHUNK_CELLS);
    if (typeof raw !== "string" || raw.length !== CHUNK_CELLS) {
        return cells;
    }
    for (let index = 0; index < CHUNK_CELLS; index++) {
        const value = INDEX_CHARS.indexOf(raw[index]);
        cells[index] = value > 0 ? value : UNKNOWN_INDEX;
    }
    return cells;
}

function encodeExplored(cells) {
    let out = "";
    for (let index = 0; index < cells.length; index++) {
        out += INDEX_CHARS[cells[index]] || INDEX_CHARS[UNKNOWN_INDEX];
    }
    return out;
}

// 方块 typeId -> 调色板下标。沿用官方地图色的归类思路，但只按方块类型名前缀匹配，
// 不引入色表，也不声称与 Java 的 MapColor 一致。
function colorIndexFor(typeId) {
    const id = typeId.replace("minecraft:", "");

    if (id.includes("water") || id.includes("ice")) return 1;
    if (id.includes("lava") || id.includes("magma")) return 2;
    if (id === "grass_block" || id === "grass" || id === "fern" || id.includes("moss")) return 3;
    if (id.includes("leaves") || id.includes("vine")) return 4;
    if (id.includes("sand") || id.includes("end_stone") || id.includes("calcite")) return 5;
    if (id.includes("snow")) return 6;
    if (id.includes("dirt") || id.includes("podzol") || id.includes("mud")
        || id.includes("farmland") || id.includes("path")
        || id.includes("log") || id.includes("wood") || id.includes("planks")) return 7;
    if (id.includes("bedrock") || id.includes("netherrack") || id.includes("nylium")) return 8;
    if (id.includes("blackstone") || id.includes("basalt") || id.includes("obsidian")) return 9;
    return 10;
}

function getChunk(player, session, dimensionId, cx, cz) {
    const key = chunkKey(dimensionId, cx, cz);
    let entry = session.chunks.get(key);
    if (entry) {
        return entry;
    }
    const propKey = exploredPropertyKey(dimensionId, cx, cz);
    let cells;
    try {
        cells = decodeExplored(player.getDynamicProperty(propKey));
    } catch (error) {
        cells = new Uint8Array(CHUNK_CELLS);
    }
    entry = { cells, propKey, dirty: false };
    session.chunks.set(key, entry);
    return entry;
}

// 只在「区块已加载」时采样。getTopmostBlock(xz, minHeight) 的第二个参数是
// 起始搜索高度（下界），这里取玩家脚下 16 格，避免把更深处的方块误当地表。
// 采样不到就留空，这就是迷雾：未探索 / 未加载一律不画。
function sampleIndex(player, dimension, x, z) {
    const y = Math.floor(player.location.y);
    try {
        if (!dimension.isChunkLoaded({ x: x, y: y, z: z })) {
            return UNKNOWN_INDEX;
        }
        const block = dimension.getTopmostBlock({ x: x, z: z }, y - 16);
        if (!block || block.isAir) {
            return UNKNOWN_INDEX;
        }
        return colorIndexFor(block.typeId);
    } catch (error) {
        return UNKNOWN_INDEX;
    }
}

function renderMinimap(player) {
    const dimension = player.dimension;
    const centerX = Math.floor(player.location.x);
    const centerZ = Math.floor(player.location.z);
    const session = sessionFor(player);
    const rows = [];

    for (let offsetZ = -GRID_RADIUS; offsetZ <= GRID_RADIUS; offsetZ++) {
        let row = "";
        for (let offsetX = -GRID_RADIUS; offsetX <= GRID_RADIUS; offsetX++) {
            if (offsetX === 0 && offsetZ === 0) {
                // 中心格固定代表玩家自己，地形色不参与。
                row += "§f" + PLAYER_CELL;
                continue;
            }

            const worldX = centerX + offsetX;
            const worldZ = centerZ + offsetZ;
            const chunk = getChunk(player, session, dimension.id, worldX >> 4, worldZ >> 4);
            const cellIndex = ((worldZ & 15) << 4) | (worldX & 15);

            let colorIndex = chunk.cells[cellIndex];
            if (colorIndex === UNKNOWN_INDEX) {
                colorIndex = sampleIndex(player, dimension, worldX, worldZ);
                if (colorIndex !== UNKNOWN_INDEX) {
                    chunk.cells[cellIndex] = colorIndex;
                    if (!chunk.dirty) {
                        chunk.dirty = true;
                        session.dirtyCount++;
                    }
                }
            }

            row += colorIndex === UNKNOWN_INDEX ? "§r " : PALETTE[colorIndex - 1] + CELL;
        }
        rows.push(row);
    }

    player.onScreenDisplay.setActionBar(rows.join("\n"));
}

function flushExplored(player, session) {
    if (session.dirtyCount === 0) {
        return;
    }
    let failed = 0;
    for (const entry of session.chunks.values()) {
        if (!entry.dirty) {
            continue;
        }
        try {
            player.setDynamicProperty(entry.propKey, encodeExplored(entry.cells));
            entry.dirty = false;
            if (!session.writtenKeys.includes(entry.propKey)) {
                session.writtenKeys.push(entry.propKey);
            }
        } catch (error) {
            // 单格写入失败保留 dirty，下一次批量时重试；计数不能清零。
            failed++;
        }
    }
    session.dirtyCount = failed;
    trimExploredProperties(player, session);
}

// 动态属性会写进世界存档，必须有上限。超出时删掉最早写入的那批区块（连同迷雾一起丢弃），
// 这是基岩侧没有独立本地文件带来的代价，已在不可对齐声明里写明。
function trimExploredProperties(player, session) {
    while (session.writtenKeys.length > MAX_CHUNK_PROPS) {
        const victim = session.writtenKeys.shift();
        try {
            player.setDynamicProperty(victim, undefined);
        } catch (error) {
            // 忽略：属性本就不存在或删除失败都不会影响游戏。
        }
        for (const entry of session.chunks.values()) {
            if (entry.propKey === victim) {
                entry.cells = new Uint8Array(CHUNK_CELLS);
                entry.dirty = false;
            }
        }
    }
}

function loadMarkers(player) {
    const raw = player.getDynamicProperty(MARKER_PROPERTY);
    if (typeof raw !== "string") {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .filter((marker) => marker
                && typeof marker.name === "string"
                && marker.name.trim().length > 0
                && Number.isFinite(marker.x)
                && Number.isFinite(marker.y)
                && Number.isFinite(marker.z))
            .slice(0, MAX_MARKERS)
            .map((marker) => ({
                name: marker.name.trim().slice(0, MARKER_NAME_LIMIT),
                x: Math.trunc(marker.x),
                y: Math.trunc(marker.y),
                z: Math.trunc(marker.z),
            }));
    } catch (error) {
        return [];
    }
}

function saveMarkers(player, markers) {
    player.setDynamicProperty(MARKER_PROPERTY, JSON.stringify(markers.slice(0, MAX_MARKERS)));
}

async function addMarker(player, markers) {
    const modal = new ModalFormData()
        .title("添加地点标记")
        .textField("标记名称", "例如：家");
    const response = await modal.show(player);
    if (response.canceled) {
        return;
    }

    const rawName = response.formValues && response.formValues[0];
    let name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name) {
        name = "标记 " + (markers.length + 1);
    }
    name = name.slice(0, MARKER_NAME_LIMIT);

    markers.push({
        name: name,
        x: Math.floor(player.location.x),
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z),
    });
    saveMarkers(player, markers);
    player.sendMessage("§a已添加标记：" + name);
}

async function renameMarker(player, markers, index) {
    const marker = markers[index];
    const modal = new ModalFormData()
        .title("重命名标记")
        .textField("新名称", "标记名称", { defaultValue: marker.name });
    const response = await modal.show(player);
    if (response.canceled) {
        return;
    }

    const rawName = response.formValues && response.formValues[0];
    const name = typeof rawName === "string" ? rawName.trim().slice(0, MARKER_NAME_LIMIT) : "";
    if (!name) {
        return;
    }
    markers[index] = { name: name, x: marker.x, y: marker.y, z: marker.z };
    saveMarkers(player, markers);
    player.sendMessage("§a已重命名标记：" + name);
}

async function deleteMarker(player, markers, index) {
    const form = new ActionFormData()
        .title("删除标记")
        .body("确定删除“" + markers[index].name + "”吗？")
        .button("取消")
        .button("删除");
    const response = await form.show(player);
    if (response.canceled || response.selection !== 1) {
        return;
    }

    const removed = markers.splice(index, 1)[0];
    saveMarkers(player, markers);
    player.sendMessage("§a已删除标记：" + removed.name);
}

async function manageMarker(player, markers, index) {
    const form = new ActionFormData()
        .title(markers[index].name)
        .body("仅管理名称；不显示坐标面板，不与其他玩家共享。")
        .button("重命名")
        .button("删除")
        .button("返回");
    const response = await form.show(player);
    if (response.canceled || response.selection === undefined) {
        return;
    }

    if (response.selection === 0) {
        await renameMarker(player, markers, index);
    } else if (response.selection === 1) {
        await deleteMarker(player, markers, index);
    }
}

async function openMarkers(player) {
    const markers = loadMarkers(player);
    const form = new ActionFormData()
        .title("地点标记")
        .body("标记按玩家隔离，保存在本存档内。");
    form.button("添加当前位置");
    for (const marker of markers) {
        form.button(marker.name);
    }

    const response = await form.show(player);
    if (response.canceled || response.selection === undefined) {
        return;
    }

    if (response.selection === 0) {
        if (markers.length >= MAX_MARKERS) {
            player.sendMessage("§c最多保存 " + MAX_MARKERS + " 个标记。");
            return;
        }
        await addMarker(player, markers);
        return;
    }

    await manageMarker(player, markers, response.selection - 1);
}

// 基岩没有按键绑定 API，M 键做不到。这里注册一个不需要作弊、任何权限都能执行的
// 脚本命令作为唯一入口；与「M 键」的有意偏离见 docs/03-不可对齐项声明.md。
system.beforeEvents.startup.subscribe((event) => {
    event.customCommandRegistry.registerCommand(
        {
            name: "simplemap:markers",
            description: "打开地点标记管理",
            permissionLevel: CommandPermissionLevel.Any,
            cheatsRequired: false,
            mandatoryParameters: [],
            optionalParameters: [],
        },
        (origin) => {
            const source = origin.sourceEntity;
            if (!source || source.typeId !== "minecraft:player") {
                return {
                    status: CustomCommandStatus.Failure,
                    message: "该命令只能由玩家执行。",
                };
            }

            const player = source;
            system.run(() => {
                openMarkers(player).catch((error) => {
                    console.warn("[simple_minimap] marker form failed: " + error);
                });
            });
            return { status: CustomCommandStatus.Success };
        },
    );
});

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        try {
            const session = sessionFor(player);
            session.ticks++;
            if (session.ticks % FLUSH_EVERY_SAMPLE === 0) {
                flushExplored(player, session);
            }
            renderMinimap(player);
        } catch (error) {
            console.warn("[simple_minimap] render failed: " + error);
        }
    }
}, SAMPLE_INTERVAL_TICKS);

// 离开世界 / 关服前把脏区块落盘，避免丢掉最后几秒的探索记录。
world.beforeEvents.playerLeave.subscribe((event) => {
    const session = sessions.get(event.player.id);
    if (session) {
        flushExplored(event.player, session);
    }
});

system.beforeEvents.shutdown.subscribe(() => {
    for (const player of world.getPlayers()) {
        const session = sessions.get(player.id);
        if (session) {
            try {
                flushExplored(player, session);
            } catch (error) {
                console.warn("[simple_minimap] flush on shutdown failed: " + error);
            }
        }
    }
});

world.afterEvents.playerLeave.subscribe((event) => {
    sessions.delete(event.playerId);
});
