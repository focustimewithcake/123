const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 🔍 THÊM LOGGING Ở ĐÂY
  console.log('Event body:', event.body);
  console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
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

    console.log('Processing text length:', text.length);
    
    // Call OpenAI API
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
            content: `Bạn là AI chuyên tạo sơ đồ tư duy. Phân tích văn bản và trả về JSON với cấu trúc:
            {
              "centralTopic": "Chủ đề trung tâm",
              "mainBranches": [
                {
                  "title": "Tên nhánh chính",
                  "subTopics": ["Ý phụ 1", "Ý phụ 2", "Ý phụ 3"]
                }
              ]
            }
            Chỉ trả về JSON, không thêm text nào khác.`
          },
          {
            role: 'user',
            content: `Tạo sơ đồ tư duy từ văn bản sau: ${text.substring(0, 3000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    // 🔍 THÊM LOGGING CHO RESPONSE
    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API data received');
    
    // Process OpenAI response
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;
      console.log('AI Response content:', aiResponse.substring(0, 200) + '...');
      
      // Try to parse JSON from AI response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mindmapData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed mindmap data');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mindmapData)
          };
        } else {
          console.log('No JSON found in AI response, using fallback');
          // Fallback data
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              centralTopic: "Chủ đề chính",
              mainBranches: [
                { 
                  title: "Phân tích chính", 
                  subTopics: ["Điểm quan trọng 1", "Điểm quan trọng 2", "Điểm quan trọng 3"] 
                },
                { 
                  title: "Ứng dụng", 
                  subTopics: ["Cách sử dụng", "Lợi ích", "Ví dụ thực tế"] 
                }
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
            centralTopic: "Chủ đề từ văn bản",
            mainBranches: [
              { title: "Khái niệm", subTopics: ["Định nghĩa", "Đặc điểm"] },
              { title: "Ứng dụng", subTopics: ["Lợi ích", "Cách sử dụng"] },
              { title: "Ví dụ", subTopics: ["Case study", "Best practice"] }
            ]
          })
        };
      }
    } else {
      console.error('Invalid OpenAI response format');
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
