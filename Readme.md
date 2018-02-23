## 集成webpack的打包工具，可以打包纯净的单页，多页，vue应用

## 安装

`npm install --save-dev flow-build`

## 开发
运行

`flow start`

## 打包

`flow build`

## 中间件

```
const express = require('express')
const Flow = require("flow-build");

const config = require("./flow.config");

const port = process.env.PORT || config.dev.port

const app = express();
let {devMiddleware, hotMiddleware} = new Flow(config);

app.use(hotMiddleware)

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

app.listen(config.dev.port);

```



## [配置文档](https://github.com/ysk2014/flow-build/blob/master/docs/config.md) 
