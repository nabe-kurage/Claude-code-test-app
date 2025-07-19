import { UIManager } from '../js/uiManager.js';

describe('UIManager', () => {
  let uiManager;
  let mockElements;

  beforeEach(() => {
    // DOM要素のモックを作成
    mockElements = {
      searchInput: createMockElement('searchInput', 'input'),
      searchButton: createMockElement('searchButton', 'button'),
      resultDisplay: createMockElement('result', 'div'),
      actionButtons: createMockElement('actionButtons', 'div'),
      copyButton: createMockElement('copyButton', 'button'),
      shareButton: createMockElement('shareButton', 'button')
    };

    uiManager = new UIManager();
  });

  describe('初期化', () => {
    test('DOM要素が正しく初期化される', () => {
      expect(uiManager.elements.searchInput).toBeTruthy();
      expect(uiManager.elements.searchButton).toBeTruthy();
      expect(uiManager.elements.resultDisplay).toBeTruthy();
    });

    test('入力フィールドにフォーカスイベントリスナーが設定される', () => {
      const focusSpy = jest.spyOn(mockElements.searchInput, 'focus');
      
      // loadイベントを発火
      window.dispatchEvent(new Event('load'));
      
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('getInputText', () => {
    test('入力テキストを正しく取得', () => {
      mockElements.searchInput.value = 'テストテキスト';
      expect(uiManager.getInputText()).toBe('テストテキスト');
    });

    test('空の入力テキストを取得', () => {
      mockElements.searchInput.value = '';
      expect(uiManager.getInputText()).toBe('');
    });
  });

  describe('setInputText', () => {
    test('入力テキストを正しく設定', () => {
      uiManager.setInputText('新しいテキスト');
      expect(mockElements.searchInput.value).toBe('新しいテキスト');
    });

    test('空文字を設定', () => {
      uiManager.setInputText('');
      expect(mockElements.searchInput.value).toBe('');
    });
  });

  describe('displayResult', () => {
    test('結果を正しく表示', () => {
      uiManager.displayResult('😊 🐱');
      
      expect(mockElements.resultDisplay.textContent).toBe('😊 🐱');
      expect(mockElements.resultDisplay.className).toBe('result-display');
    });

    test('結果がある場合はアクションボタンを表示', (done) => {
      uiManager.displayResult('😊');
      
      // アニメーション完了後にチェック
      setTimeout(() => {
        expect(mockElements.actionButtons.style.display).toBe('flex');
        done();
      }, 100);
    });

    test('空の結果でアクションボタンを非表示', () => {
      uiManager.displayResult('');
      expect(mockElements.actionButtons.style.display).toBe('none');
    });
  });

  describe('showLoading', () => {
    test('ローディング状態を正しく表示', () => {
      uiManager.showLoading();
      
      expect(mockElements.resultDisplay.textContent).toBe('検索中...');
      expect(mockElements.resultDisplay.className).toBe('result-display loading');
    });

    test('ローディング時はアクションボタンを非表示', () => {
      uiManager.showLoading();
      expect(mockElements.actionButtons.style.display).toBe('none');
    });
  });

  describe('clearResult', () => {
    test('結果を正しくクリア', () => {
      // 事前に結果を設定
      mockElements.resultDisplay.textContent = '😊';
      mockElements.resultDisplay.className = 'result-display';
      
      uiManager.clearResult();
      
      expect(mockElements.resultDisplay.textContent).toBe('');
      expect(mockElements.resultDisplay.className).toBe('result-display');
    });
  });

  describe('getResultText', () => {
    test('結果テキストを正しく取得', () => {
      mockElements.resultDisplay.textContent = '😊 🐱';
      expect(uiManager.getResultText()).toBe('😊 🐱');
    });
  });

  describe('アクションボタンの表示/非表示', () => {
    test('showActionButtons', (done) => {
      uiManager.showActionButtons();
      
      expect(mockElements.actionButtons.style.display).toBe('flex');
      
      setTimeout(() => {
        expect(mockElements.actionButtons.classList.contains('visible')).toBe(true);
        done();
      }, 100);
    });

    test('hideActionButtons', (done) => {
      // 最初に表示状態にする
      mockElements.actionButtons.style.display = 'flex';
      mockElements.actionButtons.classList.add('visible');
      
      uiManager.hideActionButtons();
      
      expect(mockElements.actionButtons.classList.contains('visible')).toBe(false);
      
      setTimeout(() => {
        expect(mockElements.actionButtons.style.display).toBe('none');
        done();
      }, 350);
    });
  });

  describe('animateButtonClick', () => {
    test('ボタンクリックアニメーションを実行', (done) => {
      const button = mockElements.copyButton;
      
      uiManager.animateButtonClick(button);
      
      expect(button.classList.contains('clicked')).toBe(true);
      
      setTimeout(() => {
        expect(button.classList.contains('clicked')).toBe(false);
        done();
      }, 350);
    });

    test('無効なボタンでエラーが発生しない', () => {
      expect(() => {
        uiManager.animateButtonClick(null);
      }).not.toThrow();
    });
  });

  describe('temporaryButtonText', () => {
    test('ボタンテキストを一時的に変更', (done) => {
      const button = mockElements.copyButton;
      button.innerHTML = '元のテキスト';
      
      uiManager.temporaryButtonText(button, '新しいテキスト', 100);
      
      expect(button.innerHTML).toBe('新しいテキスト');
      
      setTimeout(() => {
        expect(button.innerHTML).toBe('元のテキスト');
        done();
      }, 150);
    });
  });

  describe('validateInput', () => {
    test('有効な入力でtrueを返す', () => {
      mockElements.searchInput.value = '嬉しい';
      expect(uiManager.validateInput()).toBe(true);
    });

    test('空の入力でfalseを返す', () => {
      mockElements.searchInput.value = '';
      expect(uiManager.validateInput()).toBe(false);
    });

    test('スペースのみの入力でfalseを返す', () => {
      mockElements.searchInput.value = '   ';
      expect(uiManager.validateInput()).toBe(false);
    });
  });

  describe('イベントリスナー', () => {
    test('エンターキーで検索イベントが発火', () => {
      const searchSpy = jest.fn();
      document.addEventListener('search-requested', searchSpy);
      
      mockElements.searchInput.value = 'テスト';
      
      // エンターキーイベントを発火
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      mockElements.searchInput.dispatchEvent(event);
      
      expect(searchSpy).toHaveBeenCalled();
    });

    test('入力クリア時にクリアイベントが発火', () => {
      // 事前に結果を設定
      mockElements.resultDisplay.textContent = '😊';
      
      // 入力をクリア
      mockElements.searchInput.value = '';
      mockElements.searchInput.dispatchEvent(new Event('input'));
      
      expect(mockElements.resultDisplay.textContent).toBe('');
    });
  });

  describe('コールバック設定', () => {
    test('onCopyButtonClick でコールバックが設定される', () => {
      const callback = jest.fn();
      uiManager.onCopyButtonClick(callback);
      
      mockElements.copyButton.click();
      
      expect(callback).toHaveBeenCalled();
    });

    test('onShareButtonClick でコールバックが設定される', () => {
      const callback = jest.fn();
      uiManager.onShareButtonClick(callback);
      
      mockElements.shareButton.click();
      
      expect(callback).toHaveBeenCalled();
    });

    test('onSearchButtonClick でコールバックが設定される', () => {
      const callback = jest.fn();
      uiManager.onSearchButtonClick(callback);
      
      mockElements.searchButton.click();
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しない要素での操作でエラーが発生しない', () => {
      // 要素を削除
      document.body.innerHTML = '';
      
      const uiManagerWithoutElements = new UIManager();
      
      expect(() => {
        uiManagerWithoutElements.displayResult('😊');
        uiManagerWithoutElements.showLoading();
        uiManagerWithoutElements.clearResult();
        uiManagerWithoutElements.showActionButtons();
        uiManagerWithoutElements.hideActionButtons();
      }).not.toThrow();
    });
  });
});