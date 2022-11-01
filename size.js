const { exec } = require('child_process');
const DEFAULT = 21;
const SIZE = typeof process.env.SIZE === "string" ? (Number(process.env.SIZE) || DEFAULT) : DEFAULT;

const numbers = Array.from(Array(SIZE).keys());

exec(
  'CATIDS=' + numbers.join(',') + ' FILNAME=' + SIZE + ' node ./index.js',
  (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  }
);