const chalk = require("chalk");

let log = (...params) => {

    console.log(...params);
};
/**
 * 日志
 */
class Logger {
    /**
     * 构造器
     * @param {*} prefix 
     */
    constructor(prefix) {
        this.prefix = prefix;
    }
    /**
     * 
     * @param {*} params 
     */
    info(params) {
        log(chalk.green(this.prefix), params);
    }
    /**
     * 
     * @param {*} params 
     */
    error(params) {
        log(chalk.red(this.prefix), params);
    }
    /**
     * 
     * @param {*} params 
     */
    warn(params) {
        log(chalk.yellow(this.prefix), params);
    }
}

module.exports = Logger;