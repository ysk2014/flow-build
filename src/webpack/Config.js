"use strict";

let path = require("path");
let webpack = require("webpack");
let _ = require("lodash");

let utils = require("../utils/utils");

/**
 * webpack config class
 */
class Config {
    /**
     * 构造器
     */
    constructor(config) {
        this.baseDir = config.baseDir || process.cwd();
        this.webpack = webpack;

        this.utils = utils;
        this.flowConfig = config;

        this._init(config);
        this._initEnv(config);
    }
    /**
     * 文件路径前缀
     */
    get prefix() {
        return this.flowConfig.build.assetsSubDirectory || "";
    }

    /**
     * 初始化, 加载默认的webpackConfig
     */
    _init(config) {
        this.config = {
            mode: config.mode,
            fallback: "style-loader",
            imerge: config.image.imerge,
            html: config.html,
            cssExtension: [...new Set([
                "css",
                "wxss",
                "less",
                "postcss",
                "sass",
                "scss",
                "stylus",
                "styl"
            ].concat(config.css.extension))],
            loaderOptions: {
                babel: {
                    babelrc: false,
                    configFile: false,
                    presets: [require.resolve("@nuxtjs/babel-preset-app")],
                    plugins: ["@babel/plugin-transform-runtime"]
                },
                postcss: {
                    ident: "postcss",
                    sourceMap: false,
                    plugins: () => [
                        require("postcss-flexbugs-fixes"),
                        require("autoprefixer")({
                            browsers: [
                                ">1%",
                                "last 4 versions",
                                "Firefox ESR",
                                "not ie < 9"
                            ],
                            flexbox: "no-2009"
                        })
                    ]
                }
            }
        };

        if (config.css.postcss) this.config.loaderOptions.postcss = config.css.postcss;
        if (config.js.babel) this.config.loaderOptions.babel = config.css.babel;
        
        this.webpackConfig = _.cloneDeep(require("../../config/webpack"));
        this.rules = _.cloneDeep(require("../../config/rules"));
        this.plugins = _.cloneDeep(require("../../config/plugins"));
        this.optimization = _.cloneDeep(require("../../config/optimization"));
    }
    /**
     * 初始化环境
     * @param {*} config
     */
    _initEnv(config = {}) {
        this.env = config.env || "dev"; // local/dev, test, prod
        this.dev = false;
        this.test = false;
        this.prod = false;
        if (this.env == "prod") {
            this.prod = true;
            this.config.cssSourceMap =
                (config.build && config.build.cssSourceMap) || true;
            this.config.extract = true;
            this.config.loaderOptions.postcss.sourceMap = this.config.cssSourceMap;
        } else if (this.env == "test") {
            this.test = true;
            this.config.cssSourceMap =
                (config.build && config.build.cssSourceMap) || true;
            this.config.extract = true;
            this.config.loaderOptions.postcss.sourceMap = this.config.cssSourceMap;
        } else {
            this.dev = true;
            this.config.cssSourceMap =
                (config.dev && config.dev.cssSourceMap) || false;
            this.config.extract = false;
        }

        this.set("mode", this.dev ? "development" : "production");
    }
    /**
     * 设置config
     * @param {Object} config
     */
    setConfig(config) {
        this.config = _.merge(this.config, config);
    }

    /**
     * 设置webpack的output.filename
     * @param {String} dirname
     * @param {String} hash
     */
    setOutputFileName(dirname, hash) {
        if (this.env == "dev") {
            this.webpackConfig.output.filename = utils.assetsPath(
                this.prefix,
                `${dirname}/[name].js`
            );
        } else {
            this.webpackConfig.output.filename = utils.assetsPath(
                this.prefix,
                `${dirname}/[name].[chunkhash:${hash}].js`
            );
        }
    }
    /**
     * 设置webpack的ouput.path
     * @param {*} outputPath
     */
    setOutputPath(outputPath) {
        if (path.isAbsolute(outputPath)) {
            this.webpackConfig.output.path = outputPath;
        } else {
            this.webpackConfig.output.path = path.resolve(
                process.cwd(),
                outputPath
            );
        }
    }

    /**
     * 设置webpack的output.chunkFilename
     * @param {String} dirname
     * @param {*} hash
     */
    setOutputChunkFileName(dirname, hash) {
        if (this.env == "dev") {
            this.webpackConfig.output.chunkFilename = utils.assetsPath(
                this.prefix,
                `${dirname}/[name].js`
            );
        } else {
            this.webpackConfig.output.chunkFilename = utils.assetsPath(
                this.prefix,
                `${dirname}/[name].[chunkhash:${hash}].js`
            );
        }
    }

    /**
     * 设置image输出名称
     * @param {String} dirname
     * @param {*} hash
     */
    setImageName(dirname, hash) {
        this.rules.urlimage.use[0].options.name = utils.assetsPath(
            this.prefix,
            `${dirname}/[name].[hash:${hash}].[ext]`
        );
    }
    /**
     * 设置font输出名称和格式
     * @param {String} dirname
     * @param {*} hash
     */
    setFontName(dirname, hash) {
        this.rules.urlfont.use[0].options.name = utils.assetsPath(
            this.prefix,
            `${dirname}/[name].[hash:${hash}].[ext]`
        );
    }
    /**
     * 设置css的输出格式
     * @param {String} dirname
     * @param {*} hash
     */
    setCssName(dirname, hash) {
        this.config.cssName = utils.assetsPath(
            this.prefix,
            `${dirname}/[name].[contenthash:${hash}].css`
        );
    }

    /**
     * 判断type值是否有效， type可以为[client, server]其中的一个或者多个
     * @param {*} type
     */
    isType(type) {
        return (
            type === undefined ||
            type === this.type ||
            (Array.isArray(type) && type.includes(this.type))
        );
    }
    /**
     * 判断env值是否有效，env可以为test, dev, prod其中的一个或者多个
     * @param {*} env
     */
    isEnv(env) {
        return (
            env === undefined ||
            env === this.env ||
            (Array.isArray(env) && env.includes(this.env))
        );
    }
    /**
     *
     * @param {*} enable
     */
    isEnable(enable) {
        if (_.isFunction(enable)) {
            return enable.apply(this);
        }
        if (_.isBoolean(enable)) {
            return enable;
        }
        if (_.isUndefined(enable)) {
            return true;
        }
        return false;
    }
    /**
     * 判断该loader或者plugin是否能够使用
     * @param {*} name
     * @param {*} range
     */
    isUse(name, range = "plugin") {
        if (_.isBoolean(name)) {
            return name;
        }
        return (
            _.isPlainObject(name) &&
            this.isType(name.type) &&
            this.isEnv(name.env) &&
            this.isEnable(name.enable)
        );
    }

    /**
     * 获取webpackConfig的配置
     * @param {*} path
     */
    get(path) {
        return _.get(this.webpackConfig, path);
    }

    /**
     * 设置webpackConfig的配置
     * @param {*} path
     * @param {*} val
     */
    set(path, val) {
        return _.set(this.webpackConfig, path, val);
    }

    /**
     * 更新webpackConfig的配置
     * @param {*} path
     * @param {*} updater
     */
    update(path, updater) {
        this.set(path, updater(this.get(path)));
    }

    /**
     * 删除webpackConfig的配置
     * @param {*} path
     */
    delete(path) {
        return _.unset(this.webpackConfig, path);
    }

    /**
     * 在webpackConfig中是否含有某项配置
     * @param {*} path
     * @param {*} item
     */
    has(path) {
        return _.has(this.webpackConfig, path);
    }
}

module.exports = Config;
