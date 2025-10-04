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
    const mindmap = this.createMindMapStructure(analysis, style, complexity);
    
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
    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    const wordFreq = this.calculateWordFrequency(words);
    const keywords = this.extractKeywords(wordFreq);
    const scoredSentences = this.scoreSentences(sentences, wordFreq);
    const topics = this.groupSentencesByTopic(scoredSentences, keywords);
    
    return {
      sentences,
      words,
      wordFreq,
      keywords,
      scoredSentences,
      topics,
      totalSentences: sentences.length,
      totalWords: words.length
    };
  }

  splitSentences(text) {
    if (!text) return [];
    return text.split(/[.!?]+/).filter(s => s.trim().length > 5);
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
      .slice(0, 15)
      .map(item => item.word);
  }

  scoreSentences(sentences, wordFreq) {
    const totalFrequency = Object.values(wordFreq).reduce((a, b) => a + b, 0);
    if (totalFrequency === 0) return sentences.map(s => ({ text: s, score: 0, wordCount: 0 }));
    
    return sentences.map(sentence => {
      const sentenceWords = this.extractWords(sentence);
      let score = 0;
      
      sentence
