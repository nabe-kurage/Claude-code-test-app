import { ClipboardManager } from './clipboard.js';

/**
 * シェア機能クラス
 * Web Share API とSNSシェア機能を提供
 */
export class ShareManager {
    constructor() {
        this.clipboardManager = new ClipboardManager();
    }

    /**
     * コンテンツをシェアする
     * @param {string} emojis - シェアする絵文字
     * @param {string} inputText - 元の入力テキスト
     * @param {string} url - シェアするURL（オプション）
     * @returns {Promise<boolean>} シェアが成功したかどうか
     */
    async shareContent(emojis, inputText, url = window.location.href) {
        if (!emojis || !inputText) {
            throw new Error('シェアするコンテンツが無効です');
        }

        const shareText = `「${inputText}」→ ${emojis}`;
        
        try {
            // Web Share API を試行（モバイル対応）
            if (this.isWebShareSupported()) {
                await navigator.share({
                    title: '絵文字検索アプリ',
                    text: shareText,
                    url: url
                });
                return true;
            } else {
                // フォールバック: シェアメニューを表示
                this.showShareMenu(shareText, url);
                return true;
            }
        } catch (error) {
            console.error('Web Share API エラー:', error);
            // フォールバック: シェアメニューを表示
            this.showShareMenu(shareText, url);
            return false;
        }
    }

    /**
     * シェアメニューを表示
     * @param {string} shareText - シェアテキスト
     * @param {string} shareUrl - シェアURL
     */
    showShareMenu(shareText, shareUrl) {
        // 既存のシェアメニューを削除
        this.removeExistingShareMenu();

        const shareButton = document.getElementById('shareButton');
        if (!shareButton) {
            console.error('シェアボタンが見つかりません');
            return;
        }

        // シェアメニューを作成
        const shareMenu = this.createShareMenu(shareText, shareUrl);
        
        // シェアボタンの位置に追加
        shareButton.style.position = 'relative';
        shareButton.appendChild(shareMenu);
        
        // 表示アニメーション
        setTimeout(() => {
            shareMenu.classList.add('visible');
        }, 10);
        
        // 自動で非表示（5秒後）
        setTimeout(() => {
            this.removeShareMenu(shareMenu);
        }, 5000);
        
        // 他の場所をクリックした時に非表示
        this.setupOutsideClickListener(shareMenu, shareButton);
    }

    /**
     * シェアメニューのHTML要素を作成
     * @param {string} shareText - シェアテキスト
     * @param {string} shareUrl - シェアURL
     * @returns {HTMLElement} シェアメニュー要素
     */
    createShareMenu(shareText, shareUrl) {
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        
        // Twitter シェアリンク
        const twitterLink = document.createElement('a');
        twitterLink.href = this.getTwitterShareUrl(shareText, shareUrl);
        twitterLink.target = '_blank';
        twitterLink.className = 'share-option';
        twitterLink.textContent = '🐦 Twitter でシェア';
        
        // LINE シェアリンク
        const lineLink = document.createElement('a');
        lineLink.href = this.getLineShareUrl(shareText, shareUrl);
        lineLink.target = '_blank';
        lineLink.className = 'share-option';
        lineLink.textContent = '💚 LINE でシェア';
        
        // コピーボタン
        const copyButton = document.createElement('button');
        copyButton.className = 'share-option';
        copyButton.textContent = '📋 テキストをコピー';
        copyButton.addEventListener('click', () => {
            this.copyShareText(shareText);
        });
        
        // 要素を追加
        shareMenu.appendChild(twitterLink);
        shareMenu.appendChild(lineLink);
        shareMenu.appendChild(copyButton);
        
        return shareMenu;
    }

    /**
     * Twitter シェアURLを生成
     * @param {string} text - シェアテキスト
     * @param {string} url - シェアURL
     * @returns {string} Twitter シェアURL
     */
    getTwitterShareUrl(text, url) {
        const params = new URLSearchParams({
            text: text,
            url: url
        });
        return `https://twitter.com/intent/tweet?${params.toString()}`;
    }

    /**
     * LINE シェアURLを生成
     * @param {string} text - シェアテキスト
     * @param {string} url - シェアURL
     * @returns {string} LINE シェアURL
     */
    getLineShareUrl(text, url) {
        const params = new URLSearchParams({
            url: url,
            text: text
        });
        return `https://social-plugins.line.me/lineit/share?${params.toString()}`;
    }

    /**
     * シェアテキストをコピー
     * @param {string} text - コピーするテキスト
     */
    async copyShareText(text) {
        try {
            const success = await this.clipboardManager.copyToClipboard(text);
            if (success) {
                // 成功通知を発火
                const event = new CustomEvent('notification-show', {
                    detail: { message: 'シェア用テキストをコピーしました! 📋', type: 'success' }
                });
                document.dispatchEvent(event);
            } else {
                throw new Error('コピーに失敗しました');
            }
        } catch (error) {
            console.error('シェアテキストコピーエラー:', error);
            // エラー通知を発火
            const event = new CustomEvent('notification-show', {
                detail: { message: 'コピーに失敗しました', type: 'error' }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * 既存のシェアメニューを削除
     */
    removeExistingShareMenu() {
        const existingMenu = document.querySelector('.share-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    /**
     * シェアメニューを削除
     * @param {HTMLElement} shareMenu - 削除するシェアメニュー
     */
    removeShareMenu(shareMenu) {
        if (shareMenu && shareMenu.parentNode) {
            shareMenu.remove();
        }
    }

    /**
     * 外部クリック時の非表示リスナーを設定
     * @param {HTMLElement} shareMenu - シェアメニュー
     * @param {HTMLElement} shareButton - シェアボタン
     */
    setupOutsideClickListener(shareMenu, shareButton) {
        const hideMenu = (event) => {
            if (!shareButton.contains(event.target)) {
                this.removeShareMenu(shareMenu);
                document.removeEventListener('click', hideMenu);
            }
        };
        
        // 少し遅延してイベントリスナーを追加（同じクリックイベントを避けるため）
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
        }, 100);
    }

    /**
     * Web Share API が利用可能かチェック
     * @returns {boolean} 利用可能かどうか
     */
    isWebShareSupported() {
        return !!(navigator.share);
    }

    /**
     * 現在の環境がモバイルかチェック
     * @returns {boolean} モバイルかどうか
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}