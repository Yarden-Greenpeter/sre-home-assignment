const kafka = require('kafkajs');
const log4js = require('log4js');

// Configure logging for consumer
log4js.configure({
  appenders: {
    console: { 
      type: 'console',
      layout: {
        type: 'json',
        separator: '\n'
      }
    },
    consumer: {
      type: 'file',
      filename: 'logs/consumer.log',
      layout: {
        type: 'json',
        separator: '\n'
      }
    }
  },
  categories: {
    default: { appenders: ['console', 'consumer'], level: 'info' }
  }
});

const logger = log4js.getLogger();

class DatabaseChangeConsumer {
  constructor() {
    this.kafka = kafka({
      clientId: 'database-change-consumer',
      brokers: [process.env.KAFKA_BROKERS || 'kafka:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.consumer = this.kafka.consumer({ 
      groupId: 'database-change-consumer-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    
    this.isRunning = false;
  }

  async start() {
    try {
      await this.consumer.connect();
      console.log('Database Change Consumer connected to Kafka');
      
      // Subscribe to database changes topic
      await this.consumer.subscribe({ topic: 'database-changes' });
      
      this.isRunning = true;
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          try {
            const changeData = JSON.parse(message.value.toString());
            
            // Process the database change
            await this.processChange(changeData);
            
            // Call heartbeat to ensure the consumer stays alive
            await heartbeat();
            
          } catch (error) {
            logger.error('Error processing database change message:', error);
          }
        }
      });
      
    } catch (error) {
      logger.error('Failed to start Database Change Consumer:', error);
      throw error;
    }
  }

  async processChange(changeData) {
    // Log database change in structured format as required
    const processedChange = {
      timestamp: new Date().toISOString(),
      operation: changeData.operation,
      table: changeData.table,
      userId: changeData.data?.email || null,
      data: changeData.data,
      originalTimestamp: changeData.timestamp,
      processed: true
    };
    
    // Write to console in structured format
    logger.info('Database change processed:', processedChange);
    
    // Additional processing logic can be added here
    switch (changeData.table) {
      case 'users':
        await this.handleUserChange(processedChange);
        break;
      case 'user_activities':
        await this.handleActivityChange(processedChange);
        break;
      case 'audit_logs':
        await this.handleAuditLogChange(processedChange);
        break;
      default:
        logger.info('Unknown table change:', processedChange);
    }
  }

  async handleUserChange(change) {
    logger.info('User change detected:', {
      type: 'user_management',
      operation: change.operation,
      user: change.data?.email,
      timestamp: change.timestamp
    });
  }

  async handleActivityChange(change) {
    logger.info('Activity change detected:', {
      type: 'user_activity',
      operation: change.operation,
      user: change.data?.email,
      activity: change.data?.activity_type,
      timestamp: change.timestamp
    });
  }

  async handleAuditLogChange(change) {
    logger.info('Audit log change detected:', {
      type: 'audit_event',
      operation: change.operation,
      user: change.data?.email,
      action: change.data?.action,
      success: change.data?.success,
      timestamp: change.timestamp
    });
  }

  async stop() {
    try {
      this.isRunning = false;
      await this.consumer.disconnect();
      logger.info('Database Change Consumer disconnected');
    } catch (error) {
      logger.error('Error stopping Database Change Consumer:', error);
    }
  }
}

// Start the consumer
const consumer = new DatabaseChangeConsumer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received - shutting down consumer gracefully');
  await consumer.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received - shutting down consumer gracefully');
  await consumer.stop();
  process.exit(0);
});

// Start the consumer
consumer.start().catch(error => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});