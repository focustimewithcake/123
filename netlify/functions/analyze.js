

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const formData = JSON.parse(event.body);
  const text = formData.text || "";

  // gọi API AI để phân tích văn bản thành mindmap JSON
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là một AI tạo sơ đồ tư duy. Trả về JSON gồm nodes và edges." },
        { role: "user", content: text }
      ]
    })
  });

  const result = await response.json();

  // ví dụ JSON trả về từ AI
  const mindmapData = {
    nodes: [
      { id: 1, label: "Ý chính" },
      { id: 2, label: "Ý phụ 1" },
      { id: 3, label: "Ý phụ 2" }
    ],
    edges: [
      { from: 1, to: 2 },
      { from: 1, to: 3 }
    ]
  };

  return {
    statusCode: 200,
    body: JSON.stringify(mindmapData)
  };
}
