var webpack = require("webpack"),
    path = require("path"),
    fileSystem = require("fs"),
    env = require("./utils/env"),
    _ = require('lodash'),
    path = require('path'),
    HtmlWebpackPlugin = require("html-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin");

// load the secrets
var alias = {};

var secretsPath = path.join(__dirname, ("secrets." + env.NODE_ENV + ".js"));

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

const Entries = {
  popup: Entry(
    'popup',
    path.join(__dirname, "src", "js", "popup.js"),
    path.join(__dirname, "src", "popup.html")
  ),

  // options: Entry(
  //   'options',
  //   path.join(__dirname, "src", "js", "options.js"),
  //   path.join(__dirname, "src", "options.html")
  // ),
  //
  // background: Entry(
  //   'background',
  //   path.join(__dirname, "src", "js", "background.js"),
  //   path.join(__dirname, "src", "background.html")
  // ),
};

function Entry (id, filename, htmlFile) {
  return {
    id: id,
    filename: filename,
    htmlFile: htmlFile
  };
}

module.exports = {
  entry: _.mapValues(Entries, entry => entry.filename),

  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },

  module: {
    rules: [
      { test: /\.(js|jsx)$/, loader: "babel-loader" },
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  },

  resolve: {
    alias: alias,
    extensions: [".js", ".jsx", ".css"]
  },

  plugins: [
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
    }),
  ].concat(_.values(Entries).map(entry => new HtmlWebpackPlugin({
      template: entry.htmlFile,
      filename: path.basename(entry.htmlFile),
      chunks: [entry.id]
    })
  )).concat([ new WriteFilePlugin() ]),

};
