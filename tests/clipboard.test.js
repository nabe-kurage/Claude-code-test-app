import { ClipboardManager } from '../js/clipboard.js';

describe('ClipboardManager', () => {
  let clipboardManager;

  beforeEach(() => {
    clipboardManager = new ClipboardManager();
    jest.clearAllMocks();
  });

  describe('copyToClipboard', () => {
    test('Clipboard API使用時の正常コピー', async () => {
      // Clipboard API が利用可能な状態をモック
      navigator.clipboard.writeText.mockResolvedValue();
      window.isSecureContext = true;

      const result = await clipboardManager.copyToClipboard('😊 🐱');
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('😊 🐱');
      expect(result).toBe(true);
    });

    test('Clipboard API エラー時のフォールバック', async () => {
      // Clipboard API でエラーが発生する状態をモック
      navigator.clipboard.writeText.mockRejectedValue(new Error('API Error'));
      
      // execCommand のモック
      document.execCommand.mockReturnValue(true);

      const result = await clipboardManager.copyToClipboard('😊 🐱');
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });

    test('非セキュアコンテキストでのフォールバック', async () => {
      // 非セキュアコンテキストをモック
      window.isSecureContext = false;
      document.execCommand.mockReturnValue(true);

      const result = await clipboardManager.copyToClipboard('😊 🐱');
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });

    test('無効なテキストでエラーを投げる', async () => {
      await expect(clipboardManager.copyToClipboard(null)).rejects.toThrow('コピーするテキストが無効です');
      await expect(clipboardManager.copyToClipboard(undefined)).rejects.toThrow('コピーするテキストが無効です');
      await expect(clipboardManager.copyToClipboard('')).rejects.toThrow('コピーするテキストが無効です');
    });

    test('すべてのコピー方法が失敗した場合', async () => {
      // Clipboard API でエラー
      navigator.clipboard.writeText.mockRejectedValue(new Error('API Error'));
      
      // execCommand も失敗
      document.execCommand.mockReturnValue(false);

      const result = await clipboardManager.copyToClipboard('😊 🐱');
      
      expect(result).toBe(false);
    });
  });

  describe('fallbackCopy', () => {
    test('フォールバックコピーの正常動作', () => {
      document.execCommand.mockReturnValue(true);

      const result = clipboardManager.fallbackCopy('テストテキスト');
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('フォールバックコピーの失敗', () => {
      document.execCommand.mockReturnValue(false);

      const result = clipboardManager.fallbackCopy('テストテキスト');
      
      expect(result).toBe(false);
    });

    test('フォールバックコピー時のDOM操作', () => {
      document.execCommand.mockReturnValue(true);
      
      // DOM操作をスパイ
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');

      clipboardManager.fallbackCopy('テストテキスト');
      
      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    test('フォールバックコピーでのエラーハンドリング', () => {
      // createElement でエラーを発生
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM Error');
      });

      const result = clipboardManager.fallbackCopy('テストテキスト');
      
      expect(result).toBe(false);
    });
  });

  describe('readFromClipboard', () => {
    test('Clipboard API 使用時の正常読み取り', async () => {
      const testText = 'クリップボードのテキスト';
      navigator.clipboard.readText.mockResolvedValue(testText);
      window.isSecureContext = true;

      const result = await clipboardManager.readFromClipboard();
      
      expect(navigator.clipboard.readText).toHaveBeenCalled();
      expect(result).toBe(testText);
    });

    test('Clipboard API エラー時の処理', async () => {
      navigator.clipboard.readText.mockRejectedValue(new Error('Read Error'));

      const result = await clipboardManager.readFromClipboard();
      
      expect(result).toBeNull();
    });

    test('非セキュアコンテキストでの処理', async () => {
      window.isSecureContext = false;

      const result = await clipboardManager.readFromClipboard();
      
      expect(result).toBeNull();
    });
  });

  describe('機能サポートチェック', () => {
    test('isClipboardSupported', () => {
      window.isSecureContext = true;
      expect(clipboardManager.isClipboardSupported()).toBe(true);

      window.isSecureContext = false;
      expect(clipboardManager.isClipboardSupported()).toBe(false);

      // navigator.clipboard が存在しない場合
      const originalClipboard = navigator.clipboard;
      delete navigator.clipboard;
      expect(clipboardManager.isClipboardSupported()).toBe(false);
      navigator.clipboard = originalClipboard;
    });

    test('isExecCommandSupported', () => {
      document.queryCommandSupported.mockReturnValue(true);
      expect(clipboardManager.isExecCommandSupported()).toBe(true);

      document.queryCommandSupported.mockReturnValue(false);
      expect(clipboardManager.isExecCommandSupported()).toBe(false);

      // queryCommandSupported が存在しない場合
      const original = document.queryCommandSupported;
      delete document.queryCommandSupported;
      expect(clipboardManager.isExecCommandSupported()).toBe(false);
      document.queryCommandSupported = original;
    });

    test('isCopySupported', () => {
      window.isSecureContext = true;
      document.queryCommandSupported.mockReturnValue(true);
      
      expect(clipboardManager.isCopySupported()).toBe(true);

      window.isSecureContext = false;
      expect(clipboardManager.isCopySupported()).toBe(true); // execCommand がサポートされている

      document.queryCommandSupported.mockReturnValue(false);
      expect(clipboardManager.isCopySupported()).toBe(false); // どちらもサポートされていない
    });
  });

  describe('エッジケース', () => {
    test('非常に長いテキストのコピー', async () => {
      const longText = '😊'.repeat(10000);
      navigator.clipboard.writeText.mockResolvedValue();

      const result = await clipboardManager.copyToClipboard(longText);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longText);
    });

    test('特殊文字を含むテキストのコピー', async () => {
      const specialText = '😊\n\t"\'\\';
      navigator.clipboard.writeText.mockResolvedValue();

      const result = await clipboardManager.copyToClipboard(specialText);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(specialText);
    });

    test('絵文字のみのテキストコピー', async () => {
      const emojiText = '😊🐱🌞🎉';
      navigator.clipboard.writeText.mockResolvedValue();

      const result = await clipboardManager.copyToClipboard(emojiText);
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(emojiText);
    });
  });

  describe('パフォーマンステスト', () => {
    test('複数回の連続コピー', async () => {
      navigator.clipboard.writeText.mockResolvedValue();

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(clipboardManager.copyToClipboard(`テスト${i}`));
      }

      const results = await Promise.all(promises);
      
      expect(results.every(result => result === true)).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(100);
    });
  });
});