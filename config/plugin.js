"use strict";

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const chalk = require("chalk");
const os = require("os");
const WORKERS = os.cpus().length - 1;
const UGLIFYJS_WORKERS = WORKERS > 8 ? 8 : WORKERS;

exports.define = {
    enable: true,
    name: webpack.DefinePlugin,
    args() {
        const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : (this.prod ? "production" : "development");
        return {
            "process.env.NODE_ENV": JSON.stringify(NODE_ENV)
        };
    }
};

exports.npm = {
    enable: false,
    name: "npm-install-webpack3-plugin",
    args: {
        dev: true
    }
};


exports.error = {
    enable: true,
    name: webpack.NoEmitOnErrorsPlugin
};

exports.nameModule = {
    enable: true,
    env: ["dev"],
    type: "client",
    name: webpack.NamedModulesPlugin,
    args: {}
};

exports.hashModule = {
    enable: true,
    env: ["test", "prod"],
    name: webpack.HashedModuleIdsPlugin,
    args: {}
};

exports.hot = {
    enable: true,
    type: "client",
    env: ["dev"],
    name: webpack.HotModuleReplacementPlugin
};

exports.module = {
    enable: true,
    env: ["test", "prod"],
    name: webpack.optimize.ModuleConcatenationPlugin
};

exports.uglifyJs = {
    enable: true,
    env: ["prod"],
    name: "uglifyjs-webpack-plugin",
    args: {
        cache: true,
        parallel: UGLIFYJS_WORKERS,
        sourceMap: true,
        uglifyOptions: {
            warnings: false,
            compress: {
                dead_code: true,
                // drop_console: true,
                drop_debugger: true
            },
            output: {
                comments: false
            }
        }
    }
};

exports.extract = {
    name: "extract-text-webpack-plugin",
    env: ["test", "prod"],
    enable: true,
    args() {
        return { filename: this.config.cssName, allChunks: true };
    }
};

exports.optimizeCSS = {
    type: "client",
    name: "optimize-css-assets-webpack-plugin",
    env: ["test", "prod"],
    enable: true,
    args() {
        return { cssProcessorOptions: this.config.cssSourceMap
            ? { safe: true, map: { inline: false } }
            : { safe: true }
        };
    }
};

exports.html = {
    enable: true,
    type: "client",
    name: "html-webpack-plugin",
    withimg: false,
    args() {
        let obj = { 
            filename: this.config.html.template.filename,
            template: path.resolve(this.baseDir, this.config.html.template.path),
            inject: true,
            chunksSortMode: "dependency"
        };

        if (this.env!="dev") {
            obj = Object.assign({}, obj, {
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true
                }
            });
        };
        return obj;
    }
};

exports.vendor = {
    enable: true,
    type: "client",
    env: ["test", "prod"],
    name: webpack.optimize.CommonsChunkPlugin,
    args: {
        name: "vendor",
        minChunks: function (module) {
            // any required modules inside node_modules are extracted to vendor
            return (
                module.resource &&
                /\.js$/.test(module.resource) &&
                module.resource.indexOf(
                    path.join(process.cwd(), "./node_modules")
                ) === 0
                && !/\.(css|less|scss|sass|styl|stylus|vue)$/.test(module.request)
            );
        }
    }
};

exports.manifest = {
    enable: true,
    type: "client",
    env: ["test", "prod"],
    name: webpack.optimize.CommonsChunkPlugin,
    args: {
        name: "manifest",
        minChunks: Infinity
    }
};


exports.imagemini = {
    enable: false,
    env: ["prod"],
    type: "client",
    name: "imagemin-webpack-plugin",
    entry: "default"
};

exports.analyzer = {
    enable: false,
    type: "client",
    name: "webpack-bundle-analyzer",
    entry: "BundleAnalyzerPlugin",
    args() {
        return {
            analyzerPort: this.ssr ? 9998 : 9999,
            statsFilename: this.type ? this.type + "_analyzer_stats.json" : "analyzer_stats.json"
        };
    }
};

exports.processbar = {
    enable: false,
    env: ["test", "prod"],
    name: "progress-bar-webpack-plugin",
    args() {
        let format, complete;
        if (this.type== "client") {
            format = `${chalk.green.bold("*")} ${chalk.green("client")} :bar ${chalk.green.bold(":percent")} :msg`;
            complete = chalk.green("█");
        }  else {
            format = `${chalk.yellow.bold("*")} ${chalk.yellow("server")} :bar ${chalk.yellow.bold(":percent")} :msg`;
            complete = chalk.yellow("█");
        }
        return {
            complete: complete,
            incomplete: chalk.white("█"),
            format: format,
            clear: true
        };
    }
};



  