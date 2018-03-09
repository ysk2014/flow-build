# hooks配置

> 钩子向第三方开发者提供了 `flow-build` 引擎中完整的能力。使用阶段式的构建回调，开发者可以引入它们自己的行为到构建流程中。

- 完善webpack配置
- 在相应的打包阶段，引入自己的行为

事件名  | 触发条件 | 参数   
:-:|:-:|:-:
entry-option | 检测完配置文件触发 | builder
base-config  | 初始化环境变量触发 | base - 设置基础webpack配置的实例
merge-loader  | 合并loader触发 | base - 设置基础webpack配置的实例
merge-plugin  | 合并plugin触发 | base - 设置基础webpack配置的实例
client-config  | 得到webpack配置触发 | client - 设置前端webpack配置的实例
server-config  | 得到webpack配置触发 | server - 设置后端webpack配置的实例
run  | 开始编译webpack前触发 | builder
done  | webpack的done触发 | webpack的stats
ssr-done  | webpack的done触发 | webpack的stats


## 创建钩子

`hooks`的组成：

- 一个JavaScript命名函数。
- 在它的原型上定义一个apply方法。
- 指定绑定自身的`事件钩子`。
- 处理内部实例的特定数据。

```js
//命名函数
function MyHook() {

}

// 在它的 prototype 上定义一个 `apply` 方法。
MyHook.prototype.apply = function(builder) {
    // 指定挂载的事件钩子。
    builder.on("eventhook", function(wp /* 处理webpack配置的实例对象。*/) {
        console.log("This is an example hook!!!");
    })
}
```
**提示：** 目前`hook`不支持异步处理


## 使用方法

```js
let MyHook = require("my-hook");

module.exports = {
    ...
    hooks:[
        new MyHook();
    ]
}
```

## hook可以是loaders和plugins配置的总结

> 可以使用`merge-loader`和`merge-plugin`事件把`loader`和`plugin`与默认进行合并，比如：

```js
module.exports = {
    loades: [
        loader1,
        loader2,
        loader3,
        loader4,

        ....

        loadern
    ],
    plugins: [
        plugin1,
        plugin2,
        ....
        pluginn
    ]
}
```
像这种情况，就可以使用hook来完善：

- 创建一个loader.js文件

```js
// loader.js
exports.loader1 = {};
exports.loader2 = {};
......
exports.loadern = {};

```
- 创建一个plugin.js文件

```js
exports.plugin1 = {};
exports.plugin2 = {};
......
exports.pluginn = {};
```

hook文件
```js
let loaders = require("loader");
let plugins = require("plugin");

module.exports = class MyHook {
    constructor() {

    }

    apply(builder) {
        builder.on("merge-loader", (base)=> {
            base.mergeLoader(loaders);
        });
        builder.on("merge-plugin", (base)=> {
            base.mergePlugin(plugins);
        })
    }
}
```


## hook也是webpack配置的增强项

> 可能现在配置，不满足项目的需求，要更改一些webpack配置。hook提供了此功能，分别在`base-config`、`client-config`、`server-config`的生命周期中，提供了base、client、server相应的对象，这些对象提供了一些设置webpack配置的方法。

- setEntry
- setDevTool
- setOutputPath
- setPublicpath
- setExtensions
- setExternals
- setAlias
- setOutputFileName
- setOutputChunkFileName
- setOutput
- setLibrary
- setLibraryTarget
- setNode
- setImageName
- setFontName
- setCssName
- setDevServer
- setTarget
- setResolveLoaderModules

```js
class MyHook {
    constructor() {},

    apply(builder) {
        builder.on("client-config", (client) => {
            client.setAlias({
                "@": path.resolve(builder.options.srcDir),
                "vue$": "vue/dist/vue.esm.js"
            });
        })
    }
}
```