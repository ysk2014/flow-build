"use strict"

const { promisify } = require('util');
const path = require("path");
const MFS = require('memory-fs');
const { remove } = require("fs-extra");
const webpack = require('webpack');
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const Compontent = require("./Compontent");
const createClientConfig = require('../config/webpack.client.conf');
const createServerConfig = require('../config/webpack.server.conf');
const Logger = require("./utils/logger");

let logger = new Logger("flow");


class SSRBuilder extends Compontent {
    constructor(options) {
        super(options);

        this.options.dev.ssr = true;
        
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

    async run() {
        this.options.dev.ssr = false;
        
        logger.info("Before packing, remove the output folder");
        await remove(path.resolve(process.cwd(), this.options.build.outputPath))
        await this.build();
    }

    async build(callback) {
        logger.info("Building files...");

        const compilersOptions = [];

        // Client
        const clientConfig = createClientConfig.call(this);
        compilersOptions.push(clientConfig);

        // Server
        let serverConfig = createServerConfig.call(this);
        compilersOptions.push(serverConfig);

        const sharedFS = this.options.dev.ssr && new MFS();

        this.compilers = compilersOptions.map(compilersOption => {
            const compiler = webpack(compilersOption);

            if (sharedFS) {
                compiler.outputFileSystem = sharedFS;
            }

            return compiler;
        });

        await sequence(this.compilers, compiler => new Promise(async (resolve, reject) => {
            let distPath = path.resolve(process.cwd(), 'dist')
            let bundlePath = path.resolve(distPath, 'server-bundle.json')
            let clientPath = path.resolve(distPath, 'vue-ssr-client-manifest.json')

            compiler.plugin('done',  async stats => {
                if (sharedFS && sharedFS.existsSync(bundlePath) && sharedFS.existsSync(clientPath)) {
                    logger.info("create or update ssr json");
                    callback && callback(sharedFS);
                }
                if (compiler.options.name == "client") {
                    logger.info("Webpack client compiled successfully");
                } else {
                    logger.info("Webpack server compiled successfully");
                }
                process.nextTick(resolve);
            });

            if (this.options.dev.ssr) {
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
        }));

        return {
            devMiddleware: this.webpackDevMiddleware,
            hotMiddleware: this.webpackHotMiddleware
        }
    }

    webpackDev(compiler) {
        logger.info("Adding webpack middleware...");

        // Create webpack dev middleware
        this.webpackDevMiddleware = webpackDevMiddleware(compiler,{
            publicPath: this.options.dev.publicPath,
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
