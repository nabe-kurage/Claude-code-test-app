import { ShareManager } from '../js/share.js';

describe('ShareManager', () => {
  let shareManager;

  beforeEach(() => {
    shareManager = new ShareManager();
    jest.clearAllMocks();
    
    // DOM要素のモックを作成
    createMockElement('shareButton', 'button');
  });

  describe('shareContent', () => {
    test('Web Share API 使用時の正常シェア', async () => {
      navigator.share.mockResolvedValue();

      const result = await shareManager.shareContent('😊 🐱', '嬉しい 猫', 'https://example.com');
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: '絵文字検索アプリ',
        text: '「嬉しい 猫」→ 😊 🐱',
        url: 'https://example.com'
      });
      expect(result).toBe(true);
    });

    test('Web Share API エラー時のフォールバック', async () => {
      navigator.share.mockRejectedValue(new Error('Share Error'));

      // showShareMenu のモック
      const showShareMenuSpy = jest.spyOn(shareManager, 'showShareMenu').mockImplementation(() => {});

      const result = await shareManager.shareContent('😊 🐱', '嬉しい 猫');
      
      expect(showShareMenuSpy).toHaveBeenCalledWith('「嬉しい 猫」→ 😊 🐱', window.location.href);
      expect(result).toBe(false);
    });

    test('Web Share API 非対応時のフォールバック', async () => {
      // Web Share API を削除
      const originalShare = navigator.share;
      delete navigator.share;

      const showShareMenuSpy = jest.spyOn(shareManager, 'showShareMenu').mockImplementation(() => {});

      const result = await shareManager.shareContent('😊 🐱', '嬉しい 猫');
      
      expect(showShareMenuSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      navigator.share = originalShare;
    });

    test('無効なコンテンツでエラーを投げる', async () => {
      await expect(shareManager.shareContent('', '嬉しい')).rejects.toThrow('シェアするコンテンツが無効です');
      await expect(shareManager.shareContent('😊', '')).rejects.toThrow('シェアするコンテンツが無効です');
      await expect(shareManager.shareContent(null, '嬉しい')).rejects.toThrow('シェアするコンテンツが無効です');
    });
  });

  describe('showShareMenu', () => {
    test('シェアメニューを正しく作成・表示', () => {
      const shareButton = document.getElementById('shareButton');
      
      shareManager.showShareMenu('「嬉しい」→ 😊', 'https://example.com');
      
      const shareMenu = shareButton.querySelector('.share-menu');
      expect(shareMenu).toBeTruthy();
      expect(shareMenu.innerHTML).toContain('Twitter でシェア');
      expect(shareMenu.innerHTML).toContain('LINE でシェア');
      expect(shareMenu.innerHTML).toContain('テキストをコピー');
    });

    test('既存のシェアメニューを削除してから新規作成', () => {
      const shareButton = document.getElementById('shareButton');
      
      // 既存のメニューを作成
      const existingMenu = document.createElement('div');
      existingMenu.className = 'share-menu';
      document.body.appendChild(existingMenu);
      
      shareManager.showShareMenu('テスト', 'https://example.com');
      
      // 既存のメニューが削除されていることを確認
      expect(document.querySelectorAll('.share-menu')).toHaveLength(1);
      expect(shareButton.querySelector('.share-menu')).toBeTruthy();
    });

    test('シェアボタンが存在しない場合のエラーハンドリング', () => {
      document.body.innerHTML = '';
      
      const consoleSpy = mockConsoleError();
      
      expect(() => {
        shareManager.showShareMenu('テスト', 'https://example.com');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('シェアボタンが見つかりません');
      
      restoreConsoleError(consoleSpy);
    });
  });

  describe('createShareMenu', () => {
    test('シェアメニューのHTML要素を正しく作成', () => {
      const shareMenu = shareManager.createShareMenu('「嬉しい」→ 😊', 'https://example.com');
      
      expect(shareMenu.className).toBe('share-menu');
      
      // Twitter リンクの確認
      const twitterLink = shareMenu.querySelector('a[href*="twitter.com"]');
      expect(twitterLink).toBeTruthy();
      expect(twitterLink.textContent).toBe('🐦 Twitter でシェア');
      
      // LINE リンクの確認
      const lineLink = shareMenu.querySelector('a[href*="social-plugins.line.me"]');
      expect(lineLink).toBeTruthy();
      expect(lineLink.textContent).toBe('💚 LINE でシェア');
      
      // コピーボタンの確認
      const copyButton = shareMenu.querySelector('button');
      expect(copyButton).toBeTruthy();
      expect(copyButton.textContent).toBe('📋 テキストをコピー');
    });

    test('コピーボタンのイベントリスナー', () => {
      const copyShareTextSpy = jest.spyOn(shareManager, 'copyShareText').mockImplementation(() => {});
      
      const shareMenu = shareManager.createShareMenu('テストテキスト', 'https://example.com');
      const copyButton = shareMenu.querySelector('button');
      
      copyButton.click();
      
      expect(copyShareTextSpy).toHaveBeenCalledWith('テストテキスト');
      
      copyShareTextSpy.mockRestore();
    });
  });

  describe('URL生成メソッド', () => {
    test('getTwitterShareUrl', () => {
      const url = shareManager.getTwitterShareUrl('「嬉しい」→ 😊', 'https://example.com');
      
      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain(encodeURIComponent('「嬉しい」→ 😊'));
      expect(url).toContain(encodeURIComponent('https://example.com'));
    });

    test('getLineShareUrl', () => {
      const url = shareManager.getLineShareUrl('「嬉しい」→ 😊', 'https://example.com');
      
      expect(url).toContain('social-plugins.line.me');
      expect(url).toContain(encodeURIComponent('「嬉しい」→ 😊'));
      expect(url).toContain(encodeURIComponent('https://example.com'));
    });
  });

  describe('copyShareText', () => {
    test('シェアテキストの正常コピー', async () => {
      // ClipboardManager のモック
      const copyToClipboardSpy = jest.spyOn(shareManager.clipboardManager, 'copyToClipboard')
        .mockResolvedValue(true);

      await shareManager.copyShareText('テストテキスト');
      
      expect(copyToClipboardSpy).toHaveBeenCalledWith('テストテキスト');
    });

    test('コピー成功時の通知イベント発火', async () => {
      jest.spyOn(shareManager.clipboardManager, 'copyToClipboard').mockResolvedValue(true);
      
      const eventSpy = jest.fn();
      document.addEventListener('notification-show', eventSpy);

      await shareManager.copyShareText('テストテキスト');
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            message: 'シェア用テキストをコピーしました! 📋',
            type: 'success'
          })
        })
      );
    });

    test('コピー失敗時のエラー通知', async () => {
      jest.spyOn(shareManager.clipboardManager, 'copyToClipboard').mockResolvedValue(false);
      
      const eventSpy = jest.fn();
      document.addEventListener('notification-show', eventSpy);

      await shareManager.copyShareText('テストテキスト');
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            message: 'コピーに失敗しました',
            type: 'error'
          })
        })
      );
    });
  });

  describe('メニュー管理', () => {
    test('removeExistingShareMenu', () => {
      // 既存のメニューを作成
      const existingMenu = document.createElement('div');
      existingMenu.className = 'share-menu';
      document.body.appendChild(existingMenu);
      
      shareManager.removeExistingShareMenu();
      
      expect(document.querySelector('.share-menu')).toBeNull();
    });

    test('removeShareMenu', () => {
      const shareMenu = document.createElement('div');
      shareMenu.className = 'share-menu';
      document.body.appendChild(shareMenu);
      
      shareManager.removeShareMenu(shareMenu);
      
      expect(document.querySelector('.share-menu')).toBeNull();
    });

    test('removeShareMenu で null 要素を処理', () => {
      expect(() => {
        shareManager.removeShareMenu(null);
      }).not.toThrow();
    });
  });

  describe('外部クリックリスナー', () => {
    test('setupOutsideClickListener', (done) => {
      const shareButton = document.getElementById('shareButton');
      const shareMenu = document.createElement('div');
      shareMenu.className = 'share-menu';
      shareButton.appendChild(shareMenu);
      
      shareManager.setupOutsideClickListener(shareMenu, shareButton);
      
      // 少し待ってからクリックイベントを発火
      setTimeout(() => {
        const outsideElement = document.createElement('div');
        document.body.appendChild(outsideElement);
        
        outsideElement.click();
        
        // メニューが削除されていることを確認
        setTimeout(() => {
          expect(shareButton.querySelector('.share-menu')).toBeNull();
          done();
        }, 10);
      }, 150);
    });
  });

  describe('機能サポートチェック', () => {
    test('isWebShareSupported', () => {
      // Web Share API が存在する場合
      expect(shareManager.isWebShareSupported()).toBe(true);

      // Web Share API が存在しない場合
      const originalShare = navigator.share;
      delete navigator.share;
      expect(shareManager.isWebShareSupported()).toBe(false);
      navigator.share = originalShare;
    });

    test('isMobile', () => {
      const originalUserAgent = navigator.userAgent;
      
      // モバイルユーザーエージェント
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      expect(shareManager.isMobile()).toBe(true);

      // デスクトップユーザーエージェント
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
      expect(shareManager.isMobile()).toBe(false);

      // 元に戻す
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true
      });
    });
  });

  describe('エッジケース', () => {
    test('非常に長いシェアテキスト', async () => {
      const longText = '😊'.repeat(1000);
      navigator.share.mockResolvedValue();

      const result = await shareManager.shareContent(longText, '長いテキスト');
      
      expect(result).toBe(true);
    });

    test('特殊文字を含むシェアテキスト', async () => {
      const specialText = '特殊文字\n\t"\'\\';
      navigator.share.mockResolvedValue();

      const result = await shareManager.shareContent('😊', specialText);
      
      expect(result).toBe(true);
    });

    test('URLエンコーディングが必要な文字列', () => {
      const twitterUrl = shareManager.getTwitterShareUrl('日本語 #ハッシュタグ', 'https://example.com?param=値');
      
      expect(twitterUrl).toContain(encodeURIComponent('日本語 #ハッシュタグ'));
      expect(twitterUrl).toContain(encodeURIComponent('https://example.com?param=値'));
    });
  });
});