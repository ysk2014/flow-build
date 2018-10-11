"use strict";

const path = require("path");
const webpack = require("webpack");
const chalk = require("chalk");

exports.define = {
    enable: true,
    name: webpack.DefinePlugin,
    args() {
        const NODE_ENV = process.env.NODE_ENV
            ? process.env.NODE_ENV
            : this.prod
                ? "production"
                : "development";
        return {
            "process.env.NODE_ENV": JSON.stringify(NODE_ENV)
        };
    }
};

exports.npm = {
    enable: false,
    name: "npm-install-webpack4-plugin",
    args: {
        dev: true
    }
};

exports.hot = {
    enable: true,
    type: "client",
    env: ["dev"],
    name: webpack.HotModuleReplacementPlugin
};

exports.extract = {
    name: "mini-css-extract-plugin",
    env: ["test", "prod"],
    enable: true,
    args() {
        return { filename: this.config.cssName, allChunks: true };
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
            template: path.resolve(
                this.baseDir,
                this.config.html.template.path
            ),
            inject: true,
            chunksSortMode: "dependency"
        };

        if (this.env != "dev") {
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
        }
        return obj;
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
            statsFilename: this.type
                ? this.type + "_analyzer_stats.json"
                : "analyzer_stats.json"
        };
    }
};

exports.processbar = {
    enable: false,
    env: ["test", "prod"],
    name: "progress-bar-webpack-plugin",
    args() {
        let format, complete;
        if (this.type == "client") {
            format = `${chalk.green.bold("*")} ${chalk.green(
                "client"
            )} :bar ${chalk.green.bold(":percent")} :msg`;
            complete = chalk.green("█");
        } else {
            format = `${chalk.yellow.bold("*")} ${chalk.yellow(
                "server"
            )} :bar ${chalk.yellow.bold(":percent")} :msg`;
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
