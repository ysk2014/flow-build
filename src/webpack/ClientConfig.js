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
        this.setEntry(config.entry);
        this.setOutputPath(config.build.outputPath);
        this.setOutputFileName(config.js.dirname, config.js.hash);
        
        this.setImageName(config.image.dirname, config.image.hash);
        this.setCssName(config.css.dirname, config.css.hash);
        this.setFontName(config.font.dirname, config.font.hash);

        //hook: mergeloaders
        this.setLoaders(config.loaders);

        // hook: mergePlugin
        this.setPlugins(config.plugins);
        
        //hook: setDevTool
        if (this.env == "dev") {
            this.setPublicpath(config.dev.publicPath);
            this.setDevTool(config.dev.devtool);
            this.builder.emit("devServer", this);
        } else {
            this.setPublicpath(config.build.publicPath);
            this.setOutputChunkFileName(config.js.dirname, config.js.hash);
            this.setDevTool(config.build.devtool);
        }

        this.builder.emit('client-config', this);
    }
}

module.exports = ClientConfig;