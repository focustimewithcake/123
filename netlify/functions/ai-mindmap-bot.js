// netlify/functions/ai-mindmap-bot.js
/**
 * 🤖 AI Mind Map Bot (Offline Enhanced)
 * Phiên bản cải tiến: Tự phân tích chủ đề, sinh nhánh và subtopic dựa trên TF-IDF đơn giản.
 * Không cần API, chạy hoàn toàn cục bộ.
 */

const MindMapAIBot = class {
  constructor() {
    this.vietnameseStopWords = new Set([
      'và', 'của', 'là', 'có', 'được', 'trong', 'ngoài', 'trên', 'dưới', 'với',
      'như', 'theo', 'từ', 'về', 'sau', 'trước', 'khi', 'nếu', 'thì', 'mà',
      'này', 'đó', 'kia', 'ai', 'gì', 'nào', 'sao', 'vì', 'tại', 'do', 'bởi',
      'cho', 'đến', 'lên', 'xuống', 'ra', 'vào', 'ở', 'tại', 'bằng', 'đang',
      'sẽ', 'đã', 'rất', 'quá', 'cũng', 'vẫn', 'cứ', 'chỉ', 'mỗi', 'từng'
    ]);
    this.MAX_TEXT_LENGTH = 1500;
  }

  /** Tạo sơ đồ tư duy thông minh */
  generateMindMap(text) {
    try {
      const cleaned = this.cleanText(text);
      const sentences = this.splitSentences(cleaned);
      const tfidf = this.computeTFIDF(sentences);
      const ranked = this.rankSentences(tfidf);
      const centralTopic = this.extractCentralTopic(ranked);
      const branches = this.generateBranches(ranked, centralTopic);

      const { nodes, edges } = this.buildGraph(centralTopic, branches);

      return {
        centralTopic,
        nodes,
        edges,
        analysis: {
          totalSentences: sentences.length,
          totalWords: cleaned.split(/\s+/).length,
          keywords: this.extractKeywords(tfidf),
          confidence: Math.min(0.5 + ranked.length / 50, 0.95)
        },
        metadata: {
          generatedBy: "AI Mind Map Bot (Offline Enhanced)",
          version: "2.0-OFFLINE",
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error("❌ Lỗi:", err);
      return this.getFallbackMindMap(text);
    }
  }

  /** Tách câu */
  splitSentences(text) {
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.split(/\s+/).length > 3);
  }

  /** Làm sạch văn bản */
  cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    const limited = text.slice(0, this.MAX_TEXT_LENGTH);
    return limited
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Tính TF-IDF đơn giản */
  computeTFIDF(sentences) {
    const tfidf = [];
    const docCount = sentences.length;
    const wordDocFreq = {};

    // Đếm từ xuất hiện trong mỗi câu
    sentences.forEach((sentence, i) => {
      const words = sentence.toLowerCase().split(/\s+/)
        .filter(w => w.length > 2 && !this.vietnameseStopWords.has(w));

      const wordFreq = {};
      words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);

      Object.keys(wordFreq).forEach(w => {
        wordDocFreq[w] = (wordDocFreq[w] || 0) + 1;
      });

      tfidf.push({ sentence, wordFreq });
    });

    // Tính điểm TF-IDF cho mỗi câu
    tfidf.forEach(item => {
      const tfidfScore = Object.entries(item.wordFreq)
        .map(([word, tf]) => tf * Math.log(docCount / (1 + wordDocFreq[word])))
        .reduce((a, b) => a + b, 0);

      item.score = tfidfScore / (Object.keys(item.wordFreq).length || 1);
    });

    return tfidf;
  }

  /** Xếp hạng câu */
  rankSentences(tfidf) {
    return tfidf
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(tfidf.length, 12)); // Giới hạn 12 câu
  }

  /** Xác định chủ đề trung tâm */
  extractCentralTopic(ranked) {
    if (ranked.length === 0) return "Chủ đề chính";
    const topSentence = ranked[0].sentence;
    return this.shorten(topSentence);
  }

  /** Sinh nhánh từ câu quan trọng */
  generateBranches(ranked, centralTopic) {
    const branches = [];
    for (let i = 1; i < ranked.length; i++) {
      const { sentence } = ranked[i];
      if (sentence.toLowerCase().includes(centralTopic.toLowerCase())) continue;
      const subtopics = this.findRelatedSubtopics(sentence, ranked);
      branches.push({
        title: this.shorten(sentence),
        subTopics: subtopics.slice(0, 3).map(s => this.shorten(s))
      });
    }
    return branches.slice(0, 5);
  }

  /** Tìm câu liên quan làm subtopics */
  findRelatedSubtopics(main, ranked) {
    const mainWords = new Set(main.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const related = [];
    for (const { sentence } of ranked) {
      if (sentence === main) continue;
      const words = new Set(sentence.toLowerCase().split(/\s+/));
      let common = 0;
      mainWords.forEach(w => { if (words.has(w)) common++; });
      if (common >= 2) related.push(sentence);
    }
    return related;
  }

  /** Xây đồ thị nodes + edges */
  buildGraph(centralTopic, branches) {
    const nodes = [{ id: 0, label: centralTopic, type: "central" }];
    const edges = [];
    let id = 1;

    branches.forEach((branch, i) => {
      const branchId = id++;
      nodes.push({ id: branchId, label: branch.title, type: "branch" });
      edges.push({ from: 0, to: branchId });

      branch.subTopics.forEach(sub => {
        const subId = id++;
        nodes.push({ id: subId, label: sub, type: "subtopic" });
        edges.push({ from: branchId, to: subId });
      });
    });

    return { nodes, edges };
  }

  /** Trích từ khóa nổi bật */
  extractKeywords(tfidf) {
    const allWords = {};
    tfidf.forEach(item => {
      for (const w in item.wordFreq) {
        allWords[w] = (allWords[w] || 0) + item.wordFreq[w];
      }
    });

    return Object.entries(allWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);
  }

  /** Rút gọn câu */
  shorten(text) {
    return text.length > 60 ? text.split(/\s+/).slice(0, 10).join(' ') + "..." : text;
  }

  /** Fallback khi lỗi */
  getFallbackMindMap(text) {
    const topic = this.shorten(text || "Nội dung chính");
    return {
      centralTopic: topic,
      nodes: [
        { id: 0, label: topic, type: "central" },
        { id: 1, label: "Ý chính 1", type: "branch" },
        { id: 2, label: "Ý chính 2", type: "branch" }
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 }
      ],
      analysis: { confidence: 0.5 },
      metadata: { version: "Fallback-2.0" }
    };
  }
};

// === Netlify Function handler ===
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 200, headers, body: '' };

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    const { text } = JSON.parse(event.body || '{}');
    if (!text || text.trim().length === 0)
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing text' }) };

    const ai = new MindMapAIBot();
    const result = ai.generateMindMap(text);
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
