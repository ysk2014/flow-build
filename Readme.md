## 一个整合纯净h5、vue的，基于webpack的打包工具

---

## 安装

`npm install --save-dev flow-build`

---

## 开发

`flow start`

---

## 打包

`flow build`

---

## 中间件

```
const Flow = require("flow-build");

const express = require("express");

const flowConfig = require("./flow.config");

const app = express();

let { compiler } = new Flow(flowConfig);

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: config.dev.publicPath,
  quiet: true
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartbeat: 2000
})

app.use(hotMiddleware)

app.use(devMiddleware);

app.listen(flowConfig.dev.port);

```

---

## 命令行参数

```
-c, --config-file       Path to flow.js config file (default: flow.config.js)
```

---

## 配置文档

### entry

> webpack的entry配置，但是不支持function

- 类型： `array` 或 `Object`

- - -

### srcDir 

> 项目源码目录

- 类型： `string`
- 默认： `./src`

- - -

### dev

> 开发环境

- 类型：`object`

* host

  > 开发环境的host地址

  - 类型：`string`
  - 默认： `localhost`


* port

    > 开发环境的端口号，程序会自动检测端口号，并得出一个可以使用的端口

    - 类型：`number`
    - 默认：`3000`

* publicPath

    > 开发环境的静态资源cdn地址，默认为/

    - 类型：`string`
    - 默认：`/`

* proxyTable

    > 开发环境的代理, 基于webpack配置

    - 类型：`object`

* errorOverlay

    > 是否开启webpack-dev-server的overlay配置，默认为true

    - 类型：`boolean`
    - 默认：`true`

* poll

    > 是否开启webpack-dev-server的poll配置，默认为false

    - 类型：`boolean`
    - 默认：`false`

* devtool

    > 开发环境下webpack的devtool配置

    - 类型：`string` or `boolean`
    - 默认：`eval-source-map`

* cssSourceMap

    > 是否生成css的sourceMap配置，默认为false

    - 类型：`boolean`
    - 默认：`false`

* plugins

    > 开发环境下webpack的plugins配置

    - 类型：`array` or `null`

---

### build

> 打包环境配置

- 类型：`object`

* outputPath 

    > 打包环境的输出目录地址，默认为./dist

    - 类型：`string`
    - 默认：`./dist`

* assetsSubDirectory

    > 打包后的静态文件子目录

    - 类型：`string`
    - 默认：`static`

* publicPath

    > 打包的静态资源cdn地址，默认为/

    - 类型：`string`
    - 默认：`/`

* devtool

    > 打包环境的webpack的devtool配置

    - 类型：`string` or `boolean`
    - 默认：`#source-map`

* cssSourceMap

    > 是否生成css的sourceMap配置，默认为true

    - 类型：`boolean`
    - 默认：`true`

* analyze

    > 使用 [webpack-bundle-analyzer](https://github.com/th0r/webpack-bundle-analyzer) 分析并可视化构建后的打包文件，你可以基于分析结果来决定如何优化它。

    - 类型：`boolean`
    - 默认：`false`


* plugins

    > 开发环境下webpack的额外plugins配置

    - 类型：`array` or `null`

---

### js

> js配置

- 类型：`object`

* babel

    > babel配置

    - 类型：`object`
    - 默认：

```

{
    "presets": [
        ["env", {
            "modules": false
        }],
        "stage-2"
    ]
}

```

---

### css

> css配置

- 类型：`object`

* engine

    > css引擎，可以为["css","less","sass","postcss","stylus"]中的任意一个或者多个

    - 类型：`string` or `array`
    - 默认：`css`

---

### image

> 图片配置

- 类型：`object`

* limit

    > 图片base64的限制大小

    - 类型：`number`
    - 默认：`1000`

---

### html

> html配置

- 类型：`object`

* filename

    > html-webpack-plugin的filename配置

    - 类型：`string`

* template

    > html-webpack-plugin的template配置

    - 类型：`string`

* data

    > 替换html中以%包裹的字段

    - 类型：`object`

列如:
```
// html
<link rel="manifest" href="%PUBLIC_URL%/manifest.json">

//配置
data: {
    "PUBLIC_URL": "http://www.baidu.com"
}

//替换结果：
<link rel="manifest" href="http://www.baidu.com/manifest.json">

```

---

### white

> 白名单，使用copy-webpack-plugin实现

- 类型：`object`

* patterns

    > 要配置的白名单列表，copy-webpack-plugin中的第一个参数

    - 类型：`array`

* rules

    > 白名单规则，copy-webpack-plugin中的第二参数

    - 类型：`object`

---

### spa 

> 项目应用类型，在`vue/react/multiple/none`中的一个

- 类型：`string`

