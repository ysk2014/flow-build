## 一个整合纯净h5、vue的，基于webpack的打包工具

## 安装

`npm install --save-dev @cluas/flow-build`

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

let {devMiddle, hotMiddleware} = new Flow(flowConfig);

app.use(devMiddleware);

app.use(hotMiddleware);

app.listen(flowConfig.dev.port);

```

## 命令行参数

```
-c, --config-file       Path to flow.js config file (default: flow.config.js)
```


