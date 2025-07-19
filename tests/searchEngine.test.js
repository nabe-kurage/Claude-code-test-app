import { SearchEngine } from '../js/searchEngine.js';

describe('SearchEngine', () => {
  let searchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('searchEmojis', () => {
    test('単一キーワードで正しい絵文字を返す', () => {
      expect(searchEngine.searchEmojis('嬉しい')).toBe('😊');
      expect(searchEngine.searchEmojis('悲しい')).toBe('😢');
      expect(searchEngine.searchEmojis('猫')).toBe('🐱');
    });

    test('複数キーワードをスペース区切りで処理', () => {
      const result = searchEngine.searchEmojis('嬉しい 猫');
      expect(result).toBe('😊 🐱');
    });

    test('未知のキーワードにフォールバック絵文字を返す', () => {
      const result = searchEngine.searchEmojis('存在しないキーワード');
      expect(result).toBe('❓🤔');
    });

    test('混在したキーワード（既知と未知）を正しく処理', () => {
      const result = searchEngine.searchEmojis('嬉しい 存在しない 猫');
      expect(result).toBe('😊 ❓🤔 🐱');
    });

    test('空文字列で空文字を返す', () => {
      expect(searchEngine.searchEmojis('')).toBe('');
      expect(searchEngine.searchEmojis(' ')).toBe('');
      expect(searchEngine.searchEmojis('   ')).toBe('');
    });

    test('null や undefined で空文字を返す', () => {
      expect(searchEngine.searchEmojis(null)).toBe('');
      expect(searchEngine.searchEmojis(undefined)).toBe('');
    });

    test('数値を渡した場合の処理', () => {
      expect(searchEngine.searchEmojis(123)).toBe('');
    });

    test('大文字小文字を区別しない', () => {
      expect(searchEngine.searchEmojis('ネコ')).toBe('🐱');
      expect(searchEngine.searchEmojis('ねこ')).toBe('🐱');
    });

    test('連続スペースを正しく処理', () => {
      const result = searchEngine.searchEmojis('嬉しい   猫');
      expect(result).toBe('😊 🐱');
    });

    test('前後のスペースを正しく処理', () => {
      const result = searchEngine.searchEmojis(' 嬉しい 猫 ');
      expect(result).toBe('😊 🐱');
    });
  });

  describe('getDictionarySize', () => {
    test('辞書のサイズが正の数を返す', () => {
      const size = searchEngine.getDictionarySize();
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('辞書のサイズが期待される範囲内', () => {
      const size = searchEngine.getDictionarySize();
      expect(size).toBeGreaterThanOrEqual(800); // 最低限の語数
      expect(size).toBeLessThanOrEqual(1000); // 現実的な上限
    });
  });

  describe('hasKeyword', () => {
    test('存在するキーワードでtrueを返す', () => {
      expect(searchEngine.hasKeyword('嬉しい')).toBe(true);
      expect(searchEngine.hasKeyword('猫')).toBe(true);
      expect(searchEngine.hasKeyword('太陽')).toBe(true);
    });

    test('存在しないキーワードでfalseを返す', () => {
      expect(searchEngine.hasKeyword('存在しない')).toBe(false);
      expect(searchEngine.hasKeyword('unknown')).toBe(false);
    });

    test('大文字小文字を区別しない', () => {
      expect(searchEngine.hasKeyword('ネコ')).toBe(true);
      expect(searchEngine.hasKeyword('ねこ')).toBe(true);
    });

    test('無効な入力でfalseを返す', () => {
      expect(searchEngine.hasKeyword(null)).toBe(false);
      expect(searchEngine.hasKeyword(undefined)).toBe(false);
      expect(searchEngine.hasKeyword('')).toBe(false);
      expect(searchEngine.hasKeyword(123)).toBe(false);
    });
  });

  describe('findSimilarKeywords', () => {
    test('部分一致するキーワードを返す', () => {
      const results = searchEngine.findSimilarKeywords('猫');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(item => item.keyword.includes('猫'))).toBe(true);
      expect(results.every(item => typeof item.emoji === 'string')).toBe(true);
    });

    test('制限数を正しく適用', () => {
      const results = searchEngine.findSimilarKeywords('い', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    test('マッチしない場合は空配列を返す', () => {
      const results = searchEngine.findSimilarKeywords('xyz123');
      expect(results).toEqual([]);
    });

    test('無効な入力で空配列を返す', () => {
      expect(searchEngine.findSimilarKeywords(null)).toEqual([]);
      expect(searchEngine.findSimilarKeywords(undefined)).toEqual([]);
      expect(searchEngine.findSimilarKeywords('')).toEqual([]);
    });

    test('結果の形式が正しい', () => {
      const results = searchEngine.findSimilarKeywords('嬉', 1);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('keyword');
        expect(results[0]).toHaveProperty('emoji');
        expect(typeof results[0].keyword).toBe('string');
        expect(typeof results[0].emoji).toBe('string');
      }
    });
  });

  describe('エッジケーステスト', () => {
    test('非常に長い入力テキストを処理', () => {
      const longText = '嬉しい '.repeat(100);
      const result = searchEngine.searchEmojis(longText.trim());
      const expected = '😊 '.repeat(99) + '😊';
      expect(result).toBe(expected);
    });

    test('特殊文字を含む入力を処理', () => {
      const result = searchEngine.searchEmojis('嬉しい！猫@#$');
      // 区切り文字として認識されない特殊文字は単一キーワードとして扱われる
      expect(result).toBe('❓🤔');
    });

    test('数字を含むキーワード', () => {
      const result = searchEngine.searchEmojis('嬉しい123');
      expect(result).toBe('❓🤔');
    });

    test('タブや改行文字を含む入力', () => {
      const result = searchEngine.searchEmojis('嬉しい\t猫\n犬');
      expect(result).toBe('❓🤔');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量検索のパフォーマンス', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        searchEngine.searchEmojis('嬉しい 悲しい 猫 犬');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 1000回の検索が1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
    });
  });
});