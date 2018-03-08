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