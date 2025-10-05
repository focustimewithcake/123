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
    
    const limitedText = text.length > this.MAX_TEXT_LENGTH 
      ? text.substring(0, this.MAX_TEXT_LENGTH) + '...'
      : text;
    
    return limitedText
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ.,!?;:()-]/gu, ' ')
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
        totalParagraphs: Math.min(paragraphs.length, 5),
        totalWords: text.split(/\s+/).length
      };
    } catch (error) {
      console.error('❌ Lỗi phân tích văn bản:', error);
      return this.getDefaultAnalysis();
    }
  }

  // THUẬT TOÁN MỚI: Tìm chủ đề trung tâm thông minh hơn
  findTrueCentralTopic(sentences, keyPhrases) {
    if (!sentences || sentences.length === 0) {
      return "Nội dung chính";
    }

    try {
      // Ưu tiên câu đầu tiên có độ dài hợp lý và chứa từ khóa
      let centralTopic = sentences[0];
      let bestScore = 0;

      // Tính điểm cho mỗi câu dựa trên độ dài và từ khóa
      sentences.slice(0, 8).forEach(sentence => {
        let score = 0;
        
        // Điểm cho độ dài lý tưởng (20-60 ký tự)
        if (sentence.length >= 20 && sentence.length <= 60) {
          score += 3;
        }
        
        // Điểm cho việc chứa từ khóa quan trọng
        keyPhrases.slice(0, 5).forEach(phrase => {
          if (sentence.toLowerCase().includes(phrase.toLowerCase())) {
            score += 2;
          }
        });
        
        // Điểm cho vị trí (câu đầu có điểm cao hơn)
        const positionBonus = Math.max(0, 5 - sentences.indexOf(sentence));
        score += positionBonus;

        if (score > bestScore) {
          bestScore = score;
          centralTopic = sentence;
        }
      });

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
      .replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó|tiếp theo)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim();
    
    // Giới hạn độ dài và đảm bảo ý nghĩa
    if (topic.length > 40) {
      const words = topic.split(/\s+/);
      // Giữ lại 4-6 từ đầu để đảm bảo ý nghĩa
      const keepWords = Math.min(Math.max(4, words.length), 6);
      topic = words.slice(0, keepWords).join(' ') + '...';
    }
    
    return this.capitalizeFirst(topic);
  }

  splitMeaningfulSentences(text) {
    if (!text) return [];
    
    try {
      return text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 8 && s.length < 150) // Nới rộng độ dài
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
        .filter(p => p.length > 15)
        .slice(0, 5);
    } catch (error) {
      console.error('❌ Lỗi split paragraphs:', error);
      return [];
    }
  }

  // THUẬT TOÁN MỚI: Trích xuất cụm từ khóa thông minh hơn
  extractKeyPhrases(sentences) {
    const phrases = new Set();
    
    if (!sentences || sentences.length === 0) {
      return [];
    }

    try {
      const processedSentences = sentences.slice(0, 8);
      
      processedSentences.forEach(sentence => {
        const words = sentence.split(/\s+/).filter(word => 
          word && word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
        );
        
        // Tạo cụm từ 2-3 từ, ưu tiên cụm tự nhiên
        for (let i = 0; i < Math.min(words.length - 1, 6); i++) {
          // Cụm 2 từ
          if (i < words.length - 1) {
            const twoWordPhrase = `${words[i]} ${words[i+1]}`;
            if (twoWordPhrase.length >= 6 && twoWordPhrase.length < 25) {
              phrases.add(twoWordPhrase);
            }
          }
          
          // Cụm 3 từ (quan trọng hơn)
          if (i < words.length - 2) {
            const threeWordPhrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
            if (threeWordPhrase.length >= 8 && threeWordPhrase.length < 35) {
              phrases.add(threeWordPhrase);
            }
          }
          
          if (phrases.size >= this.MAX_KEYPHRASES) break;
        }
      });
      
      // Chuyển thành mảng và sắp xếp theo độ dài (ưu tiên cụm dài hơn)
      return Array.from(phrases)
        .sort((a, b) => b.length - a.length)
        .slice(0, this.MAX_KEYPHRASES);
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
          totalWords: analysis.totalWords,
          keywords: analysis.keyPhrases.slice(0, 8),
          confidence: this.calculateConfidence(analysis)
        },
        metadata: {
          generatedBy: "AI Mind Map Bot 🤖",
          style: style,
          complexity: complexity,
          timestamp: new Date().toISOString(),
          version: "OPTIMIZED 2.0"
        }
      };
      
      console.log('✅ Tạo mindmap thành công');
      return result;
    } catch (error) {
      console.error('❌ Lỗi tạo mindmap:', error);
      return this.getFallbackMindMap();
    }
  }

  // THUẬT TOÁN MỚI: Xác định chủ đề chính thông minh hơn
  identifyUniqueMainThemes(analysis, centralTopic) {
    const themes = new Set();
    const centralLower = centralTopic.toLowerCase();
    
    try {
      // Ưu tiên các câu quan trọng không trùng với chủ đề trung tâm
      if (analysis.sentences && analysis.sentences.length > 0) {
        analysis.sentences.slice(0, 8).forEach(sentence => {
          if (sentence.length > 15 && 
              !this.isSimilarToCentralTopic(sentence, centralLower) &&
              this.hasSubstantialContent(sentence)) {
            const theme = this.createThemeTitle(sentence);
            if (theme && !this.isDuplicateTheme(theme, Array.from(themes))) {
              themes.add(theme);
            }
          }
        });
      }
      
      // Bổ sung từ key phrases nếu cần
      if (themes.size < 3 && analysis.keyPhrases) {
        analysis.keyPhrases.slice(0, 6).forEach(phrase => {
          if (phrase.length > 10 && 
              !this.isSimilarToCentralTopic(phrase, centralLower) &&
              !this.isDuplicateTheme(phrase, Array.from(themes))) {
            const theme = this.createThemeTitle(phrase);
            if (theme && themes.size < 5) themes.add(theme);
          }
        });
      }
      
      // Đảm bảo có ít nhất 2 chủ đề
      if (themes.size < 2) {
        themes.add('Phân tích chi tiết');
        themes.add('Ứng dụng thực tế');
      }
      
      return Array.from(themes).slice(0, 4);
    } catch (error) {
      console.error('❌ Lỗi identify themes:', error);
      return ['Khía cạnh chính', 'Phân tích', 'Ứng dụng'];
    }
  }

  hasSubstantialContent(sentence) {
    const words = sentence.split(/\s+/).filter(word => 
      word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
    );
    return words.length >= 3;
  }

  isDuplicateTheme(newTheme, existingThemes) {
    const newLower = newTheme.toLowerCase();
    return existingThemes.some(theme => 
      theme.toLowerCase().includes(newLower) || newLower.includes(theme.toLowerCase())
    );
  }

  isSimilarToCentralTopic(text, centralLower) {
    try {
      const textLower = text.toLowerCase();
      if (textLower === centralLower) return true;
      
      const textWords = new Set(textLower.split(/\s+/).filter(w => w.length > 2));
      const centralWords = new Set(centralLower.split(/\s+/).filter(w => w.length > 2));
      
      let commonWords = 0;
      centralWords.forEach(word => {
        if (textWords.has(word)) {
          commonWords++;
        }
      });
      
      return commonWords >= Math.min(2, centralWords.size);
    } catch (error) {
      return false;
    }
  }

  createThemeTitle(text) {
    if (!text) return null;
    
    try {
      let title = text.trim();
      // Loại bỏ từ nối ở đầu
      title = title.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|tuy nhiên|sau đó|tiếp theo)\s+/i, '');
      
      // Giới hạn độ dài nhưng đảm bảo ý nghĩa
      if (title.length > 30) {
        const words = title.split(/\s+/);
        const keepWords = Math.min(5, words.length);
        title = words.slice(0, keepWords).join(' ') + '...';
      }
      
      return this.capitalizeFirst(title);
    } catch (error) {
      return text;
    }
  }

  createHierarchicalBranches(analysis, mainThemes, complexity, style) {
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    const usedContent = new Set();
    
    try {
      mainThemes.slice(0, branchCount).forEach((theme, index) => {
        const branch = this.createBranchStructure(theme, analysis, index, style, usedContent);
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

  createBranchStructure(theme, analysis, index, style, usedContent) {
    try {
      const branchTitle = this.formatBranchTitle(theme, style, index);
      const subTopics = this.findRelevantSubTopics(theme, analysis, usedContent);
      
      if (subTopics.length === 0) {
        // Fallback: tạo subtopic từ key phrases
        const fallbackSubTopics = analysis.keyPhrases
          .slice(0, 3)
          .filter(phrase => !usedContent.has(phrase.toLowerCase()))
          .map(phrase => {
            usedContent.add(phrase.toLowerCase());
            return this.cleanSubTopic(phrase);
          })
          .filter(topic => topic);
        
        return {
          title: branchTitle,
          subTopics: fallbackSubTopics.length > 0 ? fallbackSubTopics : ['Thông tin chi tiết']
        };
      }
      
      return {
        title: branchTitle,
        subTopics: subTopics.slice(0, 3)
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch structure:', error);
      return null;
    }
  }

  findRelevantSubTopics(theme, analysis, usedContent) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    try {
      // Tìm câu có liên quan đến chủ đề
      if (analysis.sentences) {
        analysis.sentences.forEach(sentence => {
          if (this.calculateRelevance(sentence.toLowerCase(), themeLower) > 0.3) {
            const cleanSubTopic = this.cleanSubTopic(sentence);
            if (cleanSubTopic && 
                !usedContent.has(cleanSubTopic.toLowerCase()) &&
                !this.isTooSimilar(cleanSubTopic, themeLower)) {
              subTopics.push(cleanSubTopic);
              usedContent.add(cleanSubTopic.toLowerCase());
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

  isTooSimilar(subTopic, themeLower) {
    const subLower = subTopic.toLowerCase();
    const subWords = new Set(subLower.split(/\s+/));
    const themeWords = new Set(themeLower.split(/\s+/));
    
    let commonWords = 0;
    themeWords.forEach(word => {
      if (subWords.has(word) && word.length > 2) {
        commonWords++;
      }
    });
    
    return commonWords >= Math.min(3, themeWords.size);
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
      const textWords = new Set(text.split(/\s+/).filter(w => w.length > 2));
      const themeWords = new Set(theme.split(/\s+/).filter(w => w.length > 2));
      
      let commonWords = 0;
      themeWords.forEach(word => {
        if (textWords.has(word)) {
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
      // Loại bỏ từ nối ở đầu
      cleanText = cleanText.replace(/^(có thể|được|là|của|trong|về|theo)\s+/i, '');
      
      // Giới hạn độ dài
      if (cleanText.length > 60) {
        const words = cleanText.split(/\s+/);
        const keepWords = Math.min(8, words.length);
        cleanText = words.slice(0, keepWords).join(' ') + '...';
      }
      
      if (cleanText.length < 10) {
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
      'comprehensive': 4
    };
    return counts[complexity] || 3;
  }

  calculateConfidence(analysis) {
    try {
      if (!analysis) return 0.5;
      
      const sentenceCount = analysis.totalSentences || 0;
      const paragraphCount = analysis.totalParagraphs || 0;
      const wordCount = analysis.totalWords || 0;
      
      let confidence = 0;
      
      if (sentenceCount >= 3) confidence += 0.3;
      if (sentenceCount >= 6) confidence += 0.2;
      if (paragraphCount >= 2) confidence += 0.3;
      if (wordCount >= 50) confidence += 0.2;
      
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
      totalParagraphs: 0,
      totalWords: 0
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
        totalWords: 0,
        keywords: ["thông tin", "nội dung"],
        confidence: 0.5
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖 (Fallback Mode)",
        style: "balanced",
        complexity: "medium",
        timestamp: new Date().toISOString(),
        version: "FALLBACK 2.0"
      }
    };
  }
};

// Export function với timeout ngắn hơn cho mobile
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - OPTIMIZED VERSION 2.0 ===');
  
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

    const processedText = text.length > 1200 ? text.substring(0, 1200) : text;
    
    console.log('🤖 AI Bot xử lý văn bản, độ dài:', processedText.length);
    
    const aiBot = new MindMapAIBot();
    
    // Giảm timeout cho mobile
    const mindmapPromise = aiBot.generateMindMap(processedText, style, complexity);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), 5000); // Giảm xuống 5 giây
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
    
    const aiBot = new MindMapAIBot();
    const fallbackResponse = aiBot.getFallbackMindMap();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackResponse)
    };
  }
};
