// netlify/functions/auth.js
const db = require('./db.js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { action, username, password, email } = JSON.parse(event.body);

      if (!action || !username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
      }

      if (action === 'register') {
        if (!password) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password is required' }) };
        }

        const user = await db.createUser(username, password, email);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Đăng ký thành công!',
            user: {
              username: user.username,
              remainingGenerations: user.remainingGenerations,
              usageCount: user.usageCount
            }
          })
        };

      } else if (action === 'login') {
        if (!password) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password is required' }) };
        }

        const user = await db.authenticateUser(username, password);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Đăng nhập thành công!',
            user: {
              username: user.username,
              remainingGenerations: user.remainingGenerations,
              usageCount: user.usageCount,
              mindmaps: user.mindmaps || []
            }
          })
        };

      } else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
      }

    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
