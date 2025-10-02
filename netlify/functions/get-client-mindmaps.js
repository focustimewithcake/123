const db = require('./db.js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-ID',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'POST') {
    try {
      const clientId = event.headers['x-client-id'] || (JSON.parse(event.body)?.clientId);
      
      if (!clientId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Client ID is required' }) };
      }

      const mindmaps = await db.getClientMindmaps(clientId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mindmaps)
      };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
