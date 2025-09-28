const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Xử lý CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing text parameter' })
      };
    }

    // Gọi API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là một AI chuyên tạo sơ đồ tư duy. Hãy phân tích văn bản và trả về một JSON object với cấu trúc sau:
            {
              "centralTopic": "Chủ đề trung tâm",
              "mainBranches": [
                {
                  "title": "Tên nhánh chính",
                  "subTopics": ["Ý phụ 1", "Ý phụ 2", ...]
                },
                ...
              ]
            }
            Hãy đảm bảo rằng:
            - Chủ đề trung tâm là một câu ngắn gọn, xúc tích.
            - Có từ 3 đến 5 nhánh chính.
            - Mỗi nhánh chính có từ 2 đến 4 ý phụ.
            - Chỉ trả về JSON, không thêm bất kỳ văn bản nào khác.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Lấy nội dung từ phản hồi của OpenAI
    const content = data.choices[0].message.content;

    // Cố gắng parse JSON từ nội dung
    let mindmapData;
    try {
      mindmapData = JSON.parse(content);
    } catch (parseError) {
      // Nếu không parse được, tạo một cấu trúc mặc định
      mindmapData = {
        centralTopic: "Chủ đề chính",
        mainBranches: [
          {
            title: "Nhánh 1",
            subTopics: ["Ý phụ 1", "Ý phụ 2"]
          },
          {
            title: "Nhánh 2",
            subTopics: ["Ý phụ 1", "Ý phụ 2"]
          },
          {
            title: "Nhánh 3",
            subTopics: ["Ý phụ 1", "Ý phụ 2"]
          }
        ]
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mindmapData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
