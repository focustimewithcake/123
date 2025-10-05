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

    // Giới hạn để tránh timeout
    this.MAX_TEXT_LENGTH = 1200;
    this.MAX_SENTENCES = 15;
    this.MAX_KEYPHRASES = 15;
  }

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    try {
      const cleanedText = this.cleanText(text);
      const analysis = this.analyzeText(cleanedText);
      const mindmap = this.createStructuredMindMap(analysis, style, complexity);
      
      return mindmap;
    } catch (error) {
      console.error('❌ Lỗi trong generateMindMap:', error);
      return this.getFallbackMindMap(text);
    }
  }

  cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Giới hạn độ dài văn bản
    const limitedText = text.length > this.MAX_TEXT_LENGTH 
      ? text.substring(0, this.MAX_TEXT_LENGTH) + '...'
      : text;
    
    return limitedText
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  analyzeText(text) {
    console.log('📊 Phân tích cấu trúc văn bản...');
    
    if (!text || text.length < 10) {
      return this.getDefaultAnalysis();
    }

    try {
      const sentences = this.splitMeaningfulSentences(text);
      const paragraphs = this.splitParagraphs(text);
      const keyPhrases = this.extractKeyPhrases(sentences);
      const centralTopic = this.findTrueCentralTopic(sentences, keyPhrases);
      
      console.log('✅ Phân tích hoàn thành:', {
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        keyPhrases: keyPhrases.length
      });
      
      return {
        sentences: sentences.slice(0, this.MAX_SENTENCES),
        paragraphs: paragraphs.slice(0, 5),
        keyPhrases: keyPhrases.slice(0, this.MAX_KEYPHRASES),
        centralTopic,
        totalSentences: Math.min(sentences.length, this.MAX_SENTENCES),
        totalParagraphs: Math.min(paragraphs.length, 5)
      };
    } catch (error) {
      console.error('❌ Lỗi phân tích văn bản:', error);
      return this.getDefaultAnalysis();
    }
  }

  // PHIÊN BẢN TỐI ƯU: Giảm độ phức tạp thuật toán
  findTrueCentralTopic(sentences, keyPhrases) {
    if (!sentences || sentences.length === 0) {
      return "Nội dung chính";
    }

    try {
      // Đơn giản hóa: lấy câu đầu tiên có độ dài phù hợp
      let centralTopic = sentences[0];
      
      // Ưu tiên câu ngắn gọn, rõ nghĩa
      for (let i = 0; i < Math.min(sentences.length, 5); i++) {
        const sentence = sentences[i];
        if (sentence.length >= 15 && sentence.length <= 50) {
          centralTopic = sentence;
          break;
        }
      }

      // Rút gọn thành chủ đề
      const conciseTopic = this.createConciseTopic(centralTopic);
      console.log('🎯 Central topic:', conciseTopic);
      
      return conciseTopic;
    } catch (error) {
      console.error('❌ Lỗi tìm central topic:', error);
      return "Nội dung chính";
    }
  }

  createConciseTopic(sentence) {
    if (!sentence) return "Nội dung chính";
    
    let topic = sentence
      .replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim();
    
    // Giới hạn độ dài
    if (topic.length > 40) {
      const words = topic.split(/\s+/);
      if (words.length > 6) {
        topic = words.slice(0, 5).join(' ') + '...';
      } else {
        topic = topic.substring(0, 37) + '...';
      }
    }
    
    return this.capitalizeFirst(topic);
  }

  splitMeaningfulSentences(text) {
    if (!text) return [];
    
    try {
      return text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10 && s.length < 120)
        .slice(0, this.MAX_SENTENCES);
    } catch (error) {
      console.error('❌ Lỗi split sentences:', error);
      return [text.substring(0, 100)];
    }
  }

  splitParagraphs(text) {
    if (!text) return [];
    
    try {
      return text.split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 20)
        .slice(0, 5);
    } catch (error) {
      console.error('❌ Lỗi split paragraphs:', error);
      return [];
    }
  }

  extractKeyPhrases(sentences) {
    const phrases = new Set();
    
    if (!sentences || sentences.length === 0) {
      return [];
    }

    try {
      // Giới hạn số câu xử lý
      const processedSentences = sentences.slice(0, 10);
      
      processedSentences.forEach(sentence => {
        const words = sentence.split(/\s+/).filter(word => 
          word && word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
        );
        
        // Tạo cụm từ 2-3 từ (giới hạn số lượng)
        for (let i = 0; i < Math.min(words.length - 1, 8); i++) {
          if (i < words.length - 2) {
            const threeWordPhrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
            if (threeWordPhrase.length > 8 && threeWordPhrase.length < 35) {
              phrases.add(threeWordPhrase);
            }
          }
          
          const twoWordPhrase = `${words[i]} ${words[i+1]}`;
          if (twoWordPhrase.length > 5 && twoWordPhrase.length < 25) {
            phrases.add(twoWordPhrase);
          }
          
          // Giới hạn số cụm từ mỗi câu
          if (phrases.size >= this.MAX_KEYPHRASES) break;
        }
      });
      
      return Array.from(phrases).slice(0, this.MAX_KEYPHRASES);
    } catch (error) {
      console.error('❌ Lỗi extract key phrases:', error);
      return [];
    }
  }

  createStructuredMindMap(analysis, style, complexity) {
    console.log('🏗️ Tạo cấu trúc sơ đồ tư duy...');
    
    try {
      const centralTopic = analysis.centralTopic || "Nội dung chính";
      const mainThemes = this.identifyUniqueMainThemes(analysis, centralTopic);
      const structuredBranches = this.createHierarchicalBranches(analysis, mainThemes, complexity, style);
      
      const result = {
        centralTopic,
        mainBranches: structuredBranches,
        analysis: {
          totalSentences: analysis.totalSentences,
          totalParagraphs: analysis.totalParagraphs,
          mainThemes: mainThemes.slice(0, 4),
          confidence: this.calculateConfidence(analysis)
        },
        metadata: {
          generatedBy: "AI Mind Map Bot 🤖",
          style: style,
          complexity: complexity,
          timestamp: new Date().toISOString(),
          version: "OPTIMIZED 1.0"
        }
      };
      
      console.log('✅ Tạo mindmap thành công');
      return result;
    } catch (error) {
      console.error('❌ Lỗi tạo mindmap:', error);
      return this.getFallbackMindMap();
    }
  }

  identifyUniqueMainThemes(analysis, centralTopic) {
    const themes = new Set();
    const centralLower = centralTopic.toLowerCase();
    
    try {
      // Sử dụng các đoạn văn làm chủ đề chính
      if (analysis.paragraphs && analysis.paragraphs.length > 0) {
        analysis.paragraphs.slice(0, 4).forEach(paragraph => {
          const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
          if (firstSentence.length > 15 && !this.isSimilarToCentralTopic(firstSentence, centralLower)) {
            const theme = this.createThemeTitle(firstSentence);
            if (theme) themes.add(theme);
          }
        });
      }
      
      // Bổ sung từ key phrases
      if (analysis.keyPhrases && analysis.keyPhrases.length > 0) {
        analysis.keyPhrases.slice(0, 8).forEach(phrase => {
          if (phrase.length > 8 && !this.isSimilarToCentralTopic(phrase, centralLower)) {
            const theme = this.createThemeTitle(phrase);
            if (theme && themes.size < 6) themes.add(theme);
          }
        });
      }
      
      return Array.from(themes).slice(0, 5);
    } catch (error) {
      console.error('❌ Lỗi identify themes:', error);
      return ['Khía cạnh 1', 'Khía cạnh 2', 'Khía cạnh 3'];
    }
  }

  isSimilarToCentralTopic(text, centralLower) {
    try {
      const textLower = text.toLowerCase();
      const textWords = new Set(textLower.split(/\s+/));
      const centralWords = new Set(centralLower.split(/\s+/));
      
      let commonWords = 0;
      centralWords.forEach(word => {
        if (textWords.has(word) && word.length > 2) {
          commonWords++;
        }
      });
      
      return commonWords >= 2;
    } catch (error) {
      return false;
    }
  }

  createThemeTitle(text) {
    if (!text) return null;
    
    try {
      let title = text.trim();
      title = title.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy)\s+/i, '');
      
      if (title.length > 30) {
        title = title.substring(0, 28) + '...';
      }
      
      return this.capitalizeFirst(title);
    } catch (error) {
      return text;
    }
  }

  createHierarchicalBranches(analysis, mainThemes, complexity, style) {
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    const usedSubTopics = new Set();
    
    try {
      mainThemes.slice(0, branchCount).forEach((theme, index) => {
        const branch = this.createBranchStructure(theme, analysis, index, style, usedSubTopics);
        if (branch && branch.subTopics.length > 0) {
          branches.push(branch);
        }
      });
      
      return branches;
    } catch (error) {
      console.error('❌ Lỗi tạo branches:', error);
      return [{
        title: 'Nội dung chính',
        subTopics: ['Thông tin quan trọng 1', 'Thông tin quan trọng 2']
      }];
    }
  }

  createBranchStructure(theme, analysis, index, style, usedSubTopics) {
    try {
      const branchTitle = this.formatBranchTitle(theme, style, index);
      const subTopics = this.findUniqueSubTopics(theme, analysis, usedSubTopics);
      
      if (subTopics.length === 0) {
        return null;
      }
      
      // Đánh dấu các subtopic đã sử dụng
      subTopics.forEach(topic => {
        if (topic) usedSubTopics.add(topic.toLowerCase());
      });
      
      return {
        title: branchTitle,
        subTopics: subTopics.slice(0, 3) // Giảm số subtopic
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch structure:', error);
      return null;
    }
  }

  findUniqueSubTopics(theme, analysis, usedSubTopics) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    try {
      // Tìm trong sentences
      if (analysis.sentences) {
        analysis.sentences.slice(0, 8).forEach(sentence => {
          if (this.calculateRelevance(sentence.toLowerCase(), themeLower) > 0.3) {
            const cleanSubTopic = this.cleanSubTopic(sentence);
            if (cleanSubTopic && !usedSubTopics.has(cleanSubTopic.toLowerCase())) {
              subTopics.push(cleanSubTopic);
            }
          }
        });
      }
      
      return subTopics.slice(0, 4);
    } catch (error) {
      console.error('❌ Lỗi tìm subtopics:', error);
      return ['Chi tiết quan trọng'];
    }
  }

  formatBranchTitle(theme, style, index) {
    const stylePrefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Quan điểm']
    };
    
    const prefixes = stylePrefixes[style] || stylePrefixes.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix}: ${theme}`;
  }

  calculateRelevance(text, theme) {
    try {
      const textWords = new Set(text.split(/\s+/));
      const themeWords = new Set(theme.split(/\s+/));
      
      let commonWords = 0;
      themeWords.forEach(word => {
        if (textWords.has(word) && word.length > 2) {
          commonWords++;
        }
      });
      
      return commonWords / Math.max(themeWords.size, 1);
    } catch (error) {
      return 0;
    }
  }

  cleanSubTopic(text) {
    if (!text) return null;
    
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/^(có thể|được|là|của|trong)\s+/i, '');
      
      if (cleanText.length > 50) {
        cleanText = cleanText.substring(0, 47) + '...';
      }
      
      if (cleanText.length < 8) {
        return null;
      }
      
      return cleanText;
    } catch (error) {
      return text;
    }
  }

  getBranchCount(complexity) {
    const counts = {
      'simple': 2,
      'medium': 3,
      'detailed': 4,
      'comprehensive': 4 // Giảm xuống để tránh phức tạp
    };
    return counts[complexity] || 3;
  }

  calculateConfidence(analysis) {
    try {
      if (!analysis) return 0.5;
      
      const sentenceCount = analysis.totalSentences || 0;
      const paragraphCount = analysis.totalParagraphs || 0;
      
      let confidence = 0;
      
      if (sentenceCount >= 2) confidence += 0.3;
      if (sentenceCount >= 5) confidence += 0.2;
      if (paragraphCount >= 1) confidence += 0.3;
      if (paragraphCount >= 2) confidence += 0.2;
      
      return Math.min(confidence, 0.9);
    } catch (error) {
      return 0.7;
    }
  }

  capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  getDefaultAnalysis() {
    return {
      sentences: [],
      paragraphs: [],
      keyPhrases: [],
      centralTopic: "Nội dung chính",
      totalSentences: 0,
      totalParagraphs: 0
    };
  }

  getFallbackMindMap(text = '') {
    return {
      centralTopic: text ? this.createConciseTopic(text.substring(0, 50)) : "Nội dung chính",
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
        totalSentences: 0,
        totalParagraphs: 0,
        mainThemes: ["Thông tin chính", "Chi tiết bổ sung"],
        confidence: 0.5
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖 (Fallback Mode)",
        style: "balanced",
        complexity: "medium",
        timestamp: new Date().toISOString(),
        version: "FALLBACK 1.0"
      }
    };
  }
};

// Export function chính với xử lý lỗi chi tiết
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - OPTIMIZED VERSION ===');
  
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

    // Giới hạn text length để tránh timeout
    const processedText = text.length > 1200 ? text.substring(0, 1200) : text;
    
    console.log('🤖 AI Bot xử lý văn bản, độ dài:', processedText.length);
    
    // Khởi tạo và chạy AI Bot với timeout
    const aiBot = new MindMapAIBot();
    
    // Thêm timeout để tránh function chạy quá lâu
    const mindmapPromise = aiBot.generateMindMap(processedText, style, complexity);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), 8000); // 8 seconds timeout
    });

    const mindmapData = await Promise.race([mindmapPromise, timeoutPromise]);
    
    console.log('✅ AI Bot hoàn thành');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ AI Bot lỗi:', error);
    
    // Fallback response
    const aiBot = new MindMapAIBot();
    const fallbackResponse = aiBot.getFallbackMindMap();
    
    return {
      statusCode: 200, // Vẫn trả về 200 với fallback data
      headers,
      body: JSON.stringify(fallbackResponse)
    };
  }
};
