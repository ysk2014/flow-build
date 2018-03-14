"use strict"

const path = require("path");
const MFS = require('memory-fs');
const { remove } = require("fs-extra");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const formatWebpackMessages = require('./utils/formatWebpackMessages');
const Logger = require("./utils/logger");

let logger = new Logger("flow");


class SSRBuilder {
    constructor(flow) {
        this.flow = flow;
        this.env = flow.env;
        this.compilers = [];
        this.webpackDevMiddleware = null;
        this.webpackHotMiddleware = null;

        this.webpackStats = {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }
    }

    async build(callback) {
        logger.info("Building files...");

        const compilersOptions = [];

        // Client
        const clientConfig = this.flow.clientWebpackConfig;
        compilersOptions.push(clientConfig);

        // Server
        let serverConfig = this.flow.serverWebpackConfig;
        compilersOptions.push(serverConfig);

        const sharedFS = this.env == "dev" && new MFS();

        this.compilers = compilersOptions.map(compilersOption => {
            const compiler = webpack(compilersOption);

            if (sharedFS) {
                compiler.outputFileSystem = sharedFS;
            }

            return compiler;
        });

        await sequence(this.compilers, compiler => new Promise(async (resolve, reject) => {
            compiler.plugin('done',  async stats => {

                let messages = formatWebpackMessages(stats.toJson({}, true));
                const isSuccessful = !messages.errors.length && !messages.warnings.length;

                if (messages.errors.length) {
                    logger.error('Failed to compile.\n');
                    console.log(messages.errors.join('\n\n'));
                    return reject(new Error('Webpack build exited with errors'))
                }

                if (messages.warnings.length) {
                    logger.warn('Compiled with warnings.\n');
                    console.log(messages.warnings.join('\n\n'));
                }

                if (isSuccessful) {
                    this.flow.emit("ssr-done", sharedFS, callback);
                
                    if (compiler.options.name == "client") {
                        logger.info("Webpack client compiled successfully");
                    } else {
                        logger.info("Webpack server compiled successfully");
                    }
                    process.nextTick(resolve);
                }
            });

            if (this.env == "dev") {
                if (compiler.options.name == "client") {
                    return this.webpackDev(compiler);
                }

                compiler.watch({}, err => {
                    if (err) return reject(err)
                })
                return;
            }

            compiler.run((err, stats) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }

                process.stdout.write('\n\n'+stats.toString(this.webpackStats) + '\n\n');

                if (stats.hasErrors()) {
                    return reject(new Error('Webpack build exited with errors'))
                } else {
                    logger.info('Compiled successfully.\n')
                }
            })
        })).catch(e => {
            process.exit();
        });

        return {
            devMiddleware: this.webpackDevMiddleware,
            hotMiddleware: this.webpackHotMiddleware
        }
    }

    webpackDev(compiler) {
        logger.info("Adding webpack middleware...");

        // Create webpack dev middleware
        this.webpackDevMiddleware = webpackDevMiddleware(compiler,{
            publicPath: this.flow.options.dev.publicPath,
            logLevel: 'silent'
        })
        
        this.webpackDevMiddleware.close = this.webpackDevMiddleware.close;

        this.webpackHotMiddleware = webpackHotMiddleware(compiler,{
            log: false,
            heartbeat: 10000
        });
    }
}

module.exports = SSRBuilder;

function sequence(tasks, fn) {
    return tasks.reduce(
      (promise, task) => promise.then(() => fn(task)),
      Promise.resolve()
    )
}
