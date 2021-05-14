import { UserConfig } from "vite";
import crx from "vite-plugin-crx";

const path = require("path");

function pathResolve(dir: string) {
  return path.resolve(process.cwd(), dir);
}

const viteConfig: UserConfig = {
  server: {
    port: 3050,
  },
  plugins: [
    crx({
      name: "demo",
      version: "1.0.0",
      background: [
        pathResolve("background/index.ts"),
        pathResolve("background/a.ts"),
      ],
      content: [
        {
          matches: ["<all_urls>"],
          js: [pathResolve("./content/index.ts"), pathResolve("./content/b.ts")],
        },
        {
          matches: ["http://*/*"],
          js: [pathResolve("./content/c.ts")],
        },
      ],
    }),
  ],
};

export default viteConfig;
