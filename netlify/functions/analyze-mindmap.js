const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Xử lý CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Xử lý preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    // Gọi OpenAI API
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
            content: `Bạn là AI chuyên tạo sơ đồ tư duy. Hãy phân tích văn bản và trả về JSON với cấu trúc:
            {
              "centralTopic": "Chủ đề trung tâm",
              "mainBranches": [
                {
                  "title": "Tên nhánh chính",
                  "subTopics": ["Ý phụ 1", "Ý phụ 2"]
                }
              ]
            }
            Chỉ trả về JSON, không thêm text nào khác.`
          },
          {
            role: 'user',
            content: `Hãy tạo sơ đồ tư duy từ văn bản sau: ${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    // Xử lý response từ OpenAI
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      
      // Try to parse JSON from AI response
      try {
        // Tìm JSON trong response (AI có thể thêm text ngoài JSON)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mindmapData = JSON.parse(jsonMatch[0]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mindmapData)
          };
        } else {
          // Fallback nếu không tìm thấy JSON
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              centralTopic: "Chủ đề chính",
              mainBranches: [
                { title: "Nhánh 1", subTopics: ["Ý phụ 1", "Ý phụ 2"] },
                { title: "Nhánh 2", subTopics: ["Ý phụ 3", "Ý phụ 4"] }
              ]
            })
          };
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        // Fallback data
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            centralTopic: "Chủ đề chính từ văn bản",
            mainBranches: [
              { title: "Phân tích chính", subTopics: ["Điểm quan trọng 1", "Điểm quan trọng 2"] },
              { title: "Ứng dụng", subTopics: ["Cách sử dụng", "Lợi ích"] }
            ]
          })
        };
      }
    } else {
      throw new Error('Invalid response format from OpenAI');
    }

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    };
  }
};
