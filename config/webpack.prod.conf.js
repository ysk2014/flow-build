const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');


let createBase = require("./webpack.base.conf");

module.exports = function createProdConfig() {
    let base = createBase.call(this, false);
    let env = this.options.build;

    let config = merge(base, {
        module: {
            rules: this.styleLoaders({
                sourceMap: env.cssSourceMap,
                extract: true,
                usePostCSS: true
            })
        },
        plugins: [

            new CleanWebpackPlugin([this.options.build.outputPath], {
                root: path.resolve(process.cwd())
            }),

            new webpack.optimize.UglifyJsPlugin({
                compress: {
                  warnings: false
                },
                sourceMap: true,
                parallel: true
            }),

            new ExtractTextPlugin({
                filename: this.assetsPath('css/[name].[contenthash].css'),
                allChunks: false,
            }),

            new OptimizeCSSPlugin({
                cssProcessorOptions: env.cssSourceMap
                    ? { safe: true, map: { inline: false } }
                    : { safe: true }
            }),

            new webpack.HashedModuleIdsPlugin(),
            // enable scope hoisting
            new webpack.optimize.ModuleConcatenationPlugin(),
            // split vendor js into its own file
            new webpack.optimize.CommonsChunkPlugin({
                name: 'vendor',
                minChunks: function (module) {
                    // any required modules inside node_modules are extracted to vendor
                    return (
                        module.resource &&
                        /\.js$/.test(module.resource) &&
                        module.resource.indexOf(
                            path.join(process.cwd(), './node_modules')
                        ) === 0
                    )
                }
            }),

            new webpack.optimize.CommonsChunkPlugin({
                name: 'manifest',
                minChunks: Infinity
            }),
            
        ]
    });
    //白名单配置
    if (this.options.white && this.options.white.patterns && this.options.white.rules) {
        let CopyWebpackPlugin = require("copy-webpack-plugin");
        config.plugins.plugins(new CopyWebpackPlugin(this.options.white.patterns, this.options.white.rules));
    }

    if (this.mode=="vue") {
        config.plugins.push(
            new webpack.optimize.CommonsChunkPlugin({
                name: 'app',
                async: 'vendor-async',
                children: true,
                minChunks: 3
            })
        )
    }

    if (env.analyze) {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
        config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
}