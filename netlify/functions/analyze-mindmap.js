// AI Mind Map Bot - Không cần API Key
// Sử dụng thuật toán NLP và heuristic

class MindMapAIBot {
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
  }

  // Phân tích văn bản và tạo sơ đồ tư duy
  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    // Làm sạch và chuẩn hóa văn bản
    const cleanedText = this.cleanText(text);
    
    // Phân tích văn bản
    const analysis = this.analyzeText(cleanedText);
    
    // Tạo sơ đồ tư duy dựa trên style và complexity
    const mindmap = this.createMindMapStructure(analysis, style, complexity);
    
    return mindmap;
  }

  // Làm sạch văn bản
  cleanText(text) {
    return text
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Phân tích văn bản với các thuật toán NLP đơn giản
  analyzeText(text) {
    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    
    // Tính tần suất từ
    const wordFreq = this.calculateWordFrequency(words);
    
    // Xác định từ khóa quan trọng
    const keywords = this.extractKeywords(wordFreq);
    
    // Phân loại câu theo mức độ quan trọng
    const scoredSentences = this.scoreSentences(sentences, wordFreq);
    
    // Nhóm câu theo chủ đề
    const topics = this.groupSentencesByTopic(scoredSentences, keywords);
    
    return {
      sentences,
      words,
      wordFreq,
      keywords,
      scoredSentences,
      topics,
      totalSentences: sentences.length,
      totalWords: words.length
    };
  }

  // Tách câu
  splitSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  }

  // Trích xuất từ
  extractWords(text) {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.vietnameseStopWords.has(word) &&
        !/\d/.test(word)
      );
  }

  // Tính tần suất từ
  calculateWordFrequency(words) {
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
  }

  // Trích xuất từ khóa quan trọng (TF-IDF đơn giản)
  extractKeywords(wordFreq) {
    const totalWords = Object.values(wordFreq).reduce((a, b) => a + b, 0);
    
    return Object.entries(wordFreq)
      .map(([word, count]) => ({
        word,
        frequency: count,
        score: count / totalWords
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // Lấy 15 từ khóa quan trọng nhất
      .map(item => item.word);
  }

  // Đánh giá mức độ quan trọng của câu
  scoreSentences(sentences, wordFreq) {
    const totalFrequency = Object.values(wordFreq).reduce((a, b) => a + b, 0);
    
    return sentences.map(sentence => {
      const sentenceWords = this.extractWords(sentence);
      let score = 0;
      
      sentenceWords.forEach(word => {
        if (wordFreq[word]) {
          score += wordFreq[word] / totalFrequency;
        }
      });
      
      // Ưu tiên câu dài hơn (thường chứa nhiều thông tin)
      score *= Math.log(sentenceWords.length + 1);
      
      return {
        text: sentence.trim(),
        score: score,
        wordCount: sentenceWords.length
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Nhóm câu theo chủ đề
  groupSentencesByTopic(scoredSentences, keywords) {
    const topics = {};
    
    keywords.forEach(keyword => {
      const relatedSentences = scoredSentences.filter(sentence =>
        sentence.text.toLowerCase().includes(keyword)
      ).slice(0, 3); // Lấy tối đa 3 câu liên quan
      
      if (relatedSentences.length > 0) {
        topics[keyword] = relatedSentences.map(s => s.text);
      }
    });
    
    return topics;
  }

  // Tạo cấu trúc sơ đồ tư duy
  createMindMapStructure(analysis, style, complexity) {
    // Xác định chủ đề trung tâm
    const centralTopic = this.determineCentralTopic(analysis);
    
    // Xác định số nhánh dựa trên complexity
    const branchCount = this.getBranchCount(complexity);
    
    // Tạo các nhánh chính
    const mainBranches = this.createMainBranches(analysis, branchCount, style);
    
    return {
      centralTopic,
      mainBranches,
      analysis: {
        totalSentences: analysis.totalSentences,
        totalWords: analysis.totalWords,
        keywords: analysis.keywords.slice(0, 5),
        confidence: this.calculateConfidence(analysis)
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖",
        style: style,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        version: "1.0",
        algorithm: "NLP + Heuristic"
      }
    };
  }

  // Xác định chủ đề trung tâm
  determineCentralTopic(analysis) {
    // Ưu tiên câu đầu tiên và câu có điểm cao
    const firstSentence = analysis.sentences[0];
    const highScoreSentence = analysis.scoredSentences[0];
    
    // Kết hợp từ khóa quan trọng
    const topKeywords = analysis.keywords.slice(0, 3).join(' ');
    
    // Tạo chủ đề trung tâm từ các yếu tố trên
    let centralTopic = firstSentence;
    
    // Nếu câu đầu quá dài, rút gọn
    if (centralTopic.length > 60) {
      centralTopic = centralTopic.substring(0, 60) + '...';
    }
    
    return centralTopic || "Chủ đề chính";
  }

  // Xác định số nhánh theo complexity
  getBranchCount(complexity) {
    const counts = {
      'simple': 2,
      'medium': 3,
      'detailed': 4,
      'comprehensive': 5
    };
    return counts[complexity] || 3;
  }

  // Tạo các nhánh chính
  createMainBranches(analysis, branchCount, style) {
    const branches = [];
    const usedKeywords = new Set();
    
    // Các template nhánh theo style
    const styleTemplates = this.getStyleTemplates(style);
    
    // Tạo nhánh từ các chủ đề chính
    analysis.keywords.slice(0, branchCount * 2).forEach((keyword, index) => {
      if (branches.length >= branchCount) return;
      if (usedKeywords.has(keyword)) return;
      
      const relatedSentences = analysis.topics[keyword] || [];
      if (relatedSentences.length === 0) return;
      
      // Tạo tiêu đề nhánh thông minh
      const branchTitle = this.createBranchTitle(keyword, style, index);
      
      // Tạo subtopics từ các câu liên quan
      const subTopics = this.createSubTopics(relatedSentences, style);
      
      branches.push({
        title: branchTitle,
        subTopics: subTopics
      });
      
      usedKeywords.add(keyword);
    });
    
    // Nếu không đủ nhánh, thêm nhánh mặc định
    while (branches.length < branchCount) {
      const defaultBranch = styleTemplates[branches.length] || styleTemplates[0];
      branches.push({
        title: defaultBranch.title,
        subTopics: defaultBranch.subTopics
      });
    }
    
    return branches;
  }

  // Template theo style
  getStyleTemplates(style) {
    const templates = {
      'academic': [
        { title: "Khái niệm cốt lõi", subTopics: ["Định nghĩa chính", "Đặc điểm nổi bật", "Nguyên lý hoạt động"] },
        { title: "Phân tích học thuật", subTopics: ["Lý thuyết liên quan", "Nghiên cứu điển hình", "Phương pháp luận"] },
        { title: "Ứng dụng thực tiễn", subTopics: ["Case study", "Bài học kinh nghiệm", "Hướng phát triển"] }
      ],
      'creative': [
        { title: "💡 Ý tưởng sáng tạo", subTopics: ["Góc nhìn mới", "Giải pháp đột phá", "Tư duy đa chiều"] },
        { title: "🚀 Ứng dụng thực tế", subTopics: ["Tình huống sử dụng", "Lợi ích cụ thể", "Kết quả mong đợi"] },
        { title: "🎯 Phát triển ý tưởng", subTopics: ["Các bước thực hiện", "Nguồn lực cần thiết", "Đo lường kết quả"] }
      ],
      'business': [
        { title: "Chiến lược kinh doanh", subTopics: ["Mục tiêu chiến lược", "Kế hoạch hành động", "Phân tích SWOT"] },
        { title: "Triển khai thực tế", subTopics: ["Các bước thực hiện", "Nguồn lực cần có", "Lộ trình thời gian"] },
        { title: "Đo lường kết quả", subTopics: ["Chỉ số KPI", "Đánh giá hiệu quả", "Điều chỉnh chiến lược"] }
      ],
      'balanced': [
        { title: "Phân tích chính", subTopics: ["Thông tin cốt lõi", "Dữ liệu quan trọng", "Kết luận chính"] },
        { title: "Chi tiết bổ sung", subTopics: ["Thông tin mở rộng", "Ví dụ minh họa", "Dữ liệu hỗ trợ"] },
        { title: "Ứng dụng thực tế", subTopics: ["Tình huống áp dụng", "Lợi ích thực tế", "Hướng dẫn thực hiện"] }
      ]
    };
    
    return templates[style] || templates.balanced;
  }

  // Tạo tiêu đề nhánh thông minh
  createBranchTitle(keyword, style, index) {
    const prefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Ứng dụng', 'Lý thuyết'],
      'creative': ['💡', '🚀', '🎯', '✨'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Ứng dụng']
    };
    
    const prefixList = prefixes[style] || prefixes.balanced;
    const prefix = prefixList[index % prefixList.length];
    
    return `${prefix} ${this.capitalizeFirst(keyword)}`;
  }

  // Tạo subtopics từ các câu
  createSubTopics(sentences, style) {
    return sentences
      .slice(0, 4) // Lấy tối đa 4 subtopics
      .map(sentence => {
        // Rút gọn câu nếu cần
        if (sentence.length > 80) {
          sentence = sentence.substring(0, 80) + '...';
        }
        
        // Thêm emoji cho creative style
        if (style === 'creative') {
          const emojis = ['🌟', '💫', '🔥', '⚡'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          return `${randomEmoji} ${sentence}`;
        }
        
        return sentence;
      });
  }

  // Tính độ tin cậy của phân tích
  calculateConfidence(analysis) {
    const sentenceCount = analysis.totalSentences;
    const wordCount = analysis.totalWords;
    const keywordCount = analysis.keywords.length;
    
    let confidence = 0;
    
    if (sentenceCount >= 3) confidence += 0.3;
    if (sentenceCount >= 5) confidence += 0.2;
    if (wordCount >= 50) confidence += 0.3;
    if (keywordCount >= 5) confidence += 0.2;
    
    return Math.min(confidence, 0.95); // Max 95%
  }

  // Viết hoa chữ cái đầu
  capitalizeFirst(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}

// Export function chính
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT STARTED ===');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const parsedBody = JSON.parse(event.body);
    const { text, style = 'balanced', complexity = 'medium' } = parsedBody;

    if (!text || text.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Text parameter is required' }) };
    }

    console.log('🤖 AI Bot processing text length:', text.length);
    
    // Khởi tạo và chạy AI Bot
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(text, style, complexity);
    
    console.log('✅ AI Bot completed successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ AI Bot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI Bot processing failed',
        message: error.message
      })
    };
  }
};
