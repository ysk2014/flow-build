"use strict"
let path = require("path");
let webpack = require("webpack");
let fs = require("fs");
let _ = require('lodash');

let utils = require("../utils/utils");
let BaseConfig = require("./BaseConfig");

class ClientConfig extends BaseConfig {
    constructor(builder) {
        super(builder.options);
        this.type = "client";
        this.builder = builder;
        this.webpackConfig.name = "client";

        this.initEnv(builder.options);
        
        this.initialize(builder.options);
    }

    initialize(config) {
        this.initBase(config);

        this.setEntry(config.entry);

        //hook: setDevTool
        if (this.env == "dev") {
            this.setPublicpath(config.dev.publicPath);
            this.setDevTool(config.dev.devtool);
            this.setDevServer(this.createDevServer(config.dev));
        } else {
            this.setPublicpath(config.build.publicPath);
            this.setOutputChunkFileName(config.js.dirname, config.js.hash);
            this.setDevTool(config.build.devtool);
        }

        this.builder.emit('client-config', this);
    }

    createDevServer(dev) {
        return {
            compress: true,
            clientLogLevel: 'warning',
            historyApiFallback: true,
            hot: true,
            inline: true,
            host: dev.host,
            port: dev.port,
            overlay: dev.errorOverlay ? {
                warnings: false,
                errors: true,
            } : false,
            publicPath: dev.publicPath,
            proxy: dev.proxyTable,
            quiet: true, // necessary for FriendlyErrorsPlugin
            watchOptions: {
                poll: dev.poll
            }
        };
    }
}

module.exports = ClientConfig;