# API 白名单（逐项对照版本核对表）

> 规则：只调用 `VERSION-EVIDENCE.md` 中已列出的官方 API；每个 import / require 都在此登记全名、包路径、稳定 / 实验状态、文档 URL、适配版本。

## A. Fabric（Java 1.21.11 / Fabric API 0.141.6+1.21.11 / Yarn 1.21.11+build.6）

| 全名 | 包路径 | 状态 | 文档 URL | 适配版本 |
|---|---|---|---|---|
| `ClientModInitializer` | `net.fabricmc.api.ClientModInitializer` | 稳定 | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/api/ClientModInitializer.html | Fabric Loader 0.20.1 / MC 1.21.11 |
| `ClientLifecycleEvents` | `net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents` | 稳定 | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/fabric/api/client/event/lifecycle/v1/ClientLifecycleEvents.html | Fabric API 0.141.6+1.21.11 |
| `ClientTickEvents` | `net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents` | 稳定 | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/fabric/api/client/event/lifecycle/v1/ClientTickEvents.html | Fabric API 0.141.6+1.21.11 |
| `KeyBindingHelper` | `net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper` | 稳定 | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/fabric/api/client/keybinding/v1/KeyBindingHelper.html | Fabric API 0.141.6+1.21.11 |
| `HudRenderCallback` | `net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback` | **已弃用但仍存在**（官方推荐 HudElementRegistry；任务约束点名此回调，故按 Javadoc 签名使用） | https://maven.fabricmc.net/docs/fabric-api-0.141.6+1.21.11/net/fabricmc/fabric/api/client/rendering/v1/HudRenderCallback.html | Fabric API 0.141.6+1.21.11 |
| `MinecraftClient` | `net.minecraft.client.MinecraftClient` | 稳定（Yarn 映射） | https://maven.fabricmc.net/net/fabricmc/yarn/1.21.11+build.6/yarn-1.21.11+build.6-v2.jar | Yarn build.6 |
| `KeyBinding` / `KeyBinding.Category` | `net.minecraft.client.option.KeyBinding` | 稳定（Yarn 映射） | 同上 | Yarn build.6 |
| `InputUtil` | `net.minecraft.client.util.InputUtil` | 稳定（Yarn 映射） | 同上 | Yarn build.6 |
| `DrawContext` | `net.minecraft.client.gui.DrawContext` | 稳定（Yarn 映射；Mojmap 名 GuiGraphics） | 同上 | Yarn build.6 |
| `Screen` / `ButtonWidget` / `TextFieldWidget` | `net.minecraft.client.gui.screen.Screen` / `net.minecraft.client.gui.widget.*` | 稳定（Yarn 映射） | 同上 | Yarn build.6 |
| `MapColor` | `net.minecraft.block.MapColor` | 稳定（Yarn 映射；直接取游戏内颜色，不手抄色表） | 同上 | Yarn build.6 |
| `Heightmap.Type` | `net.minecraft.world.Heightmap.Type` | 稳定（Yarn 映射） | 同上 | Yarn build.6 |
| `WorldChunk` / `ChunkPos` / `BlockPos` | `net.minecraft.world.chunk.WorldChunk` / `net.minecraft.util.math.ChunkPos` / `BlockPos` | 稳定（Yarn 映射） | 同上 | Yarn build.6 |
| `Gson`（`JsonObject` 等） | `com.google.gson.*` | 稳定（Minecraft 运行时自带） | https://github.com/google/gson | MC 1.21.11 内置 |

**没有使用**：Mixin、`InGameHud`、任何反射式访问器、任何第三方库、任何手抄的 256 色表。

## B. Bedrock（1.21.130 / @minecraft/server 2.4.0 / @minecraft/server-ui 2.0.0）

| 全名 | 包路径 | 状态 | 文档 URL | 适配版本 |
|---|---|---|---|---|
| `world` | `@minecraft/server` → `world` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable | 2.4.0 |
| `system` | `@minecraft/server` → `system` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-stable | 2.4.0 |
| `CommandPermissionLevel` | `@minecraft/server` → `CommandPermissionLevel` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/commandpermissionlevel?view=minecraft-bedrock-stable | 2.4.0 |
| `CustomCommandStatus` | `@minecraft/server` → `CustomCommandStatus` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/customcommandstatus?view=minecraft-bedrock-stable | 2.4.0 |
| `system.beforeEvents.startup` / `shutdown` | `@minecraft/server` → `SystemBeforeEvents` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/systembeforeevents?view=minecraft-bedrock-stable | 2.4.0 |
| `CustomCommandRegistry.registerCommand` | `@minecraft/server` → `CustomCommandRegistry` | 稳定（2.1.0 引入） | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/customcommandregistry?view=minecraft-bedrock-stable | 2.4.0 |
| `Dimension.isChunkLoaded` | `@minecraft/server` → `Dimension` | 稳定（2.3.0 引入） | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable#ischunkloaded | 2.4.0 |
| `Dimension.getTopmostBlock` | `@minecraft/server` → `Dimension` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable#gettopmostblock | 2.4.0 |
| `Player.getDynamicProperty` / `setDynamicProperty` / `getDynamicPropertyIds` | `@minecraft/server` → `Entity` / `Player` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable | 2.4.0 |
| `Player.onScreenDisplay.setActionBar` | `@minecraft/server` → `ScreenDisplay` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable#setactionbar | 2.4.0 |
| `world.beforeEvents.playerLeave` / `world.afterEvents.playerLeave` | `@minecraft/server` → `WorldBeforeEvents` / `WorldAfterEvents` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerleavebeforeevent?view=minecraft-bedrock-stable#player ； .../playerleaveafterevent?view=minecraft-bedrock-stable#playerid | 2.4.0 |
| `ActionFormData` | `@minecraft/server-ui` → `ActionFormData` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata?view=minecraft-bedrock-stable | 2.0.0 |
| `ModalFormData` | `@minecraft/server-ui` → `ModalFormData` | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdata?view=minecraft-bedrock-stable | 2.0.0 |
| `ModalFormData.textField(label, placeholderText, textFieldOptions?)` | `@minecraft/server-ui` → `ModalFormData` | 稳定（2.0.0 三参签名） | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdata?view=minecraft-bedrock-stable#textfield | 2.0.0 |
| `ModalFormDataTextFieldOptions.defaultValue` | `@minecraft/server-ui` → 接口 | 稳定 | https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/modalformdatatextfieldoptions?view=minecraft-bedrock-stable#defaultvalue | 2.0.0 |

**明确不存在的东西（不声称、不使用）**：
- 没有官方逐帧像素 canvas / 动态 PNG 重写 API；
- 没有常驻 overlay 客户端控件可写任意文本；
- 没有客户端本地文件 API；
- 没有按键绑定 API；
- 没有多人标记同步 API（本实现也刻意不同步）。
