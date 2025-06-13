document.addEventListener('DOMContentLoaded', () => {
  const extractButton = document.getElementById('extractButton');
  const copyButton = document.getElementById('copyButton');
  const sourceText = document.getElementById('sourceText');
  const resultArea = document.getElementById('resultArea');

  // 抽出ボタンがクリックされたら、入力テキストをバックグラウンドに送信
  extractButton.addEventListener('click', () => {
    const text = sourceText.value;
    if (text) {
      resultArea.value = '抽出中...';
      // バックグラウンドスクリプトに処理を依頼
      chrome.runtime.sendMessage({ action: 'processText', data: text });
    } else {
      resultArea.value = 'テキストが入力されていません。';
    }
  });

  // コピーボタンがクリックされたら、結果をクリップボードにコピー
  copyButton.addEventListener('click', () => {
    if (resultArea.value) {
      resultArea.select();
      document.execCommand('copy');
    }
  });

  // バックグラウンドスクリプトから結果を受け取るリスナー
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateResult') {
      resultArea.value = request.data;
    }
  });
});