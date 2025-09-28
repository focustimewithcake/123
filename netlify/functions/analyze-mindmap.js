const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.log('=== FUNCTION STARTED ===');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Parsing request body...');
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('Body parsed successfully');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { text } = parsedBody;

    if (!text || text.trim().length === 0) {
      console.log('Empty text received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    console.log('Processing text length:', text.length);
    
    // Kiểm tra API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'OpenAI API key is not configured'
        })
      };
    }

    console.log('OpenAI API Key exists, making request...');
    
    // Gọi OpenAI API với timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
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
              content: `Tạo sơ đồ tư duy từ văn bản sau: ${text.substring(0, 2000)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      console.log('OpenAI response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        
        let errorMessage = `OpenAI API error: ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'OpenAI API key không hợp lệ';
        } else if (response.status === 429) {
          errorMessage = 'Quá nhiều request, vui lòng thử lại sau';
        } else if (response.status === 500) {
          errorMessage = 'OpenAI server lỗi, vui lòng thử lại sau';
        }
        
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            error: errorMessage,
            details: errorText
          })
        };
      }

      const data = await response.json();
      console.log('OpenAI response received, choices:', data.choices?.length);
      
      // Process OpenAI response
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        console.log('AI Response content:', aiResponse.substring(0, 200));
        
        // Try to parse JSON from AI response
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const mindmapData = JSON.parse(jsonMatch[0]);
            console.log('JSON parsed successfully');
            
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(mindmapData)
            };
          } else {
            console.log('No JSON found in response, using fallback');
            // Fallback data
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                centralTopic: text.split('.')[0] || "Chủ đề chính",
                mainBranches: [
                  { 
                    title: "Phân tích chính", 
                    subTopics: ["Điểm quan trọng 1", "Điểm quan trọng 2"] 
                  },
                  { 
                    title: "Chi tiết", 
                    subTopics: ["Thông tin bổ sung", "Ứng dụng thực tế"] 
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
                { title: "Ứng dụng", subTopics: ["Lợi ích", "Cách sử dụng"] }
              ]
            })
          };
        }
      } else {
        console.error('Invalid OpenAI response format:', data);
        throw new Error('Invalid response format from OpenAI');
      }

    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - quá thời gian chờ phản hồi từ AI');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
