/**
 * @author IITII
 * @date 2020/11/4 19:44
 */
'use strict';
// const dayjs = require('dayjs');
const format = 'YYYY-MM-DD HH:mm:ss.SSS';
const opts = {
  // logger.error() will throw a error if you are using 'errorEventName'
  // errorEventName: 'error',
  dateFormat: 'YYYY.MM.DD',
  timestampFormat: format,
  level: process.env.LOG_LEVEL || 'info',
  category: ''
}
/**
 * logger
 */
const logger = require('simple-node-logger').createSimpleLogger(opts);

module.exports = {
  logger
}
