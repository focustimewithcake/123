
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
    const mindmap = this.createStructuredMindMap(analysis, style, complexity);
    
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
    console.log('📊 Phân tích cấu trúc văn bản...');
    
    const sentences = this.splitMeaningfulSentences(text);
    const paragraphs = this.splitParagraphs(text);
    const keyPhrases = this.extractKeyPhrases(sentences);
    
    console.log('✅ Phân tích hoàn thành:', {
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      keyPhrases: keyPhrases.length
    });
    
    return {
      sentences,
      paragraphs,
      keyPhrases,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length
    };
  }

  splitMeaningfulSentences(text) {
    if (!text) return [];
    
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 150)
      .slice(0, 25);
  }

  splitParagraphs(text) {
    if (!text) return [];
    
    return text.split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .slice(0, 10);
  }

  extractKeyPhrases(sentences) {
    const phrases = new Set();
    
    sentences.forEach(sentence => {
      // Tìm các cụm từ quan trọng (2-3 từ)
      const words = sentence.split(/\s+/).filter(word => 
        word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
      );
      
      // Tạo cụm từ 2-3 từ
      for (let i = 0; i < words.length - 1; i++) {
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
      }
    });
    
    return Array.from(phrases).slice(0, 20);
  }

  // THUẬT TOÁN MỚI: Tạo cấu trúc phân cấp rõ ràng
  createStructuredMindMap(analysis, style, complexity) {
    console.log('🏗️ Tạo cấu trúc sơ đồ phân cấp...');
    
    const centralTopic = this.determineCentralTopic(analysis);
    const mainThemes = this.identifyMainThemes(analysis);
    const structuredBranches = this.createHierarchicalBranches(analysis, mainThemes, complexity, style);
    
    const result = {
      centralTopic,
      mainBranches: structuredBranches,
      analysis: {
        totalSentences: analysis.totalSentences,
        totalParagraphs: analysis.totalParagraphs,
        mainThemes: mainThemes.slice(0, 5),
        confidence: this.calculateConfidence(analysis)
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖",
        style: style,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        version: "STRUCTURED 3.0"
      }
    };
    
    console.log('✅ Cấu trúc phân cấp hoàn thành:', {
      centralTopic: result.centralTopic,
      mainThemes: result.analysis.mainThemes,
      branches: result.mainBranches.length
    });
    
    return result;
  }

  determineCentralTopic(analysis) {
    if (!analysis.sentences || analysis.sentences.length === 0) {
      return "Nội dung chính";
    }
    
    // Tìm câu đầu tiên có độ dài phù hợp
    let centralTopic = analysis.sentences[0];
    
    // Ưu tiên câu đầu tiên của đoạn văn đầu tiên
    if (analysis.paragraphs && analysis.paragraphs.length > 0) {
      const firstParagraph = analysis.paragraphs[0];
      const firstSentence = firstParagraph.split(/[.!?]+/)[0].trim();
      if (firstSentence.length > 15) {
        centralTopic = firstSentence;
      }
    }
    
    // Giới hạn độ dài
    if (centralTopic.length > 45) {
      centralTopic = centralTopic.substring(0, 45) + '...';
    }
    
    return centralTopic;
  }

  identifyMainThemes(analysis) {
    const themes = [];
    
    // Sử dụng các đoạn văn làm chủ đề chính
    if (analysis.paragraphs && analysis.paragraphs.length > 0) {
      analysis.paragraphs.forEach(paragraph => {
        const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
        if (firstSentence.length > 15) {
          themes.push(this.createThemeTitle(firstSentence));
        }
      });
    }
    
    // Bổ sung từ các cụm từ quan trọng
    if (analysis.keyPhrases && analysis.keyPhrases.length > 0) {
      analysis.keyPhrases.slice(0, 5).forEach(phrase => {
        if (phrase.length > 8) {
          themes.push(this.createThemeTitle(phrase));
        }
      });
    }
    
    // Loại bỏ trùng lặp và giới hạn số lượng
    return [...new Set(themes)].slice(0, 6);
  }

  createThemeTitle(text) {
    // Rút gọn và làm đẹp tiêu đề chủ đề
    let title = text.trim();
    
    // Loại bỏ từ dư thừa ở đầu
    title = title.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó)\s+/i, '');
    
    // Giới hạn độ dài
    if (title.length > 30) {
      title = title.substring(0, 30) + '...';
    }
    
    return this.capitalizeFirst(title);
  }

  createHierarchicalBranches(analysis, mainThemes, complexity, style) {
    console.log('🌳 Tạo cấu trúc phân cấp cho các nhánh...');
    
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    
    // Tạo nhánh từ các chủ đề chính
    mainThemes.slice(0, branchCount).forEach((theme, index) => {
      const branch = this.createBranchStructure(theme, analysis, index, style);
      if (branch && branch.subTopics.length > 0) {
        branches.push(branch);
        console.log(`✅ Đã tạo nhánh: "${branch.title}" với ${branch.subTopics.length} subtopic`);
      }
    });
    
    return branches;
  }

  createBranchStructure(theme, analysis, index, style) {
    const branchTitle = this.formatBranchTitle(theme, style, index);
    const subTopics = this.findRelevantSubTopics(theme, analysis);
    
    if (subTopics.length === 0) {
      return null;
    }
    
    return {
      title: branchTitle,
      subTopics: subTopics.slice(0, 4) // Tối đa 4 subtopic mỗi nhánh
    };
  }

  formatBranchTitle(theme, style, index) {
    const stylePrefixes = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng', 'Lý thuyết'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo', 'Đổi mới'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai', 'Phát triển'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Ứng dụng', 'Quan điểm']
    };
    
    const prefixes = stylePrefixes[style] || stylePrefixes.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix}: ${theme}`;
  }

  findRelevantSubTopics(theme, analysis) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    // Tìm các câu liên quan đến chủ đề
    if (analysis.sentences) {
      analysis.sentences.forEach(sentence => {
        const sentenceLower = sentence.toLowerCase();
        
        // Kiểm tra mức độ liên quan
        if (this.calculateRelevance(sentenceLower, themeLower) > 0.3) {
          const cleanSubTopic = this.cleanSubTopic(sentence);
          if (cleanSubTopic && !subTopics.includes(cleanSubTopic)) {
            subTopics.push(cleanSubTopic);
          }
        }
      });
    }
    
    // Bổ sung từ các cụm từ liên quan
    if (analysis.keyPhrases) {
      analysis.keyPhrases.forEach(phrase => {
        const phraseLower = phrase.toLowerCase();
        if (this.calculateRelevance(phraseLower, themeLower) > 0.4 && 
            phrase.length > 10 && 
            !subTopics.includes(phrase)) {
          subTopics.push(phrase);
        }
      });
    }
    
    return subTopics.slice(0, 6); // Giới hạn số lượng
  }

  calculateRelevance(text, theme) {
    const textWords = new Set(text.split(/\s+/));
    const themeWords = new Set(theme.split(/\s+/));
    
    let commonWords = 0;
    themeWords.forEach(word => {
      if (textWords.has(word) && word.length > 2) {
        commonWords++;
      }
    });
    
    return commonWords / Math.max(themeWords.size, 1);
  }

  cleanSubTopic(text) {
    let cleanText = text.trim();
    
    // Loại bỏ phần trùng với các từ thông dụng
    cleanText = cleanText.replace(/^(có thể|được|là|của|trong)\s+/i, '');
    
    // Giới hạn độ dài
    if (cleanText.length > 55) {
      cleanText = cleanText.substring(0, 55) + '...';
    }
    
    // Đảm bảo có ý nghĩa
    if (cleanText.length < 8) {
      return null;
    }
    
    return cleanText;
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

  calculateConfidence(analysis) {
    if (!analysis) return 0.5;
    
    const sentenceCount = analysis.totalSentences || 0;
    const paragraphCount = analysis.totalParagraphs || 0;
    
    let confidence = 0;
    
    if (sentenceCount >= 3) confidence += 0.3;
    if (sentenceCount >= 8) confidence += 0.2;
    if (paragraphCount >= 2) confidence += 0.3;
    if (paragraphCount >= 4) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
};

// Export function chính
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - STRUCTURED HIERARCHY MODE ===');
  
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
    console.log('📥 Nhận dữ liệu từ người dùng...');
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('✅ Body parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { text, style = 'balanced', complexity = 'medium' } = parsedBody;

    if (!text || text.trim().length === 0) {
      console.log('❌ Empty text received');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    // Giới hạn 1500 chữ
    const processedText = text.length > 1500 ? text.substring(0, 1500) : text;
    
    console.log('🤖 AI Bot xử lý văn bản, độ dài:', processedText.length);
    console.log('📝 Mẫu văn bản:', processedText.substring(0, 100) + '...');
    
    // Khởi tạo và chạy AI Bot
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ AI Bot hoàn thành - CẤU TRÚC PHÂN CẤP');
    console.log('📊 Kết quả:', {
      centralTopic: mindmapData.centralTopic,
      branchCount: mindmapData.mainBranches.length,
      structure: 'PHÂN CẤP RÕ RÀNG'
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ AI Bot lỗi:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI Bot xử lý thất bại',
        message: error.message
      })
    };
  }
};
