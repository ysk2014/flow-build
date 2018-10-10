"use strict";

const os = require("os");
const WORKERS = os.cpus().length - 1;
const UGLIFYJS_WORKERS = WORKERS > 8 ? 8 : WORKERS;
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
module.exports = {
    runtimeChunk: "single",

    minimizer: [
        new UglifyJsPlugin({
            cache: true,
            parallel: UGLIFYJS_WORKERS,
            sourceMap: true,
            uglifyOptions: {
                warnings: false,
                compress: {
                    dead_code: true,
                    // drop_console: true,
                    drop_debugger: true
                },
                output: {
                    comments: false
                }
            }
        }),
        new OptimizeCSSAssetsPlugin({
            cssProcessor: require("cssnano"),
            cssProcessorOptions: {
                safe: true,
                map: { inline: false },
                discardComments: { removeAll: false }, // or removeAll: true
                zindex: false,
                normalizeUrl: false,
                discardUnused: false,
                mergeIdents: false,
                reduceIdents: false,
                autoprefixer: false
            }
        })
    ],

    splitChunks: {
        name: true,
        chunks: "all",
        automaticNameDelimiter: ".",
        minChunks: 2,

        cacheGroups: {
            vender: {
                name: "vender",
                test: function(module) {
                    // any required modules inside node_modules are extracted to vendor
                    return (
                        module.resource &&
                        /\.js$/.test(module.resource) &&
                        module.resource.indexOf(
                            path.join(process.cwd(), "./node_modules")
                        ) === 0 &&
                        !/\.(css|less|scss|sass|styl|stylus|vue)$/.test(
                            module.request
                        )
                    );
                },
                chunks: "all",
                priority: 10
            }
        }
    }
};
