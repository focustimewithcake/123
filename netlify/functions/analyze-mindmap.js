const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.log('=== MINDMAP FUNCTION STARTED ===');
  
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
    console.log('Text sample:', text.substring(0, 100));
    
    // Kiểm tra API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to Netlify environment variables.'
        })
      };
    }

    console.log('OpenAI API Key verified, making request...');
    
    // Tạo payload đơn giản và rõ ràng
    const requestPayload = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý tạo sơ đồ tư duy. Hãy phân tích văn bản và trả về KẾT QUẢ DUY NHẤT là một JSON object hợp lệ với cấu trúc sau:

{
  "centralTopic": "chủ đề chính",
  "mainBranches": [
    {
      "title": "tên nhánh 1", 
      "subTopics": ["ý con 1", "ý con 2", "ý con 3"]
    }
  ]
}

CHỈ TRẢ VỀ JSON, KHÔNG thêm bất kỳ text nào khác. Đảm bảo JSON hợp lệ.`
        },
        {
          role: 'user',
          content: `Văn bản cần phân tích: ${text.substring(0, 1500)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    };

    console.log('Sending request to OpenAI...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      console.log('OpenAI response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        
        console.error('OpenAI API error:', response.status, errorData);
        
        let errorMessage = 'Lỗi kết nối AI';
        if (response.status === 401) {
          errorMessage = 'API Key không hợp lệ. Vui lòng kiểm tra OPENAI_API_KEY.';
        } else if (response.status === 429) {
          errorMessage = 'Quá nhiều request. Vui lòng đợi 1 phút rồi thử lại.';
        } else if (response.status === 500) {
          errorMessage = 'Lỗi server AI. Vui lòng thử lại sau.';
        } else if (response.status === 403) {
          errorMessage = 'Truy cập bị từ chối. Kiểm tra API key và billing.';
        }
        
        // Trả về fallback data thay vì lỗi
        console.log('Returning fallback data due to API error');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(generateFallbackMindMap(text))
        };
      }

      const data = await response.json();
      console.log('OpenAI response received successfully');
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        console.log('AI Response:', aiResponse.substring(0, 200));
        
        try {
          // Tìm và parse JSON từ response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const mindmapData = JSON.parse(jsonMatch[0]);
            
            // Validate structure
            if (mindmapData.centralTopic && Array.isArray(mindmapData.mainBranches)) {
              console.log('Valid mindmap data received');
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify(mindmapData)
              };
            } else {
              throw new Error('Invalid JSON structure from AI');
            }
          } else {
            throw new Error('No JSON found in AI response');
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          // Return fallback data
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(generateFallbackMindMap(text))
          };
        }
      } else {
        console.error('Invalid OpenAI response format');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(generateFallbackMindMap(text))
        };
      }

    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        console.log('Request timeout, returning fallback data');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(generateFallbackMindMap(text))
        };
      }
      
      // Return fallback data for any other fetch errors
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(generateFallbackMindMap(text))
      };
    }

  } catch (error) {
    console.error('Unexpected function error:', error);
    // Return fallback data even for unexpected errors
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        centralTopic: "Sơ đồ tư duy",
        mainBranches: [
          {
            title: "Nội dung chính",
            subTopics: ["Thông tin quan trọng", "Chi tiết bổ sung"]
          },
          {
            title: "Phân tích",
            subTopics: ["Điểm nổi bật", "Kết luận"]
          }
        ]
      })
    };
  }
};

// Hàm tạo fallback mindmap data
function generateFallbackMindMap(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = text.split(/\s+/).filter(w => w.length > 3);
  
  return {
    centralTopic: sentences[0]?.substring(0, 60) || "Chủ đề chính",
    mainBranches: [
      {
        title: "Khái niệm cốt lõi",
        subTopics: [
          sentences[1]?.substring(0, 80) || "Định nghĩa chính",
          sentences[2]?.substring(0, 80) || "Đặc điểm nổi bật",
          words.slice(0, 3).join(", ") || "Nội dung quan trọng"
        ]
      },
      {
        title: "Thông tin chi tiết", 
        subTopics: [
          sentences[3]?.substring(0, 80) || "Mô tả chi tiết",
          sentences[4]?.substring(0, 80) || "Thông tin bổ sung",
          "Kết luận và ứng dụng"
        ]
      }
    ]
  };
}
