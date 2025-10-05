// netlify/functions/ai-mindmap-bot.js
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

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    try {
      const cleanedText = this.cleanText(text);
      const mindmap = this.simpleButEffectiveAnalysis(cleanedText, style, complexity);
      
      return mindmap;
    } catch (error) {
      console.error('❌ Lỗi trong generateMindMap:', error);
      return this.getFallbackMindMap(text);
    }
  }

  // PHƯƠNG PHÁP ĐƠN GIẢN NHƯNG HIỆU QUẢ
  simpleButEffectiveAnalysis(text, style, complexity) {
    console.log('🔍 Phân tích văn bản với phương pháp đơn giản...');
    
    // Bước 1: Tách đoạn văn và câu
    const paragraphs = this.splitParagraphs(text);
    const sentences = this.splitGoodSentences(text);
    
    console.log('📊 Tìm thấy:', paragraphs.length, 'đoạn văn,', sentences.length, 'câu');
    
    // Bước 2: Tìm chủ đề chính từ câu đầu tiên
    const centralTopic = this.findCentralTopic(sentences);
    
    // Bước 3: Tạo các nhánh từ các đoạn văn và câu quan trọng
    const mainBranches = this.createSimpleBranches(paragraphs, sentences, centralTopic, style, complexity);
    
    // Bước 4: Tạo keywords từ nội dung
    const keywords = this.extractSimpleKeywords(sentences);
    
    return {
      centralTopic,
      mainBranches,
      analysis: {
        totalParagraphs: paragraphs.length,
        totalSentences: sentences.length,
        totalWords: text.split(/\s+/).length,
        keywords: keywords.slice(0, 8),
        confidence: this.calculateSimpleConfidence(paragraphs.length, sentences.length),
        method: "Simple Effective Analysis"
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖",
        style: style,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        version: "SIMPLE-EFFECTIVE-1.0"
      }
    };
  }

  // TÁCH ĐOẠN VĂN ĐƠN GIẢN
  splitParagraphs(text) {
    if (!text) return [];
    return text.split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .slice(0, 6);
  }

  // TÁCH CÂU CÓ CHẤT LƯỢNG
  splitGoodSentences(text) {
    if (!text) return [];
    
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => {
        // Chỉ lấy câu có chất lượng: độ dài hợp lý, không quá ngắn/dài
        const length = s.length;
        const wordCount = s.split(/\s+/).length;
        return length >= 15 && length <= 150 && wordCount >= 3 && wordCount <= 25;
      })
      .slice(0, 20);
  }

  // TÌM CHỦ ĐỀ CHÍNH THÔNG MINH
  findCentralTopic(sentences) {
    if (!sentences || sentences.length === 0) return "Nội dung chính";
    
    // Ưu tiên câu đầu tiên có chất lượng
    if (sentences[0] && sentences[0].length >= 20 && sentences[0].length <= 80) {
      return this.shortenTopic(sentences[0]);
    }
    
    // Tìm câu có độ dài phù hợp trong 5 câu đầu
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      const sentence = sentences[i];
      if (sentence.length >= 20 && sentence.length <= 80) {
        return this.shortenTopic(sentence);
      }
    }
    
    // Fallback: câu đầu tiên được rút gọn
    return sentences[0] ? this.shortenTopic(sentences[0]) : "Nội dung chính";
  }

  shortenTopic(topic) {
    if (!topic) return "Nội dung chính";
    
    let shortened = topic
      .replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó|tiếp theo)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim();
    
    // Giới hạn độ dài
    if (shortened.length > 40) {
      const words = shortened.split(/\s+/);
      if (words.length > 6) {
        shortened = words.slice(0, 5).join(' ') + '...';
      } else {
        shortened = shortened.substring(0, 37) + '...';
      }
    }
    
    return this.capitalizeFirst(shortened);
  }

  // TẠO CÁC NHÁNH ĐƠN GIẢN NHƯNG CHẤT LƯỢNG
  createSimpleBranches(paragraphs, sentences, centralTopic, style, complexity) {
    const branches = [];
    const usedContent = new Set();
    const centralLower = centralTopic.toLowerCase();
    
    // Số lượng nhánh dựa trên độ phức tạp
    const branchCount = this.getBranchCount(complexity);
    
    // Chiến lược 1: Sử dụng các đoạn văn đầu tiên làm nhánh chính
    let branchIndex = 0;
    
    for (let i = 0; i < paragraphs.length && branchIndex < branchCount; i++) {
      const paragraph = paragraphs[i];
      const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
      
      if (firstSentence && firstSentence.length > 15 && 
          !this.isTooSimilar(firstSentence, centralLower) &&
          !usedContent.has(firstSentence.toLowerCase())) {
        
        const branch = this.createBranchFromParagraph(paragraph, branchIndex, style, usedContent);
        if (branch && branch.subTopics.length > 0) {
          branches.push(branch);
          branchIndex++;
        }
      }
    }
    
    // Chiến lược 2: Nếu chưa đủ nhánh, sử dụng các câu quan trọng
    if (branches.length < branchCount) {
      for (let i = 0; i < sentences.length && branchIndex < branchCount; i++) {
        const sentence = sentences[i];
        if (sentence.length > 20 && 
            !this.isTooSimilar(sentence, centralLower) &&
            !usedContent.has(sentence.toLowerCase())) {
          
          const branch = this.createBranchFromSentence(sentence, branchIndex, style, usedContent, sentences);
          if (branch && branch.subTopics.length > 0) {
            branches.push(branch);
            branchIndex++;
          }
        }
      }
    }
    
    // Chiến lược 3: Fallback - tạo nhánh mặc định
    while (branches.length < 2) {
      const fallbackThemes = ['Thông tin chính', 'Chi tiết quan trọng', 'Ứng dụng thực tế'];
      const theme = fallbackThemes[branches.length] || `Nhánh ${branches.length + 1}`;
      
      branches.push({
        title: this.formatBranchTitle(theme, style, branches.length),
        subTopics: ['Nội dung quan trọng', 'Thông tin chi tiết']
      });
    }
    
    return branches.slice(0, branchCount);
  }

  createBranchFromParagraph(paragraph, index, style, usedContent) {
    try {
      // Lấy câu đầu làm tiêu đề nhánh
      const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
      const branchTitle = this.formatBranchTitle(this.shortenTopic(firstSentence), style, index);
      
      // Tách các câu trong đoạn làm subtopics
      const sentencesInParagraph = paragraph.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 80)
        .slice(1, 4); // Bỏ câu đầu (đã dùng làm title), lấy 3 câu tiếp theo
      
      const subTopics = sentencesInParagraph
        .map(sentence => this.cleanSubTopic(sentence))
        .filter(topic => topic && !usedContent.has(topic.toLowerCase()))
        .slice(0, 3);
      
      // Đánh dấu nội dung đã sử dụng
      subTopics.forEach(topic => usedContent.add(topic.toLowerCase()));
      usedContent.add(firstSentence.toLowerCase());
      
      return {
        title: branchTitle,
        subTopics: subTopics.length > 0 ? subTopics : ['Thông tin chi tiết']
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch từ paragraph:', error);
      return null;
    }
  }

  createBranchFromSentence(sentence, index, style, usedContent, allSentences) {
    try {
      const branchTitle = this.formatBranchTitle(this.shortenTopic(sentence), style, index);
      
      // Tìm các câu liên quan làm subtopics
      const relatedSentences = this.findRelatedSentences(sentence, allSentences, usedContent);
      
      const subTopics = relatedSentences
        .map(s => this.cleanSubTopic(s))
        .filter(topic => topic)
        .slice(0, 3);
      
      // Đánh dấu nội dung đã sử dụng
      subTopics.forEach(topic => usedContent.add(topic.toLowerCase()));
      usedContent.add(sentence.toLowerCase());
      
      return {
        title: branchTitle,
        subTopics: subTopics.length > 0 ? subTopics : ['Thông tin bổ sung']
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch từ sentence:', error);
      return null;
    }
  }

  findRelatedSentences(mainSentence, allSentences, usedContent) {
    const mainWords = new Set(mainSentence.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const related = [];
    
    for (const sentence of allSentences) {
      if (sentence !== mainSentence && !usedContent.has(sentence.toLowerCase())) {
        const sentenceWords = new Set(sentence.toLowerCase().split(/\s+/));
        let commonWords = 0;
        
        mainWords.forEach(word => {
          if (sentenceWords.has(word)) commonWords++;
        });
        
        if (commonWords >= 1) { // Có ít nhất 1 từ chung
          related.push(sentence);
          if (related.length >= 3) break;
        }
      }
    }
    
    return related;
  }

  isTooSimilar(text, centralLower) {
    const textLower = text.toLowerCase();
    if (textLower === centralLower) return true;
    
    const textWords = new Set(textLower.split(/\s+/).filter(w => w.length > 2));
    const centralWords = new Set(centralLower.split(/\s+/).filter(w => w.length > 2));
    
    let commonWords = 0;
    centralWords.forEach(word => {
      if (textWords.has(word)) commonWords++;
    });
    
    return commonWords >= 2;
  }

  formatBranchTitle(topic, style, index) {
    const stylePrefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Quan điểm']
    };
    
    const prefixes = stylePrefixes[style] || stylePrefixes.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix}: ${topic}`;
  }

  cleanSubTopic(text) {
    if (!text) return null;
    
    try {
      let cleanText = text.trim();
      
      // Loại bỏ từ nối ở đầu
      cleanText = cleanText.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|có thể|được|là|của|trong|về)\s+/i, '');
      
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

  extractSimpleKeywords(sentences) {
    const wordFreq = new Map();
    
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/)
        .filter(word => word.length > 3 && !this.vietnameseStopWords.has(word));
      
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  calculateSimpleConfidence(paragraphCount, sentenceCount) {
    let confidence = 0;
    
    if (paragraphCount >= 1) confidence += 0.3;
    if (paragraphCount >= 2) confidence += 0.2;
    if (sentenceCount >= 5) confidence += 0.3;
    if (sentenceCount >= 10) confidence += 0.2;
    
    return Math.min(confidence, 0.9);
  }

  getBranchCount(complexity) {
    const counts = {
      'simple': 2,
      'medium': 3,
      'detailed': 4,
      'comprehensive': 4
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
    const centralTopic = text ? this.shortenTopic(text.substring(0, 50)) : "Nội dung chính";
    
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
        totalParagraphs: 0,
        totalSentences: 0,
        totalWords: 0,
        keywords: ["thông tin", "nội dung"],
        confidence: 0.5,
        method: "Fallback Mode"
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖 (Fallback Mode)",
        style: "balanced",
        complexity: "medium",
        timestamp: new Date().toISOString(),
        version: "FALLBACK-1.0"
      }
    };
  }
};

// Export function với xử lý lỗi đơn giản
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - SIMPLE EFFECTIVE VERSION ===');
  
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
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { text, style = 'balanced', complexity = 'medium' } = parsedBody || {};

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    const processedText = text.length > 1500 ? text.substring(0, 1500) : text;
    
    console.log('🤖 Xử lý văn bản, độ dài:', processedText.length);
    
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ Hoàn thành phân tích');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ Lỗi:', error);
    
    const aiBot = new MindMapAIBot();
    const fallbackResponse = aiBot.getFallbackMindMap();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackResponse)
    };
  }
};
