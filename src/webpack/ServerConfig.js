"use strict"
let path = require("path");
let fs = require("fs");
let _ = require('lodash');

let utils = require("../utils/utils");
let BaseConfig = require("./BaseConfig");

class ServerConfig extends BaseConfig {
    constructor(builder) {
        super(builder.options);
        this.builder = builder;
        this.type = "server";
        this.target = "node";
        this.webpackConfig.name = "server";

        this.initEnv(builder.options);
        this.initialize(builder.options);
    }
    
    initialize(config) {
        this.setEntry(config.entry.server);
        this.setTarget('node');
        this.setNode(false);

        this.setOutputPath(config.build.outputPath);
        this.setOutputFileName(config.js.dirname, config.js.hash);
        this.setLibraryTarget("commonjs2");

        this.setImageName(config.image.dirname, config.image.hash);
        this.setCssName(config.css.dirname, config.css.hash);
        this.setFontName(config.font.dirname, config.font.hash);

        //hook: mergeloaders
        this.setLoaders(config.loaders);


        this.setPlugins(config.plugins);

        if (this.env == "dev") {
            this.setPublicpath(config.dev.publicPath);
        } else {
            this.setPublicpath(config.build.publicPath);
        }

        this.builder.emit("server-config", this);
    }
}

module.exports = ServerConfig;