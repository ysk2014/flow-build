"use strict"
let path = require("path");
let webpack = require("webpack");
let fs = require("fs");
let _ = require('lodash');
let assert = require('assert');
let chalk = require("chalk");
let ExtractTextPlugin = require('extract-text-webpack-plugin');

let utils = require("../utils/utils");

class BaseConfig {
    constructor(config) {
        this._config = config;
        this.config = {
            mode: config.mode,
            fallback: 'style-loader',
            imerge: config.image.imerge,
            html: config.html,
            white: config.white,
            loaderOptions: {
                babel: config.js.babel ? config.js.babel : {
                    "presets": [
                        ["env", {
                            "modules": false
                        }],
                        "stage-2"
                    ]
                },
                postcss: config.css.postcss ? config.css.postcss : {
                    useConfigFile: false,
                    ident: 'postcss',
                    sourceMap: false,
                    plugins: () => [
                        require('postcss-flexbugs-fixes'),
                        require('autoprefixer')({
                            browsers: [
                                '>1%',
                                'last 4 versions',
                                'Firefox ESR',
                                'not ie < 9',
                            ],
                            flexbox: 'no-2009',
                        }),
                    ]
                }
            }
        };
        this.webpack = webpack;
        this.utils = utils;
        this.baseDir = config.baseDir || process.cwd();

        this.initConfig(config);
    }

    initConfig(config) {
        this.webpackConfig = _.cloneDeep(require("../../config/webpack"));
        this.loaders = _.cloneDeep(require('../../config/loader'));
        this.plugins = _.cloneDeep(require('../../config/plugin'));
        if (config.white && config.white.patterns && config.white.rules) {
            this.plugins.copy.enable = true;
        }
        // const pkgFile = path.join(this.baseDir, 'package.json');
        // this.devDependencies = fs.existsSync(pkgFile) ? require(pkgFile).devDependencies : {};
    }

    initBase(config) {
        this.setImageName(config.image.dirname, config.image.hash);
        this.setCssName(config.css.dirname, config.css.hash);
        this.setFontName(config.font.dirname, config.font.hash);

        this.setOutputPath(config.build.outputPath);
        this.setOutputFileName(config.js.dirname, config.js.hash);

        this.setAlias(config.alias);
        this.setExtensions(config.extensions);

        //hook: mergeloaders
        this.setLoaders(config.loaders);

        // hook: mergePlugin
        this.setPlugins(config.plugins);
    }

    initEnv(config = {}) {
        this.env = config.env || "dev";
        this.dev = false;
        this.test = false;
        this.prod = false;
        if (this.env == "prod") {
            this.prod = true;
            this.config.cssSourceMap = (config.build && config.build.cssSourceMap) || true;
            this.config.extract =  true;
            this.config.loaderOptions.postcss.sourceMap =  this.config.cssSourceMap;
        } else if (this.env == "test") {
            this.test = true;
            this.config.cssSourceMap = (config.build && config.build.cssSourceMap) || true;
            this.config.extract =  true;
            this.config.loaderOptions.postcss.sourceMap =  this.config.cssSourceMap;
        } else {
            this.dev = true;
            this.config.cssSourceMap = (config.dev && config.dev.cssSourceMap) || false;
            this.config.extract =  false;
        }
        this.builder.emit("base-config", this);
    }

    setConfig(config) {
        this.config = Object.assign({}, this.config, config);
    }

    setEntry(entry) {
        this.webpackConfig.entry = entry;
    }

    setOutputPath(outputPath) {
        if (path.isAbsolute(outputPath)) {
            this.webpackConfig.output.path = outputPath;
        } else {
            this.webpackConfig.output.path = path.resolve(process.cwd(), outputPath);
        }
    }

    setPublicpath(publicpath) {
        this.webpackConfig.output.publicPath = publicpath;
    }

    setExtensions(extensions) {
        if (!extensions) return;

        if (this.webpackConfig.resolve.extensions) {
            this.webpackConfig.resolve.extensions = _.union(this.webpackConfig.resolve.extensions, extensions);
        } else {
            this.webpackConfig.resolve.extensions = extensions;
        }
    }

    setExternals(externals) {
        if (!externals) return;

        this.webpackConfig.externals = _.union(this.webpackConfig.externals, externals);
    }

    setAlias(alias) {
        if (!alias) return;

        if (this.webpackConfig.resolve.alias) {
            this.webpackConfig.resolve.alias = Object.assign({}, this.webpackConfig.resolve.alias, alias);
        } else {
            this.webpackConfig.resolve.alias = alias;
        }
    }

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
            })
        }

        Object.keys(sourceLoaders).forEach(key => {
            let sourceLoader = sourceLoaders[key];
            
            if (sourceLoader.loader) {
                sourceLoader.use = [{loader: sourceLoader.loader, options: sourceLoader.options || {}}];
                delete sourceLoader.loader;
            }

            const loader = target[key];

            if (loader) {
                if (_.isPlainObject(sourceLoader) && sourceLoader.enable === undefined) {
                    target[key].enable = true;
                }

                if (_.isBoolean(sourceLoader)) {
                    target[key].enable = sourceLoader;
                } else if (sourceLoader.use) {
                    target[key] = Object.assign({}, target[key], sourceLoader);
                    target[key].use = sourceLoader.use;
                } else {
                    target[key] = _.cloneDeep(target[key], sourceLoader);
                }
            } else if (_.isPlainObject(sourceLoader) && sourceLoader.use) {
                target[key] = sourceLoader
            }

            if (sourceLoader.options) {
                let index = target[key].use.length-1;
                if (target[key].use[index]) {
                    target[key].use[index].options = sourceLoader.options;
                    this.config.loaderOptions[key] = sourceLoader.options;
                }
            }
        });
        return target;
    }


    setLoaders(loaders) {
        this.builder.emit("merge-loader", this);
        this.mergeLoader(loaders);

        let target = _.cloneDeep(this.loaders);
        let rules = [];
        let postcssLoader = this.createPostCssLoader();
        let cssExtension = ["css", "less", "postcss", "sass", "scss", "stylus", "styl"];

        Object.keys(target).forEach(name => {
            let itemLoader = target[name];

            if (this.isUse(itemLoader)) {
                let useloaders = itemLoader.use;

                if (_.isFunction(itemLoader.use)) {
                    itemLoader.use = itemLoader.use.apply(this);
                }

                if (this.config.imerge) {
                    useloaders.splice(1,0,{loader: 'imerge-loader'});
                }

                if (itemLoader.postcss) {
                    useloaders.splice(1,0,postcssLoader);
                }

                useloaders.forEach((k, i) => {
                    if (_.isString(k)) {
                        useloaders[i] = { loader: k };
                    }

                    let label = this.utils.getLoaderLabel(k);
                    
                    useloaders[i].options = Object.assign({
                        sourceMap: this.config.cssSourceMap
                    }, useloaders[i].options, this.config.loaderOptions[label] || this.config.loaderOptions[name]);
                });

                if (cssExtension.includes(name)) {

                    const fallback = this.config.fallback;

                    if (this.config.extract) {
                        itemLoader.use = ExtractTextPlugin.extract({
                            use: useloaders,
                            fallback: fallback
                        })
                    } else {
                        itemLoader.use = [fallback].concat(useloaders);
                    }
                }

                ['type', 'enable', 'postcss', 'loader', 'options'].forEach(propery => {
                    delete itemLoader[propery];
                });
                rules.push(itemLoader);
            }
        });

        this.webpackConfig.module.rules = rules;
    }

    createPostCssLoader(loaderOptions = {}) {
        let options = Object.assign({}, this.config.loaderOptions.postcss, loaderOptions);

        return {
            loader: 'postcss-loader',
            options: options
        }
    }

    setOutputFileName(dirname, hash) {
        if (this.env == "dev") {
            this.webpackConfig.output.filename = this.assetsPath(`${dirname}/[name].js`)
        } else {
            this.webpackConfig.output.filename = this.assetsPath(`${dirname}/[name].[chunkhash:${hash}].js`)
        }
    }

    setOutputChunkFileName(dirname, hash) {
        if (this.env == "dev") {
            this.webpackConfig.output.chunkFilename = this.assetsPath(`${dirname}/[name].js`)
        } else {
            this.webpackConfig.output.chunkFilename = this.assetsPath(`${dirname}/[name].[chunkhash:${hash}].js`);
        }
    }

    setOutput(output) {
        if (!output) return;
        this.webpackConfig.output = output
    }

    setLibrary(library) {
        if (!library) return;
        this.webpackConfig.output.library = library;
    }

    setLibraryTarget(libraryTarget) {
        if (!libraryTarget) return;

        this.webpackConfig.output.libraryTarget = libraryTarget;
    }

    setNode(node) {
        if (!node) return;
        this.webpackConfig.node = node;
    }

    setImageName(dirname, hash) {
        this.loaders.urlimage.use[0].options.name = this.assetsPath(`${dirname}/[name].[hash:${hash}].[ext]`);
    }

    setFontName(dirname, hash) {
        this.loaders.urlfont.use[0].options.name = this.assetsPath(`${dirname}/[name].[hash:${hash}].[ext]`);
    }

    setCssName(dirname, hash) {
        this.config.cssName = this.assetsPath(`${dirname}/[name].[contenthash:${hash}].css`);
    }

    assetsPath(_path) {
        return path.posix.join(this._config.build.assetsSubDirectory, _path);
    }

    mergePlugin(plugins = {}, target) {
        target = target || this.plugins;

        const clonePlugins = _.cloneDeep(plugins);
        const sourcePlugins = Array.isArray(clonePlugins) ? {} : clonePlugins;

        if (Array.isArray(clonePlugins)) {
            clonePlugins.forEach(plugin => {
                if (this.utils.isWebpackPlugin(plugin)) {
                    sourcePlugins[plugin.constructor.name] = plugin;
                } else if (_.isPlainObject(plugin)) {
                    if (plugin.name) {
                        if (_.isString(plugin.name)) {
                            sourcePlugins[plugin.label || plugin.name] = plugin;
                        } else if (this.utils.isWebpackPlugin(plugin.name)) {
                            sourcePlugins[plugin.label || plugin.name.constructor.name] = plugin;
                        } else if (_.isFunction(plugin.name) && plugin.name.name) {
                            sourcePlugins[plugin.name.name] = plugin;
                        }
                    } else if (Object.keys(plugin).length === 1) {
                        let label = Object.keys(plugin)[0];
                        sourcePlugins[label] = plugin[label];
                    }
                }
            })
        }

        Object.keys(sourcePlugins).forEach(name => {
            let configPlugin = sourcePlugins[name];
            if (target[name]) {
                if (_.isPlainObject(configPlugin) && configPlugin.enable === undefined) {
                    target[name].enable = true;
                }

                if (_.isBoolean(configPlugin)) {
                    target[name].enable = configPlugin;
                } else if (_.isPlainObject(configPlugin)) {
                    Object.keys(target[name]).forEach(k=> {
                        if (configPlugin[k]) target[name][k] = configPlugin[k]
                    })
                    if (_.isFunction(configPlugin.enable)) {
                        target[name].enable = configPlugin.enable.apply(this);
                    }
                } else if (configPlugin.name || this.utils.isWebpackPlugin(configPlugin)) { // 直接覆盖
                    target[name] = configPlugin;
                } else if (_.isFunction(configPlugin)) {
                    target[name] = Object.assign({}, target[name], {args: configPlugin});
                }
            } else if (this.utils.isWebpackPlugin(configPlugin) || this.utils.isConfigPlugin(configPlugin)) {
                target[name] = configPlugin;
            }
        });

        return target;
    }

    setPlugins(plugins) {
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
            let ImergePlugin = this.utils.requireModule("imerge-loader", modules).plugin;
            webpackPlugins.push(new ImergePlugin());
        }

        this.webpackConfig.plugins = webpackPlugins;
    }

    setDevTool(devtool) {
        if (devtool) {
            this.webpackConfig.devtool = devtool;
        }
    }
    setDevServer(devserver) {
        if (devserver) {
            this.webpackConfig.devServer = devserver;
        }
    }
    setTarget(target) {
        if (!target) return;
        this.webpackConfig.target = target;
    }

    isType(type) {
        return type === undefined || type === this.type || (Array.isArray(type) && type.includes(this.type));
    }

    isEnv(env) {
        return env === undefined || env === this.env || (Array.isArray(env) && env.includes(this.env));
    }

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

    isUse(name, range = "plugin") {
        if (_.isBoolean(name)) {
            return name;
        }
        return _.isPlainObject(name) && this.isType(name.type) && this.isEnv(name.env) && this.isEnable(name.enable);
    }

    setResolveLoaderModules(modules) {
        if (!modules) return;
        this.webpackConfig.resolveLoader.modules = _.union(this.webpackConfig.resolveLoader.modules, modules);
    }

}

module.exports = BaseConfig;