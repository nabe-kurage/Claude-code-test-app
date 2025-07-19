import { NotificationManager } from '../js/notification.js';

describe('NotificationManager', () => {
  let notificationManager;
  let mockNotification;
  let mockNotificationText;

  beforeEach(() => {
    mockNotification = createMockElement('notification', 'div');
    mockNotificationText = createMockElement('notificationText', 'span');
    
    notificationManager = new NotificationManager();
  });

  describe('初期化', () => {
    test('DOM要素が正しく初期化される', () => {
      expect(notificationManager.notification).toBeTruthy();
      expect(notificationManager.notificationText).toBeTruthy();
    });

    test('カスタムイベントリスナーが設定される', () => {
      const showSpy = jest.spyOn(notificationManager, 'show');
      const hideSpy = jest.spyOn(notificationManager, 'hide');

      // カスタムイベントを発火
      document.dispatchEvent(new CustomEvent('notification-show', {
        detail: { message: 'テスト', type: 'success' }
      }));
      document.dispatchEvent(new CustomEvent('notification-hide'));

      expect(showSpy).toHaveBeenCalledWith('テスト', 'success');
      expect(hideSpy).toHaveBeenCalled();
    });
  });

  describe('show', () => {
    test('通知を正しく表示', (done) => {
      notificationManager.show('テストメッセージ', 'success', 1000);
      
      expect(mockNotificationText.textContent).toBe('テストメッセージ');
      expect(mockNotification.className).toBe('notification success');
      expect(mockNotification.style.display).toBe('block');
      
      // アニメーション後のクラス追加をチェック
      setTimeout(() => {
        expect(mockNotification.classList.contains('show')).toBe(true);
        done();
      }, 100);
    });

    test('自動非表示タイマーが動作', (done) => {
      const hideSpy = jest.spyOn(notificationManager, 'hide');
      
      notificationManager.show('テスト', 'success', 100);
      
      setTimeout(() => {
        expect(hideSpy).toHaveBeenCalled();
        done();
      }, 150);
    });

    test('duration が 0 の場合は自動非表示しない', (done) => {
      const hideSpy = jest.spyOn(notificationManager, 'hide');
      
      notificationManager.show('テスト', 'success', 0);
      
      setTimeout(() => {
        expect(hideSpy).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    test('既存のタイマーがクリアされる', () => {
      const clearTimerSpy = jest.spyOn(notificationManager, 'clearTimer');
      
      notificationManager.show('テスト1', 'success', 1000);
      notificationManager.show('テスト2', 'success', 1000);
      
      expect(clearTimerSpy).toHaveBeenCalledTimes(2);
    });

    test('通知要素が存在しない場合のエラーハンドリング', () => {
      notificationManager.notification = null;
      notificationManager.notificationText = null;
      
      const consoleSpy = mockConsoleError();
      
      expect(() => {
        notificationManager.show('テスト');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('通知要素が利用できません');
      
      restoreConsoleError(consoleSpy);
    });
  });

  describe('hide', () => {
    test('通知を正しく非表示', (done) => {
      // 事前に表示状態にする
      mockNotification.classList.add('show');
      
      notificationManager.hide();
      
      expect(mockNotification.classList.contains('show')).toBe(false);
      
      setTimeout(() => {
        expect(mockNotification.style.display).toBe('none');
        done();
      }, 350);
    });

    test('タイマーがクリアされる', () => {
      const clearTimerSpy = jest.spyOn(notificationManager, 'clearTimer');
      
      notificationManager.hide();
      
      expect(clearTimerSpy).toHaveBeenCalled();
    });
  });

  describe('ショートカットメソッド', () => {
    test('showSuccess', () => {
      const showSpy = jest.spyOn(notificationManager, 'show');
      
      notificationManager.showSuccess('成功メッセージ', 2000);
      
      expect(showSpy).toHaveBeenCalledWith('成功メッセージ', 'success', 2000);
    });

    test('showError', () => {
      const showSpy = jest.spyOn(notificationManager, 'show');
      
      notificationManager.showError('エラーメッセージ', 2000);
      
      expect(showSpy).toHaveBeenCalledWith('エラーメッセージ', 'error', 2000);
    });

    test('showInfo', () => {
      const showSpy = jest.spyOn(notificationManager, 'show');
      
      notificationManager.showInfo('情報メッセージ', 2000);
      
      expect(showSpy).toHaveBeenCalledWith('情報メッセージ', 'info', 2000);
    });
  });

  describe('clearTimer', () => {
    test('タイマーが正しくクリア', () => {
      notificationManager.currentTimeoutId = setTimeout(() => {}, 1000);
      const timeoutId = notificationManager.currentTimeoutId;
      
      notificationManager.clearTimer();
      
      expect(notificationManager.currentTimeoutId).toBeNull();
    });

    test('タイマーが存在しない場合でもエラーが発生しない', () => {
      notificationManager.currentTimeoutId = null;
      
      expect(() => {
        notificationManager.clearTimer();
      }).not.toThrow();
    });
  });

  describe('isVisible', () => {
    test('表示中の場合はtrue', () => {
      mockNotification.classList.add('show');
      
      expect(notificationManager.isVisible()).toBe(true);
    });

    test('非表示の場合はfalse', () => {
      mockNotification.classList.remove('show');
      
      expect(notificationManager.isVisible()).toBe(false);
    });

    test('通知要素が存在しない場合はfalse', () => {
      notificationManager.notification = null;
      
      expect(notificationManager.isVisible()).toBe(false);
    });
  });

  describe('enableClickToClose', () => {
    test('クリックで通知を閉じる機能を有効化', () => {
      const hideSpy = jest.spyOn(notificationManager, 'hide');
      
      notificationManager.enableClickToClose();
      
      mockNotification.click();
      
      expect(hideSpy).toHaveBeenCalled();
      expect(mockNotification.style.cursor).toBe('pointer');
    });
  });

  describe('showQueue', () => {
    test('複数の通知を順次表示', async () => {
      const showSpy = jest.spyOn(notificationManager, 'show');
      const hideSpy = jest.spyOn(notificationManager, 'hide');
      
      const notifications = [
        { message: 'メッセージ1', type: 'success', duration: 50 },
        { message: 'メッセージ2', type: 'error', duration: 50 }
      ];
      
      await notificationManager.showQueue(notifications);
      
      expect(showSpy).toHaveBeenCalledTimes(2);
      expect(hideSpy).toHaveBeenCalledTimes(2);
      expect(showSpy).toHaveBeenNthCalledWith(1, 'メッセージ1', 'success', 0);
      expect(showSpy).toHaveBeenNthCalledWith(2, 'メッセージ2', 'error', 0);
    });
  });

  describe('showBrowserNotification', () => {
    test('ブラウザ通知APIが利用可能な場合', async () => {
      // Notification API のモック
      global.Notification = class {
        constructor(title, options) {
          this.title = title;
          this.options = options;
        }
        
        addEventListener() {}
        close() {}
        
        static get permission() {
          return 'granted';
        }
        
        static requestPermission() {
          return Promise.resolve('granted');
        }
      };
      
      const result = await notificationManager.showBrowserNotification('タイトル', '本文');
      
      expect(result).toBe(true);
    });

    test('ブラウザ通知APIが利用不可の場合', async () => {
      // Notification API を削除
      const originalNotification = global.Notification;
      delete global.Notification;
      
      const result = await notificationManager.showBrowserNotification('タイトル', '本文');
      
      expect(result).toBe(false);
      
      global.Notification = originalNotification;
    });

    test('通知の許可が拒否された場合', async () => {
      global.Notification = class {
        static get permission() {
          return 'denied';
        }
        
        static requestPermission() {
          return Promise.resolve('denied');
        }
      };
      
      const result = await notificationManager.showBrowserNotification('タイトル', '本文');
      
      expect(result).toBe(false);
    });

    test('通知の許可をリクエストして取得', async () => {
      global.Notification = class {
        constructor(title, options) {
          this.title = title;
          this.options = options;
        }
        
        addEventListener() {}
        close() {}
        
        static get permission() {
          return 'default';
        }
        
        static requestPermission() {
          return Promise.resolve('granted');
        }
      };
      
      const result = await notificationManager.showBrowserNotification('タイトル', '本文');
      
      expect(result).toBe(true);
    });
  });

  describe('エッジケース', () => {
    test('非常に長いメッセージの表示', () => {
      const longMessage = 'テスト'.repeat(1000);
      
      expect(() => {
        notificationManager.show(longMessage);
      }).not.toThrow();
      
      expect(mockNotificationText.textContent).toBe(longMessage);
    });

    test('HTMLタグを含むメッセージの安全な表示', () => {
      const htmlMessage = '<script>alert("XSS")</script>テスト';
      
      notificationManager.show(htmlMessage);
      
      // textContent を使用しているため、HTMLはエスケープされる
      expect(mockNotificationText.textContent).toBe(htmlMessage);
      expect(mockNotificationText.innerHTML).toBe(htmlMessage);
    });

    test('絵文字を含むメッセージの表示', () => {
      const emojiMessage = '成功しました! 😊🎉';
      
      notificationManager.show(emojiMessage);
      
      expect(mockNotificationText.textContent).toBe(emojiMessage);
    });

    test('空文字メッセージの処理', () => {
      expect(() => {
        notificationManager.show('');
      }).not.toThrow();
      
      expect(mockNotificationText.textContent).toBe('');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量の通知表示でメモリリークしない', () => {
      for (let i = 0; i < 1000; i++) {
        notificationManager.show(`メッセージ${i}`, 'success', 0);
      }
      
      // メモリリークの検証（タイマーが適切にクリアされているか）
      expect(notificationManager.currentTimeoutId).toBeNull();
    });
  });
});