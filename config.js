/**
 * @author IITII
 * @date 2020/11/3 22:34
 */
'use strict';
let config = {
  "downloadDir": "./tmp",
  "limit": 25,
  "proxy": false,
  "links": "./task.txt"
};
// config.proxy = false;

// Telegraph will return 500 if the rate is too high
// Maybe 25 is best
config.limit = process.env.TGD_LIMIT || 5 * 5

module.exports = config;
