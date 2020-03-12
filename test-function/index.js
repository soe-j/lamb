const moment = require('moment');
exports.handler = async event => {
  event.timestamp = moment();
  return event;
}
