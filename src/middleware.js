/**
 * express的中间件
 * @returns
 * {
 *      devMiddleware: webpack-dev-middleware的实例
 *      hotMiddleware: webpack-hot-middleware的实例
 * }
 */

"use strict"

//初始化项目环境
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const webpack = require('webpack');
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const Compontent = require("./Compontent");
const createDevConfig = require('../config/webpack.dev.conf');
const formatWebpackMessages = require('./utils/formatWebpackMessages');
const Logger = require("./utils/logger");

let logger = new Logger("flow");

class MiddleWare extends Compontent {
    constructor(options) {
        super(options);

        let compiler = this._createCompiler();
        this.devMiddleware = webpackDevMiddleware(compiler, {
            publicPath: this.options.dev.publicPath,
            quiet: true
        });
        this.hotMiddleware = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2000
        });
    }

    _createCompiler() {
        let compiler;
        //获取开发环境下的webpack配置
        let devConfig = createDevConfig.call(this);

        if (Array.isArray(devConfig.entry)) {
            devConfig.entry = ["webpack-hot-middleware/client?noInfo=true&reload=true"].concat(devConfig.entry);
        } else if (typeof devConfig.entry === 'object') {
            Object.keys(devConfig.entry).forEach((key) => {
                devConfig.entry[key] = ["webpack-hot-middleware/client?noInfo=true&reload=true"].concat(devConfig.entry[key]);
            });
        }

        try {
            compiler = webpack(devConfig);
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
                logger.error('Failed to compile.\n')
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

module.exports = MiddleWare;