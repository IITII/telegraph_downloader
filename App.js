const fetch = require('node-fetch'),
  cheerio = require('cheerio'),
  config = require('./config.json'),
  util = require('util'),
  fs = require('fs'),
  streamPipeline = util.promisify(require('stream').pipeline),
  readline = require('readline'),
  async = require('async'),
  // adm_zip = require("adm-zip"),
  // zip = new adm_zip(),
  path = require('path'),
  HttpsProxyAgent = require('https-proxy-agent');

function init() {
  try {
    if (!fs.existsSync(config.links)) {
      console.error(`File NOT FOUND:${path.resolve(config.links)}`);
      process.exit(1);
    }
    if (!fs.existsSync(config.downloadDir)) {
      fs.mkdirSync(config.downloadDir);
      console.log(`Created ${path.resolve(config.downloadDir)}`);
    }
    fs.accessSync(config.links, fs.constants.R_OK);
  } catch (err) {
    console.error('Unable to read file!');
    process.exit(1)
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
      await func(args);
      return resolve();
    } catch (e) {
      console.error(e);
      return reject();
    } finally {
      let cost = new Date() - start;
      let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
      console.info(`Total spent ${logInfo}.`);
    }
  });
}

/**
 * Checks if value is null or undefined or ''.
 * @param object object
 * @return {boolean} true for nil or ''
 */
function isNil(object) {
  return (object == null) || (object === '');
}

async function getDom(url) {
  let data = await (isNil(config.proxy) ? fetch(url) : fetch(url, {agent: new HttpsProxyAgent(config.proxy)}));
  let text = await data.text();
  return await cheerio.load(text);
}

async function mkdir(dir) {
  return await new Promise(async (resolve, reject) => {
    if (!fs.existsSync(dir)) {
      try {
        await fs.mkdirSync(dir);
        console.log(`Created dir ${dir} successful!`);
        return resolve();
      } catch (e) {
        console.error(`Create dir ${dir} failed!`);
        return reject(e);
      }
    } else {
      console.log(`Dir already exist: ${dir}`);
      return resolve();
    }
  })
}

async function downloadImg(imgSrc, callback) {
  console.log(`Downloading ${imgSrc.url}...`);
  await spendTime(async () => {
    let res = await fetch(imgSrc.url);
    if (res.ok) {
      await streamPipeline(res.body, fs.createWriteStream(imgSrc.savePath));
    }
  }, null)
    .then(() => {
      console.log(`Save to ${imgSrc.savePath}`);
    })
    .catch(e => {
      console.error(`Download error!!!`);
      console.error(e);
    });
  callback();
}

async function main() {
  await init();
  // read by line
  let rl = readline.createInterface({
    input: fs.createReadStream(config.links),
    crlfDelay: Infinity
  });
  /* [{"name":"","url":"","saveDir":"","imgSrc":[{"url":"","savePath":""}]},...]
  links is updated but only use for length, maybe it's not necessary.
   */
  let links = [];
  for await (const line of rl) {
    if (isNil(line)) {
      continue;
    }
    let tmp = {
      "name": "",
      "url": "",
      "saveDir": "",
      "imgSrc": []
    };
    tmp.url = line;
    links.push(tmp);
  }
  console.log(`Links Total: ${links.length}`);
  let imgSrcArray = [];
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    let $ = await getDom(link.url);
    link.name = await $('header h1').text();
    link.saveDir = path.resolve(config.downloadDir + path.sep + link.name);
    await mkdir(link.saveDir);
    await $("img").each((index, item) => {
      let tmp = {
        url: new URL(link.url).origin + item.attribs.src,
        savePath: path.resolve(link.saveDir + path.sep + (index + 1) + path.extname(item.attribs.src))
      }
      link.imgSrc.push(tmp);
      imgSrcArray.push(tmp);
    });
  }
  await spendTime(async () => {
    await async.mapLimit(imgSrcArray, config.limit, function (json, callback) {
      downloadImg(json, callback);
    })
  }, null);
}

spendTime(main, null).then(() => {
  console.log(`Download complete!`);
})
  .then(async () => {
    // let files = fs.readdirSync(config.downloadDir);
    // files.forEach(file => {
    //   let filePath = config.downloadDir + path.sep + file;
    //   if (fs.lstatSync(filePath).isDirectory()) {
    //     zip.addLocalFolder(filePath);
    //   }
    // })
    // await zip.addLocalFolder(config.downloadDir)
    // await zip.writeZip(`${config.downloadDir + path.sep + path.basename(config.downloadDir)}.zip`);
    // console.log('Compress Finish!')
  })
