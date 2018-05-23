exports.webpack = require("webpack");

exports.BaseConfig = require("./BaseConfig");
exports.ClientConfig = require("./ClientConfig");
exports.ServerConfig = require("./ServerConfig");

exports.getClientConfig = (flow)=> {
    return new exports.ClientConfig(flow);
};

exports.getServerConfig = (flow)=> {
    return new exports.ServerConfig(flow);
};


