const fetch = require('node-fetch');

class Database {
  constructor() {
    this.binId = process.env.JSONBIN_BIN_ID;
    this.apiKey = process.env.JSONBIN_API_KEY;
    this.baseURL = 'https://api.jsonbin.io/v3/b';
  }

  async readDB() {
    // ... (code đầy đủ từ trước)
  }

  async writeDB(data) {
    // ... (code đầy đủ từ trước)
  }

  async getOrCreateClient(clientId) {
    // ... (code đầy đủ từ trước)
  }

  async updateClient(clientId, updates) {
    // ... (code đầy đủ từ trước)
  }

  async incrementUsage(clientId) {
    // ... (code đầy đủ từ trước)
  }

  async activatePackage(clientId, packageType = 'basic') {
    // ... (code đầy đủ từ trước)
  }

  async saveMoMoTransaction(orderId, transactionData) {
    // ... (code đầy đủ từ trước)
  }

  async updateMoMoTransaction(orderId, updates) {
    // ... (code đầy đủ từ trước)
  }

  async getMoMoTransaction(orderId) {
    // ... (code đầy đủ từ trước)
  }

  async saveMindmap(clientId, mindmapData) {
    // ... (code đầy đủ từ trước)
  }

  async getMindmap(mindmapId) {
    // ... (code đầy đủ từ trước)
  }

  async getClientMindmaps(clientId) {
    // ... (code đầy đủ từ trước)
  }
}

module.exports = new Database();
