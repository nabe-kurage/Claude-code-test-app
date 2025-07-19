/**
 * UI管理クラス
 * DOM要素の制御とユーザーインターフェースの管理を担当
 */
export class UIManager {
    constructor() {
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * DOM要素を初期化
     * @returns {Object} DOM要素のオブジェクト
     */
    initializeElements() {
        const elements = {
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            resultDisplay: document.getElementById('result'),
            actionButtons: document.getElementById('actionButtons'),
            copyButton: document.getElementById('copyButton'),
            shareButton: document.getElementById('shareButton')
        };

        // 必要な要素が存在するかチェック
        for (const [name, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`要素が見つかりません: ${name}`);
            }
        }

        return elements;
    }

    /**
     * 基本的なイベントリスナーを設定
     */
    setupEventListeners() {
        // エンターキーでの検索
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.triggerSearch();
                }
            });

            // 入力クリア時の処理
            this.elements.searchInput.addEventListener('input', () => {
                if (this.elements.searchInput.value === '') {
                    this.clearResult();
                }
            });
        }

        // ページ読み込み時に入力フィールドにフォーカス
        window.addEventListener('load', () => {
            if (this.elements.searchInput) {
                this.elements.searchInput.focus();
            }
        });
    }

    /**
     * 検索実行のイベントを発火
     */
    triggerSearch() {
        const event = new CustomEvent('search-requested', {
            detail: { inputText: this.getInputText() }
        });
        document.dispatchEvent(event);
    }

    /**
     * 入力テキストを取得
     * @returns {string} 入力されたテキスト
     */
    getInputText() {
        return this.elements.searchInput ? this.elements.searchInput.value : '';
    }

    /**
     * 入力テキストを設定
     * @param {string} text - 設定するテキスト
     */
    setInputText(text) {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = text;
        }
    }

    /**
     * 検索結果を表示
     * @param {string} result - 表示する絵文字
     */
    displayResult(result) {
        if (!this.elements.resultDisplay) return;

        this.elements.resultDisplay.textContent = result;
        this.elements.resultDisplay.className = 'result-display';
        
        // 結果がある場合はアクションボタンを表示
        if (result) {
            this.showActionButtons();
        } else {
            this.hideActionButtons();
        }
    }

    /**
     * ローディング状態を表示
     */
    showLoading() {
        if (!this.elements.resultDisplay) return;

        this.elements.resultDisplay.textContent = '検索中...';
        this.elements.resultDisplay.className = 'result-display loading';
        this.hideActionButtons();
    }

    /**
     * 結果をクリア
     */
    clearResult() {
        if (!this.elements.resultDisplay) return;

        this.elements.resultDisplay.textContent = '';
        this.elements.resultDisplay.className = 'result-display';
        this.hideActionButtons();
    }

    /**
     * 現在の結果テキストを取得
     * @returns {string} 結果テキスト
     */
    getResultText() {
        return this.elements.resultDisplay ? this.elements.resultDisplay.textContent : '';
    }

    /**
     * アクションボタンを表示
     */
    showActionButtons() {
        if (!this.elements.actionButtons) return;

        this.elements.actionButtons.style.display = 'flex';
        setTimeout(() => {
            this.elements.actionButtons.classList.add('visible');
        }, 50);
    }

    /**
     * アクションボタンを非表示
     */
    hideActionButtons() {
        if (!this.elements.actionButtons) return;

        this.elements.actionButtons.classList.remove('visible');
        setTimeout(() => {
            this.elements.actionButtons.style.display = 'none';
        }, 300);
    }

    /**
     * ボタンクリックアニメーションを実行
     * @param {HTMLElement} button - アニメーションするボタン
     */
    animateButtonClick(button) {
        if (!button) return;

        button.classList.add('clicked');
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 300);
    }

    /**
     * ボタンのテキストを一時的に変更
     * @param {HTMLElement} button - 対象のボタン
     * @param {string} newText - 新しいテキスト
     * @param {number} duration - 表示時間（ミリ秒）
     */
    temporaryButtonText(button, newText, duration = 2000) {
        if (!button) return;

        const originalText = button.innerHTML;
        button.innerHTML = newText;
        
        setTimeout(() => {
            button.innerHTML = originalText;
        }, duration);
    }

    /**
     * 入力値の検証
     * @returns {boolean} 入力が有効かどうか
     */
    validateInput() {
        const inputText = this.getInputText();
        return inputText && inputText.trim().length > 0;
    }

    /**
     * コピーボタンにイベントリスナーを追加
     * @param {Function} callback - コピー実行時のコールバック
     */
    onCopyButtonClick(callback) {
        if (this.elements.copyButton) {
            this.elements.copyButton.addEventListener('click', callback);
        }
    }

    /**
     * シェアボタンにイベントリスナーを追加
     * @param {Function} callback - シェア実行時のコールバック
     */
    onShareButtonClick(callback) {
        if (this.elements.shareButton) {
            this.elements.shareButton.addEventListener('click', callback);
        }
    }

    /**
     * 検索ボタンにイベントリスナーを追加
     * @param {Function} callback - 検索実行時のコールバック
     */
    onSearchButtonClick(callback) {
        if (this.elements.searchButton) {
            this.elements.searchButton.addEventListener('click', callback);
        }
    }
}