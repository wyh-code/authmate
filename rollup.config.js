
import typescript from "rollup-plugin-typescript2";
import clear from 'rollup-plugin-clear';

export default {
  input: './src/index.ts',
  output: [
    {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].esm.js',
      sourcemap: false, // 是否输出sourcemap
    },
    {
      dir: 'lib',
      format: 'iife',
      entryFileNames: '[name].iife.js',
      name: 'createAuthmate',
      sourcemap: false, // 是否输出sourcemap
    },
    {
      dir: 'lib',
      format: 'umd',
      entryFileNames: '[name].umd.js',
      name: 'createAuthmate', // umd模块名称，相当于一个命名空间，会自动挂载到window下面
      sourcemap: false,
    },
  ],
  plugins: [
    clear({
      targets: ['./lib'],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      useTsconfigDeclarationDir: true
    })
  ],
  external: [] // 添加外部依赖，这里可以填写不需要打包的库
};
