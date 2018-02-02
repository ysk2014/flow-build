/**
 * 一个webpack插件，作用于htmlwebpackplugin，在生成html之前，替换掉以"%"包裹的变量
 * 比如:
 * html: <link rel="manifest" href="%PUBLIC_URL%/manifest.json">
 * 本插件参数：replacements = {"PUBLIC_URL": "http://music.baidu.com"}
 * 
 * 编译后：
 * <link rel="manifest" href="http://music.baidu.com/manifest.json">
 */

'use strict';
const escapeStringRegexp = require('escape-string-regexp');

class InterpolateHtmlPlugin {
    constructor(replacements) {
        this.replacements = replacements;
    }

    apply(compiler) {
        compiler.plugin('compilation', compilation => {
            compilation.plugin(
                'html-webpack-plugin-before-html-processing',
                (data, callback) => {
                    Object.keys(this.replacements).forEach(key => {
                        const value = this.replacements[key];
                        data.html = data.html.replace(
                            new RegExp('%' + escapeStringRegexp(key) + '%', 'g'),
                            value
                        );
                    });
                    callback(null, data);
                }
            );
        });
    }
}

module.exports = InterpolateHtmlPlugin;