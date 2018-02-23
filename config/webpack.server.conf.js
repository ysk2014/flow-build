const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

let createBase = require("./webpack.base.conf");

module.exports = function createServerConfig() {
    let base = createBase.call(this, this.options.dev.ssr);
    let env = this.options.build;

    let config = merge(base, {
        name: 'server',
        target: "node",
        node: false,
        output: {
            path: path.resolve(process.cwd(), this.options.build.outputPath),
            filename: "server-bundle.js",
            publicPath: env.publicPath,
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: this.styleLoaders({
                sourceMap: env.cssSourceMap,
                extract: true,
                usePostCSS: true
            })
        },
        performance: {
            hints: false,
            maxAssetSize: Infinity
        },
        externals: [
            nodeExternals({
                whitelist: [/es6-promise|\.(?!(?:js|json)$).{1,5}$/i, /\.css$/]
            })
        ],
        plugins: [
            new VueSSRServerPlugin({
                filename: 'server-bundle.json'
            }),
            new ExtractTextPlugin({
                filename: this.assetsPath('css/[name].[contenthash].css'),
                allChunks: false,
            })
        ]
    });
    
    config.entry = this.options.entry.server;

    if (!this.options.dev.ssr) {
        config.plugins.push(
            new webpack.HashedModuleIdsPlugin(),
            // enable scope hoisting
            new webpack.optimize.ModuleConcatenationPlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                  warnings: false
                },
                parallel: true
            }),
            new ExtractTextPlugin({
                filename: this.assetsPath('css/[name].[contenthash].css'),
                allChunks: false,
            })
        )
    } else {
        config.plugins.push(new FriendlyErrorsPlugin())
    }


    return config;
}