document.getElementById("generateBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value;

  // gửi request tới function analyze
  const res = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();

  console.log("AI trả về:", data);

  drawMindmap(data);
});
