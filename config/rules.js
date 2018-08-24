"use strict";

exports.babel = {
    enable: true,
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: [
        {
            loader: require.resolve("babel-loader")
        }
    ]
};

exports.eslint = {
    enable: true,
    test: /\.(jsx?|vue)$/,
    use: [
        {
            loader: "eslint-loader"
        }
    ],
    exclude: /node_modules/,
    enforce: "pre"
};

exports.typescript = {
    enable: false,
    test: /\.ts$/,
    exclude: [/node_modules/],
    use: [
        {
            loader: "ts-loader"
        }
    ]
};

exports.tslint = {
    enable: false,
    test: /\.ts$/,
    exclude: /node_modules/,
    enforce: "pre",
    use: [
        {
            loader: "tslint-loader"
        }
    ]
};

exports.css = {
    enable: true,
    test: /\.css$/,
    use: [
        {
            loader: "css-loader",
            options: {
                sourceMap: false
            }
        }
    ],
    postcss: true
};

exports.sass = {
    enable: false,
    test: /\.sass/,
    use: [
        {
            loader: "css-loader",
            options: {
                sourceMap: false
            }
        },
        {
            loader: "sass-loader",
            options: {
                indentedSyntax: true,
                sourceMap: false
            }
        }
    ],
    postcss: true
};

exports.less = {
    enable: false,
    test: /\.less/,
    use: [
        {
            loader: "css-loader",
            options: {
                sourceMap: false
            }
        },
        {
            loader: "less-loader",
            options: {
                sourceMap: false
            }
        }
    ],
    postcss: true
};

exports.stylus = {
    enable: false,
    test: /\.stylus/,
    use: [
        {
            loader: "css-loader",
            options: {
                sourceMap: false
            }
        },
        {
            loader: "stylus-loader",
            options: {
                sourceMap: false
            }
        }
    ],
    postcss: true
};

exports.urlimage = {
    enable: true,
    test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
    use: [
        {
            loader: "url-loader",
            options: {
                limit: 1024
            }
        }
    ]
};

exports.urlfont = {
    enable: true,
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    use: [
        {
            loader: "url-loader",
            options: {
                limit: 1024
            }
        }
    ]
};
