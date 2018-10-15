"use strict";

let _ = require("lodash");
let assert = require("assert");
let chalk = require("chalk");
let merge = require("webpack-merge");
let MiniCssExtractPlugin = require("mini-css-extract-plugin");
let Config = require("./Config");

/**
 * webpack 基础配置项
 */
class BaseConfig extends Config {
    /**
     * 构造器
     * @param {Object} config
     */
    constructor(config) {
        super(config);
    }

    /**
     * 初始化webpack基础配置
     * @param {Object} config
     */
    initBase(config) {
        this.setImageName(config.image.dirname, config.image.hash);
        this.setCssName(config.css.dirname, config.css.hash);
        this.setFontName(config.font.dirname, config.font.hash);

        this.setOutputPath(config.build.outputPath);
        this.setOutputFileName(config.js.dirname, config.js.hash);

        this.set("resolve.alias", config.alias || {});
        this.update("resolve.extensions", old => {
            return _.union(old, config.extensions || []);
        });

        this.builder.emit("base-config", this);

        //hook: mergeRules
        this.setRules(config.rules);

        // hook: mergePlugin
        this.setPlugins(config.plugins);
    }

    /**
     * 合并rule配置项
     * @param {Object | Array} rules
     * @param {Object} target
     */
    mergeRule(rules = {}, target) {
        target = target || this.rules;

        const cloneRules = _.cloneDeep(rules);
        const sourceRules = Array.isArray(cloneRules) ? {} : cloneRules;

        if (Array.isArray(cloneRules)) {
            cloneRules.forEach(rule => {
                if (this.utils.isWebpackRule(rule)) {
                    let label = this.utils.getLoaderLabel(rule);
                    sourceRules[label] = Object.assign({}, rule, {
                        enable: true
                    });
                } else if (
                    _.isPlainObject(rule) &&
                    Object.keys(rule).length === 1
                ) {
                    let label = Object.keys(rule)[0];
                    sourceRules[label] = rule[label];
                }
            });
        }

        Object.keys(sourceRules).forEach(key => {
            let sourceRule = sourceRules[key];

            if (sourceRule.loader) {
                sourceRule.use = [
                    {
                        loader: sourceRule.loader,
                        options: sourceRule.options || {}
                    }
                ];
            }

            const rule = target[key];

            if (rule) {
                if (_.isPlainObject(sourceRule)) {
                    if (sourceRule.enable === undefined) {
                        target[key].enable = true;
                    }

                    target[key] = Object.assign(target[key], sourceRule);

                    if (sourceRule.use) {
                        target[key].use = sourceRule.use;
                    }
                } else if (_.isBoolean(sourceRule)) {
                    target[key].enable = sourceRule;
                }
            } else if (this.utils.isWebpackRule(sourceRule)) {
                target[key] = sourceRule;
            }

            if (sourceRule.options && target[key]) {
                let index = target[key].use.length - 1;
                if (target[key].use[index]) {
                    target[key].use[index].options = sourceRule.options;

                    let label = this.utils.getLoaderLabel(
                        target[key].use[index]
                    );
                    this.config.loaderOptions[label] = sourceRule.options;
                }
            }
        });
        return target;
    }

    /**
     * 设置webpack的loader
     * @param {Object} rules
     */
    setRules(rules) {
        this.builder.emit("merge-rule", this);
        this.mergeRule(rules);

        let target = _.cloneDeep(this.rules);
        let result = [];
        let postcssLoader = this.createPostCssLoader();
        let cssExtension = this.config.cssExtension;

        Object.keys(target).forEach(name => {
            let itemRule = target[name];

            if (this.isUse(itemRule)) {
                let useloaders = itemRule.use;

                if (_.isFunction(itemRule.use)) {
                    itemRule.use = itemRule.use.apply(this);
                }

                if (itemRule.postcss) {
                    useloaders.splice(1, 0, postcssLoader);
                }

                useloaders.forEach((k, i) => {
                    if (_.isString(k)) {
                        useloaders[i] = { loader: k };
                    }

                    let label = this.utils.getLoaderLabel(k);

                    if (cssExtension.includes(name)) {
                        useloaders[i].options = Object.assign(
                            {
                                sourceMap: this.config.cssSourceMap
                            },
                            useloaders[i].options
                        );
                    } else {
                        if (label == "babel") {
                            useloaders[i].options = Object.assign(
                                {},
                                useloaders[i].options,
                                this.config.loaderOptions[label]
                            );
                        } else {
                            useloaders[i].options = Object.assign(
                                {},
                                useloaders[i].options
                            );
                        }
                    }
                });

                if (cssExtension.includes(name)) {
                    const fallback = this.config.extract
                        ? MiniCssExtractPlugin.loader
                        : this.config.fallback;
                    itemRule.use = [
                        {
                            loader: "cache-loader",
                            options: {
                                cacheDirectory: path.resolve(
                                    process.cwd(),
                                    "node_modules/.cache/cache-loader"
                                )
                            }
                        },
                        fallback
                    ].concat(useloaders);
                } else {
                    itemRule.use = [{
                        loader: "cache-loader",
                        options: {
                            cacheDirectory: path.resolve(
                                process.cwd(),
                                "node_modules/.cache/cache-loader"
                            )
                        }
                    }].concat(useloaders);
                }

                ["type", "enable", "postcss", "loader", "options"].forEach(
                    propery => {
                        delete itemRule[propery];
                    }
                );
                result.push(itemRule);
            }
        });

        this.webpackConfig.module.rules = result;
    }

    /**
     * 创建postcss-loader
     * @param {Object} loaderOptions
     */
    createPostCssLoader(loaderOptions = {}) {
        let options = Object.assign(
            {},
            this.config.loaderOptions.postcss,
            loaderOptions
        );

        return {
            loader: "postcss-loader",
            options: options
        };
    }

    /**
     * 合并plugin
     * @param {Object | Array} plugins
     * @param {*} target
     */
    mergePlugin(plugins = {}, target) {
        target = target || this.plugins;

        const clonePlugins = _.cloneDeep(plugins);
        const sourcePlugins = Array.isArray(clonePlugins) ? {} : clonePlugins;

        if (Array.isArray(clonePlugins)) {
            clonePlugins.forEach(plugin => {
                if (this.utils.isWebpackPlugin(plugin)) {
                    sourcePlugins[plugin.constructor.name] = plugin;
                } else if (_.isPlainObject(plugin) && plugin.name) {
                    if (_.isString(plugin.name) && _.isString(plugin.label)) {
                        sourcePlugins[plugin.label] = plugin;
                    } else if (this.utils.isWebpackPlugin(plugin.name)) {
                        sourcePlugins[
                            plugin.label || plugin.name.constructor.name
                        ] = plugin;
                    } else if (_.isFunction(plugin.name) && plugin.name.name) {
                        sourcePlugins[plugin.name.name] = plugin;
                    }
                }
            });
        }

        Object.keys(sourcePlugins).forEach(name => {
            let configPlugin = sourcePlugins[name];
            if (target[name]) {
                if (this.utils.isWebpackPlugin(configPlugin)) {
                    target[name].name = configPlugin;
                } else if (_.isPlainObject(configPlugin)) {
                    if (typeof configPlugin.enable === "undefined") {
                        target[name].enable = true;
                    } else if (_.isFunction(configPlugin.enable)) {
                        target[name].enable = configPlugin.enable.apply(this);
                    }

                    Object.keys(configPlugin).forEach(k => {
                        if (target[name].hasOwnProperty(k))
                            target[name][k] = configPlugin[k];
                    });
                } else if (_.isBoolean(configPlugin)) {
                    target[name].enable = configPlugin;
                } else if (_.isFunction(configPlugin)) {
                    target[name] = Object.assign({}, target[name], {
                        args: configPlugin
                    });
                }
            } else if (
                this.utils.isWebpackPlugin(configPlugin) ||
                this.utils.isConfigPlugin(configPlugin)
            ) {
                target[name] = configPlugin;
            }
        });

        return target;
    }
    /**
     * 设置webpack的plugins
     * @param {Object} plugins
     */
    setPlugins(plugins) {
        let self = this;
        this.builder.emit("merge-plugin", this);
        this.mergePlugin(plugins);

        let target = _.cloneDeep(this.plugins);
        let webpackPlugins = [];
        const modules =
            this.webpackConfig.resolveLoader &&
            this.webpackConfig.resolveLoader.modules;

        Object.keys(target).forEach(name => {
            let itemPlugin = target[name];

            if (this.isUse(itemPlugin)) {
                let plugin, pluginName;

                if (this.utils.isWebpackPlugin(itemPlugin)) {
                    plugin = itemPlugin;
                    pluginName = itemPlugin.constructor.name;
                } else if (_.isPlainObject(itemPlugin.name)) {
                    plugin = itemPlugin.name;
                    pluginName =
                        itemPlugin.constructor && itemPlugin.constructor.name;
                } else if (
                    _.isString(itemPlugin.name) ||
                    _.isFunction(itemPlugin.name)
                ) {
                    let Clazz = itemPlugin.name;
                    if (_.isString(itemPlugin.name)) {
                        pluginName = itemPlugin.name;
                        Clazz = require(itemPlugin.name);
                    } else if (_.isFunction(itemPlugin.name)) {
                        pluginName = itemPlugin.name.name;
                    }
                    assert(
                        Clazz,
                        chalk.red(
                            `dynamic create plugin[${name}] error, please check the npm module [${pluginName}] whether installed. if not installed, please execute the command [npm install ${pluginName} --save-dev] in command line`
                        )
                    );

                    if (itemPlugin.entry) {
                        Clazz = Clazz[itemPlugin.entry];
                    }

                    if (itemPlugin.args) {
                        let args;
                        if (_.isFunction(itemPlugin.args)) {
                            args = itemPlugin.args.apply(this);
                        } else {
                            args = itemPlugin.args;
                        }
                        plugin = new (Function.prototype.bind.apply(
                            Clazz,
                            [null].concat(args)
                        ))();
                    } else {
                        plugin = new Clazz();
                    }
                }

                if (plugin) {
                    plugin.__plugin__ = pluginName;
                    plugin.__lable__ = name;
                    webpackPlugins.push(plugin);
                }
            }
        });

        this.webpackConfig.plugins = webpackPlugins;
    }

    /**
     * 合并optimization
     */
    mergeOptimization(opt = {}) {
        this.update("optimization", (old = {}) => {
            return merge(old, opt);
        });
    }

    /**
     * 设置optimization
     * @param {*} opt
     */
    setOptimization(opt = {}) {
        this.set("optimization", opt);
        this.builder.emit("merge-optimization", this);
    }
}

module.exports = BaseConfig;
