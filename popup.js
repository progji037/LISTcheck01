document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === target) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  const extractButton = document.getElementById('extractButton');
  const copyButton = document.getElementById('copyButton');
  const sourceText = document.getElementById('sourceText');
  const resultArea = document.getElementById('resultArea');
  const openUrlsButton = document.getElementById('openUrlsButton');
  const urlList = document.getElementById('urlList');

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

  // URLを開くボタンがクリックされたら、URLリストをバックグラウンドに送信
  openUrlsButton.addEventListener('click', () => {
    const urls = urlList.value.split('\n').filter(url => url.trim() !== '');
    if (urls.length > 0) {
      chrome.runtime.sendMessage({ action: 'openUrls', urls: urls });
    }
  });

  // バックグラウンドスクリプトから結果を受け取るリスナー
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateResult') {
      resultArea.value = request.data;
    }
  });
});