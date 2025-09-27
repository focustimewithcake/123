document.getElementById("generateBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value;
  const files = document.getElementById("inputImages").files;

  const formData = new FormData();
  formData.append("text", text);
  for (let i = 0; i < files.length && i < 3; i++) {
    formData.append("images", files[i]);
  }

  const res = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  drawMindmap(data); // gọi hàm vẽ sơ đồ
});
