## 一个整合纯净h5、vue的，基于webpack的打包工具

## 安装

`npm install --save-dev flow-build`

## 开发

`flow start`

## 打包

`flow build`

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

## 命令行参数

```
-c, --config-file       Path to flow.js config file (default: flow.config.js)
```


