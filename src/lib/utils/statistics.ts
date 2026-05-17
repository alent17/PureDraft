interface DocumentStats {
  wordCount: number;
  charCount: number;
  charCountNoSpaces: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  selectedWordCount: number;
}

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
const WORD_REGEX = /[a-zA-Z0-9]+/g;

export function getDocumentStats(content: string, selectedText?: string): DocumentStats {
  if (!content) {
    return { wordCount: 0, charCount: 0, charCountNoSpaces: 0, paragraphCount: 0, readingTimeMinutes: 0, selectedWordCount: 0 };
  }

  const charCount = content.length;
  const charCountNoSpaces = content.replace(/\s/g, '').length;

  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const cjkCount = (content.match(CJK_REGEX) || []).length;

  const nonCjkText = content.replace(CJK_REGEX, ' ');
  const wordMatches = nonCjkText.match(WORD_REGEX) || [];
  const wordCount = cjkCount + wordMatches.length;

  const cjkReadingSpeed = 300;
  const wordReadingSpeed = 200;
  const readingTimeMinutes = Math.max(1, Math.ceil((cjkCount / cjkReadingSpeed + wordMatches.length / wordReadingSpeed) * 10) / 10);

  let selectedWordCount = 0;
  if (selectedText) {
    const selectedCjk = (selectedText.match(CJK_REGEX) || []).length;
    const selectedNonCjk = selectedText.replace(CJK_REGEX, ' ');
    const selectedWords = (selectedNonCjk.match(WORD_REGEX) || []).length;
    selectedWordCount = selectedCjk + selectedWords;
  }

  return {
    wordCount,
    charCount,
    charCountNoSpaces,
    paragraphCount,
    readingTimeMinutes,
    selectedWordCount,
  };
}
