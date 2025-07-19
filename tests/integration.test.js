import { SearchEngine } from '../js/searchEngine.js';
import { UIManager } from '../js/uiManager.js';
import { ClipboardManager } from '../js/clipboard.js';
import { ShareManager } from '../js/share.js';
import { NotificationManager } from '../js/notification.js';

describe('統合テスト', () => {
  let searchEngine;
  let uiManager;
  let clipboardManager;
  let shareManager;
  let notificationManager;

  beforeEach(() => {
    // 必要なDOM要素を作成
    createMockElement('searchInput', 'input');
    createMockElement('searchButton', 'button');
    createMockElement('result', 'div');
    createMockElement('actionButtons', 'div');
    createMockElement('copyButton', 'button');
    createMockElement('shareButton', 'button');
    createMockElement('notification', 'div');
    createMockElement('notificationText', 'span');

    // 各モジュールを初期化
    searchEngine = new SearchEngine();
    uiManager = new UIManager();
    clipboardManager = new ClipboardManager();
    shareManager = new ShareManager();
    notificationManager = new NotificationManager();
  });

  describe('検索から表示までの完全フロー', () => {
    test('検索 → 結果表示 → アクションボタン表示の流れ', async () => {
      // 1. 入力テキストを設定
      uiManager.setInputText('嬉しい 猫');
      
      // 2. 検索実行
      const inputText = uiManager.getInputText();
      const result = searchEngine.searchEmojis(inputText);
      
      // 3. 結果表示
      uiManager.displayResult(result);
      
      // 4. 結果の検証
      expect(uiManager.getResultText()).toBe('😊 🐱');
      
      // 5. アクションボタンが表示されているか確認
      setTimeout(() => {
        const actionButtons = document.getElementById('actionButtons');
        expect(actionButtons.style.display).toBe('flex');
      }, 100);
    });

    test('空の検索でクリア処理', () => {
      // 事前に結果を設定
      uiManager.setInputText('嬉しい');
      const result = searchEngine.searchEmojis(uiManager.getInputText());
      uiManager.displayResult(result);
      
      // 空の検索
      uiManager.setInputText('');
      const inputText = uiManager.getInputText();
      
      if (!inputText.trim()) {
        uiManager.clearResult();
      }
      
      expect(uiManager.getResultText()).toBe('');
    });
  });

  describe('コピー機能の統合テスト', () => {
    test('検索結果のコピー完全フロー', async () => {
      // 1. 検索実行
      uiManager.setInputText('嬉しい');
      const result = searchEngine.searchEmojis(uiManager.getInputText());
      uiManager.displayResult(result);
      
      // 2. コピー実行
      const resultText = uiManager.getResultText();
      const copySuccess = await clipboardManager.copyToClipboard(resultText);
      
      // 3. 結果検証
      expect(copySuccess).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('😊');
    });

    test('コピー失敗時の通知表示', async () => {
      // コピー失敗をシミュレート
      navigator.clipboard.writeText.mockRejectedValue(new Error('Copy failed'));
      document.execCommand.mockReturnValue(false);
      
      uiManager.setInputText('嬉しい');
      const result = searchEngine.searchEmojis(uiManager.getInputText());
      uiManager.displayResult(result);
      
      const resultText = uiManager.getResultText();
      
      try {
        await clipboardManager.copyToClipboard(resultText);
      } catch (error) {
        notificationManager.showError('コピーに失敗しました');
      }
      
      expect(document.getElementById('notificationText').textContent).toBe('コピーに失敗しました');
    });
  });

  describe('シェア機能の統合テスト', () => {
    test('シェア機能の完全フロー', async () => {
      // 1. 検索実行
      uiManager.setInputText('嬉しい 猫');
      const result = searchEngine.searchEmojis(uiManager.getInputText());
      uiManager.displayResult(result);
      
      // 2. シェア実行
      const emojis = uiManager.getResultText();
      const inputText = uiManager.getInputText();
      const shareSuccess = await shareManager.shareContent(emojis, inputText);
      
      // 3. 結果検証
      expect(shareSuccess).toBe(true);
      expect(navigator.share).toHaveBeenCalledWith({
        title: '絵文字検索アプリ',
        text: '「嬉しい 猫」→ 😊 🐱',
        url: window.location.href
      });
    });

    test('Web Share API 非対応時のフォールバック', async () => {
      // Web Share API を無効化
      const originalShare = navigator.share;
      delete navigator.share;
      
      uiManager.setInputText('嬉しい');
      const result = searchEngine.searchEmojis(uiManager.getInputText());
      uiManager.displayResult(result);
      
      const showShareMenuSpy = jest.spyOn(shareManager, 'showShareMenu').mockImplementation(() => {});
      
      const emojis = uiManager.getResultText();
      const inputText = uiManager.getInputText();
      await shareManager.shareContent(emojis, inputText);
      
      expect(showShareMenuSpy).toHaveBeenCalled();
      
      navigator.share = originalShare;
    });
  });

  describe('通知システムの統合テスト', () => {
    test('成功通知の表示', () => {
      notificationManager.showSuccess('テスト成功');
      
      expect(document.getElementById('notificationText').textContent).toBe('テスト成功');
      expect(document.getElementById('notification').className).toBe('notification success');
    });

    test('カスタムイベント経由の通知', () => {
      document.dispatchEvent(new CustomEvent('notification-show', {
        detail: { message: 'イベント通知', type: 'info' }
      }));
      
      expect(document.getElementById('notificationText').textContent).toBe('イベント通知');
      expect(document.getElementById('notification').className).toBe('notification info');
    });
  });

  describe('エラーハンドリングの統合テスト', () => {
    test('存在しない要素での安全な動作', () => {
      // 全ての要素を削除
      document.body.innerHTML = '';
      
      // 新しいインスタンスを作成（要素が存在しない状態）
      const safeUIManager = new UIManager();
      const safeNotificationManager = new NotificationManager();
      
      // エラーが発生しないことを確認
      expect(() => {
        safeUIManager.displayResult('😊');
        safeUIManager.showLoading();
        safeUIManager.clearResult();
        safeNotificationManager.show('テスト');
      }).not.toThrow();
    });

    test('無効な入力値での安全な動作', () => {
      expect(() => {
        searchEngine.searchEmojis(null);
        searchEngine.searchEmojis(undefined);
        searchEngine.searchEmojis(123);
        searchEngine.searchEmojis('');
      }).not.toThrow();
      
      expect(searchEngine.searchEmojis(null)).toBe('');
      expect(searchEngine.searchEmojis(undefined)).toBe('');
      expect(searchEngine.searchEmojis(123)).toBe('');
      expect(searchEngine.searchEmojis('')).toBe('');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量データ処理のパフォーマンス', () => {
      const start = performance.now();
      
      // 大量の検索を実行
      for (let i = 0; i < 100; i++) {
        const result = searchEngine.searchEmojis('嬉しい 悲しい 猫 犬 太陽');
        uiManager.displayResult(result);
        uiManager.clearResult();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 100回の処理が500ms以内に完了することを確認
      expect(duration).toBeLessThan(500);
    });

    test('メモリリークテスト', () => {
      // 大量の通知を発生させる
      for (let i = 0; i < 50; i++) {
        notificationManager.show(`テスト${i}`, 'success', 0);
      }
      
      // タイマーが適切にクリアされていることを確認
      expect(notificationManager.currentTimeoutId).toBeNull();
    });
  });

  describe('ブラウザ互換性テスト', () => {
    test('古いブラウザでのClipboard API フォールバック', async () => {
      // Clipboard API を無効化
      const originalClipboard = navigator.clipboard;
      delete navigator.clipboard;
      window.isSecureContext = false;
      
      // execCommand をモック
      document.execCommand.mockReturnValue(true);
      
      const result = await clipboardManager.copyToClipboard('😊');
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      navigator.clipboard = originalClipboard;
      window.isSecureContext = true;
    });

    test('Web Share API 非対応環境での動作', async () => {
      const originalShare = navigator.share;
      delete navigator.share;
      
      const showShareMenuSpy = jest.spyOn(shareManager, 'showShareMenu').mockImplementation(() => {});
      
      await shareManager.shareContent('😊', 'テスト');
      
      expect(showShareMenuSpy).toHaveBeenCalled();
      
      navigator.share = originalShare;
    });
  });

  describe('リアルワールドシナリオ', () => {
    test('一般的なユーザーフローのシミュレーション', async () => {
      // 1. ユーザーがページを訪問
      expect(uiManager.elements.searchInput).toBeTruthy();
      
      // 2. 入力フィールドにテキストを入力
      uiManager.setInputText('お祝い ケーキ');
      expect(uiManager.validateInput()).toBe(true);
      
      // 3. 検索を実行
      const inputText = uiManager.getInputText();
      const result = searchEngine.searchEmojis(inputText);
      expect(result).toBe('🎉 🍰');
      
      // 4. 結果を表示
      uiManager.displayResult(result);
      expect(uiManager.getResultText()).toBe('🎉 🍰');
      
      // 5. 結果をコピー
      const copySuccess = await clipboardManager.copyToClipboard(result);
      expect(copySuccess).toBe(true);
      
      // 6. 成功通知を表示
      notificationManager.showSuccess('絵文字をコピーしました! 📋');
      expect(notificationManager.isVisible()).toBe(true);
    });

    test('複数キーワード検索での未知語混在パターン', () => {
      const inputText = '嬉しい 未知の単語 猫 存在しない 太陽';
      const result = searchEngine.searchEmojis(inputText);
      
      expect(result).toBe('😊 ❓🤔 🐱 ❓🤔 ☀️');
    });

    test('特殊な入力パターンの処理', () => {
      // 連続スペース
      expect(searchEngine.searchEmojis('嬉しい    猫')).toBe('😊 🐱');
      
      // 前後スペース
      expect(searchEngine.searchEmojis('  嬉しい 猫  ')).toBe('😊 🐱');
      
      // タブ文字（単一キーワードとして扱われる）
      expect(searchEngine.searchEmojis('嬉しい\t猫')).toBe('❓🤔');
    });
  });
});