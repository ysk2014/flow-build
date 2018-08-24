"use strict";
let BaseConfig = require("./BaseConfig");

/**
 * 前端打包
 */
class ClientConfig extends BaseConfig {
    /**
     * 构造器
     * @param {*} builder
     */
    constructor(builder) {
        super(builder.options);
        this.type = "client";
        this.builder = builder;
        this.set("name", "client");
        this.initialize(builder.options);
    }
    /**
     * 初始化webpack配置
     * @param {*} config
     */
    initialize(config) {
        this.initBase(config);

        this.set("entry", config.entry);

        if (this.env == "dev") {
            this.set("output.publicPath", config.dev.publicPath);
            this.set("devtool", config.dev.devtool);
            this.set("devServer", this.createDevServer(config.dev));
        } else {
            this.set("output.publicPath", config.build.publicPath);
            this.setOutputChunkFileName(config.js.dirname, config.js.hash);
            this.set("devtool", config.build.devtool);
        }

        this.builder.emit("client-config", this);
    }
    /**
     * 获取devserver的配置
     * @param {*} dev
     */
    createDevServer(dev) {
        return {
            compress: true,
            clientLogLevel: "warning",
            historyApiFallback: true,
            hot: true,
            inline: true,
            host: dev.host,
            port: dev.port,
            overlay: dev.errorOverlay
                ? { warnings: false, errors: true }
                : false,
            publicPath: dev.publicPath,
            proxy: dev.proxy,
            quiet: true, // necessary for FriendlyErrorsPlugin
            watchOptions: {
                poll: dev.poll
            }
        };
    }
}

module.exports = ClientConfig;
