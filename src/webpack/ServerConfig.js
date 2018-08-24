"use strict";
let BaseConfig = require("./BaseConfig");

/**
 * 服务端打包
 */
class ServerConfig extends BaseConfig {
    /**
     * 构造器
     * @param {*} builder
     */
    constructor(builder) {
        super(builder.options);
        this.builder = builder;
        this.type = "server";
        this.target = "node";
        this.set("name", "server");

        this.initialize(builder.options);
    }
    /**
     * 获取webpack配置
     * @param {*} config
     */
    initialize(config) {
        this.initBase(config);

        this.set("entry", config.entry.server);
        this.set("target", "node");
        this.set("node", { __filename: false, __dirname: false });
        this.set("output.libraryTarget", "commonjs2");

        if (this.env == "dev") {
            this.set("output.publicPath", config.dev.publicPath);
        } else {
            this.set("output.publicPath", config.build.publicPath);
        }

        this.builder.emit("server-config", this);
    }
}

module.exports = ServerConfig;
