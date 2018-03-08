let path = require("path");

exports.vueSSRServer = {
    enable: true,
    type: 'server',
    name: 'vue-server-renderer/server-plugin',
    args() {
        return { filename: this.config.serverBundle };
    }
};

exports.vueSSRClient = {
    enable: true,
    type: 'client',
    name: 'vue-server-renderer/client-plugin',
    args() {
        return { filename: this.config.clientManifest };
    }
}

exports.html = {
    enable: true,
    type: 'client',
    name: 'html-webpack-plugin',
    withimg: false,
    args() {
        return { 
            filename: this.config.html.template.filename,
            template: path.resolve(this.baseDir, this.config.html.template.path),
            inject: false 
        };
    }
};