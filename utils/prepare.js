const fileSystem = require("fs-extra");
const fs = require('fs-extra');
const path = require("path");

// Clean the dist folder.
fileSystem.emptyDirSync(path.join(__dirname, "../build"));

// Copy static assets to the build directory.
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

require("./generate_manifest");
