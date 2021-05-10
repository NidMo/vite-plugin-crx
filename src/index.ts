import fs from "fs";
import path from "path";
import { Plugin } from "vite";
import ws from "ws";
import { genReloadHtml } from "./reload";
import { copyDir } from "./utils";
export { reload } from "./reload";

export interface Options {
  host?: string;
  port?: number;
  /**
   * 扩展background的入口
   */
  background?: string | string[];
  /**
   * 扩展content-script的入口
   */
  content?: string | string[];
  /**
   * 扩展popup的入口
   */
  popup?: string;
}

export interface ResolvedOptions extends Options {
  root: string;
}

export default function crxPlugin(rawOptions: Options = {}): Plugin {
  let options: ResolvedOptions = {
    host: "localhost",
    port: 3060,
    ...rawOptions,
    root: process.cwd(),
  };
  let needInsertBackground = false;
  let outDir = path.resolve(options.root,"")
  // 存放客户端逻辑的目录
  const clientDir = path.resolve(
    options.root,
    "node_modules/vite-plugin-crx/client"
  );
  const background =
    typeof options.background === "string"
      ? [options.background]
      : typeof options.background === "undefined"
      ? []
      : Array.from(options.background);
  const content =
    typeof options.content === "string"
      ? [options.content]
      : typeof options.content === "undefined"
      ? []
      : Array.from(options.content);
  const reloadCode =
    `import { reload } from "vite-plugin-crx"\n` + `reload(${options})`;
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
      outDir = outDir + "/" + (config.build?.outDir || "dist")
      // 开发模式下，若background不存在入口，则生成一个html作为扩展入口来插入热重载代码
      if (config.mode === "development" && background.length === 0) {
        needInsertBackground = true
        const filename = clientDir + "/background.html";
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filename, genReloadHtml(options), {
          encoding: "utf-8",
        });
      }
      // 根据配置的background和content生成vite的入口配置
      return {
        build: {
          emptyOutDir: config.mode !== "development",
          rollupOptions: {
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
      console.log("id:", id);
      console.log("bg:", background);
      // TODO：找到background，插入热重载代码
      if (id.endsWith(background[0])) {
        console.log("background:", options.background);
        console.log("id:", id);
        code += `${reloadCode}`;
        console.log("code:", code);
      }

      return code;
    },
    buildEnd() {
      console.log(`\n build end`);
      // 复制client目录下的代码到构建目录
      if(needInsertBackground){
        copyDir(clientDir, outDir);
      }
      if (client) {
        client.send("reload");
      }
    },
  };
}
