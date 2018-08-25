"use strict";
const EventEmitter = require("events");
const path = require("path");
const chalk = require("chalk");
const fs = require("fs-extra");
const cpy = require("cpy");
let _ = require("lodash");
const checkRequiredFiles = require("./utils/checkRequiredFiles");
const validateSchema = require("./schema/v");
const openBrowser = require("./utils/openBrowser");
let { getClientConfig, getServerConfig, webpack } = require("./webpack");

const Logger = require("./utils/logger");

let logger = new Logger("flow");

module.exports = class Builder extends EventEmitter {
    /**
     *
     * @param {*} options
     */
    constructor(options) {
        super();

        this.options = options;

        this.initHook();
        //hook: entry-option
        this.emit("entry-option", this);

        //对options进行格式化校验
        validateSchema(this.options);

        this.mode = this.options.mode;
        this.env = this.options.env;

        this.checkFiles();

        this.copyFiles();

        this.initWebpack();
    }

    /**
     * 获取webpack配置
     */
    initWebpack() {
        this.webpack = webpack;

        if (this.mode == "ssr" || this.mode == "vue-prerender") {
            let { webpackConfig } = getServerConfig(this);
            this.serverWebpackConfig = webpackConfig;
        }

        let { webpackConfig } = getClientConfig(this);
        this.clientWebpackConfig = webpackConfig;
    }

    /**
     * 检测入口文件是否存在
     */
    checkFiles() {
        // logger.info("Check entry files...");

        let op = this.options;
        let paths = [];

        let dealEntry = entry => {
            if (typeof entry == "string") {
                paths.push(path.resolve(process.cwd(), entry));
            } else if (!Array.isArray(entry)) {
                Object.keys(entry).forEach(key => {
                    paths.push(path.resolve(process.cwd(), entry[key]));
                });
            } else {
                entry.forEach(key => {
                    paths.push(path.resolve(process.cwd(), key));
                });
            }
        };

        // 判断webpack的entry文件是否存在，ssr情况下，必须有client和server
        if (this.mode == "ssr") {
            if (!op.entry.client || !op.entry.server) {
                console.log(
                    chalk.red(
                        "  In SSR mode, the entry.client field and the entry.server field must be included in the config file"
                    )
                );
                process.exit(1);
            }
            dealEntry(op.entry.client);
            dealEntry(op.entry.server);
        } else {
            dealEntry(op.entry);
        }

        //判断html模板文件是否存在
        if (this.mode == "multiple") {
            if (!Array.isArray(op.html.template)) {
                console.log(
                    chalk.red(
                        "  the template field is an array in the config file"
                    )
                );
                process.exit(1);
            }
            op.html.template.forEach(t => {
                paths.push(path.resolve(process.cwd(), t.path));
            });
        } else if (this.mode == "ssr") {
            if (Array.isArray(op.html.template)) {
                console.log(
                    chalk.red(
                        "  In SSR mode, the html.template field must be object in the config file"
                    )
                );
                process.exit(1);
            }
            paths.push(path.resolve(process.cwd(), op.html.template.path));

            //bugs: mode为ssr时，filename不能为index.html
            if (op.html.template.filename == "index.html") {
                this.options.html.template.filename = "index.ssr.html";
            }
        } else {
            paths.push(path.resolve(process.cwd(), op.html.template.path));
        }

        if (!checkRequiredFiles(paths)) {
            process.exit(1);
        }
    }
    /**
     * 白名单，复制不需要编译的文件到指定的地址
     */
    async copyFiles() {
        let white = this.options.white;

        if (white) {
            try {
                if (Array.isArray(white)) {
                    await Promise.all(
                        white.map(item => {
                            return cpy(item.from, item.to, item.options || {});
                        })
                    );
                } else {
                    await cpy(white.from, white.to, white.options || {});
                }
            } catch (error) {
                logger.error("copy files error:");
                logger.error(error);
                process.exit(1);
            }
        }
    }
    /**
     * 开始启动程序
     */
    run() {
        if (this.env !== "dev" && this.options.clean) {
            logger.info("Before packing, remove the output folder");
            fs.remove(
                path.resolve(process.cwd(), this.options.build.outputPath)
            );
        }

        this.emit("run", this);

        if (this.mode == "ssr") {
            this.build();
        } else {
            let SpaCompontent = require("./Spa");
            new SpaCompontent(this);
        }
    }
    /**
     * 开始服务端打包
     * @param {*} callback
     */
    build(callback) {
        let SSRCompontent = require("./SSR");
        let SSRBuilder = new SSRCompontent(this);
        return SSRBuilder.build(callback);
    }
    /**
     * 初始化hook插件
     */
    initHook() {
        let hooks = Array.isArray(this.options.hooks)
            ? this.options.hooks
            : [this.options.hooks];

        hooks.forEach(obj => {
            if (obj && obj.apply) obj.apply(this);
        });
    }
    /**
     * 对外提供自动打开浏览器的功能
     * @param {*} host
     * @param {*} port
     */
    openBrowser(host, port) {
        openBrowser(host, port);
    }

    /**
     * 获取options的配置
     * @param {*} path
     */
    get(path) {
        return _.get(this.options, path);
    }

    /**
     * 设置options的配置
     * @param {*} path
     * @param {*} val
     */
    set(path, val) {
        return _.set(this.options, path, val);
    }

    /**
     * 更新options的配置
     * @param {*} path
     * @param {*} updater
     */
    update(path, updater) {
        this.set(path, updater(this.get(path)));
    }

    /**
     * 删除options的配置
     * @param {*} path
     */
    delete(path) {
        return _.unset(this.options, path);
    }

    /**
     * 在options中是否含有某项配置
     * @param {*} path
     * @param {*} item
     */
    has(path) {
        return _.has(this.options, path);
    }
};
