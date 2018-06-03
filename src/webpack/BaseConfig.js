"use strict";

let path = require("path");
let fs = require("fs");
let _ = require("lodash");
let assert = require("assert");
let chalk = require("chalk");
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let Config = require("./Config");
let utils = require("../utils/utils");

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

        this.setAlias(config.alias);
        this.setExtensions(config.extensions);

        this.builder.emit("base-config", this);

        //hook: mergeloaders
        this.setLoaders(config.loaders);

        // hook: mergePlugin
        this.setPlugins(config.plugins);
    }

    /**
     * 合并loader配置项
     * @param {Object | Array} loaders 
     * @param {Object} target 
     */
    mergeLoader(loaders = {}, target) {
        target = target || this.loaders;

        const cloneLoaders = _.cloneDeep(loaders);
        const sourceLoaders = Array.isArray(cloneLoaders) ? {} : cloneLoaders;

        if (Array.isArray(cloneLoaders)) {
            cloneLoaders.forEach(loader => {
                if (this.utils.isWebpackLoader(loader)) {
                    let label = this.utils.getLoaderLabel(loader);
                    sourceLoaders[label] = Object.assign({}, loader, {enable: true});
                } else if (_.isPlainObject(loader) && Object.keys(loader).length === 1) {
                    let label = Object.keys(loader)[0];
                    sourceLoaders[label] = loader[label];
                }
            });
        }

        Object.keys(sourceLoaders).forEach(key => {
            let sourceLoader = sourceLoaders[key];
            
            if (sourceLoader.loader) {
                sourceLoader.use = [{loader: sourceLoader.loader, options: sourceLoader.options || {}}];
            }

            const loader = target[key];

            if (loader) {
                if (_.isPlainObject(sourceLoader)) {
                    if (sourceLoader.enable === undefined) {
                        target[key].enable = true;
                    }

                    target[key] = Object.assign(target[key], sourceLoader);

                    if (sourceLoader.use) {
                        target[key].use = sourceLoader.use;
                    }

                } else if (_.isBoolean(sourceLoader)) {
                    target[key].enable = sourceLoader;
                }
            } else if (this.utils.isWebpackLoader(sourceLoader)) {
                target[key] = sourceLoader;
            }

            if (sourceLoader.options && target[key]) {
                let index = target[key].use.length-1;
                if (target[key].use[index]) {
                    target[key].use[index].options = sourceLoader.options;

                    let label = this.utils.getLoaderLabel(target[key].use[index]);
                    this.config.loaderOptions[label] = sourceLoader.options;
                }
            }
        });
        return target;
    }

    /**
     * 设置webpack的loader
     * @param {Object} loaders 
     */
    setLoaders(loaders) {
        this.builder.emit("merge-loader", this);
        this.mergeLoader(loaders);

        let target = _.cloneDeep(this.loaders);
        let rules = [];
        let postcssLoader = this.createPostCssLoader();
        let cssExtension = this.config.cssExtension;

        Object.keys(target).forEach(name => {
            let itemLoader = target[name];

            if (this.isUse(itemLoader)) {
                let useloaders = itemLoader.use;

                if (_.isFunction(itemLoader.use)) {
                    itemLoader.use = itemLoader.use.apply(this);
                }

                if (this.config.imerge && cssExtension.includes(name) && this.config.extract) {
                    useloaders.splice(1,0,{loader: "imerge-loader"});
                }

                if (itemLoader.postcss) {
                    useloaders.splice(1,0,postcssLoader);
                }

                useloaders.forEach((k, i) => {
                    if (_.isString(k)) {
                        useloaders[i] = { loader: k };
                    }

                    let label = this.utils.getLoaderLabel(k);
                    
                    if (cssExtension.includes(name)) {
                        useloaders[i].options = Object.assign({
                            sourceMap: this.config.cssSourceMap
                        }, useloaders[i].options);
                    } else {
                        if (label == "babel") {
                            useloaders[i].options = Object.assign({}, useloaders[i].options, this.config.loaderOptions[label]);
                        } else {
                            useloaders[i].options = Object.assign({}, useloaders[i].options);
                        }
                    }
                });

                if (cssExtension.includes(name)) {

                    const fallback = this.config.fallback;

                    if (this.config.extract) {
                        itemLoader.use = ExtractTextPlugin.extract({
                            use: useloaders,
                            fallback: fallback
                        });
                    } else {
                        itemLoader.use = [fallback].concat(useloaders);
                    }
                }

                ["type", "enable", "postcss", "loader", "options"].forEach(propery => {
                    delete itemLoader[propery];
                });
                rules.push(itemLoader);
            }
        });

        this.webpackConfig.module.rules = rules;
    }
    /**
     * 创建postcss-loader
     * @param {Object} loaderOptions 
     */
    createPostCssLoader(loaderOptions = {}) {
        let options = Object.assign({}, this.config.loaderOptions.postcss, loaderOptions);

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
                        sourcePlugins[plugin.label || plugin.name.constructor.name] = plugin;
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
                        if (target[name].hasOwnProperty(k)) target[name][k] = configPlugin[k];
                    });
                } else if (_.isBoolean(configPlugin)) {
                    target[name].enable = configPlugin;
                } else if (_.isFunction(configPlugin)) {
                    target[name] = Object.assign({}, target[name], {args: configPlugin});
                }
            } else if (this.utils.isWebpackPlugin(configPlugin) || this.utils.isConfigPlugin(configPlugin)) {
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
        const modules = this.webpackConfig.resolveLoader && this.webpackConfig.resolveLoader.modules;

        Object.keys(target).forEach(name => {
            let itemPlugin = target[name];

            if (this.isUse(itemPlugin)) {
                let plugin, pluginName;

                if (this.utils.isWebpackPlugin(itemPlugin)) {
                    plugin = itemPlugin;
                    pluginName = itemPlugin.constructor.name;
                } else if (_.isPlainObject(itemPlugin.name)) {
                    plugin = itemPlugin.name;
                    pluginName = itemPlugin.constructor && itemPlugin.constructor.name;
                } else if (_.isString(itemPlugin.name) || _.isFunction(itemPlugin.name)) {
                    let Clazz = itemPlugin.name;
                    if (_.isString(itemPlugin.name)) {
                        pluginName = itemPlugin.name;
                        Clazz = require(itemPlugin.name);
                    } else if (_.isFunction(itemPlugin.name)) {
                        pluginName = itemPlugin.name.name;
                    }
                    assert(Clazz, chalk.red(`dynamic create plugin[${name}] error, please check the npm module [${pluginName}] whether installed. if not installed, please execute the command [npm install ${pluginName} --save-dev] in command line`));

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
                        plugin = new (Function.prototype.bind.apply(Clazz, [null].concat(args)));
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

        if (this.env != "dev" && this.config.imerge) {
            let ImergePlugin = this.utils.requireModule("imerge-loader", modules).Plugin;
            if (_.isPlainObject(this.config.imerge)) {
                webpackPlugins.push(new ImergePlugin(this.config.imerge));
            } else {
                webpackPlugins.push(new ImergePlugin({
                    spriteTo: self.prefix+"/"+self.flowConfig.image.dirname+"/imerge"
                }));
            }
        }

        this.webpackConfig.plugins = webpackPlugins;
    }
}

module.exports = BaseConfig;