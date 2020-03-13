const Lamb = require('../lib/lamb');

(async () => {
  const lamb = new Lamb();
  await lamb.setup({
    funcFolderPath: `${process.cwd()}/${process.argv[3]}`,
    env: process.argv[4]
  });

  const command = process.argv[2];
  await lamb.exec(command);
})().catch(e => {
  console.error(e);
});
