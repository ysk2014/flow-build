## build

> 打包环境配置

- 类型：`object`

### outputPath 

    > 打包环境的输出目录地址，默认为./dist

    - 类型：`string`
    - 默认：`./dist`

### assetsSubDirectory

    > 打包后的静态文件子目录

    - 类型：`string`
    - 默认：`static`

### publicPath

    > 打包的静态资源cdn地址，默认为/

    - 类型：`string`
    - 默认：`/`

### devtool

    > 打包环境的webpack的devtool配置

    - 类型：`string` or `boolean`
    - 默认：`#source-map`

### cssSourceMap

    > 是否生成css的sourceMap配置，默认为true

    - 类型：`boolean`
    - 默认：`true`
