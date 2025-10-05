// netlify/functions/ai-mindmap-bot.js
const MindMapAIBot = class {
  constructor() {
    this.vietnameseStopWords = new Set([
      'và', 'của', 'là', 'có', 'được', 'trong', 'ngoài', 'trên', 'dưới', 'với',
      'như', 'theo', 'từ', 'về', 'sau', 'trước', 'khi', 'nếu', 'thì', 'mà',
      'này', 'đó', 'kia', 'ai', 'gì', 'nào', 'sao', 'vì', 'tại', 'do', 'bởi'
    ]);
  }

  generateMindMap(text, style = 'balanced', complexity = 'medium') {
    console.log('🤖 AI Bot đang xử lý...');
    
    try {
      const cleanedText = this.cleanText(text);
      const analysis = this.quickAnalyzeText(cleanedText);
      const mindmap = this.createSimpleMindMap(analysis, style, complexity);
      
      return mindmap;
    } catch (error) {
      console.error('❌ Lỗi trong generateMindMap:', error);
      return this.createFallbackMindMap(text);
    }
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/[^\w\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ.,!?]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  quickAnalyzeText(text) {
    console.log('📊 Phân tích nhanh...');
    
    // Giới hạn xử lý để tránh timeout
    const limitedText = text.substring(0, 1000);
    
    const sentences = limitedText.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 15);

    const paragraphs = limitedText.split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .slice(0, 5);

    const keyPhrases = this.extractSimpleKeyPhrases(sentences);
    
    return {
      sentences,
      paragraphs, 
      keyPhrases,
      totalSentences: sentences.length,
      totalParagraphs: paragraphs.length
    };
  }

  extractSimpleKeyPhrases(sentences) {
    const phrases = [];
    
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).filter(word => 
        word.length > 2 && !this.vietnameseStopWords.has(word.toLowerCase())
      );
      
      // Chỉ lấy cụm từ đơn giản
      for (let i = 0; i < words.length - 1; i++) {
        const twoWordPhrase = `${words[i]} ${words[i+1]}`;
        if (twoWordPhrase.length > 5 && twoWordPhrase.length < 25) {
          phrases.push(twoWordPhrase);
          if (phrases.length >= 10) break;
        }
      }
    });
    
    return phrases.slice(0, 10);
  }

  createSimpleMindMap(analysis, style, complexity) {
    console.log('🏗️ Tạo mind map đơn giản...');
    
    const centralTopic = this.getSimpleCentralTopic(analysis);
    const branches = this.createSimpleBranches(analysis, complexity);
    
    return {
      centralTopic,
      mainBranches: branches,
      analysis: {
        totalSentences: analysis.totalSentences,
        totalParagraphs: analysis.totalParagraphs,
        confidence: Math.min(0.7 + (analysis.totalSentences * 0.02), 0.9)
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖",
        style: style,
        complexity: complexity,
        timestamp: new Date().toISOString(),
        version: "SIMPLE 1.0"
      }
    };
  }

  getSimpleCentralTopic(analysis) {
    if (!analysis.sentences || analysis.sentences.length === 0) {
      return "Nội dung chính";
    }
    
    let topic = analysis.sentences[0];
    
    // Tìm câu ngắn gọn hơn
    for (let i = 0; i < Math.min(3, analysis.sentences.length); i++) {
      if (analysis.sentences[i].length < 50) {
        topic = analysis.sentences[i];
        break;
      }
    }
    
    if (topic.length > 40) {
      topic = topic.substring(0, 40) + '...';
    }
    
    return topic;
  }

  createSimpleBranches(analysis, complexity) {
    const branchCount = this.getSimpleBranchCount(complexity);
    const branches = [];
    
    // Sử dụng các câu đầu tiên làm nhánh chính
    for (let i = 0; i < Math.min(branchCount, analysis.sentences.length); i++) {
      if (i === 0) continue; // Bỏ qua câu đầu (đã dùng làm central topic)
      
      const branch = this.createSimpleBranch(analysis.sentences[i], analysis, i);
      if (branch) {
        branches.push(branch);
      }
    }
    
    // Nếu không đủ nhánh, tạo thêm từ key phrases
    if (branches.length < branchCount && analysis.keyPhrases.length > 0) {
      for (let i = 0; i < Math.min(analysis.keyPhrases.length, branchCount - branches.length); i++) {
        branches.push({
          title: `Khía cạnh: ${analysis.keyPhrases[i]}`,
          subTopics: this.getSimpleSubTopics(analysis, analysis.keyPhrases[i])
        });
      }
    }
    
    return branches.slice(0, branchCount);
  }

  createSimpleBranch(sentence, analysis, index) {
    const branchTitle = this.createBranchTitle(sentence, index);
    const subTopics = this.getSimpleSubTopics(analysis, sentence);
    
    if (subTopics.length === 0) {
      return null;
    }
    
    return {
      title: branchTitle,
      subTopics: subTopics.slice(0, 3) // Chỉ 3 subtopic mỗi nhánh
    };
  }

  createBranchTitle(sentence, index) {
    const prefixes = ['Đặc điểm', 'Ứng dụng', 'Phương diện', 'Vấn đề', 'Giải pháp'];
    const prefix = prefixes[index % prefixes.length];
    
    let title = sentence;
    if (title.length > 30) {
      title = title.substring(0, 30) + '...';
    }
    
    return `${prefix}: ${title}`;
  }

  getSimpleSubTopics(analysis, theme) {
    const subTopics = [];
    const themeLower = theme.toLowerCase();
    
    // Tìm các câu liên quan đơn giản
    analysis.sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(themeLower) && sentence !== theme) {
        let subTopic = sentence;
        if (subTopic.length > 50) {
          subTopic = subTopic.substring(0, 50) + '...';
        }
        if (subTopic.length > 10) {
          subTopics.push(subTopic);
        }
      }
    });
    
    // Thêm key phrases liên quan
    analysis.keyPhrases.forEach(phrase => {
      if (phrase.toLowerCase().includes(themeLower) && phrase !== theme) {
        subTopics.push(phrase);
      }
    });
    
    return subTopics.slice(0, 4);
  }

  getSimpleBranchCount(complexity) {
    const counts = {
      'simple': 2,
      'medium': 3,
      'detailed': 4,
      'comprehensive': 4 // Giảm xuống để đơn giản
    };
    return counts[complexity] || 3;
  }

  createFallbackMindMap(text) {
    console.log('🔄 Sử dụng fallback mind map');
    
    const limitedText = text.substring(0, 100);
    
    return {
      centralTopic: limitedText.length > 30 ? limitedText.substring(0, 30) + '...' : limitedText,
      mainBranches: [
        {
          title: "Nội dung chính",
          subTopics: [
            "Thông tin cơ bản",
            "Đặc điểm nổi bật", 
            "Ứng dụng thực tế"
          ]
        },
        {
          title: "Phân tích",
          subTopics: [
            "Ưu điểm",
            "Hạn chế",
            "Giải pháp"
          ]
        }
      ],
      analysis: {
        totalSentences: 1,
        totalParagraphs: 1,
        confidence: 0.5
      },
      metadata: {
        generatedBy: "AI Mind Map Bot 🤖 (Fallback Mode)",
        style: "balanced",
        complexity: "simple",
        timestamp: new Date().toISOString(),
        version: "FALLBACK 1.0"
      }
    };
  }
};

// Export function chính - TỐI ƯU CHO NETLIFY
exports.handler = async (event) => {
  console.log('=== AI MIND MAP BOT - SIMPLE MODE ===');
  
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
    console.log('📥 Nhận dữ liệu...');
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }

    const { text, style = 'balanced', complexity = 'medium' } = parsedBody;

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text parameter is required' })
      };
    }

    // GIỚI HẠN NGHIÊM NGẶT để tránh timeout
    const processedText = text.length > 800 ? text.substring(0, 800) : text;
    
    console.log('🤖 Bắt đầu xử lý, độ dài:', processedText.length);
    
    // Khởi tạo và chạy AI Bot - ĐƠN GIẢN HÓA
    const aiBot = new MindMapAIBot();
    const mindmapData = aiBot.generateMindMap(processedText, style, complexity);
    
    console.log('✅ Hoàn thành - SIMPLE MODE');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmapData)
    };

  } catch (error) {
    console.error('❌ Lỗi tổng:', error);
    
    // Trả về fallback response ngay cả khi có lỗi
    const aiBot = new MindMapAIBot();
    const fallbackData = aiBot.createFallbackMindMap(event.body?.text || 'Nội dung');
    
    return {
      statusCode: 200, // Vẫn trả về 200 với fallback data
      headers,
      body: JSON.stringify(fallbackData)
    };
  }
};
