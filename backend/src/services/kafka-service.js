const kafka = require('kafkajs');

class KafkaService {
  constructor() {
    this.kafka = kafka({
      clientId: 'sre-backend',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:29092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'backend-group' });
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      console.log('Connected to Kafka');
      
      await this.consumer.subscribe({ topic: 'user-activities' });
      await this.consumer.subscribe({ topic: 'audit-logs' });
      await this.consumer.subscribe({ topic: 'database-changes' });
      
      await this.startConsuming();
      
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
      this.isConnected = false;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('Disconnected from Kafka');
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
    }
  }

  async publishUserActivity(email, activityType, activityData = null) {
    if (!this.isConnected) return;

    try {
      await this.producer.send({
        topic: 'user-activities',
        messages: [{
          key: email,
          value: JSON.stringify({
            email,
            activityType,
            activityData,
            timestamp: new Date().toISOString()
          })
        }]
      });
    } catch (error) {
      console.error('Failed to publish user activity:', error);
    }
  }

  async publishAuditLog(email, action, ipAddress, userAgent, success = true, errorMessage = null) {
    if (!this.isConnected) return;

    try {
      await this.producer.send({
        topic: 'audit-logs',
        messages: [{
          key: email || 'anonymous',
          value: JSON.stringify({
            email,
            action,
            ipAddress,
            userAgent,
            success,
            errorMessage,
            timestamp: new Date().toISOString()
          })
        }]
      });
    } catch (error) {
      console.error('Failed to publish audit log:', error);
    }
  }

  async startConsuming() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`Received message from ${topic}:`, data);
          
          if (topic === 'user-activities') {
            await this.storeUserActivity(data);
          } else if (topic === 'audit-logs') {
            await this.storeAuditLog(data);
          }
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      }
    });
  }

  async publishDatabaseChange(changeData) {
  if (!this.isConnected) return;

  try {
    await this.producer.send({
      topic: 'database-changes',
      messages: [{
        key: `${changeData.table}-${changeData.operation}`,
        value: JSON.stringify({
          ...changeData,
          timestamp: new Date().toISOString()
        })
      }]
    });
    console.log(`Published database change: ${changeData.operation} on ${changeData.table}`);
  } catch (error) {
    console.error('Failed to publish database change:', error);
  }
}

  async storeUserActivity(data) {
    const pool = require('../models/db');
    try {
      await pool.execute(
        'INSERT INTO user_activities (email, activity_type, activity_data, timestamp) VALUES (?, ?, ?, ?)',
        [data.email, data.activityType, JSON.stringify(data.activityData), new Date(data.timestamp)]
      );
    } catch (error) {
      console.error('Failed to store user activity:', error);
    }
  }

  async storeAuditLog(data) {
    const pool = require('../models/db');
    try {
      await pool.execute(
        'INSERT INTO audit_logs (email, action, ip_address, user_agent, success, error_message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.email, data.action, data.ipAddress, data.userAgent, data.success, data.errorMessage, new Date(data.timestamp)]
      );
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }
}

module.exports = new KafkaService();