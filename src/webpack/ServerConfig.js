"use strict";
let path = require("path");
let fs = require("fs");
let _ = require("lodash");

let utils = require("../utils/utils");
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
        this.webpackConfig.name = "server";

        this.initialize(builder.options);
    }
    /**
     * 获取webpack配置
     * @param {*} config 
     */
    initialize(config) {
        this.initBase(config);
        
        this.setEntry(config.entry.server);
        this.setTarget("node");
        this.setNode(false);
        this.setLibraryTarget("commonjs2");

        if (this.env == "dev") {
            this.setPublicpath(config.dev.publicPath);
        } else {
            this.setPublicpath(config.build.publicPath);
        }

        this.builder.emit("server-config", this);
    }
}

module.exports = ServerConfig;