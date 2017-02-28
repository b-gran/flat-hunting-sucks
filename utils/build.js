var webpack = require("webpack"),
  config = require("../webpack.config"),
  fs = require('fs-extra'),
  path = require('path');

require("./prepare");

// Copy static assets to the build directory
fs.copy(
  path.join(__dirname, '../src/static/'),
  path.join(__dirname, '../build/static/'),
  err => {
    if (err) {
      console.error('Failed to copy static assets');
      console.log(err);
    }
  }
);

webpack(
  config,
  function (err) { if (err) throw err; }
);
