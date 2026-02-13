/**
 * 字数统计与转换工具
 */

/**
 * 统计文本中的字数（支持中英文混合）
 * @param text 要统计的文本
 * @returns 字数
 */
export function countWords(text: string): number {
  if (!text) return 0;
  
  // 匹配中文字符
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  // 匹配英文字符和数字（按单词统计）
  const englishWords = text.match(/[a-zA-Z0-9]+/g) || [];
  // 匹配标点符号和空格（不统计）
  
  return chineseChars.length + englishWords.length;
}

/**
 * 字数转页数
 * @param words 字数
 * @param wordsPerPage 每页字数（默认400字/页）
 * @returns 页数
 */
export function wordsToPages(words: number, wordsPerPage: number = 400): number {
  return Math.ceil(words / wordsPerPage);
}

/**
 * 页数转字数
 * @param pages 页数
 * @param wordsPerPage 每页字数（默认400字/页）
 * @returns 字数
 */
export function pagesToWords(pages: number, wordsPerPage: number = 400): number {
  return Math.round(pages * wordsPerPage);
}

/**
 * 计算章节权重（基于层级和重要性）
 * @param level 章节层级（1-3级）
 * @returns 权重值
 */
export function calculateChapterWeight(level: number): number {
  switch (level) {
    case 1:
      return 0.4; // 一级章节占40%
    case 2:
      return 0.3; // 二级章节占30%
    case 3:
      return 0.2; // 三级章节占20%
    default:
      return 0.1; // 其他占10%
  }
}

/**
 * 智能分配字数到各章节
 * @param totalWords 总字数
 * @param chapters 章节列表
 * @returns 各章节的字数分配
 */
export function distributeWords(totalWords: number, chapters: any[]): any[] {
  const totalWeight = chapters.reduce((sum, chapter) => {
    const level = getChapterLevel(chapter.id);
    return sum + calculateChapterWeight(level);
  }, 0);

  return chapters.map(chapter => {
    const level = getChapterLevel(chapter.id);
    const weight = calculateChapterWeight(level);
    const allocatedWords = Math.round(totalWords * (weight / totalWeight));
    
    return {
      chapterId: chapter.id,
      allocatedWords,
      allocatedPages: wordsToPages(allocatedWords)
    };
  });
}

/**
 * 从章节ID获取层级
 * @param chapterId 章节ID
 * @returns 层级（1-3级）
 */
function getChapterLevel(chapterId: string): number {
  // 假设章节ID格式为 "1.1.1" 或 "1-1-1"
  const parts = chapterId.split(/[.-]/);
  return parts.length;
}

/**
 * 格式化字数显示
 * @param words 字数
 * @returns 格式化后的字符串
 */
export function formatWordCount(words: number): string {
  if (words >= 10000) {
    return `${(words / 10000).toFixed(1)}万字`;
  } else if (words >= 1000) {
    return `${(words / 1000).toFixed(1)}千字`;
  } else {
    return `${words}字`;
  }
}

/**
 * 格式化页数显示
 * @param pages 页数
 * @returns 格式化后的字符串
 */
export function formatPageCount(pages: number): string {
  return `${pages}页`;
}
