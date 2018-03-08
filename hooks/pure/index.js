const url = require("url");
const webpackDevServer = require('webpack-dev-server');

module.exports = class Pure {
    constructor() {

    }

    apply(builder) {
        builder.on("devServer", (client)=> {
            client.setDevServer(this.createDevtool(builder.options));
        });
       
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