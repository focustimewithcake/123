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
      'mọi', 'toàn', 'cả', 'chính', 'ngay', 'luôn', 'vừa', 'mới', 'đều', 'chưa',
      'vẫn', 'lại', 'chính', 'ngay', 'chứ', 'ơi', 'ừ', 'ôi', 'trời', 'ạ'
    ]);

    this.MAX_TEXT_LENGTH = 1500;
    this.MAX_SENTENCES = 20;
    this.MAX_KEYPHRASES = 20;
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
      const topics = this.extractMainTopics(sentences, keyPhrases);
      
      console.log('✅ Phân tích hoàn thành:', {
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        keyPhrases: keyPhrases.length,
        topics: topics.length
      });
      
      return {
        sentences: sentences.slice(0, this.MAX_SENTENCES),
        paragraphs: paragraphs.slice(0, 5),
        keyPhrases: keyPhrases.slice(0, this.MAX_KEYPHRASES),
        topics: topics.slice(0, 6),
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
      // Ưu tiên câu đầu tiên có độ dài hợp lý và chứa từ khóa quan trọng
      let bestTopic = sentences[0];
      let bestScore = 0;

      // Xem xét 5 câu đầu tiên
      const candidateSentences = sentences.slice(0, 5);
      
      candidateSentences.forEach((sentence, index) => {
        let score = 0;
        
        // Điểm cho độ dài lý tưởng (15-80 ký tự)
        const length = sentence.length;
        if (length >= 15 && length <= 80) {
          score += 2;
        }
        
        // Điểm cho vị trí (câu đầu điểm cao hơn)
        const positionScore = Math.max(0, 3 - index);
        score += positionScore;
        
        // Điểm cho từ khóa quan trọng
        keyPhrases.slice(0, 3).forEach(phrase => {
          if (sentence.toLowerCase().includes(phrase.toLowerCase())) {
            score += 2;
          }
        });
        
        // Điểm cho các từ chỉ mục (first, second, các số thứ tự)
        const hasOrderWords = /(đầu tiên|thứ nhất|thứ hai|thứ ba|thứ tư|thứ năm|thứ sáu|thứ bảy|thứ tám|thứ chín|thứ mười|trước tiên|tiếp theo|sau cùng|cuối cùng)/i.test(sentence);
        if (hasOrderWords) {
          score += 1;
        }
        
        // Điểm cho câu hỏi hoặc câu khẳng định
        const isQuestion = /^(tại sao|vì sao|làm thế nào|làm sao|như thế nào|cái gì|ai|khi nào|ở đâu)/i.test(sentence);
        if (!isQuestion) {
          score += 1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTopic = sentence;
        }
      });

      const conciseTopic = this.createConciseTopic(bestTopic);
      console.log('🎯 Central topic found:', conciseTopic);
      
      return conciseTopic;
    } catch (error) {
      console.error('❌ Lỗi tìm central topic:', error);
      return "Nội dung chính";
    }
  }

  // THUẬT TOÁN MỚI: Trích xuất chủ đề chính từ văn bản
  extractMainTopics(sentences, keyPhrases) {
    const topics = new Set();
    
    if (!sentences || sentences.length === 0) {
      return [];
    }

    try {
      // Nhóm câu theo chủ đề sử dụng từ khóa
      const topicGroups = {};
      
      keyPhrases.slice(0, 8).forEach(phrase => {
        topicGroups[phrase] = [];
      });

      // Phân phối câu vào các nhóm chủ đề
      sentences.forEach(sentence => {
        let bestGroup = null;
        let bestScore = 0;
        
        Object.keys(topicGroups).forEach(topic => {
          const score = this.calculateTopicRelevance(sentence, topic);
          if (score > bestScore && score > 0.3) {
            bestScore = score;
            bestGroup = topic;
          }
        });
        
        if (bestGroup) {
          topicGroups[bestGroup].push(sentence);
        }
      });

      // Chọn các chủ đề có nhiều câu nhất
      const sortedTopics = Object.keys(topicGroups)
        .filter(topic => topicGroups[topic].length > 0)
        .sort((a, b) => topicGroups[b].length - topicGroups[a].length)
        .slice(0, 6);

      sortedTopics.forEach(topic => {
        if (topic.length > 5) {
          topics.add(topic);
        }
      });

      // Nếu không đủ chủ đề, bổ sung từ các câu quan trọng
      if (topics.size < 3) {
        sentences.slice(0, 8).forEach(sentence => {
          if (sentence.length > 15 && sentence.length < 100) {
            const cleanTopic = this.createThemeTitle(sentence);
            if (cleanTopic && topics.size < 6) {
              topics.add(cleanTopic);
            }
          }
        });
      }

      return Array.from(topics);
    } catch (error) {
      console.error('❌ Lỗi extract main topics:', error);
      return ['Khía cạnh 1', 'Khía cạnh 2', 'Khía cạnh 3'];
    }
  }

  calculateTopicRelevance(sentence, topic) {
    const sentenceWords = new Set(sentence.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const topicWords = new Set(topic.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    let commonWords = 0;
    topicWords.forEach(word => {
      if (sentenceWords.has(word)) {
        commonWords++;
      }
    });
    
    return commonWords / Math.max(topicWords.size, 1);
  }

  createConciseTopic(sentence) {
    if (!sentence) return "Nội dung chính";
    
    try {
      let topic = sentence
        .replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|đầu tiên|thứ nhất|sau đó|tiếp theo|cuối cùng|trước tiên)\s+/i, '')
        .replace(/[.!?]+$/, '')
        .trim();
      
      // Loại bỏ phần thừa trong ngoặc đơn
      topic = topic.replace(/\([^)]*\)/g, '').trim();
      
      // Giới hạn độ dài và đảm bảo ý nghĩa
      if (topic.length > 45) {
        const words = topic.split(/\s+/);
        // Giữ lại 3-5 từ đầu để đảm bảo ý nghĩa
        const keepWords = Math.min(Math.max(3, words.length), 6);
        topic = words.slice(0, keepWords).join(' ') + '...';
      }
      
      return this.capitalizeFirst(topic);
    } catch (error) {
      return "Nội dung chính";
    }
  }

  splitMeaningfulSentences(text) {
    if (!text) return [];
    
    try {
      return text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 8 && s.length < 200) // Nới rộng độ dài
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

  // THUẬT TOÁN MỚI: Trích xuất cụm từ khóa thông minh hơn
  extractKeyPhrases(sentences) {
    const phrases = new Map(); // Sử dụng Map để theo dõi tần suất
    
    if (!sentences || sentences.length === 0) {
      return [];
    }

    try {
      const processedSentences = sentences.slice(0, 10);
      
      processedSentences.forEach(sentence => {
        const words = sentence.split(/\s+/).filter(word => 
          word && word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
        );
        
        // Tạo cụm từ 2-3 từ, ưu tiên cụm tự nhiên
        for (let i = 0; i < Math.min(words.length - 1, 8); i++) {
          // Cụm 2 từ
          if (i < words.length - 1) {
            const twoWordPhrase = `${words[i]} ${words[i+1]}`;
            if (twoWordPhrase.length >= 6 && twoWordPhrase.length < 30) {
              const count = phrases.get(twoWordPhrase) || 0;
              phrases.set(twoWordPhrase, count + 1);
            }
          }
          
          // Cụm 3 từ (quan trọng hơn)
          if (i < words.length - 2) {
            const threeWordPhrase = `${words[i]} ${words[i+1]} ${words[i+2]}`;
            if (threeWordPhrase.length >= 8 && threeWordPhrase.length < 40) {
              const count = phrases.get(threeWordPhrase) || 0;
              phrases.set(threeWordPhrase, count + 2); // Cụm 3 từ có trọng số cao hơn
            }
          }
        }
      });
      
      // Sắp xếp theo tần suất và độ dài
      return Array.from(phrases.entries())
        .sort((a, b) => {
          // Ưu tiên tần suất cao hơn
          if (b[1] !== a[1]) return b[1] - a[1];
          // Sau đó ưu tiên cụm từ dài hơn
          return b[0].length - a[0].length;
        })
        .map(entry => entry[0])
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
      const mainThemes = this.identifyQualityMainThemes(analysis, centralTopic);
      const structuredBranches = this.createQualityBranches(analysis, mainThemes, complexity, style);
      
      const result = {
        centralTopic,
        mainBranches: structuredBranches,
        analysis: {
          totalSentences: analysis.totalSentences,
          totalParagraphs: analysis.totalParagraphs,
          totalWords: analysis.totalWords,
          keywords: analysis.keyPhrases.slice(0, 10),
          confidence: this.calculateConfidence(analysis)
        },
        metadata: {
          generatedBy: "AI Mind Map Bot 🤖",
          style: style,
          complexity: complexity,
          timestamp: new Date().toISOString(),
          version: "IMPROVED 3.0"
        }
      };
      
      console.log('✅ Tạo mindmap thành công');
      return result;
    } catch (error) {
      console.error('❌ Lỗi tạo mindmap:', error);
      return this.getFallbackMindMap();
    }
  }

  // THUẬT TOÁN MỚI: Xác định chủ đề chính chất lượng hơn
  identifyQualityMainThemes(analysis, centralTopic) {
    const themes = new Set();
    const centralLower = centralTopic.toLowerCase();
    
    try {
      // Ưu tiên sử dụng các topics đã được trích xuất
      if (analysis.topics && analysis.topics.length > 0) {
        analysis.topics.forEach(topic => {
          if (!this.isSimilarToCentralTopic(topic, centralLower) && 
              this.isQualityTheme(topic)) {
            themes.add(topic);
          }
        });
      }
      
      // Bổ sung từ key phrases nếu cần
      if (themes.size < 3 && analysis.keyPhrases) {
        analysis.keyPhrases.slice(0, 8).forEach(phrase => {
          if (phrase.length > 8 && 
              !this.isSimilarToCentralTopic(phrase, centralLower) &&
              this.isQualityTheme(phrase) &&
              !this.isDuplicateTheme(phrase, Array.from(themes))) {
            const theme = this.createThemeTitle(phrase);
            if (theme && themes.size < 5) themes.add(theme);
          }
        });
      }
      
      // Bổ sung từ các câu quan trọng
      if (themes.size < 2 && analysis.sentences) {
        analysis.sentences.slice(1, 6).forEach(sentence => {
          if (sentence.length > 20 && 
              !this.isSimilarToCentralTopic(sentence, centralLower) &&
              this.isQualityTheme(sentence)) {
            const theme = this.createThemeTitle(sentence);
            if (theme && !this.isDuplicateTheme(theme, Array.from(themes))) {
              themes.add(theme);
            }
          }
        });
      }
      
      // Đảm bảo có ít nhất 2 chủ đề chất lượng
      if (themes.size < 2) {
        if (analysis.totalSentences >= 3) {
          themes.add('Phân tích chi tiết');
          themes.add('Ứng dụng thực tế');
        } else {
          themes.add('Thông tin chính');
          themes.add('Chi tiết bổ sung');
        }
      }
      
      return Array.from(themes).slice(0, 4);
    } catch (error) {
      console.error('❌ Lỗi identify themes:', error);
      return ['Thông tin chính', 'Phân tích', 'Ứng dụng'];
    }
  }

  isQualityTheme(text) {
    if (!text || text.length < 6) return false;
    
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    
    // Kiểm tra xem có quá nhiều từ dừng không
    const stopWordCount = words.filter(word => 
      this.vietnameseStopWords.has(word.toLowerCase())
    ).length;
    
    return stopWordCount <= words.length / 2;
  }

  isDuplicateTheme(newTheme, existingThemes) {
    const newLower = newTheme.toLowerCase();
    return existingThemes.some(theme => {
      const themeLower = theme.toLowerCase();
      return themeLower.includes(newLower) || newLower.includes(themeLower) ||
             this.calculateSimilarity(themeLower, newLower) > 0.7;
    });
  }

  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
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
      
      return commonWords >= Math.min(2, centralWords.size) || 
             this.calculateSimilarity(textLower, centralLower) > 0.5;
    } catch (error) {
      return false;
    }
  }

  createThemeTitle(text) {
    if (!text) return null;
    
    try {
      let title = text.trim();
      // Loại bỏ từ nối ở đầu và các ký tự không cần thiết
      title = title.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy|tuy nhiên|sau đó|tiếp theo|đầu tiên|thứ nhất)\s+/i, '');
      title = title.replace(/[.!?]+$/, '');
      
      // Giới hạn độ dài nhưng đảm bảo ý nghĩa
      if (title.length > 35) {
        const words = title.split(/\s+/);
        const keepWords = Math.min(5, words.length);
        title = words.slice(0, keepWords).join(' ') + '...';
      }
      
      if (title.length < 6) {
        return null;
      }
      
      return this.capitalizeFirst(title);
    } catch (error) {
      return text;
    }
  }

  createQualityBranches(analysis, mainThemes, complexity, style) {
    const branchCount = this.getBranchCount(complexity);
    const branches = [];
    const usedContent = new Set();
    
    try {
      mainThemes.slice(0, branchCount).forEach((theme, index) => {
        const branch = this.createQualityBranchStructure(theme, analysis, index, style, usedContent);
        if (branch && branch.subTopics.length > 0) {
          branches.push(branch);
        }
      });
      
      return branches;
    } catch (error) {
      console.error('❌ Lỗi tạo branches:', error);
      return [{
        title: 'Thông tin chính',
        subTopics: ['Nội dung quan trọng 1', 'Nội dung quan trọng 2']
      }];
    }
  }

  createQualityBranchStructure(theme, analysis, index, style, usedContent) {
    try {
      const branchTitle = this.formatBranchTitle(theme, style, index);
      const subTopics = this.findQualitySubTopics(theme, analysis, usedContent);
      
      if (subTopics.length === 0) {
        // Fallback: tạo subtopic từ key phrases và sentences
        const fallbackSubTopics = [];
        
        // Thử từ key phrases trước
        if (analysis.keyPhrases) {
          analysis.keyPhrases.slice(0, 4).forEach(phrase => {
            if (!usedContent.has(phrase.toLowerCase()) && 
                this.isRelevantToTheme(phrase, theme) &&
                fallbackSubTopics.length < 3) {
              const cleanTopic = this.cleanSubTopic(phrase);
              if (cleanTopic) {
                fallbackSubTopics.push(cleanTopic);
                usedContent.add(phrase.toLowerCase());
              }
            }
          });
        }
        
        // Thử từ sentences nếu cần
        if (fallbackSubTopics.length === 0 && analysis.sentences) {
          analysis.sentences.slice(0, 6).forEach(sentence => {
            if (!usedContent.has(sentence.toLowerCase()) && 
                this.isRelevantToTheme(sentence, theme) &&
                fallbackSubTopics.length < 3) {
              const cleanTopic = this.cleanSubTopic(sentence);
              if (cleanTopic) {
                fallbackSubTopics.push(cleanTopic);
                usedContent.add(sentence.toLowerCase());
              }
            }
          });
        }
        
        return {
          title: branchTitle,
          subTopics: fallbackSubTopics.length > 0 ? fallbackSubTopics : ['Thông tin chi tiết']
        };
      }
      
      return {
        title: branchTitle,
        subTopics: subTopics.slice(0, 4)
      };
    } catch (error) {
      console.error('❌ Lỗi tạo branch structure:', error);
      return null;
    }
  }

  findQualitySubTopics(theme, analysis, usedContent) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    try {
      // Tìm câu có liên quan đến chủ đề
      if (analysis.sentences) {
        analysis.sentences.forEach(sentence => {
          if (this.isRelevantToTheme(sentence, themeLower) && 
              !usedContent.has(sentence.toLowerCase()) &&
              this.isQualitySubTopic(sentence, themeLower)) {
            const cleanSubTopic = this.cleanSubTopic(sentence);
            if (cleanSubTopic) {
              subTopics.push(cleanSubTopic);
              usedContent.add(sentence.toLowerCase());
            }
          }
        });
      }
      
      // Bổ sung từ key phrases nếu cần
      if (subTopics.length < 2 && analysis.keyPhrases) {
        analysis.keyPhrases.forEach(phrase => {
          if (this.isRelevantToTheme(phrase, themeLower) && 
              !usedContent.has(phrase.toLowerCase()) &&
              subTopics.length < 4) {
            const cleanSubTopic = this.cleanSubTopic(phrase);
            if (cleanSubTopic) {
              subTopics.push(cleanSubTopic);
              usedContent.add(phrase.toLowerCase());
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

  isRelevantToTheme(text, themeLower) {
    const textLower = text.toLowerCase();
    const relevance = this.calculateTopicRelevance(textLower, themeLower);
    return relevance > 0.2 && !this.isTooSimilar(textLower, themeLower);
  }

  isQualitySubTopic(text, themeLower) {
    if (!text || text.length < 10) return false;
    
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/).filter(w => w.length > 2);
    
    // Kiểm tra có đủ từ có nghĩa không
    if (words.length < 2) return false;
    
    // Kiểm tra độ trùng lặp với theme
    const themeWords = new Set(themeLower.split(/\s+/).filter(w => w.length > 2));
    const commonWords = words.filter(word => themeWords.has(word));
    
    return commonWords.length < themeWords.size;
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
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng', 'Thảo luận'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo', 'Đổi mới'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai', 'Phát triển'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Quan điểm', 'Vấn đề']
    };
    
    const prefixes = stylePrefixes[style] || stylePrefixes.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix}: ${theme}`;
  }

  cleanSubTopic(text) {
    if (!text) return null;
    
    try {
      let cleanText = text.trim();
      // Loại bỏ từ nối ở đầu
      cleanText = cleanText.replace(/^(có thể|được|là|của|trong|về|theo|với|và|nhưng)\s+/i, '');
      cleanText = cleanText.replace(/[.!?]+$/, '');
      
      // Giới hạn độ dài
      if (cleanText.length > 70) {
        const words = cleanText.split(/\s+/);
        const keepWords = Math.min(10, words.length);
        cleanText = words.slice(0, keepWords).join(' ') + '...';
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
      'comprehensive': 5
    };
    return counts[complexity] || 3;
  }

  calculateConfidence(analysis) {
    try {
      if (!analysis) return 0.5;
      
      const sentenceCount = analysis.totalSentences || 0;
      const paragraphCount = analysis.totalParagraphs || 0;
      const wordCount = analysis.totalWords || 0;
      const topicCount = analysis.topics ? analysis.topics.length : 0;
      
      let confidence = 0;
      
      if (sentenceCount >= 3) confidence += 0.2;
      if (sentenceCount >= 6) confidence += 0.2;
      if (paragraphCount >= 2) confidence += 0.2;
      if (wordCount >= 50) confidence += 0.2;
      if (topicCount >= 2) confidence += 0.2;
      
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
      topics: [],
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
        version: "FALLBACK 3.0"
      }
    };
  }
};

// Export function với timeout ngắn hơn cho mobile
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - IMPROVED VERSION 3.0 ===');
  
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

    const processedText = text.length > 1500 ? text.substring(0, 1500) : text;
    
    console.log('🤖 AI Bot xử lý văn bản, độ dài:', processedText.length);
    
    const aiBot = new MindMapAIBot();
    
    // Giảm timeout cho mobile
    const mindmapPromise = aiBot.generateMindMap(processedText, style, complexity);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), 8000);
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
