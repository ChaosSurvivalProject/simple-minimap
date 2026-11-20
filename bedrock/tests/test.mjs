import { fake, makePlayer, setUnloaded, reset } from "@minecraft/server";
import { uiQueue, uiShown } from "@minecraft/server-ui";

let pass = 0, fail = 0;
const ok = (c, name, extra) => c ? (pass++, console.log("  PASS  " + name))
                                 : (fail++, console.log("  FAIL  " + name + (extra ? "  <- " + extra : "")));
const tick = () => fake.intervals.forEach(i => i.fn());
const settle = () => new Promise(r => setTimeout(r, 25));   // 让多层 await 链跑完

reset();
await import("./src/main.js");

// ---- 1. startup 注册自定义命令 ----
const reg = { cmd: null, cb: null, registerCommand(c, cb) { this.cmd = c; this.cb = cb; } };
fake.startupHandlers.forEach(h => h({ customCommandRegistry: reg }));
ok(reg.cmd?.name === "simplemap:markers", "startup 注册命令 simplemap:markers");
ok(reg.cmd?.permissionLevel === 0 && reg.cmd?.cheatsRequired === false, "命令权限 Any 且不需要作弊");
ok(fake.intervals.length === 1 && fake.intervals[0].interval === 4, "渲染间隔 4 tick");
ok(fake.leaveBefore.length === 1 && fake.leaveAfter.length === 1 && fake.shutdownHandlers.length === 1,
   "已订阅 离场前 / 离场后 / 关服前 事件");

// ---- 2. 渲染：7 行、中心是玩家 ----
const p = makePlayer("p1", 0, 64, 0);
fake.players = [p];
tick();
let lines = p.onScreenDisplay.last.split("\n");
ok(lines.length === 7, "actionbar 输出 7 行", "实际 " + lines.length);
ok(lines.every(l => l.replace(/§./g, "").length === 7), "每行 7 格");
ok(lines[3].includes("+"), "中心格是玩家标记 +");
const stripped = lines.join("").replace(/§./g, "").replace(/[█+ ]/g, "");
ok(stripped === "", "除地形色块与玩家标记外没有绘制任何别的东西", JSON.stringify(stripped));

// ---- 3. 迷雾：未加载区域留空 ----
setUnloaded(2, 6);
const p2 = makePlayer("p2", 4, 64, 0);
fake.players = [p2];
tick();
const plain = p2.onScreenDisplay.last.split("\n").map(l => l.replace(/§./g, ""));
ok(plain.every((row, zi) => [...row].every((c, xi) => {
  const wx = 4 + xi - 3;
  return (wx >= 2 && wx <= 6 && zi !== 3) ? c === " " : true;
})), "未加载区块的列一律留空（不猜测地形）");
setUnloaded(null);

// ---- 4. 探索持久化 + 重进世界恢复 ----
for (let i = 0; i < 25; i++) tick();          // 第 25 次采样触发批量落盘
let expKeys = [...p2._dp.keys()].filter(k => k.startsWith("simplemap:exp:"));
ok(expKeys.length > 0, "按区块写入探索属性", expKeys.join("|"));
let grids = expKeys.map(k => p2._dp.get(k));
ok(grids.every(g => typeof g === "string" && g.length === 256), "每个区块存 256 字符网格");
ok(grids.some(g => /[1-9a]/.test(g)), "网格里写入了真实颜色下标");
ok(grids.some(g => g.includes(".")), "未采到的格子保持未知 .");
const savedFirst = p2._dp.get(expKeys[0]);

fake.players = [];                                     // 离场
fake.leaveAfter.forEach(h => h({ playerId: p2.id }));
fake.players = [p2];                                   // 同一玩家同一存档重进
for (let i = 0; i < 3; i++) tick();
ok(p2._dp.get(expKeys[0]) === savedFirst, "重进世界没有覆盖已存区块");
const drawnAfterRejoin = p2.onScreenDisplay.last.split("\n").map(l => l.replace(/§./g, "")).join("");
ok(drawnAfterRejoin.replace(/[ +]/g, "").length > 0, "重进世界后仍画出地形（来自存档 / 缓存）");

// ---- 5. 属性上限与逐出 ----
for (let hop = 0; hop < 140; hop++) {
  p2.location = { x: hop * 17 + 100, y: 64, z: hop * 13 + 50 };
  for (let i = 0; i < 25; i++) tick();
}
expKeys = [...p2._dp.keys()].filter(k => k.startsWith("simplemap:exp:"));
ok(expKeys.length <= 96, "跨会话累计后探索属性仍不超过 96 个", "实际 " + expKeys.length);

// ---- 6. 标记：添加 ----
const q = makePlayer("q1", 10, 64, 20);
fake.players = [q];
tick();
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 0 }, { canceled: false, formValues: ["  家  "] });
reg.cb({ sourceEntity: q });
await settle();
ok(uiShown[0]?.kind === "action" && uiShown[0].buttons[0] === "添加当前位置", "命令打开标记管理表单");
ok(uiShown[1]?.kind === "modal" && uiShown[1].fields[0].placeholder === "例如：家", "添加走 ModalFormData（2.0.0 三参签名）");
let markers = JSON.parse(q.getDynamicProperty("simplemap:markers"));
ok(markers.length === 1 && markers[0].name === "家", "添加标记并去除首尾空格", JSON.stringify(markers));
ok(markers[0].x === 10 && markers[0].y === 64 && markers[0].z === 20, "标记记录当前坐标");

// ---- 7. 标记：重命名 ----
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 1 },
             { canceled: false, selection: 0 },
             { canceled: false, formValues: ["基地"] });
reg.cb({ sourceEntity: q });
await settle();
ok(uiShown[1]?.buttons.join(",") === "重命名,删除,返回", "单标记提供 重命名 / 删除 / 返回");
ok(uiShown[2]?.fields[0].options?.defaultValue === "家", "重命名表单预填旧名");
markers = JSON.parse(q.getDynamicProperty("simplemap:markers"));
ok(markers[0]?.name === "基地", "重命名已持久化", JSON.stringify(markers));

// ---- 8. 标记：删除（二次确认） ----
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 1 },
             { canceled: false, selection: 1 },
             { canceled: false, selection: 1 });
reg.cb({ sourceEntity: q });
await settle();
ok(uiShown[2]?.buttons.join(",") === "取消,删除", "删除前有确认框");
markers = JSON.parse(q.getDynamicProperty("simplemap:markers"));
ok(markers.length === 0, "删除后标记为空");

// ---- 9. 取消不应改动数据 ----
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 0 }, { canceled: true });
reg.cb({ sourceEntity: q });
await settle();
markers = JSON.parse(q.getDynamicProperty("simplemap:markers"));
ok(markers.length === 0, "在名称输入框点取消不会新增标记");

// ---- 10. 非玩家来源 ----
uiShown.length = 0;
const r1 = reg.cb({ sourceEntity: undefined });
const r2 = reg.cb({ sourceEntity: { typeId: "minecraft:cow", id: "c" } });
ok(r1.status === 1 && r1.message.includes("玩家"), "无实体来源返回 Failure");
ok(r2.status === 1, "非玩家实体来源返回 Failure");

// ---- 11. 名称上限 32 ----
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 0 }, { canceled: false, formValues: ["标".repeat(40)] });
reg.cb({ sourceEntity: q });
await settle();
markers = JSON.parse(q.getDynamicProperty("simplemap:markers"));
ok(markers[0].name.length === 32, "标记名截断到 32 字符", "实际 " + markers[0].name.length);

// ---- 12. 关服前落盘 ----
const r = makePlayer("r1", 0, 64, 0);
fake.players = [r];
tick();
const before = [...r._dp.keys()].filter(k => k.startsWith("simplemap:exp:")).length;
fake.shutdownHandlers.forEach(h => h({}));
const after = [...r._dp.keys()].filter(k => k.startsWith("simplemap:exp:")).length;
ok(after > before, "关服前把脏区块写入动态属性", before + " -> " + after);

// ---- 13. 离场前落盘 ----
const s = makePlayer("s1", 0, 64, 0);
fake.players = [s];
tick();
const sBefore = [...s._dp.keys()].filter(k => k.startsWith("simplemap:exp:")).length;
fake.leaveBefore.forEach(h => h({ player: s }));
const sAfter = [...s._dp.keys()].filter(k => k.startsWith("simplemap:exp:")).length;
ok(sAfter > sBefore, "玩家离场前把脏区块写入动态属性", sBefore + " -> " + sAfter);

// ---- 14. 标记按玩家隔离 ----
const a = makePlayer("a", 0, 64, 0), b = makePlayer("b", 0, 64, 0);
fake.players = [a, b];
tick();
uiShown.length = 0; uiQueue.length = 0;
uiQueue.push({ canceled: false, selection: 0 }, { canceled: false, formValues: ["只有A知道"] });
reg.cb({ sourceEntity: a });
await settle();
ok(JSON.parse(a.getDynamicProperty("simplemap:markers")).length === 1, "A 的标记写入 A 的动态属性");
ok(b.getDynamicProperty("simplemap:markers") === undefined, "B 读不到 A 的标记（按玩家隔离）");

console.log("\n合计: PASS=" + pass + "  FAIL=" + fail);
process.exit(fail ? 1 : 0);
