# 版本核对表（检索日期：2026-11-20）

> 门禁说明：写任何代码之前，本节所有条目均从 Mojang / Fabric / Microsoft Learn 官方页面或官方发布端点取证。
> 凡未能从上述来源确认的项目均标注「未证实」并停止实现；本交付没有「未证实」项。
> 所有链接均为官方页面 / 官方元数据端点，不含教程、论坛、Wiki 或记忆外推。

## 1. Minecraft Java Edition / Fabric 工具链

| 项目 | 版本号 | 来源官方页面 URL | 检索日期 | 游戏渠道 | 正式 / 预览 |
|---|---|---|---|---|---|
| Minecraft Java | 1.21.11 | https://piston-meta.mojang.com/mc/game/version_manifest_v2.json （条目 `id: 1.21.11`, `type: release`） | 2026-11-20 | Java Edition | 正式版 |
| Java 最低版本 | 21 | https://piston-meta.mojang.com/v1/packages/a969d96978af7b52dba8df44e177f48ec4ebe0d8/1.21.11.json （`javaVersion.majorVersion: 21`） | 2026-11-20 | Java Edition | 正式版 |
| Fabric Loader | 0.20.1 | https://meta.fabricmc.net/v2/versions/loader （首条 `stable: true`；Fabric 开发页实际按此字段选取） | 2026-11-20 | Fabric 开发渠道 | 正式版 |
| Fabric API | 0.141.6+1.21.11 | https://maven.fabricmc.net/net/fabricmc/fabric-api/fabric-api/maven-metadata.xml （1.21.11 最高稳定版本） | 2026-11-20 | Fabric 开发渠道 | 正式版 |
| Yarn mappings | 1.21.11+build.6 | https://meta.fabricmc.net/v2/versions/yarn/1.21.11 （`build: 6`, `stable: true`） | 2026-11-20 | Fabric 开发渠道 | 正式版 |
| Loom | 1.19-SNAPSHOT（解析为 1.19.4） | https://fabricmc.net/develop/ （原文："The recommended loom version is **1.19-SNAPSHOT**"） | 2026-11-20 | Fabric 开发渠道 | 官方推荐（快照标签） |
| Gradle | 9.8.2 | https://fabricmc.net/develop/template/ （官方模板生成器 `gradle-wrapper.properties`：`gradle-9.8.2-bin.zip`） | 2026-11-20 | Fabric 开发渠道 | 正式版 |
| HudRenderCallback 签名 | `(GuiGraphics, DeltaTracker)`；已弃用，推荐 HudElementRegistry | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/fabric/api/client/rendering/v1/HudRenderCallback.html （`@Deprecated`；`onHudRender(net.minecraft.client.gui.GuiGraphics drawContext, net.minecraft.client.DeltaTracker tickCounter)`） | 2026-11-20 | Fabric Javadoc | 正式版 API（标记弃用） |
| Yarn 类名映射 | `DrawContext` / `RenderTickCounter` / `KeyBinding` / `InputUtil` / `MapColor` | https://maven.fabricmc.net/net/fabricmc/yarn/1.21.11+build.6/yarn-1.21.11+build.6-v2.jar （`mappings/mappings.tiny`） | 2026-11-20 | Fabric 开发渠道 | 正式版 |

说明：
- Fabric 开发页顶部示例显示的是当时最新的 `26.3`，不是本项目目标；实际 Loader/Yarn/Fabric API 数值由该页前端调用上述 meta 端点按所选游戏版本计算得到，本项目直接取这些端点的 1.21.11 结果。
- Loom 1.19.4 要求 Gradle ≥ 9.8.0，因此 Gradle 固定为官方模板的 9.8.2，不使用容器预装的旧版本。
- 目标号 `minecraft_version=1.21.11` 与 Java 21 为任务固定条件，未改动。

## 2. Minecraft Bedrock Edition / Add-on

| 项目 | 版本号 | 来源官方页面 URL | 检索日期 | 游戏渠道 | 正式 / 预览 |
|---|---|---|---|---|---|
| Minecraft Bedrock | 1.21.130 | https://www.minecraft.net/en-us/article/minecraft-1.21-130-bedrock-changelog （标题 `Minecraft 1.21.130 Bedrock Changelog`，开篇 "Mounts of Mayhem charges into Minecraft today!"） | 2026-11-20 | Bedrock Edition 零售版 | 正式版 |
| 平台版本指引 | 当前零售版 = 1.21.130 | https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/latestplatformversion?view=minecraft-bedrock-stable （原文："target the most recent release of the Minecraft: Bedrock Edition retail version, in this case, `1.21.130`"） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| Manifest format_version | 2 | 同上（原文："The **manifest.json** file in behavior packs/resource packs should have a format version of `2`"） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| min_engine_version | [1, 21, 130]（整数数组，format_version 2） | 同上（`Behavior Pack/Resource Pack manifest file min_engine_version` 章节） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| @minecraft/server | 2.4.0 | https://www.minecraft.net/en-us/article/minecraft-1.21-130-bedrock-changelog （多条 "Released ... from beta to v2.4.0"）；https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable （2.4.0 为正式轨道条目） | 2026-11-20 | Bedrock 零售版 | 正式版（2.5.0-beta 为预览，未采用） |
| @minecraft/server-ui | 2.0.0 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable （Available Versions 中 2.0.0 为 2.x 稳定轨道；2.4.0-rc / 2.5.0-beta 为预览，未采用） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| 自定义命令 | CustomCommandRegistry 自 2.1.0 起可用 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable （2.1.0 段：`Added CustomCommandOrigin` / `Added CustomCommandRegistry`） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| Dimension.isChunkLoaded | 自 2.3.0 起可用 | 同上（2.3.0 段：`Changed Dimension` → `Added function isChunkLoaded`） | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| Dimension.getTopmostBlock | `(locationXZ: VectorXZ, minHeight?: number)` | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable#gettopmostblock | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| ModalFormData.textField | `(label, placeholderText, textFieldOptions?)` | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdata?view=minecraft-bedrock-stable#textfield | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| ModalFormDataTextFieldOptions.defaultValue | 可用 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdatatextfieldoptions?view=minecraft-bedrock-stable#defaultvalue | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| CustomCommand 字段 | `name` / `description` / `permissionLevel` / `cheatsRequired?` / `mandatoryParameters?` / `optionalParameters?` | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/customcommand?view=minecraft-bedrock-stable | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| PlayerLeaveBeforeEvent.player / PlayerLeaveAfterEvent.playerId | 可用 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerleavebeforeevent?view=minecraft-bedrock-stable#player ； https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerleaveafterevent?view=minecraft-bedrock-stable#playerid | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| system.beforeEvents.startup / shutdown | 可用 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/systembeforeevents?view=minecraft-bedrock-stable#startup | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |
| ScreenDisplay.setActionBar | `(RawMessage \| string)[] \| RawMessage \| string` | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable#setactionbar | 2026-11-20 | Microsoft Learn / Bedrock | 正式版 |

说明：
- 行为包 / 资源包的 4 个 UUID 均为本次生成的新 v4 UUID，不复用附件 r3 中的任何 UUID。
- 脚本依赖按任务要求写 `{"module_name": ..., "version": ...}`，不写死包 UUID。
- `format_version: 2`（manifest）与本任务中其他文件的 `format_version` 互不套用；本项目未新增 block / item / entity 定义文件，因此不存在需要另行核对的这类格式号。
- 本交付**不包含** `pack.mcmeta`：Fabric 官方模板生成器不产出该文件，且资源包格式号无法从任务允许的官方页面确认；为避免写入「未证实」的版本号，直接省略。模组资源（语言文件、图标）由 Fabric Loader 以模组资源包方式加载，无需它。

## 3. 未证实项

无。所有依赖坐标、API 符号与字段均已从上述官方来源确认；如后续官方页面变化导致任一条失效，应停止构建并重新核对，不得按相邻版本外推。
