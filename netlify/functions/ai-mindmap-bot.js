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
    const centralTopic = this.findTrueCentralTopic(sentences, keyPhrases);
    
    console.log('✅ Phân tích hoàn thành:', {
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      keyPhrases: keyPhrases.length,
      centralTopic: centralTopic
    });
    
    return {
      sentences,
      paragraphs,
      keyPhrases,
      centralTopic,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length
    };
  }

  // THUẬT TOÁN MỚI: Tìm chủ đề trung tâm thực sự
  findTrueCentralTopic(sentences, keyPhrases) {
    if (!sentences || sentences.length === 0) return "Nội dung chính";
    
    // Phân tích tần suất từ khóa để tìm chủ đề chính
    const wordFrequency = this.analyzeWordFrequency(sentences);
    const topKeywords = this.getTopKeywords(wordFrequency, 10);
    
    console.log('🔍 Top keywords:', topKeywords);
    
    // Tìm câu chứa nhiều từ khóa quan trọng nhất
    let bestSentence = sentences[0];
    let highestScore = 0;
    
    sentences.forEach(sentence => {
      const score = this.calculateTopicScore(sentence, topKeywords);
      if (score > highestScore && sentence.length > 10 && sentence.length < 60) {
        highestScore = score;
        bestSentence = sentence;
      }
    });
    
    // Rút gọn thành chủ đề ngắn gọn
    const centralTopic = this.createConciseTopic(bestSentence, topKeywords);
    console.log('🎯 Central topic được chọn:', centralTopic);
    
    return centralTopic;
  }

  analyzeWordFrequency(sentences) {
    const frequency = {};
    
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2 && !this.vietnameseStopWords.has(word)) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
    });
    
    return frequency;
  }

  getTopKeywords(frequency, count) {
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([word]) => word);
  }

  calculateTopicScore(sentence, keywords) {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (sentenceLower.includes(keyword)) {
        score += 1;
      }
    });
    
    // Ưu tiên câu ngắn gọn, rõ ràng
    if (sentence.length >= 15 && sentence.length <= 50) {
      score += 2;
    }
    
    return score;
  }

  createConciseTopic(sentence, keywords) {
    // Loại bỏ từ thừa, giữ lại ý chính
    let topic = sentence
      .replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó)\s+/i, '')
      .replace(/[.!?]+$/, '')
      .trim();
    
    // Ưu tiên giữ lại các từ khóa quan trọng
    const words = topic.split(/\s+/);
    const importantWords = words.filter(word => 
      keywords.some(keyword => 
        word.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    // Nếu có đủ từ quan trọng, tạo topic từ chúng
    if (importantWords.length >= 2) {
      topic = importantWords.slice(0, 4).join(' ');
    }
    
    // Giới hạn độ dài
    if (topic.length > 45) {
      topic = topic.substring(0, 42) + '...';
    }
    
    return this.capitalizeFirst(topic);
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
      const words = sentence.split(/\s+/).filter(word => 
        word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
      );
      
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

  // THUẬT TOÁN CẢI TIẾN: Tạo cấu trúc không trùng lặp
  createStructuredMindMap(analysis, style, complexity) {
    console.log('🏗️ Tạo cấu trúc sơ đồ phân cấp...');
    
    const centralTopic = analysis.centralTopic || this.determineCentralTopic(analysis);
    const mainThemes = this.identifyUniqueMainThemes(analysis, centralTopic);
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
        version: "STRUCTURED 4.0 - FIXED DUPLICATION"
      }
    };
    
    console.log('✅ Cấu trúc phân cấp hoàn thành:', {
      centralTopic: result.centralTopic,
      mainThemes: result.analysis.mainThemes,
      branches: result.mainBranches.length
    });
    
    return result;
  }

  // PHƯƠNG PHÁP MỚI: Xác định chủ đề chính không trùng lặp
  identifyUniqueMainThemes(analysis, centralTopic) {
    const themes = new Set();
    const centralLower = centralTopic.toLowerCase();
    
    // Sử dụng các đoạn văn làm chủ đề chính (loại bỏ trùng với central topic)
    if (analysis.paragraphs && analysis.paragraphs.length > 0) {
      analysis.paragraphs.forEach(paragraph => {
        const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
        if (firstSentence.length > 15 && !this.isSimilarToCentralTopic(firstSentence, centralLower)) {
          const theme = this.createThemeTitle(firstSentence);
          if (theme && !themes.has(theme)) {
            themes.add(theme);
          }
        }
      });
    }
    
    // Bổ sung từ các cụm từ quan trọng (loại bỏ trùng)
    if (analysis.keyPhrases && analysis.keyPhrases.length > 0) {
      analysis.keyPhrases.forEach(phrase => {
        if (phrase.length > 8 && !this.isSimilarToCentralTopic(phrase, centralLower)) {
          const theme = this.createThemeTitle(phrase);
          if (theme && !themes.has(theme)) {
            themes.add(theme);
          }
        }
      });
    }
    
    // Nếu không đủ chủ đề, thêm từ các câu quan trọng
    if (themes.size < 3 && analysis.sentences) {
      analysis.sentences.forEach(sentence => {
        if (sentence.length > 20 && !this.isSimilarToCentralTopic(sentence, centralLower)) {
          const theme = this.createThemeTitle(sentence);
          if (theme && !themes.has(theme) && themes.size < 6) {
            themes.add(theme);
          }
        }
      });
    }
    
    return Array.from(themes).slice(0, 6);
  }

  isSimilarToCentralTopic(text, centralLower) {
    const textLower = text.toLowerCase();
    const textWords = new Set(textLower.split(/\s+/));
    const centralWords = new Set(centralLower.split(/\s+/));
    
    let commonWords = 0;
    centralWords.forEach(word => {
      if (textWords.has(word) && word.length > 2) {
        commonWords++;
      }
    });
    
    // Nếu có quá nhiều từ trùng nhau, coi là tương tự
    return commonWords >= Math.min(2, centralWords.size);
  }

  createThemeTitle(text) {
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
    const usedSubTopics = new Set();
    
    // Tạo nhánh từ các chủ đề chính
    mainThemes.slice(0, branchCount).forEach((theme, index) => {
      const branch = this.createBranchStructure(theme, analysis, index, style, usedSubTopics);
      if (branch && branch.subTopics.length > 0) {
        branches.push(branch);
        console.log(`✅ Đã tạo nhánh: "${branch.title}" với ${branch.subTopics.length} subtopic`);
      }
    });
    
    return branches;
  }

  createBranchStructure(theme, analysis, index, style, usedSubTopics) {
    const branchTitle = this.formatBranchTitle(theme, style, index);
    const subTopics = this.findUniqueSubTopics(theme, analysis, usedSubTopics);
    
    if (subTopics.length === 0) {
      return null;
    }
    
    // Đánh dấu các subtopic đã sử dụng
    subTopics.forEach(topic => usedSubTopics.add(topic.toLowerCase()));
    
    return {
      title: branchTitle,
      subTopics: subTopics.slice(0, 4)
    };
  }

  // PHƯƠNG PHÁP MỚI: Tìm subtopic không trùng lặp
  findUniqueSubTopics(theme, analysis, usedSubTopics) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    // Tìm các câu liên quan đến chủ đề nhưng chưa được sử dụng
    if (analysis.sentences) {
      analysis.sentences.forEach(sentence => {
        const sentenceLower = sentence.toLowerCase();
        
        if (this.calculateRelevance(sentenceLower, themeLower) > 0.3) {
          const cleanSubTopic = this.cleanSubTopic(sentence);
          if (cleanSubTopic && 
              !usedSubTopics.has(cleanSubTopic.toLowerCase()) &&
              !this.isTooSimilar(cleanSubTopic, themeLower)) {
            subTopics.push(cleanSubTopic);
            usedSubTopics.add(cleanSubTopic.toLowerCase());
          }
        }
      });
    }
    
    // Bổ sung từ các cụm từ liên quan chưa được sử dụng
    if (analysis.keyPhrases) {
      analysis.keyPhrases.forEach(phrase => {
        const phraseLower = phrase.toLowerCase();
        if (this.calculateRelevance(phraseLower, themeLower) > 0.4 && 
            phrase.length > 10 &&
            !usedSubTopics.has(phraseLower) &&
            !this.isTooSimilar(phrase, themeLower)) {
          subTopics.push(phrase);
          usedSubTopics.add(phraseLower);
        }
      });
    }
    
    return subTopics.slice(0, 6);
  }

  isTooSimilar(text, theme) {
    const textLower = text.toLowerCase();
    const textWords = new Set(textLower.split(/\s+/));
    const themeWords = new Set(theme.split(/\s+/));
    
    let commonWords = 0;
    themeWords.forEach(word => {
      if (textWords.has(word) && word.length > 2) {
        commonWords++;
      }
    });
    
    // Nếu quá giống (trên 50% từ khớp), coi là quá tương tự
    return commonWords >= Math.ceil(themeWords.size * 0.5);
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
    
    cleanText = cleanText.replace(/^(có thể|được|là|của|trong)\s+/i, '');
    
    if (cleanText.length > 55) {
      cleanText = cleanText.substring(0, 55) + '...';
    }
    
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

  // Giữ lại phương thức cũ để tương thích
  determineCentralTopic(analysis) {
    return this.findTrueCentralTopic(analysis.sentences, analysis.keyPhrases);
  }
};

// Export function chính (giữ nguyên)
exports.handler = async (event) => {
  // ... (giữ nguyên phần handler)
  // Code handler giữ nguyên như ban đầu
};
