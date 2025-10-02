const db = require('./db.js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'POST') {
    try {
      const { mindmapId } = JSON.parse(event.body);
      
      if (!mindmapId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mindmap ID is required' }) };
      }

      const mindmap = await db.getMindmap(mindmapId);
      
      if (!mindmap) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Mindmap not found' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mindmap)
      };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
