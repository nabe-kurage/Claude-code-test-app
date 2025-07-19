/**
 * 通知システムクラス
 * ユーザーへの成功・エラー通知機能を提供
 */
export class NotificationManager {
    constructor() {
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.currentTimeoutId = null;
        
        if (!this.notification || !this.notificationText) {
            console.error('通知要素が見つかりません');
        }

        this.setupEventListeners();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // カスタムイベントリスナー
        document.addEventListener('notification-show', (event) => {
            const { message, type } = event.detail;
            this.show(message, type);
        });

        document.addEventListener('notification-hide', () => {
            this.hide();
        });
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知タイプ（'success', 'error', 'info'）
     * @param {number} duration - 表示時間（ミリ秒、デフォルト: 3000）
     */
    show(message, type = 'success', duration = 3000) {
        if (!this.notification || !this.notificationText) {
            console.error('通知要素が利用できません');
            return;
        }

        // 既存のタイマーをクリア
        this.clearTimer();

        // メッセージとタイプを設定
        this.notificationText.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.style.display = 'block';
        
        // 表示アニメーション
        setTimeout(() => {
            this.notification.classList.add('show');
        }, 50);
        
        // 自動非表示タイマー
        if (duration > 0) {
            this.currentTimeoutId = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    /**
     * 通知を非表示
     */
    hide() {
        if (!this.notification) return;

        this.clearTimer();
        this.notification.classList.remove('show');
        
        setTimeout(() => {
            if (this.notification) {
                this.notification.style.display = 'none';
            }
        }, 300);
    }

    /**
     * 成功通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showSuccess(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    /**
     * エラー通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showError(message, duration = 3000) {
        this.show(message, 'error', duration);
    }

    /**
     * 情報通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showInfo(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    /**
     * 現在のタイマーをクリア
     */
    clearTimer() {
        if (this.currentTimeoutId) {
            clearTimeout(this.currentTimeoutId);
            this.currentTimeoutId = null;
        }
    }

    /**
     * 通知が現在表示されているかチェック
     * @returns {boolean} 表示されているかどうか
     */
    isVisible() {
        return this.notification && this.notification.classList.contains('show');
    }

    /**
     * 通知要素を手動でクリックして閉じる機能を有効化
     */
    enableClickToClose() {
        if (this.notification) {
            this.notification.addEventListener('click', () => {
                this.hide();
            });
            
            // クリック可能であることを示すスタイル
            this.notification.style.cursor = 'pointer';
        }
    }

    /**
     * 複数の通知をキューとして順次表示
     * @param {Array<{message: string, type: string, duration: number}>} notifications - 通知の配列
     */
    async showQueue(notifications) {
        for (const notification of notifications) {
            const { message, type = 'success', duration = 3000 } = notification;
            
            this.show(message, type, 0); // タイマーなしで表示
            
            // 指定時間待機
            await new Promise(resolve => setTimeout(resolve, duration));
            
            this.hide();
            
            // 次の通知まで少し間隔を空ける
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    /**
     * ブラウザ通知API（Notification API）を使用した通知
     * @param {string} title - 通知タイトル
     * @param {string} body - 通知本文
     * @param {string} icon - アイコンURL（オプション）
     * @returns {Promise<boolean>} 通知が表示されたかどうか
     */
    async showBrowserNotification(title, body, icon = null) {
        // 通知の許可をチェック
        if (!('Notification' in window)) {
            console.warn('このブラウザはNotification APIをサポートしていません');
            return false;
        }

        let permission = Notification.permission;

        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                tag: 'emoji-search-app' // 同じタグの通知は置き換え
            });

            // 通知クリック時の処理
            notification.addEventListener('click', () => {
                window.focus();
                notification.close();
            });

            return true;
        }

        return false;
    }
}