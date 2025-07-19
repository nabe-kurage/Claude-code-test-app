// テスト環境のセットアップファイル

// DOM のモック設定
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// console.error のモック（テスト実行時の警告を抑制）
const originalError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // テスト関連のエラーメッセージを除外
    if (!args.join(' ').includes('Warning:') && !args.join(' ').includes('Error:')) {
      originalError(...args);
    }
  });
});

afterAll(() => {
  console.error.mockRestore();
});

// 共通のテストヘルパー関数
global.mockConsoleError = () => {
  return jest.spyOn(console, 'error').mockImplementation(() => {});
};

global.restoreConsoleError = (spy) => {
  if (spy) {
    spy.mockRestore();
  }
};

// Clipboard API のモック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// Web Share API のモック
Object.assign(navigator, {
  share: jest.fn(() => Promise.resolve()),
});

// isSecureContext のモック
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true
});

// queryCommandSupported のモック
Object.assign(document, {
  queryCommandSupported: jest.fn(() => true),
  execCommand: jest.fn(() => true),
});

// カスタムマッチャーの追加（必要に応じて）
expect.extend({
  toBeValidEmoji(received) {
    // 絵文字の簡単な検証
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    const pass = emojiRegex.test(received);
    
    if (pass) {
      return {
        message: () => `期待した結果: ${received} は絵文字ではありません`,
        pass: true,
      };
    } else {
      return {
        message: () => `期待した結果: ${received} は有効な絵文字です`,
        pass: false,
      };
    }
  },
});

// グローバルなテストヘルパー関数
global.createMockElement = (id, tagName = 'div') => {
  const element = document.createElement(tagName);
  element.id = id;
  document.body.appendChild(element);
  return element;
};

global.cleanupDOM = () => {
  document.body.innerHTML = '';
};

// 各テスト後にDOMをクリーンアップ
afterEach(() => {
  cleanupDOM();
  jest.clearAllMocks();
});

// タイマーのモック
jest.useFakeTimers();