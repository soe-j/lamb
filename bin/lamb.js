const Lambda = require('../lib/lambda');
const Git = require('../lib/git');

const command = process.argv[2];
if (!['create','update'].includes(command)) {
  throw Error(`unknown command: ${command}`);
}
console.log('command:', command);

const funcFolderPath = `${process.cwd()}/${process.argv[3]}`
console.log('funcFolderPath:', funcFolderPath);

const env = process.argv[4];
console.log('environment:', env);

const lambda = new Lambda(funcFolderPath);
const git = new Git();

const functionName = (() => {
  if (env === 'production') return lambda.config.FunctionName;
  return `${lambda.config.FunctionName}-${env}`;
})();

(async () => {
  await git.isClean();

  lambda.modifyConfig({
    FunctionName: functionName,
    Environment: {
      Variables: {
        NODE_ENV: env
      }
    },
    Tags: {
      Commit: await git.revparse('HEAD')
    }
  });

  try {
    await lambda.build();

    switch (command) {
      case 'create':
        await lambda.createFunction();
        break;
      case 'update':
        await lambda.updateFunction();
        break;
    }

  } finally {
    await lambda.deletePackage();
  }
})();
