const exec = require("child_process").exec;
const fs = require("fs");
const aws = require("aws-sdk");

class Lambda {
  constructor(funcFolderPath, options) {
    this.funcFolderPath = funcFolderPath;

    // import config files
    this.config = require(`${funcFolderPath}/lamb.config`);
    this.package = require(`${funcFolderPath}/package-lock`);

    this.zipPath = `${funcFolderPath}/pkg/${this.config.FunctionName}.zip`;

    this.awsLambda = new aws.Lambda(options);
  }

  modifyConfig(options) {
    return Object.assign(this.config, options);
  }

  async localRun(event) {
    const [file, method] = this.config.Handler.split('.')
    const app = require(`${this.funcFolderPath}/${file}`);
    console.log(await app[method](event));
  }

  build () {
    return new Promise((resolve, reject) => {
      const packages = Object.keys(this.package.dependencies).map(name => {
        if (!this.package.dependencies[name].dev) return name;
      }).filter(name => name).map(name => `"node_modules/${name}/*"`);

      var cmds = [
        `cd ${this.funcFolderPath}`,
        "npm install",
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

    const createRes = await this.awsLambda.createFunction(config).promise();
    console.log(createRes);

    const updateRes = await this.putEventInvokeConfig();
    console.log(updateRes);
  }

  async updateFunction () {
    const updateCodeRes = await this.awsLambda.updateFunctionCode({
      FunctionName: this.config.FunctionName,
      ZipFile: fs.readFileSync(this.zipPath)
    }).promise();
    console.log(updateCodeRes);

    const config = Object.assign({}, this.config);
    delete config.Tags;
    delete config.EventInvokeConfig;
    const updateConfigRes = await this.awsLambda.updateFunctionConfiguration(config).promise();
    console.log(updateConfigRes);

    const updateInvokeConfigRes = await this.updateEventInvokeConfig();
    console.log(updateInvokeConfigRes);

    this.config.FunctionArn = updateConfigRes.FunctionArn;
    const updateTagRes = await this.updateTags();
    console.log(updateTagRes);
  }

  async invokeFunction () {
    const res = await this.awsLambda.invoke({
      FunctionName: this.config.FunctionName,
      Payload: JSON.stringify()
    }).promise();
    res.ParsedPayload = JSON.parse(res.Payload);
    console.log(res);
  }

  async putEventInvokeConfig () {
    const config = Object.assign({
      FunctionName: this.config.FunctionName
    }, this.config.EventInvokeConfig);

    return this.awsLambda.putFunctionEventInvokeConfig(config).promise();
  }

  async updateEventInvokeConfig() {
    const config = Object.assign({
      FunctionName: this.config.FunctionName
    }, this.config.EventInvokeConfig);

    return this.awsLambda.updateFunctionEventInvokeConfig(config).promise();
  }

  async updateTags() {
    const config = {
      Resource: this.config.FunctionArn,
      Tags: this.config.Tags
    }
    return this.awsLambda.tagResource(config).promise();
  }
}

const templateFolder = `${__dirname}/../templates`
Lambda.generate = (funcFolderPath) => {
  fs.mkdirSync(funcFolderPath);
  fs.copyFileSync(`${templateFolder}/index.js`, `${funcFolderPath}/index.js`, fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(`${templateFolder}/lamb.config.js`, `${funcFolderPath}/lamb.config.js`, fs.constants.COPYFILE_EXCL);
}

module.exports = Lambda;
