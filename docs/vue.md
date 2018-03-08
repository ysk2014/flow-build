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
npm install --save-dev flow-vue-ssr-hook
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

### `flow-build`的build方法

> 需要传入一个回调函数callback，用来生成`vue-server-renderer`的`renderer`，和返回webpack-dev-middleware以及webpack-hot-middleware的实例

```js
function createRenderer (_fs = fs) {
    const template = fs.readFileSync(templatePath, 'utf-8')
    let distPath = path.resolve(process.cwd(), 'dist')

    const bundle = JSON.parse(_fs.readFileSync(path.resolve(distPath, './server-bundle.json'), "utf-8"))
    const clientManifest = JSON.parse(_fs.readFileSync(path.resolve(distPath, './vue-ssr-client-manifest.json'), "utf-8"));

    renderer = createBundleRenderer(bundle, {
        cache: LRU({
            max: 1000,
            maxAge: 1000 * 60 * 15
        }),
        basedir: resolve('./dist'),
        runInNewContext: false,
        template,
        clientManifest
    });
}


let SSRBuilder = require("flow-build");
let builder = new SSRBuilder(require('./flow.config'));

async function createServer() {
    let { devMiddleware, hotMiddleware } = await builder.build(createRenderer);
    app.use(hotMiddleware);
    app.use(devMiddleware);

    app.use(render)

    const port = process.env.PORT || 3000
    app.listen(port, () => {
        console.log(`server started at localhost:${port}`)
    })
}

```