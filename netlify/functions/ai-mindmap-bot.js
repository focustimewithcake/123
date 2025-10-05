// netlify/functions/ai-mindmap-bot.js
const MindMapAIBot = class {
  constructor() {
    this.vietnameseStopWords = new Set([
      'và', 'của', 'là', 'có', 'được', 'trong', 'ngoài', 'trên', 'dưới', 'với',
      'như', 'theo', 'từ', 'về', 'sau', 'trước', 'khi', 'nếu', 'thì', 'mà',
      'này', 'đó', 'kia', 'ai', 'gì', 'nào', 'sao', 'vì', 'tại', 'do', 'bởi',
      'cho', 'đến', 'lên', 'xuống', 'ra', 'vào', 'ở', 'tại', 'bằng', 'đang',
      'sẽ', 'đã', 'rất', 'quá', 'cũng', 'vẫn', 'cứ', 'chỉ', 'mỗi', 'từng',
      'một', 'hai', 'ba', 'bốn', 'năm', 'mấy', 'nhiều', 'ít', 'các', 'những',
      'mọi', 'toàn', 'cả', 'chính', 'ngay', 'luôn', 'vừa', 'mới', 'đều', 'chưa'
    ]);

    this.MAX_TEXT_LENGTH = 2000;
    this.MAX_SENTENCES = 25;
  }

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản theo flow NLP...');
    
    try {
      const cleanedText = this.cleanText(text);
      const mindmap = this.processWithNLPFlow(cleanedText, style, complexity);
      
      return mindmap;
    } catch (error) {
      console.error('❌ Lỗi trong generateMindMap:', error);
      return this.getFallbackMindMap(text);
    }
  }

  // FLOW NLP HOÀN CHỈNH
  processWithNLPFlow(text, style, complexity) {
    console.log('🔁 Bắt đầu flow NLP...');
    
    // Bước 1: Tách câu và tạo embedding đơn giản
    const sentences = this.splitSentencesWithEmbedding(text);
    console.log('✅ Bước 1 - Sentence Embedding:', sentences.length, 'câu');
    
    // Bước 2: TextRank để chọn ý chính
    const importantSentences = this.textRank(sentences);
    console.log('✅ Bước 2 - TextRank:', importantSentences.length, 'ý chính');
    
    // Bước 3: Viết lại ngắn gọn (T5 đơn giản hóa)
    const summarizedContent = this.simplifiedT5Summarize(importantSentences);
    console.log('✅ Bước 3 - T5 Summarize:', summarizedContent.length, 'ý đã tóm tắt');
    
    // Bước 4: Topic Modeling nhóm chủ đề
    const topics = this.topicModeling(summarizedContent);
    console.log('✅ Bước 4 - Topic Modeling:', topics.length, 'chủ đề');
    
    // Bước 5: Graph Generation tạo sơ đồ
    const mindmap = this.graphGeneration(topics, style, complexity);
    console.log('✅ Bước 5 - Graph Generation: Hoàn thành');
    
    return mindmap;
  }

  // BƯỚC 1: SENTENCE EMBEDDING (ĐƠN GIẢN HÓA)
  splitSentencesWithEmbedding(text) {
    if (!text) return [];
    
    try {
      const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 200)
        .slice(0, this.MAX_SENTENCES);
      
      // Tạo embedding đơn giản: vector TF-IDF đơn giản
      return sentences.map(sentence => ({
        text: sentence,
        embedding: this.createSimpleEmbedding(sentence),
        length: sentence.length,
        words: sentence.split(/\s+/).length
      }));
    } catch (error) {
      console.error('❌ Lỗi sentence embedding:', error);
      return [];
    }
  }

  createSimpleEmbedding(sentence) {
    // Tạo embedding đơn giản dựa trên từ khóa và độ dài
    const words = sentence.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2 && !this.vietnameseStopWords.has(word));
    
    // Tính điểm đơn giản dựa trên số từ quan trọng và độ dài
    const importantWordCount = words.length;
    const lengthScore = Math.min(sentence.length / 100, 1);
    
    return {
      importantWords: importantWordCount,
      lengthScore: lengthScore,
      wordDiversity: new Set(words).size / Math.max(words.length, 1)
    };
  }

  // BƯỚC 2: TEXTRANK ALGORITHM (ĐƠN GIẢN HÓA)
  textRank(sentences) {
    if (!sentences || sentences.length === 0) return [];
    
    try {
      // Xây dựng ma trận tương đồng
      const similarityMatrix = this.buildSimilarityMatrix(sentences);
      
      // Tính điểm TextRank
      const scores = this.calculateTextRankScores(similarityMatrix, sentences);
      
      // Sắp xếp theo điểm số và chọn các câu quan trọng nhất
      const rankedSentences = sentences
        .map((sentence, index) => ({
          ...sentence,
          score: scores[index]
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(8, sentences.length));
      
      return rankedSentences;
    } catch (error) {
      console.error('❌ Lỗi TextRank:', error);
      return sentences.slice(0, 5);
    }
  }

  buildSimilarityMatrix(sentences) {
    const n = sentences.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = this.calculateSentenceSimilarity(
            sentences[i].text, 
            sentences[j].text
          );
        }
      }
    }
    
    return matrix;
  }

  calculateSentenceSimilarity(sentence1, sentence2) {
    const words1 = new Set(sentence1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(sentence2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  calculateTextRankScores(similarityMatrix, sentences, damping = 0.85, iterations = 20) {
    const n = sentences.length;
    let scores = Array(n).fill(1 / n);
    
    for (let iter = 0; iter < iterations; iter++) {
      const newScores = Array(n).fill(0);
      
      for (let i = 0; i < n; i++) {
        let sum = 0;
        
        for (let j = 0; j < n; j++) {
          if (i !== j && similarityMatrix[j].some(val => val > 0)) {
            const denominator = similarityMatrix[j].reduce((a, b) => a + b, 0);
            sum += similarityMatrix[j][i] / denominator * scores[j];
          }
        }
        
        newScores[i] = (1 - damping) / n + damping * sum;
      }
      
      // Chuẩn hóa
      const total = newScores.reduce((a, b) => a + b, 0);
      scores = newScores.map(score => score / total);
    }
    
    return scores;
  }

  // BƯỚC 3: T5 SUMMARIZE (ĐƠN GIẢN HÓA)
  simplifiedT5Summarize(importantSentences) {
    if (!importantSentences || importantSentences.length === 0) return [];
    
    try {
      return importantSentences.map(sentence => ({
        original: sentence.text,
        summarized: this.summarizeSentence(sentence.text),
        score: sentence.score
      }));
    } catch (error) {
      console.error('❌ Lỗi T5 summarize:', error);
      return importantSentences.map(s => ({ original: s.text, summarized: s.text, score: s.score }));
    }
  }

  summarizeSentence(sentence) {
    // Thuật toán tóm tắt đơn giản: giữ lại các từ quan trọng, loại bỏ từ dư thừa
    const words = sentence.split(/\s+/);
    
    // Loại bỏ từ dừng và từ ngắn
    const importantWords = words.filter(word => 
      word.length > 3 && !this.vietnameseStopWords.has(word.toLowerCase())
    );
    
    // Giới hạn độ dài
    if (importantWords.length <= 8) {
      return importantWords.join(' ');
    }
    
    // Giữ lại 6-8 từ quan trọng nhất (dựa trên vị trí và độ dài)
    const keepCount = Math.min(8, Math.max(6, importantWords.length));
    return importantWords.slice(0, keepCount).join(' ') + (importantWords.length > keepCount ? '...' : '');
  }

  // BƯỚC 4: TOPIC MODELING (ĐƠN GIẢN HÓA)
  topicModeling(summarizedContent) {
    if (!summarizedContent || summarizedContent.length === 0) return [];
    
    try {
      // Phân nhóm các câu đã tóm tắt thành chủ đề
      const clusters = this.clusterSentences(summarizedContent);
      
      // Tạo tên chủ đề từ các cụm
      const topics = clusters.map((cluster, index) => ({
        id: index,
        name: this.generateTopicName(cluster),
        sentences: cluster,
        size: cluster.length
      }));
      
      return topics.sort((a, b) => b.size - a.size).slice(0, 5);
    } catch (error) {
      console.error('❌ Lỗi topic modeling:', error);
      return [];
    }
  }

  clusterSentences(summarizedContent) {
    const clusters = [];
    const used = new Set();
    
    // Sử dụng thuật toán gom cụm đơn giản dựa trên độ tương đồng
    summarizedContent.forEach((item, index) => {
      if (used.has(index)) return;
      
      const cluster = [item];
      used.add(index);
      
      // Tìm các câu tương tự
      summarizedContent.forEach((otherItem, otherIndex) => {
        if (!used.has(otherIndex) && otherIndex !== index) {
          const similarity = this.calculateSentenceSimilarity(
            item.summarized, 
            otherItem.summarized
          );
          
          if (similarity > 0.3) {
            cluster.push(otherItem);
            used.add(otherIndex);
          }
        }
      });
      
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    });
    
    return clusters;
  }

  generateTopicName(cluster) {
    if (!cluster || cluster.length === 0) return "Chủ đề";
    
    // Tìm từ phổ biến nhất trong cụm
    const wordFrequency = new Map();
    
    cluster.forEach(item => {
      const words = item.summarized.split(/\s+/).filter(word => 
        word.length > 3 && !this.vietnameseStopWords.has(word.toLowerCase())
      );
      
      words.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });
    
    // Chọn 2-3 từ phổ biến nhất
    const topWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    return topWords.length > 0 ? topWords.join(' ') : "Thông tin quan trọng";
  }

  // BƯỚC 5: GRAPH GENERATION
  graphGeneration(topics, style, complexity) {
    try {
      // Chủ đề trung tâm là chủ đề lớn nhất
      const centralTopic = topics.length > 0 ? 
        this.formatCentralTopic(topics[0].name) : "Nội dung chính";
      
      // Tạo các nhánh chính từ các chủ đề
      const mainBranches = this.createMainBranches(topics, style, complexity);
      
      const result = {
        centralTopic,
        mainBranches,
        analysis: {
          totalTopics: topics.length,
          totalSentences: topics.reduce((sum, topic) => sum + topic.sentences.length, 0),
          algorithm: "NLP Flow (TextRank + Topic Modeling)",
          confidence: this.calculateNLPConfidence(topics)
        },
        metadata: {
          generatedBy: "AI Mind Map Bot 🤖 (NLP Flow)",
          style: style,
          complexity: complexity,
          timestamp: new Date().toISOString(),
          version: "NLP-FLOW 1.0"
        }
      };
      
      return result;
    } catch (error) {
      console.error('❌ Lỗi graph generation:', error);
      return this.getFallbackMindMap();
    }
  }

  formatCentralTopic(topicName) {
    if (!topicName) return "Nội dung chính";
    
    // Đảm bảo chủ đề trung tâm không quá dài
    if (topicName.length > 40) {
      const words = topicName.split(/\s+/);
      return words.slice(0, 4).join(' ') + '...';
    }
    
    return this.capitalizeFirst(topicName);
  }

  createMainBranches(topics, style, complexity) {
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    
    // Bỏ qua chủ đề đầu tiên (đã dùng làm trung tâm)
    const remainingTopics = topics.slice(1, branchCount + 1);
    
    remainingTopics.forEach((topic, index) => {
      const branch = this.createBranch(topic, index, style);
      if (branch) {
        branches.push(branch);
      }
    });
    
    // Đảm bảo có ít nhất 2 nhánh
    if (branches.length < 2 && topics.length > 0) {
      const additionalTopics = ['Phân tích', 'Ứng dụng', 'Chi tiết'];
      while (branches.length < 2) {
        const topicName = additionalTopics[branches.length] || `Nhánh ${branches.length + 1}`;
        branches.push({
          title: this.formatBranchTitle(topicName, style, branches.length),
          subTopics: ['Thông tin quan trọng', 'Nội dung chi tiết']
        });
      }
    }
    
    return branches;
  }

  createBranch(topic, index, style) {
    if (!topic || !topic.sentences) return null;
    
    try {
      // Lấy các câu quan trọng nhất trong chủ đề làm subtopics
      const subTopics = topic.sentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(item => this.cleanSubTopic(item.summarized))
        .filter(topic => topic && topic.length > 5);
      
      if (subTopics.length === 0) return null;
      
      return {
        title: this.formatBranchTitle(topic.name, style, index),
        subTopics: subTopics
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch:', error);
      return null;
    }
  }

  formatBranchTitle(topicName, style, index) {
    const stylePrefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng', 'Thảo luận'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo', 'Đổi mới'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai', 'Phát triển'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Quan điểm', 'Vấn đề']
    };
    
    const prefixes = stylePrefixes[style] || stylePrefixes.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    // Giới hạn độ dài tên chủ đề
    let cleanTopicName = topicName;
    if (cleanTopicName.length > 25) {
      const words = cleanTopicName.split(/\s+/);
      cleanTopicName = words.slice(0, 3).join(' ') + '...';
    }
    
    return `${prefix}: ${cleanTopicName}`;
  }

  cleanSubTopic(text) {
    if (!text) return null;
    
    try {
      let cleanText = text.trim();
      
      // Loại bỏ từ nối ở đầu
      cleanText = cleanText.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|có thể|được|là|của|trong)\s+/i, '');
      
      // Giới hạn độ dài
      if (cleanText.length > 60) {
        const words = cleanText.split(/\s+/);
        const keepWords = Math.min(8, words.length);
        cleanText = words.slice(0, keepWords).join(' ') + '...';
      }
      
      return cleanText.length >= 8 ? cleanText : null;
    } catch (error) {
      return text;
    }
  }

  calculateNLPConfidence(topics) {
    if (!topics || topics.length === 0) return 0.3;
    
    let confidence = 0;
    
    // Điểm cho số lượng chủ đề
    if (topics.length >= 2) confidence += 0.3;
    if (topics.length >= 3) confidence += 0.2;
    
    // Điểm cho kích thước chủ đề
    const totalSentences = topics.reduce((sum, topic) => sum + topic.sentences.length, 0);
    if (totalSentences >= 5) confidence += 0.3;
    if (totalSentences >= 8) confidence += 0.2;
    
    return Math.min(confidence, 0.9);
  }

  getBranchCount(complexity) {
    const counts = {
      'simple': 2,
      'medium': 3,
      'detailed': 4,
      'comprehensive': 5
    };
    return counts[complexity] || 3;
  }

  cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    const limitedText = text.length > this.MAX_TEXT_LENGTH 
      ? text.substring(0, this.MAX_TEXT_LENGTH) + '...'
      : text;
    
    return limitedText
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ.,!?;:()-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  getFallbackMindMap(text = '') {
    const centralTopic = text ? this.formatCentralTopic(text.substring(0, 50)) : "Nội dung chính";
    
    return {
      centralTopic,
      mainBranches: [
        {
          title: "Thông tin chính",
          subTopics: ["Nội dung quan trọng 1", "Nội dung quan trọng 2"]
        },
        {
          title: "Chi tiết bổ sung", 
          subTopics: ["Thông tin bổ sung 1", "Thông tin bổ sung 2"]
        }
      ],
      analysis: {
        totalTopics: 0,
        totalSentences: 0,
        algorithm: "Fallback Mode",
        confidence: 0.5
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖 (Fallback Mode)",
        style: "balanced",
        complexity: "medium",
        timestamp: new Date().toISOString(),
        version: "FALLBACK-NLP"
      }
    };
  }
};

// Export function
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - NLP FLOW VERSION ===');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

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
    console.log('📥 Nhận dữ liệu từ người dùng...');
    
    let parsedBody;
    try {
      parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          message: parseError.message 
        })
      };
    }

    const { text, style = 'balanced', complexity = 'medium' } = parsedBody || {};

    if (!text || text.trim().length === 0) {
      console.log('❌ Empty text received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    const processedText = text.length > 2000 ? text.substring(0, 2000) : text;
    
    console.log('🤖 AI Bot xử lý văn bản với NLP Flow, độ dài:', processedText.length);
    
    const aiBot = new MindMapAIBot();
    
    const mindmapPromise = aiBot.generateMindMap(processedText, style, complexity);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), 10000);
    });

    const mindmapData = await Promise.race([mindmapPromise, timeoutPromise]);
    
    console.log('✅ AI Bot hoàn thành NLP Flow');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ AI Bot lỗi:', error);
    
    const aiBot = new MindMapAIBot();
    const fallbackResponse = aiBot.getFallbackMindMap();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackResponse)
    };
  }
};
