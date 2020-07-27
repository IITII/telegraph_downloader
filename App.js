const rp = require('request-promise'),
  cheerio = require('cheerio'),
  config = require('./config.json'),
  fs = require('fs'),
  readline = require('readline'),
  async = require('async'),
  // adm_zip = require("adm-zip"),
  // zip = new adm_zip(),
  path = require('path');

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
    console.error('无权访问');
    process.exit(1)
  }
  
}

async function getDom(url) {
  let options = {
    method: 'GET',
    uri: url,
    proxy: config.proxy
    // encoding: 'utf-8'
  };
  let data = await rp(options);
  return await cheerio.load(data)
}

async function task(url) {
  if (url === null || url === undefined || url === "") {
    return;
  }
  let imgSrc = [];
  let $ = await getDom(url);
  await $("img").each((index, item) => {
    imgSrc.push(new URL(url).origin + item.attribs.src);
  })
  if (imgSrc.length === 0) {
    console.error(`NO IMAGE!!! URL: ${url}`);
    return;
  }
  if (config.linksOnly) {
    imgSrc.forEach(e => console.log(e));
    return;
  }
  // mkdir
  let dlDir = config.downloadDir + path.sep + await $('header h1').text();
  dlDir = path.resolve(dlDir);
  if (!fs.existsSync(dlDir)) {
    fs.mkdirSync(dlDir);
    console.log(`Created dir ${dlDir}`);
  }
  for (let i = 0; i < imgSrc.length; i++) {
    let src = imgSrc[i];
    console.log(`Downloading ${src}`);
    let savePath = dlDir + path.sep + (i + 1) + path.extname(new URL(src).pathname);
    await rp({
      url: src,
      resolveWithFullResponse: true,
      // headers
    }).pipe(fs.createWriteStream(`${savePath}`));
    console.log(`Save to ${savePath}`);
  }
}

async function main() {
  let start = new Date();
  init();
  // read by line
  let rl = readline.createInterface({
    input: fs.createReadStream(config.links),
    crlfDelay: Infinity
  });
  let links = [];
  for await (const line of rl) {
    links.push(line)
  }
  console.log(`Links Total: ${links.length}`);
  for (let i = 0; i < links.length; i++) {
    console.log(`Run task ${i}...`);
    let start1 = new Date();
    await task(links[i]);
    let cost = new Date() - start1;
    let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
    console.log(`Task ${i} finished, spent ${logInfo}.`);
  }
  let cost = new Date() - start;
  let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
  console.log(`Total spent ${logInfo}.`);
}

main().then(() => {
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
