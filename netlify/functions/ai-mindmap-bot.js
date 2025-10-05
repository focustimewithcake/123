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
    
    this.relationshipKeywords = {
      cause: ['vì', 'do', 'bởi vì', 'nguyên nhân', 'dẫn đến'],
      effect: ['kết quả', 'hậu quả', 'ảnh hưởng', 'tác động'],
      solution: ['giải pháp', 'biện pháp', 'cách thức', 'phương án'],
      advantage: ['ưu điểm', 'lợi ích', 'tích cực'],
      disadvantage: ['nhược điểm', 'hạn chế', 'khó khăn'],
      comparison: ['so với', 'khác với', 'tương tự', 'giống như'],
      process: ['bước', 'giai đoạn', 'quy trình', 'quá trình']
    };
  }

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang phân tích văn bản...');
    
    const cleanedText = this.cleanText(text);
    const analysis = this.analyzeText(cleanedText);
    const mindmap = this.createLogicalMindMap(analysis, style, complexity);
    
    return mindmap;
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ.,!?;:()-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  analyzeText(text) {
    console.log('📊 Phân tích cấu trúc văn bản...');
    
    const sentences = this.splitMeaningfulSentences(text);
    const paragraphs = this.splitParagraphs(text);
    const keyPhrases = this.extractKeyPhrases(sentences);
    const entities = this.extractEntities(sentences);
    const relationships = this.analyzeRelationships(sentences);
    
    console.log('✅ Phân tích hoàn thành:', {
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      keyPhrases: keyPhrases.length,
      entities: Object.keys(entities).length
    });
    
    return {
      sentences,
      paragraphs,
      keyPhrases,
      entities,
      relationships,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length
    };
  }

  splitMeaningfulSentences(text) {
    if (!text) return [];
    
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 8 && s.length < 200)
      .slice(0, 30);
  }

  extractEntities(sentences) {
    const entities = {
      concepts: new Set(),
      actions: new Set(),
      objects: new Set(),
      people: new Set(),
      locations: new Set()
    };

    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/);
      
      words.forEach((word, index) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:()]/g, '');
        
        if (cleanWord.length < 3 || this.vietnameseStopWords.has(cleanWord)) {
          return;
        }

        // Phát hiện khái niệm (danh từ)
        if (this.isLikelyConcept(word, words, index)) {
          entities.concepts.add(this.capitalizeFirst(word));
        }
        
        // Phát hiện hành động (động từ)
        if (this.isLikelyAction(word, words, index)) {
          entities.actions.add(word);
        }
      });
    });

    // Chuyển Set thành Array và giới hạn số lượng
    return {
      concepts: Array.from(entities.concepts).slice(0, 15),
      actions: Array.from(entities.actions).slice(0, 10),
      objects: Array.from(entities.objects).slice(0, 8)
    };
  }

  isLikelyConcept(word, words, index) {
    // Các từ thường là khái niệm: viết hoa chữ cái đầu, độ dài > 3
    if (word.length > 3 && /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯ]/.test(word)) {
      return true;
    }
    
    // Các từ đứng sau "của", "về", "trong" thường là khái niệm
    const prevWord = index > 0 ? words[index - 1].toLowerCase() : '';
    if (['của', 'về', 'trong', 'từ', 'do'].includes(prevWord)) {
      return true;
    }
    
    return false;
  }

  isLikelyAction(word, words, index) {
    // Các từ kết thúc bằng động từ phổ biến
    const actionSuffixes = ['ải', 'ết', 'ình', 'ợp', 'ạo', 'iết', 'ục', 'àng'];
    const hasActionSuffix = actionSuffixes.some(suffix => 
      word.toLowerCase().endsWith(suffix)
    );
    
    if (hasActionSuffix && word.length > 2) {
      return true;
    }
    
    // Các từ đứng trước "một", "các", "những" thường là động từ
    const nextWord = index < words.length - 1 ? words[index + 1].toLowerCase() : '';
    if (['một', 'các', 'những', 'nhiều', 'ít'].includes(nextWord)) {
      return true;
    }
    
    return false;
  }

  analyzeRelationships(sentences) {
    const relationships = [];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Phát hiện quan hệ nguyên nhân - kết quả
      if (this.relationshipKeywords.cause.some(keyword => 
          lowerSentence.includes(keyword))) {
        relationships.push({
          type: 'cause_effect',
          sentence: sentence,
          direction: 'cause'
        });
      }
      
      // Phát hiện quan hệ giải pháp
      if (this.relationshipKeywords.solution.some(keyword => 
          lowerSentence.includes(keyword))) {
        relationships.push({
          type: 'solution',
          sentence: sentence
        });
      }
      
      // Phát hiện quan hệ so sánh
      if (this.relationshipKeywords.comparison.some(keyword => 
          lowerSentence.includes(keyword))) {
        relationships.push({
          type: 'comparison',
          sentence: sentence
        });
      }
    });
    
    return relationships.slice(0, 10);
  }

  // PHIÊN BẢN MỚI: Tạo mind map có logic rõ ràng
  createLogicalMindMap(analysis, style, complexity) {
    console.log('🏗️ Tạo cấu trúc mind map logic...');
    
    const centralTopic = this.determineLogicalCentralTopic(analysis);
    const mainThemes = this.identifyLogicalThemes(analysis);
    const logicalBranches = this.createLogicalBranches(analysis, mainThemes, complexity, style);
    
    const result = {
      centralTopic,
      mainBranches: logicalBranches,
      analysis: {
        totalSentences: analysis.totalSentences,
        totalParagraphs: analysis.totalParagraphs,
        concepts: analysis.entities.concepts.slice(0, 8),
        relationships: analysis.relationships.length,
        confidence: this.calculateConfidence(analysis)
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖",
        style: style,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        version: "LOGICAL 4.0"
      }
    };
    
    console.log('✅ Cấu trúc logic hoàn thành:', {
      centralTopic: result.centralTopic,
      mainBranches: result.mainBranches.length,
      concepts: result.analysis.concepts.length
    });
    
    return result;
  }

  determineLogicalCentralTopic(analysis) {
    if (!analysis.sentences || analysis.sentences.length === 0) {
      return "Nội dung chính";
    }
    
    // Ưu tiên câu đầu tiên có chứa khái niệm quan trọng
    let centralTopic = analysis.sentences[0];
    
    // Tìm câu có nhiều khái niệm nhất
    if (analysis.entities.concepts.length > 0) {
      let bestSentence = analysis.sentences[0];
      let maxConcepts = 0;
      
      analysis.sentences.slice(0, 5).forEach(sentence => {
        const conceptCount = analysis.entities.concepts.filter(concept =>
          sentence.includes(concept)
        ).length;
        
        if (conceptCount > maxConcepts && sentence.length > 15) {
          maxConcepts = conceptCount;
          bestSentence = sentence;
        }
      });
      
      if (maxConcepts > 0) {
        centralTopic = bestSentence;
      }
    }
    
    // Rút gọn và làm rõ nghĩa
    centralTopic = this.refineCentralTopic(centralTopic);
    
    if (centralTopic.length > 50) {
      centralTopic = centralTopic.substring(0, 50) + '...';
    }
    
    return centralTopic;
  }

  refineCentralTopic(topic) {
    // Loại bỏ phần mở đầu không cần thiết
    let refined = topic
      .replace(/^(Hiện nay|Ngày nay|Trong|Với|Đối với|Theo)\s+/i, '')
      .replace(/,.*$/, '') // Loại bỏ phần sau dấu phẩy đầu tiên
      .trim();
    
    // Đảm bảo bắt đầu bằng chữ hoa
    refined = this.capitalizeFirst(refined);
    
    return refined || topic;
  }

  identifyLogicalThemes(analysis) {
    const themes = [];
    
    // Sử dụng các khái niệm chính làm chủ đề
    if (analysis.entities.concepts.length > 0) {
      analysis.entities.concepts.slice(0, 8).forEach(concept => {
        if (concept.length > 3) {
          themes.push(concept);
        }
      });
    }
    
    // Bổ sung từ các mối quan hệ
    analysis.relationships.forEach(rel => {
      const theme = this.extractThemeFromRelationship(rel);
      if (theme && !themes.includes(theme)) {
        themes.push(theme);
      }
    });
    
    // Bổ sung từ các đoạn văn nếu cần
    if (themes.length < 3 && analysis.paragraphs.length > 0) {
      analysis.paragraphs.slice(0, 3).forEach(paragraph => {
        const firstSentence = paragraph.split(/[.!?]+/)[0].trim();
        if (firstSentence.length > 10) {
          const theme = this.createThemeTitle(firstSentence);
          if (!themes.includes(theme)) {
            themes.push(theme);
          }
        }
      });
    }
    
    return themes.slice(0, 6);
  }

  extractThemeFromRelationship(relationship) {
    const sentence = relationship.sentence.toLowerCase();
    
    switch (relationship.type) {
      case 'cause_effect':
        return 'Nguyên nhân - Kết quả';
      case 'solution':
        return 'Giải pháp';
      case 'comparison':
        return 'So sánh';
      default:
        return null;
    }
  }

  createLogicalBranches(analysis, mainThemes, complexity, style) {
    console.log('🌳 Tạo các nhánh logic...');
    
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    
    mainThemes.slice(0, branchCount).forEach((theme, index) => {
      const branch = this.createLogicalBranch(theme, analysis, index, style);
      if (branch && branch.subTopics.length > 0) {
        branches.push(branch);
        console.log(`✅ Đã tạo nhánh logic: "${branch.title}"`);
      }
    });
    
    // Đảm bảo có ít nhất 2 nhánh
    if (branches.length < 2) {
      const fallbackBranches = this.createFallbackBranches(analysis, style);
      branches.push(...fallbackBranches.slice(0, 2 - branches.length));
    }
    
    return branches.slice(0, branchCount);
  }

  createLogicalBranch(theme, analysis, index, style) {
    const branchTitle = this.formatLogicalBranchTitle(theme, style, index);
    const subTopics = this.findLogicalSubTopics(theme, analysis);
    
    if (subTopics.length === 0) {
      return null;
    }
    
    return {
      title: branchTitle,
      subTopics: subTopics.slice(0, this.getSubTopicCount(style))
    };
  }

  formatLogicalBranchTitle(theme, style, index) {
    const styleFormats = {
      'academic': ['Khái niệm', 'Phân tích', 'Nghiên cứu', 'Lý thuyết', 'Ứng dụng'],
      'creative': ['Ý tưởng', 'Sáng tạo', 'Phát triển', 'Giải pháp', 'Đổi mới'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai', 'Phát triển'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Ứng dụng', 'Quan điểm']
    };
    
    const prefixes = styleFormats[style] || styleFormats.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix}: ${theme}`;
  }

  findLogicalSubTopics(theme, analysis) {
    const subTopics = new Set();
    const themeLower = theme.toLowerCase();
    
    // Tìm các câu liên quan trực tiếp đến chủ đề
    analysis.sentences.forEach(sentence => {
      if (this.isRelevantToTheme(sentence, themeLower)) {
        const subTopic = this.extractSubTopic(sentence, themeLower);
        if (subTopic && subTopic.length > 10 && subTopic.length < 60) {
          subTopics.add(subTopic);
        }
      }
    });
    
    // Tìm các khái niệm liên quan
    analysis.entities.concepts.forEach(concept => {
      if (concept !== theme && 
          this.calculateRelevance(concept.toLowerCase(), themeLower) > 0.3) {
        subTopics.add(concept);
      }
    });
    
    // Tìm các hành động liên quan
    analysis.entities.actions.forEach(action => {
      if (this.calculateRelevance(action.toLowerCase(), themeLower) > 0.4) {
        subTopics.add(action);
      }
    });
    
    return Array.from(subTopics).slice(0, 6);
  }

  isRelevantToTheme(sentence, themeLower) {
    const sentenceLower = sentence.toLowerCase();
    
    // Kiểm tra trực tiếp
    if (sentenceLower.includes(themeLower)) {
      return true;
    }
    
    // Kiểm tra các từ khóa liên quan
    const themeWords = themeLower.split(/\s+/).filter(word => word.length > 2);
    const commonWords = themeWords.filter(word => 
      sentenceLower.includes(word)
    );
    
    return commonWords.length >= Math.min(2, themeWords.length);
  }

  extractSubTopic(sentence, themeLower) {
    let subTopic = sentence.trim();
    
    // Loại bỏ phần trùng với chủ đề
    if (subTopic.toLowerCase().includes(themeLower)) {
      subTopic = subTopic.replace(new RegExp(themeLower, 'gi'), '').trim();
    }
    
    // Loại bỏ từ nối ở đầu
    subTopic = subTopic.replace(/^([Vv]à|[Hh]oặc|[Nn]hưng|[Tt]uy nhiên|[Dd]o đó)\s+/i, '');
    
    // Làm sạch
    subTopic = subTopic.replace(/^[.,!?;:]\s*/, '');
    
    if (subTopic.length < 8) {
      return null;
    }
    
    return this.capitalizeFirst(subTopic);
  }

  createFallbackBranches(analysis, style) {
    console.log('🔄 Tạo nhánh dự phòng...');
    
    const fallbackThemes = [
      'Tổng quan',
      'Đặc điểm chính', 
      'Ứng dụng thực tế',
      'Phát triển'
    ];
    
    return fallbackThemes.map((theme, index) => ({
      title: this.formatLogicalBranchTitle(theme, style, index),
      subTopics: this.extractKeyPhrases(analysis.sentences).slice(0, 3)
    }));
  }

  getSubTopicCount(style) {
    const counts = {
      'academic': 4,
      'creative': 5,
      'business': 3,
      'balanced': 4
    };
    return counts[style] || 4;
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
    const conceptCount = analysis.entities?.concepts?.length || 0;
    
    let confidence = 0;
    
    if (sentenceCount >= 3) confidence += 0.2;
    if (sentenceCount >= 8) confidence += 0.2;
    if (paragraphCount >= 2) confidence += 0.2;
    if (paragraphCount >= 4) confidence += 0.2;
    if (conceptCount >= 3) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
};

// Export function chính (giữ nguyên phần handler)
exports.handler = async (event) => {
  // ... (giữ nguyên phần handler từ code gốc)
  // Chỉ cần thay thế class MindMapAIBot cũ bằng class mới này
};
