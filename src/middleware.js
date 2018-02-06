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

const chalk = require('chalk');
const webpack = require('webpack');
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const Compontent = require("./Compontent");
const createDevConfig = require('../config/webpack.dev.conf');
const formatWebpackMessages = require('./utils/formatWebpackMessages');

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
            console.log(chalk.red('Failed to compile.'));
            console.log();
            console.log(err.message || err);
            console.log();
            process.exit(1);
        }

        //在webpack中如果项目重新编译，会触发该事件
        compiler.plugin('invalid', () => {
            console.log('Compiling...');
        });

        let isFirstCompile = true;

        //在webpack编译完成后，对webpack输出的日志进行格式输出
        compiler.plugin('done', stats => {
            const messages = formatWebpackMessages(stats.toJson({}, true));
            const isSuccessful = !messages.errors.length && !messages.warnings.length;
            if (isSuccessful) {
                console.log(chalk.green('Compiled successfully!'));
            }
            if (isSuccessful && isFirstCompile) {
                // printInstructions(appName, urls, useYarn);
            }
            isFirstCompile = false;

            // If errors exist, only show errors.
            if (messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                console.log(chalk.red('Failed to compile.\n'));
                console.log(messages.errors.join('\n\n'));
                return;
            }

            // Show warnings if no errors were found.
            if (messages.warnings.length) {
                console.log(chalk.yellow('Compiled with warnings.\n'));
                console.log(messages.warnings.join('\n\n'));

                // Teach some ESLint tricks.
                console.log(
                    '\nSearch for the ' +
                    chalk.underline(chalk.yellow('keywords')) +
                    ' to learn more about each warning.'
                );
                console.log(
                    'To ignore, add ' +
                    chalk.cyan('// eslint-disable-next-line') +
                    ' to the line before.\n'
                );
            }
        })

        return compiler;
    }

}

module.exports = MiddleWare;