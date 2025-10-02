// netlify/functions/ai-mindmap-bot.js - CẬP NHẬT
const db = require('./db.js');
// ... (giữ nguyên class MindMapAIBot)

exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT STARTED ===');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { text, style = 'balanced', complexity = 'medium', username, saveToAccount = false } = JSON.parse(event.body);

    if (!text || text.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Text parameter is required' }) };
    }

    // Check user usage if username provided
    if (username) {
      const user = await db.getUser(username);
      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
      }
      
      if (user.remainingGenerations <= 0) {
        return {
          statusCode: 402,
          headers,
          body: JSON.stringify({
            error: 'Usage limit exceeded',
            message: 'Bạn đã sử dụng hết 3 lần miễn phí. Vui lòng nâng cấp tài khoản!',
            remaining: 0
          })
        };
      }
    }

    console.log('🤖 AI Bot processing for user:', username);
    
    // Khởi tạo và chạy AI Bot
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(text, style, complexity);
    
    // Update user usage and save mindmap if requested
    let mindmapId = null;
    if (username && saveToAccount) {
      await db.updateUserUsage(username);
      mindmapId = await db.saveMindmap(username, mindmapData);
    }
    
    console.log('✅ AI Bot completed successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...mindmapData,
        usage: username ? {
          remaining: (await db.getUser(username)).remainingGenerations,
          used: (await db.getUser(username)).usageCount
        } : null,
        saved: saveToAccount,
        mindmapId: mindmapId
      })
    };

  } catch (error) {
    console.error('❌ AI Bot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI Bot processing failed',
        message: error.message
      })
    };
  }
};
