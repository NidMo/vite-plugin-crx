import path from "path";
import { Plugin } from "vite";
import ws from "ws";
import { listenExitProcess } from "./process";
import { Options, ResolvedOptions } from "./type";
import {
  findBackgroundEntry,
  genBackgroundHtml,
  genBackgroundInput,
  genContentInput,
  genManifest,
  genReloadHtml,
  isBackgroundOpts,
} from "./utils";
import { copyDir } from "./utils";
import { createWebSocketServer } from "./ws";
export { reload } from "./reload";

export default function crxPlugin(
  rawOptions: Options = { name: "my extension", version: "1.0.0" }
): Plugin {
  let options: ResolvedOptions = {
    host: "localhost",
    port: 3060,
    manifest_version: 2,
    ...rawOptions,
    root: process.cwd(),
  };
  // background的热重载入口
  let reloadEntry = findBackgroundEntry(options.background);
  let outDir = path.resolve(options.root, "");
  // 存放客户端逻辑的目录
  const clientDir = path.resolve(
    options.root,
    "node_modules/vite-plugin-crx/client"
  );
  const reloadCode =
    `import { reload } from "./reload.js"\n` +
    `reload("${options.host}",${options.port})`;
  // 创建一个ws服务
  const ws = createWebSocketServer(options)
  // 监听进程退出
  listenExitProcess(ws)
  return {
    name: "vite:chrome-extension",
    config(config) {
      const { mode } = config;
      const { background,content } = options;

      outDir = outDir + "/" + (config.build?.outDir || "dist");
      // 开发模式下，需要热重载
      reloadEntry = mode === "development" ? reloadEntry : "";

      // 生成清单文件manifest.json
      genManifest(clientDir, options);

      // 根据配置的background和content生成vite的入口配置
      const backgroundInput = genBackgroundInput(background)
      const contentInput = genContentInput(content);
      // 根据background入口配置生成background的html，js全部以es module引入
      genBackgroundHtml(clientDir,backgroundInput, mode === "development")
      return {
        build: {
          rollupOptions: {
            external: "./reload.js",
            input: {...backgroundInput,...contentInput},
            output: {
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "[name].js",
              format: "esm"
            },
          },
        },
      };
    },
    transform(code, id) {
      // TODO：找到background入口中第一个，插入热重载代码      
      if (reloadEntry && id.endsWith(reloadEntry)) {
        code += `${reloadCode}`;
      }
      return code;
    },
    buildEnd() {
      // 复制client目录下的代码到构建目录
      copyDir(clientDir, outDir);
      setTimeout(() => {
        ws.send({type: "update"})
      },500)
    },
  };
}
