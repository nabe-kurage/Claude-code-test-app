import { SearchEngine } from './searchEngine.js';
import { UIManager } from './uiManager.js';
import { ClipboardManager } from './clipboard.js';
import { ShareManager } from './share.js';
import { NotificationManager } from './notification.js';

/**
 * メインアプリケーションクラス
 * 全てのモジュールを統合し、アプリケーションの動作を制御
 */
class EmojiSearchApp {
    constructor() {
        this.searchEngine = new SearchEngine();
        this.uiManager = new UIManager();
        this.clipboardManager = new ClipboardManager();
        this.shareManager = new ShareManager();
        this.notificationManager = new NotificationManager();
        
        this.setupEventListeners();
        this.setupGlobalObjects();
        this.logInitialization();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // カスタム検索イベント
        document.addEventListener('search-requested', (event) => {
            this.performSearch(event.detail.inputText);
        });

        // UI コントロールボタンのイベント
        this.uiManager.onSearchButtonClick(() => {
            this.performSearch();
        });

        this.uiManager.onCopyButtonClick(() => {
            this.handleCopyAction();
        });

        this.uiManager.onShareButtonClick(() => {
            this.handleShareAction();
        });
    }

    /**
     * グローバルオブジェクトを設定（onclick属性などで使用）
     */
    setupGlobalObjects() {
        window.shareManager = this.shareManager;
        window.emojiSearchApp = this;
    }

    /**
     * 検索を実行
     * @param {string} inputText - 検索テキスト（オプション）
     */
    async performSearch(inputText = null) {
        const searchText = inputText || this.uiManager.getInputText();
        
        if (!searchText.trim()) {
            this.uiManager.clearResult();
            return;
        }
        
        // ローディング表示
        this.uiManager.showLoading();
        
        try {
            // 少し遅延を入れてローディング感を演出
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const result = this.searchEngine.searchEmojis(searchText);
            this.uiManager.displayResult(result);
            
        } catch (error) {
            console.error('検索エラー:', error);
            this.notificationManager.showError('検索中にエラーが発生しました');
            this.uiManager.clearResult();
        }
    }

    /**
     * コピーアクションを処理
     */
    async handleCopyAction() {
        const resultText = this.uiManager.getResultText();
        
        if (!resultText || resultText === '検索中...') {
            this.notificationManager.showError('コピーできる絵文字がありません');
            return;
        }
        
        try {
            const success = await this.clipboardManager.copyToClipboard(resultText);
            
            if (success) {
                this.notificationManager.showSuccess('絵文字をコピーしました! 📋');
                
                // ボタンアニメーション
                this.uiManager.animateButtonClick(this.uiManager.elements.copyButton);
                
                // 一時的にボタンテキストを変更
                this.uiManager.temporaryButtonText(
                    this.uiManager.elements.copyButton, 
                    '✅ コピー済み', 
                    2000
                );
            } else {
                throw new Error('コピー操作が失敗しました');
            }
            
        } catch (error) {
            console.error('コピーエラー:', error);
            this.notificationManager.showError('コピーに失敗しました');
        }
    }

    /**
     * シェアアクションを処理
     */
    async handleShareAction() {
        const emojis = this.uiManager.getResultText();
        const inputText = this.uiManager.getInputText();
        
        if (!emojis || emojis === '検索中...') {
            this.notificationManager.showError('シェアできる絵文字がありません');
            return;
        }
        
        try {
            const success = await this.shareManager.shareContent(emojis, inputText);
            
            if (success && this.shareManager.isWebShareSupported()) {
                this.notificationManager.showSuccess('シェアしました! 📤');
            }
            
        } catch (error) {
            console.error('シェアエラー:', error);
            this.notificationManager.showError('シェアに失敗しました');
        }
    }

    /**
     * アプリケーションの初期化ログを出力
     */
    logInitialization() {
        console.log('絵文字検索アプリが読み込まれました');
        console.log(`登録されている絵文字の数: ${this.searchEngine.getDictionarySize()}`);
        console.log(`クリップボード対応: ${this.clipboardManager.isCopySupported() ? 'あり' : 'なし'}`);
        console.log(`Web Share API対応: ${this.shareManager.isWebShareSupported() ? 'あり' : 'なし'}`);
        
        // デバッグ用の機能
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('開発モードで実行中');
            window.debugApp = this;
        }
    }

    /**
     * アプリケーションの統計情報を取得
     * @returns {Object} 統計情報オブジェクト
     */
    getStats() {
        return {
            dictionarySize: this.searchEngine.getDictionarySize(),
            clipboardSupported: this.clipboardManager.isCopySupported(),
            webShareSupported: this.shareManager.isWebShareSupported(),
            currentInput: this.uiManager.getInputText(),
            currentResult: this.uiManager.getResultText()
        };
    }

    /**
     * アプリケーションをリセット
     */
    reset() {
        this.uiManager.setInputText('');
        this.uiManager.clearResult();
        this.notificationManager.hide();
        console.log('アプリケーションがリセットされました');
    }

    /**
     * 検索履歴機能（将来の拡張用）
     * @param {string} searchText - 検索テキスト
     * @param {string} result - 検索結果
     */
    addToHistory(searchText, result) {
        // localStorage を使用した履歴管理（将来実装用）
        const history = JSON.parse(localStorage.getItem('emojiSearchHistory') || '[]');
        const entry = {
            searchText,
            result,
            timestamp: new Date().toISOString()
        };
        
        history.unshift(entry);
        
        // 最大50件まで保持
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('emojiSearchHistory', JSON.stringify(history));
    }

    /**
     * 検索履歴を取得
     * @returns {Array} 検索履歴の配列
     */
    getHistory() {
        return JSON.parse(localStorage.getItem('emojiSearchHistory') || '[]');
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new EmojiSearchApp();
});