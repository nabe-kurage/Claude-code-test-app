/**
 * クリップボード操作クラス
 * テキストのコピー機能を提供
 */
export class ClipboardManager {
    /**
     * テキストをクリップボードにコピーする
     * @param {string} text - コピーするテキスト
     * @returns {Promise<boolean>} コピーが成功したかどうか
     */
    async copyToClipboard(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('コピーするテキストが無効です');
        }

        try {
            // Clipboard API を試行（モダンブラウザ対応）
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // フォールバック: 古いブラウザ対応
                return this.fallbackCopy(text);
            }
        } catch (error) {
            console.error('Clipboard API エラー:', error);
            // フォールバック実行
            return this.fallbackCopy(text);
        }
    }

    /**
     * フォールバック用のコピー実装
     * @param {string} text - コピーするテキスト
     * @returns {boolean} コピーが成功したかどうか
     */
    fallbackCopy(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        } catch (error) {
            console.error('フォールバックコピーエラー:', error);
            return false;
        }
    }

    /**
     * クリップボードからテキストを読み取る（可能な場合）
     * @returns {Promise<string|null>} 読み取ったテキスト、または null
     */
    async readFromClipboard() {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                const text = await navigator.clipboard.readText();
                return text;
            }
        } catch (error) {
            console.error('クリップボード読み取りエラー:', error);
        }
        return null;
    }

    /**
     * Clipboard API が利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isClipboardSupported() {
        return !!(navigator.clipboard && window.isSecureContext);
    }

    /**
     * 実行コマンドによるコピーが利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isExecCommandSupported() {
        return document.queryCommandSupported && document.queryCommandSupported('copy');
    }

    /**
     * 何らかのコピー機能が利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isCopySupported() {
        return this.isClipboardSupported() || this.isExecCommandSupported();
    }
}