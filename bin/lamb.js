const Lambda = require('../lib/lambda');
const Git = require('../lib/git');

const funcFolderPath = `${process.cwd()}/${process.argv[2]}`
console.log('funcFolderPath:', funcFolderPath);

const env = process.argv[3];
console.log('environment:', env);

const lambda = new Lambda(funcFolderPath, env);
const git = new Git();

(async () => {
  await git.isClean();

  await lambda.build();
  await lambda.create({
    Tags: {
      Commit: await git.revparse('HEAD')
    }
  });
})();
