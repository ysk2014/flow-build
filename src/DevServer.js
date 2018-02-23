/**
 * 开发环境
 */

"use strict"

//初始化项目环境
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

//捕获未处理的错误
process.on('unhandledRejection', err => {
    throw err;
});

const path = require("path");
const url = require("url");
const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');
const Compontent = require("./Compontent");
const choosePort = require("./utils/choosePort");
const createDevServerConfig = require('../config/webpackDevServer.conf');
const createDevConfig = require('../config/webpack.dev.conf');
const formatWebpackMessages = require('./utils/formatWebpackMessages');
const openBrowser = require('./utils/openBrowser');

const Logger = require("./utils/logger");

let logger = new Logger("flow");


class DevServer extends Compontent {
    constructor(options) {
        super(options);
    }

    /**
     * 启动开发服务
     */
    run() {
        let host = this.options.dev.host || "0.0.0.0";
        let defaultPort = Number(this.options.dev.port) || 3000;

        //检测端口号，并得出一个可以使用的端口号
        choosePort(host, defaultPort)
            .then(port => {
                if (port == null) {
                    return;
                }
                
                this.options.dev.port = port;

                //生成打开浏览器时的url地址
                const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
                const localUrlForBrowser = url.format({
                    protocol: protocol,
                    hostname: host,
                    port,
                    pathname: '/',
                });
                this.options.localUrlForBrowser = localUrlForBrowser;

                //获取webpack-dev-server的配置
                const devServerConfig = createDevServerConfig.call(this);
                //获取开发环境下的webpack配置
                const devConfig = createDevConfig.call(this);
                
                //由于webpack-dev-server在node api使用方式下，浏览器不能自动刷新，此方法解决不自动刷新的bug
                //参数地址：https://github.com/webpack/webpack-dev-server/issues/994
                //https://doc.webpack-china.org/guides/hot-module-replacement/
                webpackDevServer.addDevServerEntrypoints(devConfig, devServerConfig);

                const compiler = this.createCompiler(devConfig);
                const devServer = new webpackDevServer(compiler, devServerConfig);

                devServer.listen(port, host, err => {
                    if (err) {
                        return console.log(err);
                    }

                    logger.info('Starting the development server...\n');
                    openBrowser(localUrlForBrowser);
                });

                ['SIGINT', 'SIGTERM'].forEach(function(sig) {
                    process.on(sig, function() {
                        devServer.close();
                        process.exit();
                    });
                });
            })
            .catch(err => {
                if (err && err.message) {
                    console.log(err.message);
                }
                process.exit(1);
            })
    }

    /**
     * 生成webpack实例
     * @param {Object} devConfig 
     */
    createCompiler(devConfig) {
        let compiler;
        try {
            compiler = webpack(devConfig)
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
            const messages = formatWebpackMessages(stats.toJson({}, true));
            const isSuccessful = !messages.errors.length && !messages.warnings.length;
            if (isSuccessful) {
                logger.info('Compiled successfully!');
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
        })

        return compiler;
    }

    
}

module.exports = DevServer;