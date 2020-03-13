const exec = require("child_process").exec;
const fs = require("fs");
const aws = require("aws-sdk");
const LambdaConfig = require('./lambda-config');

class Lambda {
  constructor(funcFolderPath, options) {
    this.funcFolderPath = funcFolderPath;

    // import config files
    this.config = new LambdaConfig(funcFolderPath);
    this.package = require(`${funcFolderPath}/package-lock`);

    this.zipPath = this.config.getZipPath();

    this.awsLambda = new aws.Lambda(options);
  }

  modifyConfig(params) {
    this.config.merge(params);
  }

  async localRun(event) {
    const handlerMethod = this.config.getHandlerMethod();
    console.log(await handlerMethod(event));
  }

  build () {
    return new Promise((resolve, reject) => {
      const packages = Object.keys(this.package.dependencies).map(name => {
        if (!this.package.dependencies[name].dev) return name;
      }).filter(name => name).map(name => `"node_modules/${name}/*"`);

      var cmds = [
        `cd ${this.funcFolderPath}`,
        "npm install",
        "rm -rf pkg",
        "mkdir pkg",
        `zip -r ${this.zipPath} ./* -x "node_modules/*"`,
        `zip -r ${this.zipPath} . -i ${packages.join(" ")}`,
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
    const createRes = await this.awsLambda.createFunction(
      this.config.toCreateFunction()
    ).promise();
    console.log(createRes);

    const updateRes = await this.awsLambda.putFunctionEventInvokeConfig(
      this.config.toPutEventInvokeConfig()
    ).promise();
    console.log(updateRes);
  }

  async updateFunction () {
    const updateCodeRes = await this.awsLambda.updateFunctionCode(
      this.config.toUpdateFunctionCode()
    ).promise();
    console.log(updateCodeRes);

    const updateConfigRes = await this.awsLambda.updateFunctionConfiguration(
      this.config.toUpdateFunctionConfiguration()
    ).promise();
    console.log(updateConfigRes);

    const updateInvokeConfigRes = await this.awsLambda.updateFunctionEventInvokeConfig(
      this.config.toUpdateFunctionEventInvokeConfig()
    ).promise();
    console.log(updateInvokeConfigRes);

    this.config.merge({
      FunctionArn: updateConfigRes.FunctionArn
    });
    const updateTagRes = await this.awsLambda.tagResource(
      this.config.toTagResouce()
    ).promise();
    console.log(updateTagRes);
  }

  async invokeFunction () {
    debugger
    const res = await this.awsLambda.invoke(
      this.config.toInvoke()
    ).promise();
    res.ParsedPayload = JSON.parse(res.Payload);
    console.log(res);
  }
}

const templateFolder = `${__dirname}/../templates`
Lambda.generate = (funcFolderPath) => {
  fs.mkdirSync(funcFolderPath);
  fs.copyFileSync(`${templateFolder}/index.js`, `${funcFolderPath}/index.js`, fs.constants.COPYFILE_EXCL);
  fs.copyFileSync(`${templateFolder}/lamb.config.js`, `${funcFolderPath}/lamb.config.js`, fs.constants.COPYFILE_EXCL);
}

module.exports = Lambda;
