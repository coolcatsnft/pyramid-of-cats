const { createCanvas, loadImage, registerFont } = require('canvas');
const { OutputCanvas, RandomSort, FindFontSize } = require('./utils');
const fs = require('fs-extra');

registerFont('./CoolCatsHandwritingRegular.ttf', { family: 'CoolCatsHandwritingRegular' });

const catIds = require('./cats.json').map(cat => cat[0]);
const ids = (process.env.CATIDS || "").split(",").filter(i => i).map(id => Number(id.trim())).sort(RandomSort);
const canvasWidth = Number(process.env.CANVAS_WIDTH || 900);
const canvasHeight = Number(process.env.CANVAS_HEIGHT || 1600);
for (const index in ids) {
  if (!catIds.includes(ids[index])) {
    throw new Error('Cat with id', ids[index], 'does not exist');
  }
}

let imageWidth = 100;
let imageHeight = 100;
const rows = Math.floor(canvasWidth / imageWidth);
const cols = Math.floor(canvasHeight / imageHeight);

const OriginalImageWidth = imageWidth;
const OriginalImageHeight = imageHeight;

// Image dims adjustment
const m1 = (canvasHeight % imageHeight);
if (m1 > 0) {
  const tCol1 = (canvasHeight - m1) / imageHeight;
  const adj1 = m1 / tCol1;
  imageHeight += adj1;
}
const m2 = (canvasWidth % imageWidth);
if (m2 > 0) {
  const tCol2 = (canvasWidth - m2) / imageWidth;
  const adj2 = m2 / tCol2;
  imageWidth += adj2;
}

const filename = process.env.FILENAME || [ids.length, canvasWidth + 'x' + canvasHeight, imageWidth + 'x' + imageWidth].join('_');
const numberOfCats = (canvasWidth * canvasHeight) / (imageWidth * imageHeight);
const ratio = cols / rows;
const catIdSet = new Set(ids);
while (catIdSet.size < numberOfCats) {
  catIdSet.add(catIds[Math.floor(Math.random() * catIds.length)]);
}

const CATS = Array.from(catIdSet).sort(RandomSort);

(async () => {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  for (const i in CATS) {
    const id = CATS[i];
    const cachePath = __dirname + '/cache/filled/' + id + '.png';
    const row = i % rows;
    const col = Math.floor((i * ratio) / cols);
    
    if (fs.existsSync(cachePath)) {
      image = await loadImage(cachePath);
    } else {
      try {
        image = await loadImage('https://metadata.coolcatsnft.com/cat/image/' + id + '.png');
      } catch(e) {
        console.error(id, e);
      }
    }

    const tmpC = createCanvas(image.width, image.height);
    const tmpCtx = tmpC.getContext('2d');

    if (!fs.existsSync(cachePath)) {
      tmpCtx.drawImage(image, 0, 0, image.width, image.width);
      await OutputCanvas(tmpC, cachePath);
    }

    ctx.drawImage(image, (row * imageWidth), (col * imageHeight), imageWidth, imageHeight);
  }

  const text = 'Cool Cats!';
  const fontSize = FindFontSize(ctx, text, 'CoolCatsHandwritingRegular', canvasWidth);
  ctx.font = `${fontSize - 20}px "CoolCatsHandwritingRegular"`;
  ctx.shadowColor = "black";
  ctx.shadowBlur = 10;
  ctx.lineWidth = 10;
  ctx.fillStyle = 'white';
  const metrics = ctx.measureText(text);
  const fontHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const fontWidth = metrics.width;
  ctx.fillText(text, ((canvasWidth - fontWidth) / 2), ((canvasHeight + fontHeight) / 2));

  await OutputCanvas(canvas, __dirname + '/poster_' + filename + '.png');
})();