function drawMindmap(mindmapData) {
  const container = document.getElementById("mindmap");
  const nodes = new vis.DataSet(mindmapData.nodes);
  const edges = new vis.DataSet(mindmapData.edges);

  const data = { nodes, edges };
  const options = {
    nodes: {
      shape: "circle",
      color: "#2575fc",
      font: { color: "#fff", size: 16 },
    },
    edges: {
      color: { color: "#999" },
      smooth: true,
    },
    physics: {
      enabled: true,
      stabilization: false
    }
  };

  new vis.Network(container, data, options);
}
