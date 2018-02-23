let {join, resolve} = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('../src/utils/InterpolateHtmlPlugin');

module.exports = function webpackBaseConfig (dev) {
    const nodeModulesDir = join(process.cwd(), './node_modules');

    let env = dev ? this.options.dev : this.options.build

    const config = {
        devtool:  env.devtool,
        entry: this.options.entry,
        output: {
            path: resolve(process.cwd(), this.options.build.outputPath),
            filename: this.assetsPath(dev ? "js/[name].js" : "js/[name].[chunkhash].js"),
            publicPath: env.publicPath
        },
        performance: {
            maxEntrypointSize: 1000000,
            maxAssetSize: 300000,
            hints: dev ? false : 'warning'
        },
        resolve: {
            extensions: [".js", ".json"]
        },
        module: {
            noParse: /es6-promise\.js$/, // Avoid webpack shimming process
            rules: [
                {
                    test:  /\.(js|jsx)$/,
                    loader: require.resolve('babel-loader'),
                    exclude: /node_modules/,
                    options: Object.assign({}, this.babelOptions)
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/,
                    loader: 'url-loader',
                    options: {
                        limit: this.options.image.limit,
                        name: this.assetsPath('img/[name].[hash:7].[ext]')
                    }
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                    loader: 'url-loader',
                    options: {
                        limit: 1000, // 10 KO
                        name: this.assetsPath('fonts/[name].[hash:7].[ext]')
                    }
                },
                {
                    test: /\.(webm|mp4)$/,
                    loader: 'file-loader',
                    options: {
                        name: this.assetsPath('videos/[name].[hash:7].[ext]')
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {NODE_ENV: `"${process.env.NODE_ENV}"`}
            }),
        ]
    }

    if (this.mode == "vue" || this.mode == "ssr") {
        config.module.rules.push({
            test: /\.vue$/,
            loader: 'vue-loader',
            options: this.vueLoader({
                sourceMapEnabled: env.cssSourceMap,
                isProduction: !dev
            })
        })
        config.resolve.extensions.push(".vue",".jsx");
        config.resolve.alias = {
            "@": resolve(this.options.srcDir),
            "vue$": "vue/dist/vue.esm.js"
        }
        
    } else if (this.mode == "react") {
        config.resolve.extensions.push(".jsx",".web.js",".web.jsx");
    } 

    // html 处理
    let html = this.options.html;

    if (this.mode == "multiple") {
        config.plugins.push(...html.template.map(t => {
            let params = {
                filename: t.filename,
                template: 'html-withimg-loader!'+resolve(process.cwd(), t.path),
                inject: true,
                excludeChunks: t.excludeChunks
            };
    
            if (!dev) {
                params = Object.assign({}, params, {
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
                    },
                    chunksSortMode: 'dependency'
                })
            }
            return new HtmlWebpackPlugin(params);
        }));
    } else if (this.mode=="ssr") {
        config.plugins.push(new HtmlWebpackPlugin({
            filename: html.template.filename,
            template: resolve(process.cwd(), html.template.path),
            inject: false
        }))
    } else {
        let params = {
            filename: html.template.filename,
            template: 'html-withimg-loader!'+resolve(process.cwd(), html.template.path),
            inject: true,
        };

        if (!dev) {
            params = Object.assign({}, params, {
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
                },
                chunksSortMode: 'dependency'
            })
        }
        config.plugins.push(new HtmlWebpackPlugin(params));

        if (html.data) {
            config.plugins.push(new InterpolateHtmlPlugin(this.options.html.data));
        }
    }

    return Object.assign({}, config);
}