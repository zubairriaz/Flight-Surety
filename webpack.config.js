const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const distPath = path.join(__dirname, 'dist', 'client');

module.exports = {
    mode: 'development',

    entry: './src/client/index.jsx',

    output: {
        filename: 'bundle.js',
        path: distPath,
    },

    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },

    resolve: {
        extensions: ['.js', '.jsx'],
    },

    devtool: 'inline-source-map',

    devServer: {
        contentBase: distPath,
        port: 8000,
    },

    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({ template: './src/index.html' }),
    ],
};
