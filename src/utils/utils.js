
let _ = require("lodash");
let path = require("path");
let fs = require("fs-extra");

module.exports = {
    isWebpackPlugin(plugin) {
        return _.isPlainObject(plugin) && plugin.constructor && plugin.constructor.prototype && plugin.constructor.prototype.apply;
    },

    isWebpackLoader(loader) {
        return _.isPlainObject(loader) && loader.test && (loader.loader || loader.use);
    },

    isConfigPlugin(plugin) {
        return _.isPlainObject(plugin) && plugin.name;
    },

    getLoaderLabel(loader) {
        let loaderName = loader;
        if (_.isPlainObject(loader)) {
            if (loader.loader) {
                if (path.isAbsolute(loader.loader)) {
                    let res = loader.loader.match(/[a-zA-Z]+?-loader/g);
                    loaderName = res[0];
                } else {
                    loaderName = loader.loader;
                }
            } else if (Array.isArray(loader.use)) {
                loaderName = loader.use[loader.use.length-1];
                if (!_.isString(loaderName)) {
                    loaderName = loaderName.loader;
                }
            }
        }

        return loaderName.replace(/-loader$/, "").replace(/-/g, "");
    },

    requireModule(name, modules) {
        if (typeof name === "object") {
            return name;
        }
        if (path.isAbsolute(name)) {
            return require(name);
        }
    
        const module = modules.find(m => {
            const modulepath = path.join(m, name);
            return fs.existsSync(modulepath);
        });

        return module ? require(path.join(module, name)) : null;
    }
};