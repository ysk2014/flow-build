module.exports = {
    // 入口文件
    entry: {
        "app": './src/js/index.js'
    },

    //项目源码目录
    srcDir: "./src",

    //开发配置
    dev: {
        host: 'localhost',
        port: 3000,
        publicPath: '/',
        proxyTable: {},
        errorOverlay: true,
        poll: false, // https://webpack.js.org/configuration/dev-server/#devserver-watchoptions-
        devtool: 'eval-source-map',
        cssSourceMap: false,
        plugins: null
    },

    //打包配置
    build: {
        outputPath: './dist',
        //静态文件子目录
        assetsSubDirectory: "static",
        publicPath: '/',
        // https://webpack.js.org/configuration/devtool/#production
        devtool: '#source-map',
        // bundleAnalyzerReport: process.env.npm_config_report,
        cssSourceMap: true,
        plugins: null
    },

    js: {
        //babel配置
        babel: {
            "presets": [
                ["env", {
                    "modules": false
                }],
                "stage-2"
            ]
        }
    },
    
    //css
    css: {
        engine: "css",  //css引擎，string||array
    },

    image: {
        limit: 1000
    },

    // html的配置
    html: {
        template: {
            filename: 'index.html',
            path: './index.html',
        },
        data: {
            "PUBLIC_URL": "ysk"
        }
    },
    // 项目应用类型，vue/react/multiple/spa
    mode:"spa"
}