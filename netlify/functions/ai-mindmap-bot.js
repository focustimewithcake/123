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
  }

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    const cleanedText = this.cleanText(text);
    const analysis = this.analyzeText(cleanedText);
    const mindmap = this.createMindMapStructure(analysis, style, complexity);
    
    return mindmap;
  }

  cleanText(text) {
    if (!text) return '';
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
    const topics = this.extractMainTopics(sentences, keywords);
    
    return {
      sentences,
      words,
      wordFreq,
      keywords,
      topics,
      totalSentences: sentences.length,
      totalWords: words.length
    };
  }

  splitSentences(text) {
    if (!text) return [];
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 200);
  }

  extractWords(text) {
    if (!text) return [];
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
    if (totalWords === 0) return [];
    
    return Object.entries(wordFreq)
      .map(([word, count]) => ({
        word,
        frequency: count,
        score: count / totalWords
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.word);
  }

  // PHƯƠNG PHÁP MỚI: Trích xuất chủ đề chính từ câu
  extractMainTopics(sentences, keywords) {
    const topics = [];
    
    // Tìm các câu chứa từ khóa quan trọng
    keywords.forEach(keyword => {
      const relatedSentences = sentences.filter(sentence =>
        sentence.toLowerCase().includes(keyword)
      ).slice(0, 2);
      
      if (relatedSentences.length > 0) {
        topics.push({
          keyword: keyword,
          sentences: relatedSentences
        });
      }
    });
    
    return topics.slice(0, 6); // Giới hạn 6 chủ đề
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
        version: "FREE 2.0"
      }
    };
  }

  determineCentralTopic(analysis) {
    if (!analysis.sentences || analysis.sentences.length === 0) {
      return "Chủ đề chính";
    }
    
    // Tìm câu đầu tiên có ý nghĩa làm chủ đề trung tâm
    let centralTopic = analysis.sentences[0];
    
    // Cố gắng tìm câu tốt hơn nếu câu đầu quá ngắn
    if (centralTopic.length < 20) {
      const longerSentence = analysis.sentences.find(s => s.length >= 20);
      if (longerSentence) centralTopic = longerSentence;
    }
    
    // Giới hạn độ dài
    if (centralTopic.length > 50) {
      centralTopic = centralTopic.substring(0, 50) + '...';
    }
    
    return centralTopic;
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
    
    // Tạo nhánh từ các chủ đề chính
    if (analysis.topics && analysis.topics.length > 0) {
      analysis.topics.slice(0, branchCount).forEach((topic, index) => {
        if (usedKeywords.has(topic.keyword)) return;
        
        const branchTitle = this.createBranchTitle(topic.keyword, style, index);
        const subTopics = this.createSubTopics(topic.sentences, style);
        
        branches.push({
          title: branchTitle,
          subTopics: subTopics.slice(0, 3) // Giới hạn 3 subtopic mỗi nhánh
        });
        
        usedKeywords.add(topic.keyword);
      });
    }
    
    // Thêm nhánh mặc định nếu không đủ
    const styleTemplates = this.getStyleTemplates(style);
    while (branches.length < branchCount) {
      const defaultIndex = branches.length;
      const defaultBranch = styleTemplates[defaultIndex] || styleTemplates[0];
      branches.push({
        title: defaultBranch.title,
        subTopics: defaultBranch.subTopics.slice(0, 3)
      });
    }
    
    return branches;
  }

  getStyleTemplates(style) {
    const templates = {
      'academic': [
        { 
          title: "Khái niệm cốt lõi", 
          subTopics: ["Định nghĩa chính", "Đặc điểm nổi bật", "Nguyên lý hoạt động"] 
        },
        { 
          title: "Phân tích học thuật", 
          subTopics: ["Lý thuyết liên quan", "Nghiên cứu điển hình", "Phương pháp luận"] 
        },
        { 
          title: "Ứng dụng thực tiễn", 
          subTopics: ["Case study", "Bài học kinh nghiệm", "Hướng phát triển"] 
        }
      ],
      'creative': [
        { 
          title: "Ý tưởng sáng tạo", 
          subTopics: ["Góc nhìn mới", "Giải pháp đột phá", "Tư duy đa chiều"] 
        },
        { 
          title: "Ứng dụng thực tế", 
          subTopics: ["Tình huống sử dụng", "Lợi ích cụ thể", "Kết quả mong đợi"] 
        },
        { 
          title: "Phát triển ý tưởng", 
          subTopics: ["Các bước thực hiện", "Nguồn lực cần thiết", "Đo lường kết quả"] 
        }
      ],
      'business': [
        { 
          title: "Chiến lược kinh doanh", 
          subTopics: ["Mục tiêu chiến lược", "Kế hoạch hành động", "Phân tích SWOT"] 
        },
        { 
          title: "Triển khai thực tế", 
          subTopics: ["Các bước thực hiện", "Nguồn lực cần có", "Lộ trình thời gian"] 
        },
        { 
          title: "Đo lường kết quả", 
          subTopics: ["Chỉ số KPI", "Đánh giá hiệu quả", "Điều chỉnh chiến lược"] 
        }
      ],
      'balanced': [
        { 
          title: "Phân tích chính", 
          subTopics: ["Thông tin cốt lõi", "Dữ liệu quan trọng", "Kết luận chính"] 
        },
        { 
          title: "Chi tiết bổ sung", 
          subTopics: ["Thông tin mở rộng", "Ví dụ minh họa", "Dữ liệu hỗ trợ"] 
        },
        { 
          title: "Ứng dụng thực tế", 
          subTopics: ["Tình huống áp dụng", "Lợi ích thực tế", "Hướng dẫn thực hiện"] 
        }
      ]
    };
    
    return templates[style] || templates.balanced;
  }

  createBranchTitle(keyword, style, index) {
    const prefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Lý thuyết'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Ứng dụng']
    };
    
    const prefixList = prefixes[style] || prefixes.balanced;
    const prefix = prefixList[index % prefixList.length];
    
    return `${prefix} ${this.capitalizeFirst(keyword)}`;
  }

  createSubTopics(sentences, style) {
    if (!sentences || sentences.length === 0) {
      return this.getDefaultSubTopics(style);
    }
    
    return sentences
      .map(sentence => {
        // Làm sạch và giới hạn độ dài câu
        let cleanSentence = sentence.trim();
        if (cleanSentence.length > 60) {
          cleanSentence = cleanSentence.substring(0, 60) + '...';
        }
        
        return cleanSentence;
      })
      .filter(sentence => sentence.length > 10); // Chỉ lấy câu có ý nghĩa
  }

  getDefaultSubTopics(style) {
    const defaults = {
      'academic': ["Thông tin học thuật", "Dữ liệu nghiên cứu", "Kết quả phân tích"],
      'creative': ["Chi tiết sáng tạo", "Ứng dụng thực tế", "Phát triển ý tưởng"],
      'business': ["Thông tin kinh doanh", "Chiến lược phát triển", "Kết quả dự kiến"],
      'balanced': ["Thông tin chi tiết", "Ví dụ minh họa", "Ứng dụng thực tế"]
    };
    
    return defaults[style] || defaults.balanced;
  }

  calculateConfidence(analysis) {
    if (!analysis) return 0.5;
    
    const sentenceCount = analysis.totalSentences || 0;
    const wordCount = analysis.totalWords || 0;
    const keywordCount = (analysis.keywords && analysis.keywords.length) || 0;
    
    let confidence = 0;
    
    if (sentenceCount >= 3) confidence += 0.3;
    if (sentenceCount >= 5) confidence += 0.2;
    if (wordCount >= 50) confidence += 0.3;
    if (keywordCount >= 3) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  capitalizeFirst(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
};

// Export function chính
exports.handler = async (event) => {
  console.log('=== FREE AI MIND MAP BOT STARTED ===');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
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

    const { text, style = 'balanced', complexity = 'medium' } = parsedBody;

    if (!text || text.trim().length === 0) {
      console.log('Empty text received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    // Giới hạn 1500 chữ
    const processedText = text.length > 1500 ? text.substring(0, 1500) : text;
    
    console.log('🤖 FREE AI Bot processing text length:', processedText.length);
    
    // Khởi tạo và chạy AI Bot
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ FREE AI Bot completed successfully');
    console.log('Generated mind map structure:', {
      centralTopic: mindmapData.centralTopic,
      branchCount: mindmapData.mainBranches.length,
      analysis: mindmapData.analysis
    });
    
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
