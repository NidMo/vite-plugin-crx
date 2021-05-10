// @ts-check
import typescript from "@rollup/plugin-typescript";
import path from "path";

/**
 * @type { import('rollup').RollupOptions }
 */
const rollupConfig = {
  input: path.resolve(__dirname, "src/index.ts"),
  plugins: [
    typescript({
      
    }),
  ],
  output: {
    dir: path.resolve(__dirname, 'dist'),
    format: "cjs",
    sourcemap: true
  }
};
export default rollupConfig;
