/**
 * 一切组件的基类，总结开发，打包流程中公共部分功能
 */

"use strict"

const path = require("path");
const { Tapable } = require("tapable");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const chalk = require("chalk");
const checkRequiredFiles = require("./utils/checkRequiredFiles");
const validateSchema = require("./schema/v");

const pkg = require(path.join(process.cwd(), './package.json'));

class Compontent extends Tapable {
    constructor(options) {
        super();
        //对options进行格式化校验
        validateSchema(options);

        this.options = Object.assign({}, options);
        this.spa = this.options.spa;

        this.initBabelOptions(this.options);

        this.checkFiles();

        this.checkNodeModules(this.options);
    }

    /**
     * 检测入口文件是否存在
     */
    checkFiles() {
        let entryPath = path.join(process.cwd(), this.options.entry.app);
        let htmlPath = path.join(process.cwd(), this.options.html.template);
        if (!checkRequiredFiles([entryPath, htmlPath])) {
            process.exit(1);
        }
    }

    /**
     * 检测需要额外安装的扩展是否已经安装 
     * @param {Object} options 
     */
    checkNodeModules(options) {
        let needModules = [], unInstallModules = [], message = "> Error: Cannot find module ";

        if (Array.isArray(options.css.engine)) {
            options.css.engine.forEach(item => {
                if (item != "css" && item != "postcss") {
                    needModules.push(CssEngines[item]);
                }
            });
        } else if (options.css.engine != "css" && options.css.engine!="postcss" && CssEngines[options.cssEngine]){
            needModules.push(CssEngines[options.css.engine]);
        }

        if (options.spa=="vue") {
            needModules.push("vue-style-loader","vue-loader","vue-template-compiler");
        }

        const NowModules = Object.keys(pkg["devDependencies"]);
        needModules.forEach( n=> {
            if (NowModules.indexOf(n)<0) {
                unInstallModules.push(n);
                message += `'${n}'`;
            }
        });

        if (unInstallModules.length>0) {
            console.log(chalk.red(message));
            console.log(chalk.cyan("  Please install these modules before packing"));
            process.exit(1);
        }

        return false;
    }

    /**
     * 初始化babel插件的参数
     * @param {Object} js 
     */
    initBabelOptions({ js }) {
        this.babelOptions = {
            babelrc: false,
            compact: true,
            cacheDirectory: process.env.NODE_ENV == "production",
            highlightCode: true,
        };

        Object.keys(js.babel).forEach(key => {
            if (Array.isArray(js.babel[key]) && js.babel[key].length>0) {
                if (key=="presets") {
                    var k = "preset";
                } else if (key == "plugins") {
                    var k = "plugin";
                } else {
                    var k = key.substr(0, key.length-2);
                }

                this.babelOptions[key] = js.babel[key].map(val => {
                    if (Array.isArray(val)) {
                        return [require.resolve(`babel-${k}-${val[0]}`), val[1]];
                    } else {
                        return require.resolve(`babel-${k}-${val}`);
                    }
                });
            } else {
                this.babelOptions[key] = js.babel[key];
            }
        });
    }

    /**
     * 生成对css及其扩展语言的webpack配置
     * @param {Object} options 
     */
    styleLoaders(options) {
        const output = [];
        const loaders = this.cssLoaders(options);
        for (const extension in loaders) {
            const loader = loaders[extension];
            output.push({
                test: new RegExp('\\.' + extension + '$'),
                use: loader
            });
        }
        return output;
    }

    /**
     * 生成css、less、postcss、sass、scss、stylus、styl相对应的loader数组
     * @param {Object} options 
     */
    cssLoaders(options) {
        options = options || {};

        const cssLoader = {
            loader: 'css-loader',
            options: {
                sourceMap: options.sourceMap
            }
        };

        var postcssLoader = {
            loader: 'postcss-loader',
            options: {
                sourceMap: options.sourceMap,
                ident: 'postcss',
                plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                        browsers: [
                            '>1%',
                            'last 4 versions',
                            'Firefox ESR',
                            'not ie < 9',
                        ],
                        flexbox: 'no-2009',
                    }),
                ],
            }
        }
        
        const fallback = this.spa == "vue" ? "vue-style-loader" : "style-loader";

        function generateLoaders (loader, loaderOptions) {
            const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]
            if (loader) {
                loaders.push({
                    loader: loader + '-loader',
                    options: Object.assign({}, loaderOptions, {
                        sourceMap: options.sourceMap
                    })
                })
            }
        
            
            if (options.extract) {
                return ExtractTextPlugin.extract({
                    use: loaders,
                    fallback: fallback
                })
            } else {
                return [fallback].concat(loaders)
            }
        }

        return {
            css: generateLoaders(),
            postcss: generateLoaders(),
            less: generateLoaders('less'),
            sass: generateLoaders('sass', { indentedSyntax: true }),
            scss: generateLoaders('sass'),
            stylus: generateLoaders('stylus'),
            styl: generateLoaders('stylus')
        }
    }
    
    /**
     * 对静态文件路径的扩展
     * @param {String} _path 
     */
    assetsPath(_path) {
        return path.posix.join(this.options.build.assetsSubDirectory, _path);
    }

    /**
     * 对vue-loader的参数处理
     * @param {Boolean} param
     */
    vueLoader({ sourceMapEnabled, isProduction}) {
        return {
            loaders: Object.assign({}, {
                "js": {
                    loader: 'babel-loader',
                    options: Object.assign({}, this.babelOptions)
                },
            }, this.cssLoaders({
                sourceMap: sourceMapEnabled,
                extract: isProduction
            })),
            cssSourceMap: sourceMapEnabled,
            transformToRequire: {
                video: 'src',
                source: 'src',
                img: 'src',
                image: 'xlink:href'
            }
        }
    }
}


const CssEngines = {
    less: ["less-loader","less"],
    sass: ["sass-loader","node-sass"],
    stylus: ["stylus-loader","stylus"]
}

module.exports = Compontent;