import fs from "fs";
import path from "path";
import { normalizePath } from "vite";
import {
  Background,
  BackgroundOpts,
  ContentOpts,
  ContentScript,
  Manifest,
  ResolvedOptions,
} from "./type";

export function copyDir(srcDir: string, destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

/**
 * 生成热重载的后台background.html
 * @param options
 * @returns
 */
export const genReloadHtmlCode = function (options: ResolvedOptions) {
  return `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>chrome extension background</title>
      <script>
          const socket = new WebSocket("ws://${options.host}:${options.port}");
          
          // Connection opened
          socket.addEventListener("connection", function (event) {
              socket.send("Hello Server!");
          });
  
          // Listen for messages
          socket.addEventListener("message", function (event) {
              if (event.data === "reload") {
                  chrome.runtime.reload()
              }
          });
      </script>
  </head>
  
  <body>`;
};

/**
 * 生成热重载html文件
 * @param clientDir 存放文件路径
 * @param options
 */
export const genReloadHtml = function (
  clientDir: string,
  options: ResolvedOptions
) {
  const filename = clientDir + "/background.html";
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, genReloadHtmlCode(options), {
    encoding: "utf-8",
  });
};

export const isBackground = function (
  background: any
): background is Background {
  return background && (background.page || background.scrpits);
};

export const isBackgroundOpts = function (
  background: any
): background is BackgroundOpts {
  return (
    isBackground(background) ||
    typeof background === "string" ||
    (background && background.length > 0)
  );
};

export const isContentScripts = function (
  contentScripts: any
): contentScripts is ContentScript[] {
  if (Array.isArray(contentScripts)) {
    const contentScript = contentScripts[0];
    return (
      contentScript &&
      contentScript.matches &&
      Array.isArray(contentScript.matches)
    );
  } else {
    return false;
  }
};

/**
 * 生成扩展清单文件
 * @param clientDir 存放文件路径
 * @param options 扩展配置项
 * @param isGenHtml 是否生成background入口html
 */
export const genManifest = function (
  clientDir: string,
  options: ResolvedOptions,
  isGenHtml?: boolean
) {
  // 复制配置项，剔除不熟悉于chrome extension的配置
  const { host, port, root, background, content, ...manifest } = options;
  const filename = clientDir + "/manifest.json";
  const dir = path.dirname(filename);
  const backgroundManifest = genBackgroundManifest(background);
  const contentManifest = genContentManifest(content);
  (manifest as Manifest).background = backgroundManifest;
  (manifest as Manifest).content_scripts = contentManifest;
  if (isGenHtml) {
    (manifest as Manifest).background = {
      page: "background.html",
    };
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, JSON.stringify(manifest), {
    encoding: "utf-8",
  });
};

/**
 * 根据配置生成入口
 * @param options
 * @returns
 */
export const genInputConfig = function (options: ResolvedOptions) {
  const { background, content } = options;
  const backgroundInput = genBackgroundInput(background);
  const contentInput = genContentInput(content);
  const inputOptions = { ...backgroundInput, ...contentInput };
  return inputOptions;
};

/**
 * 根据配置生成background入口配置
 * @param options
 * @returns
 */
export const genBackgroundInput = function (
  options: string | string[] | Background | undefined
): Record<string, string> {
  if (typeof options === "string") {
    return { background: options };
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "background";
        return [entryName, entryPath];
      } else {
        return [name, entryPath];
      }
    });
    return Object.fromEntries(entries);
  } else if (typeof options === "object" && "page" in options) {
    return genBackgroundInput(options.page);
  } else if (typeof options === "object" && "scripts" in options) {
    return genBackgroundInput(options.scripts);
  }
  return {};
};

/**
 * 根据配置生成content入口
 * @param options
 * @returns
 */
export const genContentInput = function (
  options?: ContentOpts
): Record<string, string> {
  if (typeof options === "string") {
    return { content: options };
  } else if (Array.isArray(options) && isContentScripts(options)) {
    const entries = options.reduce((pre: string[], current) => {
      // TODO: content-script目前支持js作为入口文件，暂不支持css
      if (current.js) {
        return pre.concat(current.js);
      } else {
        return pre;
      }
    }, []);
    return genContentInput(entries);
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "content";
        return [entryName, entryPath];
      } else {
        return [name, entryPath];
      }
    });
    return Object.fromEntries(entries);
  }
  return {};
};

/**
 * 生成background的清单项
 * @param options
 * @returns
 */
export const genBackgroundManifest = function (
  options?: BackgroundOpts
): Background {
  if (typeof options === "string") {
    const entryPath = normalizePath(options);
    const { ext } = path.parse(entryPath);
    return ext === ".html"
      ? { page: "background.html" }
      : { scripts: ["background.js"] };
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "background";
        return entryName + ".js";
      } else {
        return name + ".js";
      }
    });
    return { scripts: entries };
  } else if (typeof options === "object" && "page" in options) {
    return genBackgroundManifest(options.page);
  } else if (typeof options === "object" && "scripts" in options) {
    return genBackgroundManifest(options.scripts);
  }
  return {};
};

/**
 * 生成content-script的清单项
 * @param options
 * @returns
 */
export const genContentManifest = function (
  options?: ContentOpts
): ContentScript[] {
  if (typeof options === "string") {
    // 默认都放到同一目录下
    const entryPath = path.basename(options);
    return [
      {
        matches: ["<all_urls>"],
        js: [entryPath],
      },
    ];
  } else if (Array.isArray(options) && isContentScripts(options)) {
    return options.map((contentScript) => {
      const content = genContentManifest(contentScript.js)[0];
      return { ...contentScript, js: content.js };
    });
  } else if (Array.isArray(options)) {
    const entries = options.map((entryPath) => {
      entryPath = normalizePath(entryPath);
      const { dir, name } = path.parse(entryPath);
      if (name === "index") {
        // index入口文件取上级目录为入口名
        const entryName = dir.split("/").pop() || "content";
        return entryName + ".js";
      } else {
        return name + ".js";
      }
    });
    return [{ matches: ["<all_urls>"], js: entries }];
  } else {
    return [];
  }
};

/**
 * 查找background第一个入口
 * @param options
 * @returns
 */
export const findBackgroundEntry = function (options?: BackgroundOpts) {
  let path = "";
  if (isBackground(options)) {
    path = options.scripts ? options.scripts[0] : "";
  } else if (typeof options === "string") {
    path = options;
  } else if (options && options.length > 0) {
    path = options[0];
  }
  path = normalizePath(path);
  return path;
};
