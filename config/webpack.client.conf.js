const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');


let createBase = require("./webpack.base.conf");

module.exports = function createClientConfig() {
    let dev = this.options.dev.ssr;
    let base = createBase.call(this, this.options.dev.ssr, true);
    let env = dev ? this.options.dev : this.options.build;

    let config = merge(base, {
        name: 'client',
        module: {
            rules: this.styleLoaders({
                sourceMap: env.cssSourceMap,
                extract: !dev,
                merge: this.options.image.merge
            })
        },
        plugins: [
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
                        && !/\.(css|less|scss|sass|styl|stylus|vue)$/.test(module.request)
                    )
                }
            }),

            new VueSSRClientPlugin({
                filename: 'vue-ssr-client-manifest.json'
            }),

            new webpack.optimize.CommonsChunkPlugin({
                name: 'manifest',
                minChunks: Infinity
            }),
            new FriendlyErrorsPlugin()
        ]
    });
    
    config.entry = {
        app: this.options.entry.client,
        vendor: this.vendor()
    }
    config.output.devtoolModuleFilenameTemplate = '[absolute-resource-path]';

    if (dev) {
        config.entry.app = [
            'webpack-hot-middleware/client?name=client&reload=true&timeout=30000'.replace(/\/\//g, '/'),
            config.entry.app
        ]
        config.plugins.push(
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new webpack.NoEmitOnErrorsPlugin()
        )
    } else {
        config.plugins.push(
            new webpack.HashedModuleIdsPlugin(),
            new webpack.optimize.ModuleConcatenationPlugin(),
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
            })
        );

        //合图配置
        if (this.options.image.merge) {
            const ImergePlugin = require('imerge-loader').Plugin;
            config.plugins.push(new ImergePlugin());
        }

        if (env.analyze) {
            const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
            config.plugins.push(new BundleAnalyzerPlugin());
        }

        //白名单配置
        if (this.options.white && this.options.white.patterns && this.options.white.rules) {
            let CopyWebpackPlugin = require("copy-webpack-plugin");
            config.plugins.plugins(new CopyWebpackPlugin(this.options.white.patterns, this.options.white.rules));
        }
    }

    return config;
}