# dev配置

> 开发环境

- 类型：`object`

### host

> 开发环境的host地址

- 类型：`string`
- 默认： `localhost`


### port

    > 开发环境的端口号，程序会自动检测端口号，并得出一个可以使用的端口

    - 类型：`number`
    - 默认：`3000`

### publicPath

    > 开发环境的静态资源cdn地址，默认为/

    - 类型：`string`
    - 默认：`/`

### proxy

    > 开发环境的代理, 基于webpack配置

    - 类型：`object`

### errorOverlay

    > 是否开启[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)的overlay配置，默认为true

    - 类型：`boolean`
    - 默认：`true`

### poll

    > 是否开启[webpack-dev-server](https://www.npmjs.com/package/webpack-dev-server)的poll配置，默认为false

    - 类型：`boolean`
    - 默认：`false`

### devtool

    > 开发环境下webpack的devtool配置

    - 类型：`string` or `boolean`
    - 默认：`eval-source-map`

### cssSourceMap

    > 是否生成css的sourceMap配置，默认为false

    - 类型：`boolean`
    - 默认：`false`