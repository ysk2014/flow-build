## 配置文件：flow.config.js

> 配置大纲

``` js
module.exports = {
    // 入口文件, 继承webpack的entry特性，在ssr模式下有所变化，详情请看服务端渲染章节
    entry: {
        "app": './src/js/index.js'
    },

    srcDir: "./src"，   //项目源码目录

    // 开发环境配置项
    dev: {},

    //打包环境配置
    build: {},

    //image的基础配置
    image: {},

    // css的基础配置
    css: {},

    //js的基础配置
    js: {},

    //html的基础配置
    html: {},

    //font的基础配置
    font: {},

    //白名单
    white: {},

    //项目应用类型，vue/ssr/multiple/spa
    mode: "spa",

    //项目环境，dev/test/prod
    env: "dev",

    //对webpack的loader进行补充、关闭、覆盖
    loaders: {},

    //对webpack的plugin进行补充、关闭、覆盖
    plugins: {},

    //打包插件
    hooks: {}
}
```

## 特殊配置

- [开发环境配置](./docs/dev.md)
- [打包环境配置](./docs/build.md)
- [loaders配置](./docs/loaders.md)
- [plugins配置](./docs/plugins.md)
- [hooks配置](./docs/hooks.md)