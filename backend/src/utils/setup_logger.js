const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: { type: 'json' }
    }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});

module.exports = log4js.getLogger();
