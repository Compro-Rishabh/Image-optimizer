const sharp=require('sharp');
const fs = require('fs');
const path = require('path');
let IGNORE_FILE_EXT;


const sharpWebPOptions = {
  quality: 70
};

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

 async function compress(config) {
  IGNORE_FILE_EXT = config?.ignoreExt || ['svg'];

  if (fs.existsSync(config.srcDir)) {
    const fileNamesArr = fs.readdirSync(config.srcDir);

    const promiseArr = [];
    if (!config.images) {
      config.images = {};
    }

    ensureDirectoryExistence(config.destDir + '/abc.txt');

    for (const file of fileNamesArr) {
      // do not minify images with ext mentioned in IGNORE_FILE_EXT
      if (IGNORE_FILE_EXT.includes(splitFilename(file)[1])) {
        continue;
      }

      try {
        if (config.images[file] !== false) {
          promiseArr.push(createMinifiedImages(file, config));
        }
      } catch (err) {
        console.log('ERROR in: ', file);
        console.log('Err: ', err);
      }
    }
    await Promise.allSettled(promiseArr);
  }
}

/**
 *
 * @param {*} file - original file's name
 * @param {*} config - {
 *     origin: <current image folder - will be done away with after build time integration>,
 *     sizeArr: <scaling sizes>,
 *     dir: <directory location of source images>,
 * }
 */
function createMinifiedImages(file, config) {
  return new Promise((resolve, reject) => {
    const nameSplit = splitFilename(file);
    const minifiedName = nameSplit[0] + '-min.' + nameSplit[1];
    sharp(config.srcDir + file)
      .webp(sharpWebPOptions)
      .toFile(config.destDir + minifiedName, (err) => {
        if (err) {
          console.log('Error in: ', minifiedName);
          console.log('Error: ', err);
          reject(err);
        } else if (config.images[file]?.sizes) {
          config.images[file].sizes.forEach((size) => {
            resizeImages(minifiedName, size, config);
          });
        }
        resolve(true);
      });
  });
}

/**
 * scale the image to given width
 * @param {*} filename
 * @param {*} width
 * @returns
 */
function resizeImages(
  filename,
  width,
  config
) {
  const scaledImgName = filename.replace('-min', '-' + width);
  sharp(config.destDir + filename)
    .resize({ width })
    .webp(sharpWebPOptions)
    .toFile(config.destDir + scaledImgName, (err) => {
      if (err) {
        console.log('Error in: ', scaledImgName);
        console.log('Error: ', err);
      }
    });
}

/**
 * takes a file name with its extension
 * returns filename and extension separately
 * @param {*} filename
 * @returns
 */
function splitFilename(filename) {
  const lastIndex = filename.lastIndexOf('.');
  const name = filename.slice(0, lastIndex);
  const ext = filename.slice(lastIndex + 1);
  return [name, ext];
}

exports.compress = compress;