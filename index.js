const Lambda = require('./lib/lambda');
const Git = require('./lib/git');


class lamb {
  constructor(params) {
    this.funcFolderPath = params.funcFolderPath;
    console.log("funcFolderPath:", this.funcFolderPath);

    this.env = params.env;
    console.log("environment:", this.env);
  }

  async setup() {
    this.git = new Git();

    this.lambda = new Lambda(this.funcFolderPath, this.env, {
      region: "ap-northeast-1"
    });

    this.lambda.modifyConfig({
      Environment: {
        Variables: {
          NODE_ENV: this.env
        }
      },
      Tags: {
        Commit: await this.git.revparse("HEAD")
      }
    });
  }

  async exec(command) {
    console.log("command:", command);

    switch (command) {
      case "generate":
        return this.generate();

      case "run":
        await this.setup();
        return await this.run();

      case "create":
        await this.setup();
        return await this.create();

      case "update":
        await this.setup();
        return await this.update();

      case "invoke":
        await this.setup();
        return await this.invoke();

      default:
        throw Error(`unknown command: ${command}`);
    }
  }

  generate() {
    Lambda.generate(this.funcFolderPath);
  }

  async run() {
    await this.lambda.localRun({});
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

  async invoke() {
    await this.lambda.invokeFunction();
  }
}

module.exports = lamb;
