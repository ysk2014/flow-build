# loaders配置

## 内置loaders

- flow-build内置了`babel`,`eslint`,`typescript`,`tslint`,`css`,`sass`,`less`,`stylus`,`urlimage`,`urlfont`等loader

loader  | 别名 | 默认是否开启 | 配置举例  
:-:|:-:|:-:|:-:
babel-loader | babel | true | 禁用: loaders:{ babel: false}
eslint-loader | eslint | false | 自动修复:loaders:{ eslint: {options: {fix: true}}
ts-loader   |  typescript | false | 启用: loaders:{ typescript: true} 
tslint-loader | tslint | false | 启用: loaders:{ tslint: true}
css-loader | css | true | 禁用: loaders:{ css: false}
sass-loader | sass | false | 启用: loaders:{ sass: true}
less-loader | less | false | 启用: loaders:{ less: true}
stylus-loader | stylus | false | 启用: loaders:{ stylus: true}
url-loader | urlimage | true | 禁用: loaders:{ urlimage: false}
url-loader | urlfont | true | 禁用: loaders:{ urlfont: false}

> loades配置非必须，支持 Object | Array。 这里的loaders 是对 Webpack `module.rules` 的简化和增强。建议用 `增强配置` 方式配置。

- 兼容 Webpack 原生数组配置
- [增强]支持通过别名对内置 `loader` 开启和禁用，以及参数配置
- [增强]支持通过别名的方式添加 `loader` 插件

### 内置 loader 扩展参数统一通过 options 节点配置

```js
module.exports = {
    ......
    loaders:{
        ${loader别名}:{
            options:{
                // 具体loader参数
            }
        }
    }
}
```

### Webpack loaders 原生数组配置举例

```js
module.exports = {
  ......
  loaders:[
    {
      test: /\.html$/,
      use: ['html-loader', 'html-swig-loader']
    }
  ]
}
```

### Webpack loaders 增强配置举例

```js
module.exports = {
    ......
    loaders:{
        less: true, // 开启less， 默认禁用
        stylus: true // 开启stylus， 默认禁用
    }
}
```

<b>config.loaders</b> : {Object} Webpack loader 配置, 支持自定义格式和原生格式.

`key:value` 形式, 其中 `key` 为别名, 可以自由定义,flow-build和对应解决方案内置了一些别名和loader.

比如我要添加一个全新且没有内置的 html-swig-loader, 可以这样配置:

```js
{
    loaders:{
        swig : {
            test: /\.html$/,
            use: ['html-loader', 'html-swig-loader']
        }
    }
}
```
`swig` key别名随意, 我可以叫 swig, 也可以叫 htmlswig 等等


### 禁用内置的 babel-loader 可以这样配置

```js
{
    loaders:{
        babel:false
    }
}
```
或
```js
{
    loaders:{
        babel:{
            enable:false
        }
    }
}
```

### 修改内置 babel-loader 的 test 和 use, 可以这样配置

因use存在顺序问题, use 目前采用的策略是完全覆盖

```js
{
    loaders:{
        babel : {
            test: /\.(jsx|vue)?$/,
            exclude: [/node_modules/, 'page/test'],
            use: [
                {
                    loader: 'babel-loader'
                },
                {
                    loader: 'eslint-loader'
                }
            ]
        }
    }
}
```
### loaders具体loader配置项属性介绍

配置项除了支持的loader原生属性, 还扩展了 `env`, `type`, `enable`, `postcss` 四个属性, 其中 postcss 用于css相关loader

- enable: {Boolean/Function} 是否启用, 可选, 默认可用
- postcss: {Boolean} 可选, 特殊配置, 是否启用postcss, 只有css样式loader需要配置, 其他loader不需要配置
- use: {Array/Function} 必须, 支持扩展的Function配置和原生Use配置, use属性是完全覆盖
- env: 见 `env` 配置 说明, 可选, 默认全部
- type: 可选值[`client`, `server`], 可选, 默认全部
