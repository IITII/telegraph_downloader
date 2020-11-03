/**
 * @author IITII
 * @date 2020/11/3 22:34
 */
'use strict';
const axios = require('axios'),
  {load} = require('cheerio'),
  config = require('./config.js'),
  fs = require('fs'),
  readline = require('readline'),
  async = require('async'),
  {uniq} = require('lodash'),
  {logger} = require('./logger'),
  path = require('path');

function init() {
  try {
    if (!fs.existsSync(config.links)) {
      logger.error(`File NOT FOUND:${path.resolve(config.links)}`);
      process.exit(1);
    }
    if (!fs.existsSync(config.downloadDir)) {
      fs.mkdirSync(config.downloadDir);
      logger.info(`Created ${path.resolve(config.downloadDir)}`);
    }
    fs.accessSync(config.links, fs.constants.R_OK);

    //Init axios
    axios.defaults.timeout = 3000;
    axios.defaults.proxy = config.proxy;
    axios.defaults.headers['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36";

  } catch (err) {
    logger.error(`Unable to read file: ${config.links}!`);
    process.exit(1)
  }
}

/**
 * Checks if value is null or undefined or ''.
 * @param object object
 * @return {boolean} true for nil or ''
 */
function isNil(object) {
  return (object == null) || (object === '');
}

function mkdir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
}

/**
 * Calc how much time spent on run function.
 * @param func Run function
 * @param args function's args
 */
async function spendTime(func, ...args) {
  return await new Promise(async (resolve, reject) => {
    let start = new Date();
    try {
      await func.apply(this, args);
      return resolve();
    } catch (e) {
      logger.error(e);
      return reject();
    } finally {
      let cost = new Date() - start;
      let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
      logger.info(`Total spent ${logInfo}.`);
    }
  });
}

async function getUrl(filePath) {
  let rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });
  const links = [];
  for await (let line of rl) {
    line = line.trim().replace("\n", "");
    if (isNil(line)) {
      continue;
    }
    links.push(line);
  }
  return uniq(links);
}

async function getImageArray(url) {
  return await new Promise((resolve) => {
    axios.get(url, {
      responseType: "document",
    })
      .then(res => {
        return res.data;
      })
      .then(doc => {
        return load(doc);
      })
      .then($ => {
        const title = $('header h1').text();
        const saveDir = path.resolve(config.downloadDir + path.sep + title);
        mkdir(saveDir);
        const imgSrc = [];
        $("img").each((index, item) => {
          imgSrc.push({
            url: new URL(url).origin + item.attribs.src,
            savePath: path.resolve(saveDir + path.sep + (index + 1) + path.extname(item.attribs.src))
          });
        });
        return resolve(uniq(imgSrc));
      })
      .catch(e => {
        logger.error(`Get ImageArray failed, url: ${url}`);
        logger.error(e);
        return resolve([]);
      });
  })
}

async function downloadFile(url, filePath, callback) {
  return await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    logger.info(`Downloading ${url}...`)
    axios.get(url, {
      responseType: "stream",
    })
      .then(res => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        res.data.pipe(writeStream);
      })
      .then(() => {
        logger.info(`Downloaded ${url} to ${filePath}`);
      })
      .catch(e => {
        logger.error(`Download error: ${e.message}`);
        logger.error(e);
        return reject({
          url: url,
          filePath: filePath
        });
      })
      .finally(callback);
  })
}


(async () => {
  init();
  const urls = await getUrl(config.links);
  const downloadFailed = [];
  // update axios settings
  axios.defaults.timeout = Math.max(urls.length, 3) * 1000;
  logger.info(`Total urls: ${urls.length}`);
  let imagesUrl = [];
  for (const url of urls) {
    logger.info(`Getting image urls from ${url}`);
    imagesUrl = imagesUrl.concat(await getImageArray(url));
  }
  await spendTime(async () => {
    await async.mapLimit(imagesUrl, config.limit || 10, async function (json, callback) {
      await downloadFile(json.url, json.savePath, callback)
        .catch(e => {
          downloadFailed.push(e);
        });
    })
      .catch(e => {
        logger.error(e);
      })
  })
    .then(() => {
      logger.info(`Download complete!`);
    })
    .catch(e => {
      logger.error(`Download Error: ${e.message}`);
      logger.error(e);
    })
    .finally(() => {
      //Show failed url
      if (downloadFailed.length !== 0) {
        logger.error(downloadFailed);
      }
    })
})()


