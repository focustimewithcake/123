// netlify/functions/bot-db.js
// Database đơn giản cho AI Bot

class BotDatabase {
  constructor() {
    this.usageStats = {
      totalRequests: 0,
      successfulGenerations: 0,
      averageTextLength: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  async recordUsage(textLength, success = true) {
    this.usageStats.totalRequests++;
    if (success) this.usageStats.successfulGenerations++;
    
    // Cập nhật độ dài văn bản trung bình
    const currentAvg = this.usageStats.averageTextLength;
    const totalTexts = this.usageStats.successfulGenerations;
    this.usageStats.averageTextLength = 
      (currentAvg * (totalTexts - 1) + textLength) / totalTexts;
    
    this.usageStats.lastUpdated = new Date().toISOString();
    
    return this.usageStats;
  }

  async getStats() {
    return this.usageStats;
  }
}

module.exports = new BotDatabase();
