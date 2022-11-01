const { exec } = require('child_process');
const catIds = require('./cats.json').map(cat => cat[0]);

exec(
  'CATIDS=' + catIds.join(',') + ' FILNAME=' + catIds.length + ' node ./index.js',
  (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  }
);