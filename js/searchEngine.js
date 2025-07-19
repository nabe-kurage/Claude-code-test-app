import { emojiDictionary, fallbackEmoji } from './emojiDictionary.js';

/**
 * 検索エンジンクラス
 * テキスト入力から絵文字への変換機能を提供
 */
export class SearchEngine {
    /**
     * テキストを絵文字に変換する
     * @param {string} inputText - 入力テキスト
     * @returns {string} 変換された絵文字文字列
     */
    searchEmojis(inputText) {
        if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
            return '';
        }
        
        // スペースで区切ってキーワードを分割
        const keywords = inputText.trim().split(/\s+/);
        
        // 各キーワードに対応する絵文字を検索
        const emojis = keywords.map(keyword => {
            const normalizedKeyword = keyword.toLowerCase();
            return emojiDictionary[normalizedKeyword] || fallbackEmoji;
        });
        
        return emojis.join(' ');
    }

    /**
     * 辞書に登録されているキーワード数を取得
     * @returns {number} キーワード数
     */
    getDictionarySize() {
        return Object.keys(emojiDictionary).length;
    }

    /**
     * 特定のキーワードが辞書に存在するかチェック
     * @param {string} keyword - チェックするキーワード
     * @returns {boolean} 存在するかどうか
     */
    hasKeyword(keyword) {
        if (!keyword || typeof keyword !== 'string') {
            return false;
        }
        return keyword.toLowerCase() in emojiDictionary;
    }

    /**
     * 部分一致するキーワードを検索
     * @param {string} partialKeyword - 部分キーワード
     * @param {number} limit - 結果の最大数（デフォルト: 10）
     * @returns {Array<{keyword: string, emoji: string}>} マッチした結果の配列
     */
    findSimilarKeywords(partialKeyword, limit = 10) {
        if (!partialKeyword || typeof partialKeyword !== 'string') {
            return [];
        }
        
        const searchTerm = partialKeyword.toLowerCase();
        const matches = [];
        
        for (const [keyword, emoji] of Object.entries(emojiDictionary)) {
            if (keyword.includes(searchTerm)) {
                matches.push({ keyword, emoji });
                if (matches.length >= limit) {
                    break;
                }
            }
        }
        
        return matches;
    }
}