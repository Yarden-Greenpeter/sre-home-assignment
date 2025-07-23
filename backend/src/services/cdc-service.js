const pool = require('../models/db');
const kafkaService = require('kafka-service');
const { logDatabaseChange } = require('../utils/logger');

class CDCService {
  constructor() {
    this.isRunning = false;
    this.lastTimestamp = new Date();
  }

  async start() {
    this.isRunning = true;
    console.log('CDC Service started - monitoring database changes...');
    
    // Since TiDB doesn't have built-in CDC like some databases,
    // we'll implement a polling-based approach for demo purposes
    this.pollForChanges();
  }

  async stop() {
    this.isRunning = false;
    console.log('CDC Service stopped');
  }

  async pollForChanges() {
    while (this.isRunning) {
      try {
        // Check for new user registrations
        await this.checkUserChanges();
        
        // Check for new activities
        await this.checkActivityChanges();
        
        // Check for new audit logs
        await this.checkAuditLogChanges();
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error('CDC polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  async checkUserChanges() {
    try {
      const [rows] = await pool.execute(
        'SELECT email, created_at FROM users WHERE created_at > ? ORDER BY created_at',
        [this.lastTimestamp]
      );

      for (const user of rows) {
        const changeData = {
          operation: 'INSERT',
          table: 'users',
          data: { email: user.email },
          timestamp: user.created_at
        };

        // Log to console in structured format
        logDatabaseChange('INSERT', 'users', { email: user.email });
        
        // Send to Kafka
        await kafkaService.publishDatabaseChange(changeData);
        
        this.lastTimestamp = new Date(Math.max(this.lastTimestamp, new Date(user.created_at)));
      }
    } catch (error) {
      console.error('Error checking user changes:', error);
    }
  }

  async checkActivityChanges() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user_activities WHERE timestamp > ? ORDER BY timestamp',
        [this.lastTimestamp]
      );

      for (const activity of rows) {
        const changeData = {
          operation: 'INSERT',
          table: 'user_activities',
          data: {
            email: activity.email,
            activity_type: activity.activity_type,
            activity_data: activity.activity_data
          },
          timestamp: activity.timestamp
        };

        // Log to console in structured format
        logDatabaseChange('INSERT', 'user_activities', changeData.data, activity.email);
        
        // Send to Kafka
        await kafkaService.publishDatabaseChange(changeData);
        
        this.lastTimestamp = new Date(Math.max(this.lastTimestamp, new Date(activity.timestamp)));
      }
    } catch (error) {
      console.error('Error checking activity changes:', error);
    }
  }

  async checkAuditLogChanges() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM audit_logs WHERE timestamp > ? ORDER BY timestamp',
        [this.lastTimestamp]
      );

      for (const log of rows) {
        const changeData = {
          operation: 'INSERT',
          table: 'audit_logs',
          data: {
            email: log.email,
            action: log.action,
            ip_address: log.ip_address,
            success: log.success
          },
          timestamp: log.timestamp
        };

        // Log to console in structured format
        logDatabaseChange('INSERT', 'audit_logs', changeData.data, log.email);
        
        // Send to Kafka
        await kafkaService.publishDatabaseChange(changeData);
        
        this.lastTimestamp = new Date(Math.max(this.lastTimestamp, new Date(log.timestamp)));
      }
    } catch (error) {
      console.error('Error checking audit log changes:', error);
    }
  }
}

module.exports = new CDCService();