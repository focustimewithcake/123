// netlify/functions/analyze-mindmap.js
exports.handler = async (event) => {
  // Chỉ xử lý POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia tạo dàn ý sơ đồ tư duy. Hãy phân tích văn bản và tạo cấu trúc phân cấp hợp lý.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
