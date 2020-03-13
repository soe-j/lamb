const fs = require('fs');

class LambdaConfig {
  constructor(funcFolderPath) {
    this.funcFolderPath = funcFolderPath;
    this.config = require(`${funcFolderPath}/lamb.config`);
    this.zipPath = this.getZipPath();
  }

  getFunctionName() {
    return this.config.FunctionName;
  }

  getZipPath() {
    return `${this.funcFolderPath}/pkg/${this.config.FunctionName}.zip`;
  }

  getHandlerMethod() {
    const [file, method] = this.config.Handler.split(".");
    const app = require(`${this.funcFolderPath}/${file}`);
    return app[method];
  }

  merge(params) {
    Object.assign(this.config, params);
  }

  toCreateFunction() {
    const config = Object.assign({}, this.config);
    delete config.EventInvokeConfig;
    delete config.Custom;
    config.Code = {
      ZipFile: fs.readFileSync(this.zipPath)
    };
    return config;
  }

  toUpdateFunctionCode() {
    return {
      FunctionName: this.config.FunctionName,
      ZipFile: fs.readFileSync(this.zipPath)
    };
  }

  toUpdateFunctionConfiguration() {
    const config = Object.assign({}, this.config);
    delete config.Tags;
    delete config.EventInvokeConfig;
    delete config.Custom;
    return config;
  }

  toPutEventInvokeConfig() {
    return Object.assign(
      {
        FunctionName: this.config.FunctionName
      },
      this.config.EventInvokeConfig
    );
  }

  toUpdateFunctionEventInvokeConfig() {
    return Object.assign(
      {
        FunctionName: this.config.FunctionName
      },
      this.config.EventInvokeConfig
    );
  }

  toTagResouce() {
    return {
      Resource: this.config.FunctionArn,
      Tags: this.config.Tags
    };
  }

  toInvoke() {
    return {
      FunctionName: this.config.FunctionName,
      Payload: JSON.stringify()
    };
  }
}

module.exports = LambdaConfig;
