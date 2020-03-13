const Lambda = require('./lambda');
const Git = require('./git');


class lamb {
  constructor () {
  }

  async setup(params) {
    this.funcFolderPath = params.funcFolderPath;
    console.log('funcFolderPath:', this.funcFolderPath);

    this.env = params.env;
    console.log('environment:', this.env);

    this.git = new Git();

    this.lambda = new Lambda(this.funcFolderPath, {
      region: "ap-northeast-1"
    });

    const functionName = (() => {
      if (this.env === 'production') return this.lambda.config.FunctionName;
      return `${this.lambda.config.FunctionName}-${this.env}`;
    })();

    this.lambda.modifyConfig({
      FunctionName: functionName,
      Environment: {
        Variables: {
          NODE_ENV: this.env
        }
      },
      Tags: {
        Commit: await this.git.revparse('HEAD')
      }
    });
  }

  exec(command) {
    console.log('command:', command);

    switch (command) {
      case 'generate':
        return this.generate();

      case 'create':
        return this.create();

      case 'update':
        return this.update();

      default:
        throw Error(`unknown command: ${command}`);
    }
  }

  generate() {
    Lambda.generate(this.funcFolderPath);
  }

  async create() {
    await this.git.isClean();
    await this.lambda.build();
    await this.lambda.createFunction();
    await this.lambda.deletePackage();
  }

  async update() {
    await this.git.isClean();
    await this.lambda.build();
    await this.lambda.updateFunction();
    await this.lambda.deletePackage();
  }
}

module.exports = lamb;
