const fs = require('fs-extra');

function OutputCanvas(c, path) {
  return new Promise((res, rej) => {
    const out = fs.createWriteStream(path)
    const stream = c.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
      console.log(`The PNG file '${path}' was created.`);
      res(out)
    });
    out.on('error', (err) => {
      console.log('The PNG file was not created.');
      rej(err)
    });
  })
}

function FindFontSize(ctx, text, fontface, canvasWidth) {
  let fontsize = 300;
  if (ctx.measureText(text).width >= fontsize) {
    return fontsize;
  }

  // lower the font size until the text fits the canvas
  do {
    fontsize--;
    ctx.font = fontsize + "px " + fontface;
  } while (ctx.measureText(text).width > canvasWidth);
  return fontsize;
}

function RandomSort() {
  return (Math.random() > .5) ? 1 : -1;
}

module.exports = {
  OutputCanvas,
  RandomSort,
  FindFontSize
}