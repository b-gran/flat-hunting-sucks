var manifest = require("../src/manifest.json"),
  packageJson = require('../package.json'),
  fileSystem = require("fs"),
  path = require("path"),
  env = require("./env");

// generates the manifest file using the package.json informations
manifest.description = packageJson.description;
manifest.version = packageJson.version;

fileSystem.writeFileSync(
  path.join(__dirname, "../build/manifest.json"),
  JSON.stringify(manifest)
);
