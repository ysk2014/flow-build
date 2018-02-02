

module.exports = function create() {
    let dev = this.options.dev;

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