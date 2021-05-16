import { UserConfig } from "vite";
import crx from "vite-plugin-crx";

const path = require("path");

function pathResolve(dir: string) {
  return path.resolve(process.cwd(), dir);
}

const viteConfig: UserConfig = {
  plugins: [
    crx({
      name: "demo",
      version: "1.0.0",
      port: 3080,
      background: [
        pathResolve("background/index.ts"),
        pathResolve("background/a.ts"),
      ],
      content: [
        {
          matches: ["<all_urls>"],
          js: [pathResolve("./content/index.ts")],
        },
        {
          matches: ["<all_urls>"],
          js: [pathResolve("./content/entry.ts")],
        },
      ],
    }),
  ],
};

export default viteConfig;
