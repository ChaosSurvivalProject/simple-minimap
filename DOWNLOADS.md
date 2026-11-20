# 下载构建产物

两套实现的**真实可下载构建物**同时提供在两处：

1. GitHub Release（推荐）：https://github.com/ChaosSurvivalProject/simple-minimap/releases/tag/v1.0.0
2. 仓库内 `dist/` 目录（随源码一同版本化）

| 文件 | 用途 | 大小 |
|---|---|---|
| `simple-minimap-1.0.0-all.zip` | 总包：全部产物 + 文档 | 178 KB |
| `simple_minimap-1.0.0.jar` | Fabric 客户端模组，放入 `mods/` | 32 KB |
| `simple_minimap-1.0.0-sources.jar` | Fabric 源码 jar | 19 KB |
| `SimpleMinimap_BP.mcpack` | 基岩行为包，双击导入 | 9.4 KB |
| `SimpleMinimap_RP.mcpack` | 基岩资源包，双击导入 | 3.5 KB |
| `simple-minimap-source.zip` | 完整工程源码 | 106 KB |

## 安装

- **Fabric**：Java 21 + Fabric Loader 0.20.1 + Fabric API 0.141.6+1.21.11，把 `simple_minimap-1.0.0.jar` 放进 `mods/`。
- **Bedrock 1.21.130**：先导入资源包再导入行为包；需开启 Beta / 实验性脚本开关。按 `M` 的等价入口为 `/simplemap:markers`（基岩无按键绑定 API，见 `docs/03-不可对齐项声明.md`）。

## 校验

各文件的 SHA-256 见 Release 说明页，或运行：

```bash
sha256sum dist/*
```
