import path from "path";
import { Plugin } from "vite";
import ws from "ws";
import { Options, ResolvedOptions } from "./type";
import {
  findBackgroundEntry,
  genInputConfig,
  genManifest,
  genReloadHtml,
  isBackgroundOpts,
} from "./utils";
import { copyDir } from "./utils";
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
    `import { reload } from "vite-plugin-crx"\n` +
    `reload(${options.host},${options.port})`;
  // 创建一个ws服务
  let wss = new ws.Server({
    host: options.host,
    port: options.port,
  });
  // 扩展客户端
  let client: ws;
  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      console.log("received: %s", message);
    });
    ws.send("something");
    client = ws;
  });
  return {
    name: "vite:chrome-extension",
    config(config) {
      const { mode } = config;
      const { background } = options;

      outDir = outDir + "/" + (config.build?.outDir || "dist");
      // 开发模式下，需要热重载
      reloadEntry = mode === "development" ? reloadEntry : "";

      // 开发模式下，若background不存在入口，则生成一个html作为扩展入口来插入热重载代码
      let isGenHtml = false;
      if (mode === "development" && !isBackgroundOpts(background)) {
        genReloadHtml(clientDir, options);
        isGenHtml = true;
      }

      // 生成清单文件manifest.json
      genManifest(clientDir, options, isGenHtml);

      // 根据配置的background和content生成vite的入口配置
      const inputOptions = genInputConfig(options);
      return {
        build: {
          rollupOptions: {
            external: "vite-plugin-crx",
            input: inputOptions,
            output: {
              entryFileNames: "[name].js",
              chunkFileNames: "[name].js",
              assetFileNames: "[name].js",
            },
          },
        },
      };
    },

    transform(code, id) {
      // TODO：找到background入口中第一个，插入热重载代码
      if (id.endsWith(reloadEntry)) {
        code += `${reloadCode}`;
      }
      return code;
    },
    buildEnd() {
      console.log(`\n build end`);
      // 复制client目录下的代码到构建目录
      copyDir(clientDir, outDir);

      if (client) {
        client.send("reload");
      }
    },
  };
}
