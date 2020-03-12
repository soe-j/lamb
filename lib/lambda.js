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

  async create (options) {
    const config = Object.assign({}, this.config);
    config.Code = {
      ZipFile: fs.readFileSync(this.zipPath)
    };
    Object.assign(config, options);

    const createRes = await lambda.createFunction(config).promise();
    console.log(createRes);
  }

  async update () {
    const params = {
      FunctionName: this.config.FunctionName,
      ZipFile: fs.readFileSync(this.zipPath)
    };

    const updateCodeRes = await lambda.updateFunctionCode(params).promise();
    console.log(updateCodeRes);

    const updateConfigRes = await lambda.updateFunctionConfiguration(this.config).promise();
    console.log(updateConfigRes);
  }
}

module.exports = Lambda;
