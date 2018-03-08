const path = require("path");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
let loader = require("./config/loader");
let plugin = require("./config/plugin");

module.exports = class VueSSRHook {
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

        let defaults = {
            output: "server-bundle.js",
            serverBundle: "server-bundle.json",
            clientManifest: "vue-ssr-client-manifest.json"
        }

        this.options = Object.assign({}, defaults, options);
    }

    apply(builder) {

        builder.on("base-config", base => {
            base.setConfig({
                fallback: "vue-style-loader",
                clientManifest: this.options.clientManifest,
                serverBundle: this.options.serverBundle
            });

            base.setExtensions(['.vue']);
            base.setAlias({
                "@": path.resolve(builder.options.srcDir),
                "vue$": "vue/dist/vue.esm.js"
            });
            base.setResolveLoaderModules([path.join(__dirname, './node_modules')])
        });

        builder.on("merge-plugin", base => {
            base.mergePlugin(plugin);
        });

        builder.on("merge-loader", base => {
            loader.vue.options = this.vueLoader(base.config);
            base.mergeLoader(loader);
        });

        builder.on("client-config", client => {
            client.setEntry({
                app: builder.options.entry.client,
                vendor: ["vue","vue-router", "vuex"].concat(builder.options.entry.vendor).filter(v => v)
            });

            client.webpackConfig.output.devtoolModuleFilenameTemplate = '[absolute-resource-path]';

            if (client.env == "dev") {
                client.setEntry({
                    app: [
                        'webpack-hot-middleware/client?name=client&reload=true&timeout=30000'.replace(/\/\//g, '/'),
                        builder.options.entry.client
                    ],
                    vendor: ["vue","vue-router", "vuex"].concat(builder.options.entry.vendor).filter(v => v)
                });
            };
        });

        builder.on("server-config", server => {
            server.setExternals([
                nodeExternals({
                    whitelist: [/es6-promise|\.(?!(?:js|json)$).{1,5}$/i, /\.css$/]
                })
            ]);
            server.webpackConfig.output.filename = this.options.output;
        });

        builder.on("ssr-done", (sharedFS, callback) => {
            let distPath = builder.options.build.outputPath;
            let bundlePath = path.resolve(distPath, this.options.serverBundle);
            let clientPath = path.resolve(distPath, this.options.clientManifest);

            if (sharedFS && sharedFS.existsSync(bundlePath) && sharedFS.existsSync(clientPath)) {
                console.info("create or update ssr json");
                callback && callback(sharedFS);
            }
        })
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

    
}