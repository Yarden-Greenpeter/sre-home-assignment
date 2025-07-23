const log4js = require('log4js');

// Configure log4js for structured JSON logging
log4js.configure({
  appenders: {
    console: { 
      type: 'console',
      layout: {
        type: 'json',
        separator: '\n'
      }
    },
    userActivity: {
      type: 'file',
      filename: 'logs/user-activity.log',
      layout: {
        type: 'json',
        separator: '\n'
      }
    },
    dbChanges: {
      type: 'file',
      filename: 'logs/db-changes.log',
      layout: {
        type: 'json',
        separator: '\n'
      }
    },
    app: {
      type: 'file',
      filename: 'logs/app.log',
      layout: {
        type: 'json',
        separator: '\n'
      }
    }
  },
  categories: {
    default: { appenders: ['console', 'app'], level: 'info' },
    userActivity: { appenders: ['console', 'userActivity'], level: 'info' },
    dbChanges: { appenders: ['console', 'dbChanges'], level: 'info' }
  }
});

const appLogger = log4js.getLogger();
const userActivityLogger = log4js.getLogger('userActivity');
const dbChangesLogger = log4js.getLogger('dbChanges');

// Structured logging functions
function logUserActivity(userId, action, ipAddress, additionalData = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId,
    action: action,
    ipAddress: ipAddress,
    ...additionalData
  };
  
  userActivityLogger.info(logEntry);
}

function logDatabaseChange(operation, table, data, userId = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation: operation, // INSERT, UPDATE, DELETE
    table: table,
    userId: userId,
    data: data
  };
  
  dbChangesLogger.info(logEntry);
}

module.exports = {
  appLogger,
  userActivityLogger,
  dbChangesLogger,
  logUserActivity,
  logDatabaseChange
};