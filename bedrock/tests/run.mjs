// 基岩脚本的离线验证入口（Node 运行，不需要 Minecraft、不需要 npm 依赖）。
//
//   node bedrock/tests/run.mjs
//
// 做法：把 @minecraft/server / @minecraft/server-ui 的**手写桩**铺到临时目录，
// 再把真实发布的 scripts/main.js 复制进同一目录动态导入。
// 这样 main.js 里的 import  specifier 能解析到桩，而被测文件就是游戏里实际加载的那份，
// 不用为了跑测试改动源码，也不会往 bedrock/ 下放一份 node_modules 干扰类型检查。

import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tmp = join(here, ".tmp");

rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(tmp, "node_modules", "@minecraft"), { recursive: true });

for (const pkg of ["server", "server-ui"]) {
    cpSync(join(here, "stubs", "@minecraft", pkg), join(tmp, "node_modules", "@minecraft", pkg), { recursive: true });
}

// 被测文件：行为包里真正会被引擎加载的那份脚本
cpSync(join(here, "..", "behavior_pack", "scripts", "main.js"), join(tmp, "main.js"));

// 用例里 import 的是同目录的 main.js
const testSource = readFileSync(join(here, "test.mjs"), "utf8").replaceAll("./src/main.js", "./main.js");
writeFileSync(join(tmp, "test.mjs"), testSource);

console.log("运行基岩脚本用例（被测文件：bedrock/behavior_pack/scripts/main.js）\n");
await import(pathToFileURL(join(tmp, "test.mjs")).href);
