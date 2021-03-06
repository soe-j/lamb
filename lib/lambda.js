const exec = require("child_process").exec;
const fs = require("fs");
const aws = require("aws-sdk");
const LambdaConfig = require('./lambda-config');

class Lambda {
  constructor(funcFolderPath, env, options) {
    this.funcFolderPath = funcFolderPath;

    // import config files
    this.config = new LambdaConfig(funcFolderPath, env);
    this.package = require(`${funcFolderPath}/package-lock`);

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
        `zip -r ${this.config.zipPath} ./* -x "node_modules/*"`,
        `zip -r ${this.config.zipPath} . -i ${packages.join(" ")} -x ./*/aws-sdk/*`
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
    return fs.unlinkSync(this.config.zipPath);
  }

  async createFunction () {
    const createRes = await this.awsLambda.createFunction(
      this.config.toCreateFunction()
    ).promise();
    console.log(createRes);

    await this.putFunctionEventInvokeConfig();
  }

  async updateFunction () {
    const updateConfigRes = await this.awsLambda.updateFunctionConfiguration(
      this.config.toUpdateFunctionConfiguration()
    ).promise();
    console.log(updateConfigRes);

    await this.putFunctionEventInvokeConfig();

    this.config.merge({
      FunctionArn: updateConfigRes.FunctionArn
    });
    const updateTagRes = await this.awsLambda.tagResource(
      this.config.toTagResouce()
    ).promise();
    console.log(updateTagRes);

    const updateCodeRes = await this.awsLambda.updateFunctionCode(
      this.config.toUpdateFunctionCode()
    ).promise();
    console.log(updateCodeRes);
  }

  async putFunctionEventInvokeConfig() {
    const putRes = await this.awsLambda.putFunctionEventInvokeConfig(
      this.config.toPutEventInvokeConfig()
    ).promise();
    console.log(putRes);
  }

  async invokeFunction () {
    const res = await this.awsLambda.invoke(
      this.config.toInvoke()
    ).promise();
    res.ParsedPayload = JSON.parse(res.Payload);

    if (res.FunctionError) {
      console.error(res);
      throw new Error('FunctionError');
    }
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
