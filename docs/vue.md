## vue解决方案

### 安装

```js
npm install --save-dev flow-vue-hook
```
### flow.config.js配置文件

```js
let VueHook = require("flow-vue-hook");
module.exports = {
    ....
    hooks: [new VueHook()];
}
```

### 开发

`flow start`

### 打包

`flow build`

---

## vue服务端渲染解决方案

### 安装

```js
npm install --save-dev flow-vue-ssr-hook flow-vue-ssr-middleware
```
### flow.config.js配置文件

```js
let VueSSRHook = require("flow-vue-ssr-hook");
module.exports = {
    ....
    hooks: [new VueSSRHook()]; //可以传入参数，例如：new VueSSRHook(options);
}
```

### 参数 options

- babel
    > 是babel-loader的参数对象, 默认为：

    ```js   
    {
        "presets": [
            ["env", {
                "modules": false
            }],
            "stage-2"
        ]
    }
    ```
- serverBundle
    > webpack插件`vue-server-renderer/server-plugin`生成的json文件，默认为：server-bundle.json
- clientManifest
    > webpack插件`vue-server-renderer/client-plugin`生成的json文件，默认为：vue-ssr-client-manifest.json

### 使用方法



```js
const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
const vueSSRMiddleware = require("flow-vue-ssr-middleware");
const resolve = file => path.resolve(__dirname, file)



const isProd = process.env.NODE_ENV === 'production'

const app = express()


const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
})

app.use(favicon('./public/logo-48.png'))

// static
app.use('/static', serve('./dist/static', true))

let instance = vueSSRMiddleware({
  template: resolve('./src/index.template.html'),
  context: {
    title: 'Vue 2.0', // default title
  }
});

app.use(instance);

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
  instance.openBrowser && instance.openBrowser("localhost", port);
})
```