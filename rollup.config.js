// rollup.config.js
import typescript from "rollup-plugin-typescript2";
import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';

export default {
  // 入口文件
  input: './src/index.ts',
  
  output: [
    // ========== ESM 格式 ==========
    // 现代构建工具（Webpack、Vite）和 Node.js（type: "module"）使用
    {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].esm.js',
      sourcemap: true, // 建议开启，方便调试
      // ESM 中，axios 作为外部依赖，不打包进来
    },
    
    // ========== CommonJS 格式 ==========
    // Node.js 和旧版构建工具使用
    {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs.js',
      sourcemap: true,
      exports: 'named', // 支持命名导出：const { Authmate } = require(...)
      // CJS 中，axios 作为外部依赖，不打包进来
    },
    
    // ========== UMD 格式（打包 axios）==========
    // 浏览器直接使用，axios 会被打包进来
    {
      dir: 'lib',
      format: 'umd',
      entryFileNames: '[name].umd.js',
      name: 'Authmate', // 全局变量名，window.Authmate
      sourcemap: true,
      // UMD 格式中不设置 globals，让 axios 打包进来
      // 这样浏览器可以直接使用，无需额外引入 axios
    },
    
    // ========== UMD 压缩版 ==========
    // 生产环境使用的压缩版本
    {
      dir: 'lib',
      format: 'umd',
      entryFileNames: '[name].umd.min.js',
      name: 'Authmate',
      sourcemap: false, // 压缩版不需要 sourcemap
      plugins: [terser()], // 压缩代码
    },
  ],
  
  plugins: [
    // ========== 清理输出目录 ==========
    clear({
      targets: ['./lib'], // 每次打包前清空 lib 目录
    }),
    
    // ========== 处理 peerDependencies ==========
    // 自动将 package.json 中的 peerDependencies 标记为外部依赖
    peerDepsExternal(),
    
    // ========== 解析 node_modules 中的模块 ==========
    resolve({
      browser: true, // 优先使用包的 browser 字段（适合浏览器环境）
      preferBuiltins: false, // 不优先使用 Node.js 内置模块
      extensions: ['.js', '.json', '.ts'], // 解析的文件扩展名
      mainFields: ['module', 'main', 'browser'], // 查找包入口的优先级
    }),
    
    // ========== 转换 CommonJS 模块 ==========
    // axios 内部可能使用 CommonJS，需要转换为 ESM
    commonjs({
      include: /node_modules/, // 只转换 node_modules 中的模块
      sourceMap: true, // 生成 sourcemap
    }),
    
    // ========== 支持导入 JSON 文件 ==========
    json(),
    
    // ========== TypeScript 编译 ==========
    typescript({
      tsconfig: "./tsconfig.json",
      useTsconfigDeclarationDir: true, // 使用 tsconfig 中的 declarationDir
      clean: true, // 每次构建前清理缓存
      tsconfigOverride: {
        // 覆盖 tsconfig 的部分配置
        compilerOptions: {
          declaration: true, // 生成 .d.ts 类型文件
        },
        exclude: [
          'node_modules',
          '**/*.test.ts',
          '**/*.spec.ts',
        ],
      },
    }),
  ],
  
  // ========== 警告处理 ==========
  onwarn(warning, warn) {
    // 忽略特定警告
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return; // 忽略循环依赖警告
    }
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      return; // 忽略未使用的外部导入警告
    }
    warn(warning); // 其他警告正常显示
  },
};
