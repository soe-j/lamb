const smplGit = require("simple-git/promise")();

class Git {
  async isClean() {
    const status = await smplGit.status();
    if (status.files.length) {
      const errorMsgs = status.files.map(f => {
        return `${f.working_dir} ${f.path}`
      });
      errorMsgs.push(''); // insert new line
      console.error(errorMsgs.join('\n'));
      throw new GitNotCleanError();
    }
  }

  revparse(ref) {
    return smplGit.revparse([ref]);
  }
}

class GitNotCleanError extends Error {
  constructor() {
    super("Git Not Clean!");
  }
}

module.exports = Git;
