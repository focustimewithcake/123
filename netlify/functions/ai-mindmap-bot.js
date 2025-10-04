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
    console.log('🤖 AI Bot đang phân tích văn bản THẬT từ người dùng...');
    
    const cleanedText = this.cleanText(text);
    const analysis = this.analyzeText(cleanedText);
    const mindmap = this.createMindMapFromRealContent(analysis, style, complexity);
    
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
    console.log('📊 Phân tích văn bản thực tế...');
    
    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    const wordFreq = this.calculateWordFrequency(words);
    const keywords = this.extractKeywords(wordFreq);
    
    console.log('✅ Phân tích hoàn thành:', {
      sentences: sentences.length,
      words: words.length,
      keywords: keywords
    });
    
    return {
      sentences,
      words,
      wordFreq,
      keywords,
      totalSentences: sentences.length,
      totalWords: words.length
    };
  }

  splitSentences(text) {
    if (!text) return [];
    return text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5)
      .slice(0, 20); // Giới hạn số câu để xử lý
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

  // PHƯƠNG PHÁP MỚI: Tạo sơ đồ HOÀN TOÀN từ nội dung thực
  createMindMapFromRealContent(analysis, style, complexity) {
    console.log('🎯 Tạo sơ đồ từ nội dung THẬT...');
    
    const centralTopic = this.extractCentralTopic(analysis);
    const branchCount = this.getBranchCount(complexity);
    const mainBranches = this.extractRealBranches(analysis, branchCount, style);
    
    const result = {
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
        version: "REAL CONTENT 1.0"
      }
    };
    
    console.log('✅ Sơ đồ thực tế được tạo:', {
      centralTopic: result.centralTopic,
      branches: result.mainBranches.length,
      source: 'NỘI DUNG NGƯỜI DÙNG'
    });
    
    return result;
  }

  extractCentralTopic(analysis) {
    if (!analysis.sentences || analysis.sentences.length === 0) {
      return "Nội dung chính";
    }
    
    // Tìm câu đầu tiên có ý nghĩa làm chủ đề trung tâm
    let centralTopic = analysis.sentences[0];
    
    // Ưu tiên câu dài hơn, có chứa từ khóa quan trọng
    for (let sentence of analysis.sentences) {
      if (sentence.length > 20 && this.containsImportantKeywords(sentence, analysis.keywords)) {
        centralTopic = sentence;
        break;
      }
    }
    
    // Giới hạn độ dài
    if (centralTopic.length > 50) {
      centralTopic = centralTopic.substring(0, 50) + '...';
    }
    
    return centralTopic;
  }

  containsImportantKeywords(sentence, keywords) {
    const sentenceLower = sentence.toLowerCase();
    return keywords.slice(0, 3).some(keyword => 
      sentenceLower.includes(keyword.toLowerCase())
    );
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

  // TRÍCH XUẤT NHÁNH THỰC TỪ NỘI DUNG
  extractRealBranches(analysis, branchCount, style) {
    console.log('🌿 Trích xuất nhánh thực từ nội dung...');
    
    const branches = [];
    const usedKeywords = new Set();
    
    // Tạo nhánh từ các từ khóa quan trọng + câu liên quan
    analysis.keywords.slice(0, branchCount * 2).forEach((keyword, index) => {
      if (branches.length >= branchCount) return;
      if (usedKeywords.has(keyword)) return;
      
      const relatedContent = this.findRelatedContent(keyword, analysis.sentences);
      if (relatedContent.length === 0) return;
      
      const branchTitle = this.createRealBranchTitle(keyword, style, index);
      const subTopics = this.extractRealSubTopics(relatedContent);
      
      if (subTopics.length > 0) {
        branches.push({
          title: branchTitle,
          subTopics: subTopics.slice(0, 4) // Tối đa 4 subtopic
        });
        
        usedKeywords.add(keyword);
        console.log(`✅ Đã tạo nhánh: "${branchTitle}" từ từ khóa: "${keyword}"`);
      }
    });
    
    // Nếu không đủ nhánh, tạo từ các câu còn lại
    if (branches.length < branchCount) {
      console.log('🔄 Bổ sung nhánh từ câu còn lại...');
      this.createBranchesFromRemainingSentences(analysis, branches, branchCount, style);
    }
    
    console.log(`✅ Đã tạo ${branches.length} nhánh thực tế`);
    return branches;
  }

  findRelatedContent(keyword, sentences) {
    const keywordLower = keyword.toLowerCase();
    return sentences.filter(sentence => 
      sentence.toLowerCase().includes(keywordLower)
    ).slice(0, 5); // Giới hạn 5 câu liên quan
  }

  createRealBranchTitle(keyword, style, index) {
    const styleFormats = {
      'academic': ['Phân tích', 'Nghiên cứu', 'Khái niệm', 'Ứng dụng'],
      'creative': ['Ý tưởng', 'Giải pháp', 'Phát triển', 'Sáng tạo'],
      'business': ['Chiến lược', 'Kế hoạch', 'Giải pháp', 'Triển khai'],
      'balanced': ['Khía cạnh', 'Góc nhìn', 'Phương diện', 'Ứng dụng']
    };
    
    const prefixes = styleFormats[style] || styleFormats.balanced;
    const prefix = prefixes[index % prefixes.length];
    
    return `${prefix} ${this.capitalizeFirst(keyword)}`;
  }

  extractRealSubTopics(relatedSentences) {
    return relatedSentences
      .map(sentence => {
        // Làm sạch và rút gọn câu
        let cleanSentence = sentence.trim();
        
        // Loại bỏ các từ dư thừa ở đầu câu
        cleanSentence = cleanSentence.replace(/^(và|nhưng|tuy nhiên|do đó|vì vậy)\s+/i, '');
        
        // Giới hạn độ dài
        if (cleanSentence.length > 60) {
          cleanSentence = cleanSentence.substring(0, 60) + '...';
        }
        
        return cleanSentence;
      })
      .filter(sentence => sentence.length > 10) // Chỉ lấy câu có ý nghĩa
      .slice(0, 4); // Giới hạn số lượng
  }

  createBranchesFromRemainingSentences(analysis, branches, branchCount, style) {
    const usedSentences = new Set();
    
    // Thu thập tất cả câu đã dùng
    branches.forEach(branch => {
      branch.subTopics.forEach(subTopic => {
        usedSentences.add(subTopic);
      });
    });
    
    // Tìm câu chưa dùng
    const unusedSentences = analysis.sentences.filter(sentence => 
      !usedSentences.has(sentence) && sentence.length > 15
    );
    
    // Tạo nhánh mới từ câu chưa dùng
    unusedSentences.slice(0, branchCount - branches.length).forEach((sentence, index) => {
      if (branches.length >= branchCount) return;
      
      const branchTitle = this.createBranchFromSentence(sentence, style, branches.length);
      const subTopics = this.extractSubTopicsFromSentence(sentence);
      
      branches.push({
        title: branchTitle,
        subTopics: subTopics
      });
      
      console.log(`✅ Bổ sung nhánh từ câu: "${branchTitle}"`);
    });
  }

  createBranchFromSentence(sentence, style, index) {
    const prefixes = {
      'academic': ['Quan điểm', 'Nhận định', 'Phát hiện'],
      'creative': ['Góc nhìn', 'Ý tưởng', 'Phát hiện'],
      'business': ['Quan điểm', 'Phân tích', 'Đề xuất'],
      'balanced': ['Quan điểm', 'Nhận định', 'Thông tin']
    };
    
    const prefixList = prefixes[style] || prefixes.balanced;
    const prefix = prefixList[index % prefixList.length];
    
    // Rút gọn câu để làm tiêu đề
    let title = sentence.length > 30 ? sentence.substring(0, 30) + '...' : sentence;
    
    return `${prefix}: ${title}`;
  }

  extractSubTopicsFromSentence(sentence) {
    // Tách câu thành các ý nhỏ hơn (nếu có)
    const subPoints = sentence.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 5);
    
    if (subPoints.length > 1) {
      return subPoints.slice(0, 3).map(point => {
        if (point.length > 40) {
          return point.substring(0, 40) + '...';
        }
        return point;
      });
    }
    
    // Nếu không thể tách, trả về chính câu đó (đã rút gọn)
    return [sentence.length > 50 ? sentence.substring(0, 50) + '...' : sentence];
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
  console.log('=== FREE AI MIND MAP BOT - REAL CONTENT MODE ===');
  
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
    
    console.log('🤖 FREE AI Bot processing REAL user text, length:', processedText.length);
    console.log('📝 Text sample:', processedText.substring(0, 100) + '...');
    
    // Khởi tạo và chạy AI Bot
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ FREE AI Bot completed successfully - USING REAL CONTENT');
    console.log('📊 Generated from REAL content:', {
      centralTopic: mindmapData.centralTopic,
      branchCount: mindmapData.mainBranches.length,
      source: 'USER PROVIDED TEXT'
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
