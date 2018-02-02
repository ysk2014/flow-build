/**
 * 检测配置端口是否占用，并给出一个合理的端口
 */
'use strict';

const chalk = require('chalk');
const portfinder = require('portfinder')

module.exports = (host, defaultPort) => {
    portfinder.basePort = defaultPort;
    return portfinder.getPortPromise()
        .then(port => {
            return port;
        }).catch( err => {
            throw new Error(
                chalk.red(`Could not find an open port at ${chalk.bold(host)}.`) +
                '\n' +
                ('Network error message: ' + err.message || err) +
                '\n'
            )
        });
}