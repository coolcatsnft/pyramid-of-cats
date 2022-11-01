const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
registerFont('./CoolCatsHandwritingRegular.ttf', { family: 'CoolCatsHandwritingRegular' });

const catIds = require('./cats.json').map(cat => cat[0]);
const imageWidth = process.env.THUMBNAIL_WIDTH || 100;
const backgroundColor = process.env.BACKGROUND_COLOR || "transparent";
const CATDIMS = [imageWidth, imageWidth];
const ids = (process.env.CATIDS || "").split(",").map(id => Number(id.trim())).sort(() => (Math.random() > .5) ? 1 : -1);
const pyramid = [];
const calcdFloor = calcFloor(ids);
const floor = process.env.FLOOR_SPACES || calcdFloor;
const filename = process.env.FILENAME || [ids.length, floor, imageWidth + 'x' + imageWidth].join('_');

for (const index in ids) {
  if (!catIds.includes(ids[index])) {
    throw new Error('Cat with id', ids[index], 'does not exist');
  }
}

if (process.env.FLOOR_SPACES 
  && Number(process.env.FLOOR_SPACES)
  && Number(process.env.FLOOR_SPACES) < calcdFloor
) {
  throw new Error('Provided floor spaces is less than calculated floor.')
}

let squares = Number(floor);
let k = squares;
let index = 0;

while(k > 0) {
  const row = [];
  for (let i = 0; i < k; i++) {
    row.push(typeof ids[index] === 'number' ? ids[index] : null);
    index++;
  }

  pyramid.push(row);
  k--;
}

const catIndent = imageWidth * 0.4;
const canvasWidth = (squares * imageWidth) - (catIndent * (squares - 1));
const canvasHeight = canvasWidth;

(async () => {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const fontSize = findFontSize(ctx, 'COOL CATS!', 'CoolCatsHandwritingRegular');
  ctx.font = '12px';
  ctx.fillStyle = 'white';
  ctx.fillText('COOL CATS!', catIndent, canvasHeight - catIndent);
  const metrics = ctx.measureText(ctx.font);
  const fontHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  canvas.height = canvasHeight + (fontHeight - 20);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rev = pyramid;

  let i = Number(rev.length - 1);

  while (i >= 0) {
    let j = Number(rev[i].length - 1);
    const I = Number(i);
    const row = rev[i];
    const nulls = row.filter(r => r === null).length;
    const rowNudge = I * (catIndent / 2);
    const nullNudge = ((nulls * CATDIMS[0]) - (catIndent * nulls)) / 2;
    while (j >= 0) {
      const J = Number(j);
      const shoulderIndent = ((J > 0 || I > 0) ? (catIndent * (J + I || 1)) : 0);
      const indent = (CATDIMS[0] / 2) * i;
      const x = (CATDIMS[0] * J) + indent + rowNudge + nullNudge - shoulderIndent;
      const y = canvasHeight - ((CATDIMS[1] * I)) - CATDIMS[1] + (I > 0 ? catIndent * I : 0);
      const id = row[j];
      
      if (typeof id === 'number') {
        let image;

        if (fs.existsSync(__dirname + '/cache/' + id + '.png')) {
          image = await loadImage(__dirname + '/cache/' + id + '.png');
        } else {
          image = await loadImage('https://s3.amazonaws.com/beta-metadata.coolcatsnft.com/alpha-cats/full/' + id + '.png');
        }

        const tmpC = createCanvas(image.width, image.height);
        const tmpCtx = tmpC.getContext('2d');

        if (!fs.existsSync(__dirname + '/cache/' + id + '.png')) {
          tmpCtx.drawImage(image, 0, 0, image.width, image.width);
          await outputCanvas(tmpC, __dirname + '/cache/' + id + '.png');
        }

        ctx.drawImage(image, x, y, CATDIMS[0], CATDIMS[1]);
      }
      j--;
    }
    i--;
  }

  ctx.font = (fontSize - (fontSize * 0.5)) + 'px "CoolCatsHandwritingRegular"';
  ctx.fillStyle = 'white';
  ctx.fillText('Cool Cats!', catIndent / 2, canvas.height - (catIndent / 2));
      
  await outputCanvas(canvas, __dirname + '/' + filename + '.png');
})();


// Calc a floor for the pyramid
function calcFloor(arr, arr2, level, count) {
  level = level || 0;
  arr2 = arr2 || [];
  count = count || 0;
  arr2[level] = [];
  for (let i = 0; i <= level; i++) {
    arr2[level].push(arr[count]);
    count++;
  }

  if (count >= arr.length) {
    return level + 1;
  }

  return calcFloor(arr, arr2, level + 1, count || 1);
}

function outputCanvas(c, path) {
  return new Promise((res, rej) => {
    const out = fs.createWriteStream(path)
    const stream = c.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
      console.log('The PNG file was created.');
      res(out)
    });
    out.on('error', (err) => {
      console.log('The PNG file was not created.');
      rej(err)
    });
  })
}

function findFontSize(ctx, text, fontface) {
  let fontsize = 300;
  // lower the font size until the text fits the canvas
  do {
    fontsize--;
    ctx.font = fontsize + "px " + fontface;
  } while (ctx.measureText(text).width > canvasWidth);
  return fontsize;
}