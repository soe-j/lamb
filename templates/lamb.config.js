module.exports = {
  FunctionName: "sayHelloWorld",
  Description: "say hello world",
  Handler: "index.handler",
  Role: "arn:aws:iam::123456789012:role/awesome-role",
  MemorySize: "128",
  Timeout: "5",
  Runtime: "nodejs12.x",
  /** overwrite by lamb

    Environment: {
      Variables: {
        NODE_ENV: "staging"
      }
    },
    Tags: {
      Commit: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    },
  */
  VpcConfig: {
    SubnetIds: [
      "subnet-xxxxxxxxxxxxxxxxx",
      "subnet-yyyyyyyyyyyyyyyyy",
      "subnet-zzzzzzzzzzzzzzzzz",
    ],
    SecurityGroupIds: [
      "sg-xxxxxxxxxxxxxxxxx"
    ]
  },
  EventInvokeConfig: {
    MaximumEventAgeInSeconds: "60",
    MaximumRetryAttempts: "0"
  },
  Custom: {
    /** overwrite by each environments
      staging: {
        FunctionName: "sayHelloWorldStaging"
      },
      production: {
        FunctionName: "sayHelloWorldProduction"
      }
    */
  }
};
