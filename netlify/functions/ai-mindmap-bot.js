// netlify/functions/ai-mindmap-bot.js
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

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    const cleanedText = this.cleanText(text);
    const analysis = this.analyzeText(cleanedText);
    const mindmap = this.createMindMapStructure(analysis, style, complexity);
    
    return mindmap;
  }

  cleanText(text) {
    return text
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  analyzeText(text) {
    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    const wordFreq = this.calculateWordFrequency(words);
    const keywords = this.extractKeywords(wordFreq);
    const scoredSentences = this.scoreSentences(sentences, wordFreq);
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

  splitSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  }

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

  calculateWordFrequency(words) {
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
  }

  extractKeywords(wordFreq) {
    const totalWords = Object.values(wordFreq).reduce((a, b) => a + b, 0);
    
    return Object.entries(wordFreq)
      .map(([word, count]) => ({
        word,
        frequency: count,
        score: count / totalWords
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.word);
  }

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
      
      score *= Math.log(sentenceWords.length + 1);
      
      return {
        text: sentence.trim(),
        score: score,
        wordCount: sentenceWords.length
      };
    }).sort((a, b) => b.score - a.score);
  }

  groupSentencesByTopic(scoredSentences, keywords) {
    const topics = {};
    
    keywords.forEach(keyword => {
      const relatedSentences = scoredSentences.filter(sentence =>
        sentence.text.toLowerCase().includes(keyword)
      ).slice(0, 3);
      
      if (relatedSentences.length > 0) {
        topics[keyword] = relatedSentences.map(s => s.text);
      }
    });
    
    return topics;
  }

  createMindMapStructure(analysis, style, complexity) {
    const centralTopic = this.determineCentralTopic(analysis);
    const branchCount = this.getBranchCount(complexity);
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
        version: "FREE 1.0"
      }
    };
  }

  determineCentralTopic(analysis) {
    const firstSentence = analysis.sentences[0];
    let centralTopic = firstSentence;
    
    if (centralTopic.length > 60) {
      centralTopic = centralTopic.substring(0, 60) + '...';
    }
    
    return centralTopic || "Chủ đề chính";
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

  createMainBranches(analysis, branchCount, style) {
    const branches = [];
    const usedKeywords = new Set();
    const styleTemplates = this.getStyleTemplates(style);
    
    analysis.keywords.slice(0, branchCount * 2).forEach((keyword, index) => {
      if (branches.length >= branchCount) return;
      if (usedKeywords.has(keyword)) return;
      
      const relatedSentences = analysis.topics[keyword] || [];
      if (relatedSentences.length === 0) return;
      
      const branchTitle = this.createBranchTitle(keyword, style, index);
      const subTopics = this.createSubTopics(relatedSentences, style);
      
      branches.push({
        title: branchTitle,
        subTopics: subTopics
      });
      
      usedKeywords.add(keyword);
    });
    
    while (branches.length < branchCount) {
      const defaultBranch = styleTemplates[branches.length] || styleTemplates[0];
      branches.push({
        title: defaultBranch.title,
        subTopics: defaultBranch.subTopics
      });
    }
    
    return branches;
  }

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

  createSubTopics(sentences, style) {
    return sentences
      .slice(0, 4)
      .map(sentence => {
        if (sentence.length > 80) {
          sentence = sentence.substring(0, 80) + '...';
        }
        
        if (style === 'creative') {
          const emojis = ['🌟', '💫', '🔥', '⚡'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          return `${randomEmoji} ${sentence}`;
        }
        
        return sentence;
      });
  }

  calculateConfidence(analysis) {
    const sentenceCount = analysis.totalSentences;
    const wordCount = analysis.totalWords;
    const keywordCount = analysis.keywords.length;
    
    let confidence = 0;
    
    if (sentenceCount >= 3) confidence += 0.3;
    if (sentenceCount >= 5) confidence += 0.2;
    if (wordCount >= 50) confidence += 0.3;
    if (keywordCount >= 5) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  capitalizeFirst(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
}

// Export function chính
exports.handler = async (event) => {
  console.log('=== FREE AI MIND MAP BOT STARTED ===');
  
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

    // Giới hạn 1500 chữ
    const processedText = text.length > 1500 ? text.substring(0, 1500) : text;
    
    console.log('🤖 FREE AI Bot processing text length:', processedText.length);
    
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ FREE AI Bot completed successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ FREE AI Bot error:', error);
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
