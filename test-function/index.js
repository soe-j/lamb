const moment = require('moment');
exports.handler = async event => {
  event.timestamp = moment();
  event.env = process.env;
  return event;
}
