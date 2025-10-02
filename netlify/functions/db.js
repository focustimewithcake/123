// netlify/functions/db.js - CẬP NHẬT
const fetch = require('node-fetch');

class Database {
  constructor() {
    this.binId = process.env.JSONBIN_BIN_ID;
    this.apiKey = process.env.JSONBIN_API_KEY;
    this.baseURL = 'https://api.jsonbin.io/v3/b';
  }

  async readDB() {
    try {
      const response = await fetch(`${this.baseURL}/${this.binId}/latest`, {
        headers: { 
          'X-Master-Key': this.apiKey,
          'X-Bin-Meta': false 
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch database');
      }
      
      const data = await response.json();
      return data || { users: {}, mindmaps: {} };
    } catch (error) {
      console.log('Creating new database...');
      return { users: {}, mindmaps: {} };
    }
  }

  async writeDB(data) {
    try {
      const response = await fetch(`${this.baseURL}/${this.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save database');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving to JSONBin:', error);
      throw error;
    }
  }

  // USER MANAGEMENT
  async createUser(username, password, email = '') {
    const db = await this.readDB();
    
    if (!db.users) db.users = {};
    if (db.users[username]) {
      throw new Error('User already exists');
    }
    
    db.users[username] = {
      username,
      password: this.hashPassword(password), // Simple hash
      email,
      usageCount: 0,
      remainingGenerations: 3, // 3 lần miễn phí
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      mindmaps: [] // Lưu danh sách mindmap IDs
    };
    
    await this.writeDB(db);
    return db.users[username];
  }

  async authenticateUser(username, password) {
    const db = await this.readDB();
    const user = db.users?.[username];
    
    if (!user || user.password !== this.hashPassword(password)) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.writeDB(db);
    
    return user;
  }

  async getUser(username) {
    const db = await this.readDB();
    return db.users?.[username];
  }

  async updateUserUsage(username) {
    const db = await this.readDB();
    const user = db.users[username];
    
    if (user) {
      user.usageCount += 1;
      user.remainingGenerations = Math.max(0, 3 - user.usageCount);
      await this.writeDB(db);
    }
    
    return user;
  }

  // MINDMAP STORAGE
  async saveMindmap(username, mindmapData) {
    const db = await this.readDB();
    const mindmapId = `mm_${username}_${Date.now()}`;
    
    if (!db.mindmaps) db.mindmaps = {};
    
    db.mindmaps[mindmapId] = {
      id: mindmapId,
      username: username,
      data: mindmapData,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Add to user's mindmaps list
    if (!db.users[username].mindmaps) {
      db.users[username].mindmaps = [];
    }
    db.users[username].mindmaps.push(mindmapId);
    
    await this.writeDB(db);
    return mindmapId;
  }

  async getMindmap(mindmapId) {
    const db = await this.readDB();
    return db.mindmaps?.[mindmapId];
  }

  async updateMindmap(mindmapId, mindmapData) {
    const db = await this.readDB();
    
    if (db.mindmaps[mindmapId]) {
      db.mindmaps[mindmapId].data = mindmapData;
      db.mindmaps[mindmapId].lastModified = new Date().toISOString();
      await this.writeDB(db);
    }
    
    return db.mindmaps[mindmapId];
  }

  async getUserMindmaps(username) {
    const db = await this.readDB();
    const user = db.users[username];
    
    if (!user || !user.mindmaps) return [];
    
    return user.mindmaps.map(id => db.mindmaps[id]).filter(Boolean);
  }

  // Simple password hash (for demo - use proper hashing in production)
  hashPassword(password) {
    return password.split('').reverse().join('') + '_hashed';
  }
}

module.exports = new Database();
