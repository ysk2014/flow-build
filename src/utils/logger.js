const chalk = require("chalk");

let log = (...params) => {

    console.log(...params)
}

class Logger {
    constructor(prefix) {
        this.prefix = prefix;
    }

    info(params) {
        log(chalk.green(this.prefix), params);
    }

    error(params) {
        log(chalk.red(this.prefix), params);
    }

    warn(params) {
        log(chalk.yellow(this.prefix), params);
    }
}

module.exports = Logger;