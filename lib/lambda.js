const exec = require("child_process").exec;
const fs = require("fs");
const aws = require("aws-sdk");
const lambda = new aws.Lambda({
  region: "ap-northeast-1"
});

class Lambda {
  constructor(funcFolderPath) {
    this.funcFolderPath = funcFolderPath;

    // import config files
    this.config = require(`${funcFolderPath}/lamb.config`);
    this.package = require(`${funcFolderPath}/package-lock`);

    this.zipPath = `${funcFolderPath}/pkg/${this.config.FunctionName}.zip`;
  }

  modifyConfig(options) {
    return Object.assign(this.config, options);
  }

  build () {
    return new Promise((resolve, reject) => {
      const packages = Object.keys(this.package.dependencies).map(name => {
        if (!this.package.dependencies[name].dev) return name;
      }).filter(name => name).map(name => `"node_modules/${name}/*"`);

      var cmds = [
        `cd ${this.funcFolderPath}`,
        "ln -s ../../config",
        "rm -rf pkg",
        "mkdir pkg",
        `zip -r ${this.zipPath} ./* -x "node_modules/*"`,
        `zip -r ${this.zipPath} . -i ${packages.join(" ")}`,
        "rm -f config"
      ];

      console.log(cmds);

      exec(cmds.join("; "), { maxBuffer: 400 * 1024 }, (err, stdout, stderr) => {
        if (err) reject(err);
        if (stderr) reject(stderr);
        console.log(stdout);
        resolve(stdout);
      });
    });
  }

  deletePackage() {
    return fs.unlinkSync(this.zipPath);
  }

  async createFunction () {
    const config = Object.assign({}, this.config);
    delete config.EventInvokeConfig;
    config.Code = {
      ZipFile: fs.readFileSync(this.zipPath)
    };

    const createRes = await lambda.createFunction(config).promise();
    console.log(createRes);

    const updateRes = await this.putEventInvokeConfig();
    console.log(updateRes);
  }

  async updateFunction () {
    const updateCodeRes = await lambda.updateFunctionCode({
      FunctionName: this.config.FunctionName,
      ZipFile: fs.readFileSync(this.zipPath)
    }).promise();
    console.log(updateCodeRes);

    const config = Object.assign({}, this.config);
    delete config.Tags;
    delete config.EventInvokeConfig;
    const updateConfigRes = await lambda.updateFunctionConfiguration(config).promise();
    console.log(updateConfigRes);

    const updateInvokeConfigRes = await this.updateEventInvokeConfig();
    console.log(updateInvokeConfigRes);
  }

  async putEventInvokeConfig () {
    const config = Object.assign({
      FunctionName: this.config.FunctionName
    }, this.config.EventInvokeConfig);

    return lambda.putFunctionEventInvokeConfig(config).promise();
  }

  async updateEventInvokeConfig() {
    const config = Object.assign({
      FunctionName: this.config.FunctionName
    }, this.config.EventInvokeConfig);

    return lambda.updateFunctionEventInvokeConfig(config).promise();
  }
}

module.exports = Lambda;
