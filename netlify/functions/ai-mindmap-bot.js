// netlify/functions/ai-mindmap-bot.js - CẬP NHẬT PHẦN PHÂN TÍCH
class MindMapAIBot {
  // ... (giữ nguyên constructor và các method cơ bản)

  // PHƯƠNG PHÁP TÓM TẮT THÔNG MINH MỚI
  summarizeSentence(sentence, maxWords = 10) {
    const words = this.extractWords(sentence);
    
    // Loại bỏ từ trùng lặp và ít ý nghĩa
    const uniqueWords = [...new Set(words)];
    
    // Ưu tiên từ dài (thường chứa nhiều thông tin hơn)
    const meaningfulWords = uniqueWords
      .filter(word => word.length > 3)
      .sort((a, b) => b.length - a.length)
      .slice(0, maxWords);
    
    // Tạo câu tóm tắt tự nhiên
    if (meaningfulWords.length >= 3) {
      return meaningfulWords.slice(0, 5).join(' ') + '...';
    } else {
      // Nếu không đủ từ quan trọng, cắt ngắn câu gốc
      return sentence.length > 60 ? sentence.substring(0, 60) + '...' : sentence;
    }
  }

  // PHÂN TÍCH VĂN BẢN THÔNG MINH HƠN
  analyzeText(text) {
    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    const wordFreq = this.calculateWordFrequency(words);
    const keywords = this.extractKeywords(wordFreq);
    
    // Tóm tắt các câu thay vì dùng nguyên văn
    const summarizedSentences = sentences.map(sentence => 
      this.summarizeSentence(sentence, 8)
    );
    
    const scoredSentences = this.scoreSentences(sentences, wordFreq);
    const topics = this.groupSentencesByTopic(scoredSentences, keywords);
    
    return {
      sentences: summarizedSentences, // Dùng câu đã tóm tắt
      words,
      wordFreq,
      keywords,
      scoredSentences,
      topics,
      totalSentences: sentences.length,
      totalWords: words.length
    };
  }

  // TẠO SUBTOPICS THÔNG MINH - KHÔNG TRÙNG LẶP
  createSubTopics(relatedSentences, style) {
    const subTopics = new Set(); // Dùng Set để tránh trùng lặp
    
    relatedSentences.forEach(sentence => {
      // Tóm tắt câu thành ý chính
      const summarized = this.summarizeSentence(sentence, 6);
      
      // Đảm bảo không trùng lặp
      if (!subTopics.has(summarized) && summarized.length > 10) {
        subTopics.add(summarized);
      }
    });
    
    // Chuyển Set thành Array và thêm style
    return Array.from(subTopics)
      .slice(0, 4)
      .map(topic => {
        if (style === 'creative') {
          const emojis = ['🌟', '💫', '🔥', '⚡', '🎯', '✨'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          return `${randomEmoji} ${topic}`;
        }
        return topic;
      });
  }

  // XÁC ĐỊNH CHỦ ĐỀ TRUNG TÂM THÔNG MINH HƠN
  determineCentralTopic(analysis) {
    // Tìm câu có điểm cao nhất và tóm tắt nó
    if (analysis.scoredSentences.length > 0) {
      const bestSentence = analysis.scoredSentences[0].text;
      return this.summarizeSentence(bestSentence, 12);
    }
    
    // Fallback: kết hợp từ khóa quan trọng
    const topKeywords = analysis.keywords.slice(0, 3).join(' • ');
    return topKeywords || "Chủ đề phân tích";
  }
}
