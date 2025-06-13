chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processText') {
    processTextWithNewLogic(request.data);
  }
  return true;
});

function processTextWithNewLogic(text) {
  const lines = text.split('\n').map(line => line.trim());
  let companies = new Set();

  // --- 第1段階：構造ベースでの抽出 ---
  const prefectures = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "その他"];
  for (let i = 0; i < lines.length - 1; i++) {
    const companyLine = lines[i];
    const prefLine = lines[i + 1];

    if (prefectures.includes(prefLine)) {
      // 会社名らしいかどうかの簡易チェック
      if (companyLine.length > 2 && companyLine.length < 50) {
        companies.add(companyLine);
      }
    }
  }

  // --- 第2段階：キーワードベースでの補完抽出 ---
  const keywords = ['株式会社', '合同会社'];
  const exclusionWords = ['代表取締役', '費用：', '円', '設立：', '制作期間', 'http', '©'];

  lines.forEach(line => {
    // 除外ワードが含まれる行はスキップ
    if (exclusionWords.some(word => line.includes(word))) {
      return;
    }

    // キーワードが含まれるかチェック
    if (keywords.some(keyword => line.includes(keyword))) {
      // 会社名として妥当かチェック（長すぎず、短すぎない）
      if (line.length > 2 && line.length < 50) {
        companies.add(line);
      }
    }
  });

  const uniqueCompanies = [...companies];

  if (uniqueCompanies.length === 0) {
    chrome.runtime.sendMessage({ action: 'updateResult', data: '会社が見つかりませんでした。' });
    return;
  }

  const resultList = uniqueCompanies.map(company => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(company)}`;
    return `${company}\t${searchUrl}`;
  });

  chrome.runtime.sendMessage({ action: 'updateResult', data: resultList.join('\n') });
}