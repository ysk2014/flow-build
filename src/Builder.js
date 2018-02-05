/**
 * 打包环境
 *
 */
"use strict"

//初始化项目环境
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

//捕获未处理的错误
process.on('unhandledRejection', err => {
    throw err;
});

const path = require("path");
const chalk = require('chalk');
const webpack = require('webpack');

const Component = require("./Compontent");
const createProdConfig = require('../config/webpack.prod.conf');
const formatWebpackMessages = require('./utils/formatWebpackMessages');

class Builder extends Component {
    constructor(options) {
        super(options);
    }

    /**
     * 启动打包服务
     */
    run() {

        this.createCompiler().then(stats => {

            let messages = formatWebpackMessages(stats.toJson({}, true));
            if (messages.errors.length) {
                if (messages.errors.length > 1) {
                  messages.errors.length = 1;
                }
            }
            if (
                process.env.CI &&
                (typeof process.env.CI !== 'string' ||
                  process.env.CI.toLowerCase() !== 'false') &&
                messages.warnings.length
            ) {
                console.log(
                    chalk.yellow(
                        '\nTreating warnings as errors because process.env.CI = true.\n' +
                        'Most CI servers set it automatically.\n'
                    )
                );
            }
            if (messages.warnings.length) {
                console.log(chalk.yellow('> Compiled with warnings.\n'));
                console.log(messages.warnings.join('\n\n'));
            } else {
                process.stdout.write('\n\n'+stats.toString({
                    colors: true,
                    modules: false,
                    children: false,
                    chunks: false,
                    chunkModules: false
                }) + '\n\n');
                console.log(chalk.green('> Compiled successfully.\n'));
                console.log(chalk.yellow(
                    '  Tip: built files are meant to be served over an HTTP server.\n' +
                    '  Opening index.html over file:// won\'t work.\n'
                ))
            }

        }).catch(err => {
            throw err;
        })
    }

    createCompiler() {
        console.log('> Creating an optimized production build...');

        let config = createProdConfig.call(this);
        let compiler = webpack(config);
        return new Promise((resolve, reject)=> {
            compiler.run((err, stats) => {
                if (err) return reject(err);
                resolve(stats);
            })
        })
    }
}

module.exports = Builder;