const webpackDevServer = require('webpack-dev-server');
const formatWebpackMessages = require('./utils/formatWebpackMessages');
const openBrowser = require("./utils/openBrowser");
const Logger = require("./utils/logger");

let logger = new Logger("flow");

module.exports = class Spa {
    constructor(flow) {
        this.flow = flow;
        this.webpack = flow.webpack;
        this.webpackConfig = flow.clientWebpackConfig;

        if (flow.env == "dev") {
            this.devServer(flow.options);
        } else {
            this.build();
        }
    }

    devServer(options) {
        let host = options.dev.host || "0.0.0.0";
        let port = options.dev.port;
        
        //由于webpack-dev-server在node api使用方式下，浏览器不能自动刷新，此方法解决不自动刷新的bug
        //参数地址：https://github.com/webpack/webpack-dev-server/issues/994
        //https://doc.webpack-china.org/guides/hot-module-replacement/
        webpackDevServer.addDevServerEntrypoints(this.webpackConfig, this.webpackConfig.devServer);

        const compiler = this.createCompiler();
        const devServer = new webpackDevServer(compiler, this.webpackConfig.devServer);

        devServer.listen(port, host, err => {
            if (err) {
                return console.log(err);
            }

            logger.info('Starting the development server...\n');
            openBrowser(host, port);
        });

        ['SIGINT', 'SIGTERM'].forEach(function(sig) {
            process.on(sig, function() {
                devServer.close();
                process.exit();
            });
        });
            
    }

    /**
     * 生成webpack实例
     * @param {Object} 
     */
    createCompiler() {
        logger.info('Creating an optimized production build...');

        let compiler;
        try {
            compiler = this.webpack(this.webpackConfig)
        } catch (err) {
            logger.error('Failed to compile.');
            console.log();
            console.log(err.message || err);
            console.log();
            process.exit(1);
        }

        //在webpack中如果项目重新编译，会触发该事件
        compiler.plugin('invalid', () => {
            console.log('Compiling...');
        });

        //在webpack编译完成后，对webpack输出的日志进行格式输出
        compiler.plugin('done', stats => {
            let messages = formatWebpackMessages(stats.toJson({}, true));
            const isSuccessful = !messages.errors.length && !messages.warnings.length;
            if (isSuccessful) {
                console.log('Compiled successfully!');
            }

            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                logger.error('Failed to compile.\n');
                console.log(messages.errors.join('\n\n'));
                return;
            }

            if (messages.warnings.length) {
                logger.warn('Compiled with warnings.\n');
                console.log(messages.warnings.join('\n\n'));
            }

            this.flow.emit("done", messages);
        })

        return compiler;
    }

    build() {
        logger.info('Creating an optimized production build...');
        
        let compiler = this.webpack(this.webpackConfig);

        compiler.run((err, stats) => {
            if (err) throw err;

            let messages = formatWebpackMessages(stats.toJson({}, true));
            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                  messages.errors.length = 1;
                }

                logger.error('Failed to compile.\n');
                console.log(messages.errors.join('\n\n'));
                return;
            }
           
            if (messages.warnings.length) {
                logger.warn('Compiled with warnings.\n');
                console.log(messages.warnings.join('\n\n'));
            } else {
                process.stdout.write('\n\n'+stats.toString({
                    colors: true,
                    modules: false,
                    children: false,
                    chunks: false,
                    chunkModules: false
                }) + '\n\n');
                logger.info('Compiled successfully.\n');
            }

            this.flow.emit("done", messages);
        });
    }
}