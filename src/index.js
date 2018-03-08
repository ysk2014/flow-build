"use strict"
const EventEmitter = require('events');
const path = require("path");
const chalk = require("chalk");
const fs = require("fs-extra");
const checkRequiredFiles = require("./utils/checkRequiredFiles");
const validateSchema = require("./schema/v");
let {getClientConfig, getServerConfig, ServerConfig, ClientConfig, webpack} = require("./webpack");

const Logger = require("./utils/logger");

let logger = new Logger("flow");

let PureHook = require("../hooks/pure");

module.exports = class Builder extends EventEmitter {
    constructor(options) {
        super();
        //对options进行格式化校验
        validateSchema(options);

        this.options = Object.assign({}, options);

        this.options.hooks.push(new PureHook);
        this.initHook();

        this.mode = this.options.mode;
        this.env = this.options.env;

        //hook: entry-option
        this.emit("entry-option", this);

        this.checkFiles();

        
        this.initWebpack();
    }

    initWebpack() {

        this.webpack = webpack;

        let { webpackConfig } = getClientConfig(this);
        this.clientWebpackConfig = webpackConfig;

        if (this.mode == "ssr") {
            let { webpackConfig } = getServerConfig(this);
            this.serverWebpackConfig = webpackConfig;
        }
    }

    /**
     * 检测入口文件是否存在
     */
    checkFiles() {
        // logger.info("Check entry files...");

        let op = this.options;
        let paths = [];

        let dealEntry = (entry)=> {
            if (typeof entry == "string") {
                paths.push(path.resolve(process.cwd(), entry))
            } else if (!Array.isArray(entry)) {
                Object.keys(entry).forEach(key => {
                    paths.push(path.resolve(process.cwd(), entry[key]));
                });
            } else {
                entry.forEach(key => {
                    paths.push(path.resolve(process.cwd(), key))
                });
            }
        };

        // 判断webpack的entry文件是否存在，ssr情况下，必须有client和server
        if (this.mode == "ssr") {
            if (!op.entry.client || !op.entry.server) {
                console.log(chalk.red("  In SSR mode, the entry.client field and the entry.server field must be included in the config file"));
                process.exit(1);
            }
            dealEntry(op.entry.client);
            dealEntry(op.entry.server);
        } else {
            dealEntry(op.entry);
        }

        //判断html模板文件是否存在
        if (this.mode=="multiple") {
            if (!Array.isArray(op.html.template)) {
                console.log(chalk.red("  the template field is an array in the config file"));
                process.exit(1);
            }
            op.html.template.forEach(t => {
                paths.push(path.resolve(process.cwd(), t.path));
            });
        } else if (this.mode == "ssr") {
            if (Array.isArray(op.html.template)) {
                console.log(chalk.red("  In SSR mode, the html.template field must be object in the config file"));
                process.exit(1);
            }
            paths.push(path.resolve(process.cwd(), op.html.template.path));
        } else {
            paths.push(path.resolve(process.cwd(), op.html.template.path));
        }

        

        if (!checkRequiredFiles(paths)) {
            process.exit(1);
        }
    }

    run() {
        
        if (this.env !== "dev") {
            logger.info("Before packing, remove the output folder");
            fs.remove(path.resolve(process.cwd(), this.options.build.outputPath));
        }
        this.emit("run", this);
        
        if (this.mode == "spa" || this.mode == "vue") {
            let SpaCompontent = require("./Spa");
            new SpaCompontent(this);
        } else {
            let SSRCompontent = require("./SSR");
            new SSRCompontent(this);
        }
    }

    build(callback) {
        let SSRCompontent = require("./SSR");
        let SSRBuilder = new SSRCompontent(this);
        return SSRBuilder.build(callback)
    }

    initHook() {
        let hooks = Array.isArray(this.options.hooks) ? this.options.hooks : [this.options.hooks];

        hooks.forEach(obj => {
            if (obj.apply) obj.apply(this);
        });
    }
}