const Lambda = require('../lib/lambda');
const Git = require('../lib/git');

const funcFolderPath = `${process.cwd()}/${process.argv[2]}`
console.log('funcFolderPath:', funcFolderPath);

const env = process.argv[3];
console.log('environment:', env);

const lambda = new Lambda(funcFolderPath, env);
const git = new Git();

const functionName = (() => {
  if (env === 'production') return lambda.config.FunctionName;
  return `${lambda.config.FunctionName}-${env}`;
})();

(async () => {
  await git.isClean();

  await lambda.build();
  await lambda.create({
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
})();
