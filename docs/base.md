# 基础配置

## entry

> webpack的entry配置，但是不支持function

- 类型： `array` 或 `Object`

**提示：** 该配置在`mode`为`ssr`时候，类型必须为`Object`，且必须为如下格式:
```
entry: {
    client: "./src/js/app.js",
    server: "./src/server.js",
    vendor: ["vue","vue-router"] //非必选
}
```

## srcDir 

> 项目源码目录

- 类型： `string`
- 默认： `./src`

## js

> js配置

- 类型：`object`

* dirname
    > js输出文件夹

    - 类型：`string`
    - 默认：`js`

* hash
    > js输出hash值的长度
    
    - 类型：`number`
    - 默认：16

## css

> css配置

- 类型：`object`

* engine

    > css引擎，可以为["css","less","sass","postcss","stylus"]中的任意一个或者多个

    - 类型：`string` or `array`
    - 默认：`css`

* dirname
    > css输出文件夹

    - 类型：`string`
    - 默认：`css`

* hash
    > hash值的长度

    - 类型：`number`
    - 默认：16

## image

> 图片配置

- 类型：`object`

* limit

    > 图片base64的限制大小,单位为Byte

    - 类型：`number`
    - 默认：`1000`

* dirname
    > image输出文件夹

    - 类型：`string`
    - 默认：`images`

* hash
    > hash值的长度

    - 类型：`number`
    - 默认：16

* imerge
    > 是否要合图

    - 类型：`boolean`
    - 默认：`false`

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



## white

> 白名单，使用[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)实现

- 类型：`object`

* patterns

    > 要配置的白名单列表，[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)中的第一个参数

    - 类型：`array`

* rules

    > 白名单规则，[copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)中的第二参数

    - 类型：`object`


## mode 

> 项目应用类型，在`vue/ssr/multiple/spa`中的一个

- 类型：`string`

## env

> 环境变量, dev、test、prod

- 类型：`string`
- 默认：'dev'

## alias

> webpack的alias

- 类型：`object`

## extensions

> webpack的extensions

- 类型：`array`