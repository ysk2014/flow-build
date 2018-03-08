const path = require("path");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
let loader = require("./config/loader");

module.exports = class VueHook {
    constructor(options = {}) {
        let babelOptions = {
            "presets": [
                ["env", {
                    "modules": false
                }],
                "stage-2"
            ]
        }
        this.babelOptions = options.babel || babelOptions;
    }

    apply(builder) {
        builder.on("base-config", (base) => {
            base.setConfig({
                fallback: "vue-style-loader"
            });

            client.setExtensions(['.vue']);
            client.setAlias({
                "@": path.resolve(builder.options.srcDir),
                "vue$": "vue/dist/vue.esm.js"
            });
        });

        builder.on("devServer", (client)=> {
            client.setDevServer(this.createDevtool(builder.options));
        });


        builder.on("merge-loader", base => {
            loader.vue.options = this.vueLoader(base.config);
            base.mergeLoader(loader);
        });
    }

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
                useConfigFile: false,
                sourceMap: options.sourceMap,
                ident: 'postcss',
                plugins: ()=> [
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
                ],
            }
        }
        
        function generateLoaders (loader, loaderOptions) {
            const loaders = [cssLoader, postcssLoader];

            if (options.extract && options.merge) {
                loaders.push({
                    loader: 'imerge-loader'
                })
            }

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
                    fallback: options.fallback
                })
            } else {
                return [options.fallback].concat(loaders)
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

    vueLoader({ cssSourceMap, extract, fallback}) {
        let cssLoaders = this.cssLoaders({
            sourceMap: cssSourceMap,
            extract: extract,
            fallback: fallback
        });

        return {
            loaders:  Object.assign({}, {
                js: {
                    loader: 'babel-loader',
                    options: Object.assign({}, this.babelOptions)
                }
            }, cssLoaders),
            cssSourceMap: cssSourceMap,
            postcss: {
                useConfigFile: false,
                sourceMap: cssSourceMap,
                ident: 'postcss',
                plugins: [
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
            },
            preserveWhitespace: false,
            transformToRequire: {
                video: 'src',
                source: 'src',
                img: 'src',
                image: 'xlink:href'
            }
        }
    }

    createDevtool(config) {
        let dev = config.dev;
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