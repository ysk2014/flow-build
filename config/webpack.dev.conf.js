const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const InterpolateHtmlPlugin = require('../src/utils/InterpolateHtmlPlugin');
let createBase = require("./webpack.base.conf");
const createDevServerConfig = require('./webpackDevServer.conf');


module.exports = function webpackDevConfig () {
    let base = createBase.call(this, true);
    let env = this.options.dev;

    let devServer = createDevServerConfig.call(this);

    let config = merge(base, {
        module: {
            rules: this.styleLoaders({ sourceMap: env.cssSourceMap })
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new webpack.NoEmitOnErrorsPlugin(),
            new FriendlyErrorsPlugin()
        ],
        devServer: devServer
    });

    return config;
}
