# 配置文档

## entry

> webpack的entry配置，但是不支持function

- 类型： `array` 或 `Object`

**提示：** 该配置在`mode`为`ssr`时候，类型必须为`Object`，且必须为如下格式:
```
entry: {
    client: "./src/js/app.js",
    server: "./src/server.js"
}
```

- - -

## srcDir 

> 项目源码目录

- 类型： `string`
- 默认： `./src`

- - -

## dev

> 开发环境

- 类型：`object`

### host

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

    > 是否开启[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)的overlay配置，默认为true

    - 类型：`boolean`
    - 默认：`true`

* poll

    > 是否开启[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)的poll配置，默认为false

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

* ssr
    > 是否是ssr模式的开发环境，默认为false

    - 类型：`boolean`
    - 默认为：`false`

* plugins

    > 开发环境下webpack的plugins配置

    - 类型：`array` or `null`

---

## build

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

## js

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

## css

> css配置

- 类型：`object`

* engine

    > css引擎，可以为["css","less","sass","postcss","stylus"]中的任意一个或者多个

    - 类型：`string` or `array`
    - 默认：`css`

---

## image

> 图片配置

- 类型：`object`

* limit

    > 图片base64的限制大小,单位为Byte

    - 类型：`number`
    - 默认：`1000`

---

## html

> html配置

- 类型：`object`

* template

    > [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)配置

    - 类型：`object` or `array`

    * filename

        > [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)的filename配置

        - 类型：`string`
    
    * path

        > [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)的template配置

        - 类型：`string`
    
    * excludeChunks

        > [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)的excludeChunks配置

        - 类型：`array`

        **提示：** 该属性只有在`template`为`array`类型时候才会起作用

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

## white

> 白名单，使用[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)实现

- 类型：`object`

* patterns

    > 要配置的白名单列表，[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)中的第一个参数

    - 类型：`array`

* rules

    > 白名单规则，[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)中的第二参数

    - 类型：`object`

---

## mode 

> 项目应用类型，在`vue/ssr/multiple/spa`中的一个

- 类型：`string`