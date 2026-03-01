chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processText') {
    processTextWithNewLogic(request.data);
  } else if (request.action === 'openUrls') {
    request.urls.forEach(url => {
      chrome.tabs.create({ url: url });
    });
  }
  return true;
});

// 会社名の前後の行から住所を探す関数
function findAddressForCompany(lines, companyIndex, companyName) {
  const searchRange = 3; // 前後3行を検索
  const startIdx = Math.max(0, companyIndex - searchRange);
  const endIdx = Math.min(lines.length - 1, companyIndex + searchRange);

  // 都道府県リストは既存のものを使用
  const prefectures = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "その他"];

  // 市区町村を判定するためのキーワード
  const cityKeywords = ["市", "区", "町", "村"];

  for (let i = startIdx; i <= endIdx; i++) {
    if (i === companyIndex) continue; // 会社名の行はスキップ

    const line = lines[i];

    // 都道府県名を含むかチェック
    const hasPrefecture = prefectures.some(pref => line.includes(pref));

    // 市区町村キーワードを含むかチェック
    const hasCity = cityKeywords.some(keyword => line.includes(keyword));

    // 都道府県と市区町村の両方を含む場合、住所として扱う
    if (hasPrefecture && hasCity) {
      return line;
    }
  }

  return null; // 住所が見つからない場合
}

// 会社名の前の行から文言を取得する関数
function findTitleForCompany(lines, companyIndex) {
  if (companyIndex > 0) {
    const titleLine = lines[companyIndex - 1];

    // 直前の行が「新着」を含む場合は、さらにその上の行を取得
    if (titleLine && titleLine.includes('新着')) {
      if (companyIndex > 1) {
        const aboveTitleLine = lines[companyIndex - 2];
        if (aboveTitleLine && aboveTitleLine.trim() !== '') {
          return aboveTitleLine;
        }
      }
    }

    // 通常のケース：直前の行を返す
    if (titleLine && titleLine.trim() !== '') {
      return titleLine;
    }
  }
  return "文言なし"; // 文言が見つからない場合
}

// 文字列から半角・全角スペースを削除する関数
function removeSpaces(str) {
  return str.replace(/[\s　]/g, '');
}

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
  const keywords = ['株式会社', '合同会社', '(株)', '有限会社', '(有)'];
  const exclusionWords = ['代表取締役', '費用：', '円', '設立：', '制作期間', 'http', '©'];
  // イメージ画像パターンの定義（これを含む行は抽出から除外）
  const imagePatterns = ['のイメージ画像', 'のイメージ', 'の画像'];

  lines.forEach(line => {
    // 除外ワードが含まれる行はスキップ
    if (exclusionWords.some(word => line.includes(word))) {
      return;
    }

    // イメージ画像パターンが含まれる行はスキップ
    if (imagePatterns.some(pattern => line.includes(pattern))) {
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

  // 類似した会社名をグループ化し、基本形だけを残す処理を追加
  const companyGroups = {};

  // 除外するパターンのリスト
  const excludePatterns = [
    'のイメージ画像', 'のイメージ', 'の画像', 'イメージ', '画像',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '０', '１', '２', '３', '４', '５', '６', '７', '８', '９'
  ];

  // 会社名をグループ化する
  uniqueCompanies.forEach(company => {
    // 会社名の基本部分を抽出
    let baseCompany = company;

    // 除外パターンを取り除いた会社名を作成
    let cleanedCompany = company;
    for (const pattern of excludePatterns) {
      cleanedCompany = cleanedCompany.replace(new RegExp(pattern, 'g'), '');
    }
    // 連続する空白を1つにまとめる
    cleanedCompany = cleanedCompany.replace(/\s+/g, ' ').trim();

    // キーワードを含む会社名を処理
    for (const keyword of keywords) {
      if (cleanedCompany.includes(keyword)) {
        // キーワードの位置を特定
        const keywordIndex = cleanedCompany.indexOf(keyword);
        // キーワードの後の文字列を取得
        const afterKeyword = cleanedCompany.substring(keywordIndex + keyword.length).trim();

        if (afterKeyword) {
          // 基本形を作成（例：「株式会社 キュー」）
          baseCompany = `${keyword} ${afterKeyword}`;
          break;
        }
      }
    }

    // グループに追加
    if (!companyGroups[baseCompany]) {
      companyGroups[baseCompany] = [];
    }
    companyGroups[baseCompany].push(company);
  });

  // 各グループから最も短い会社名を選択
  const groupedCompanies = [];
  for (const baseCompany in companyGroups) {
    const group = companyGroups[baseCompany];
    // 最も短い会社名を選択（基本形と思われるため）
    const shortestCompany = group.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest, group[0]);
    groupedCompanies.push(shortestCompany);
  }

  // グループ化された会社名リストを使用
  const finalCompanies = groupedCompanies;

  if (finalCompanies.length === 0) {
    chrome.runtime.sendMessage({ action: 'updateResult', data: '会社が見つかりませんでした。' });
    return;
  }

  // 結果リストを作成（会社名、住所、URL、文言をコロン区切りで横に並べる）
  const resultList = [];
  finalCompanies.forEach(company => {
    // 会社名の行番号を検索
    const companyIndex = lines.findIndex(line => line === company);
    // 会社名の前後から住所を探す
    const address = findAddressForCompany(lines, companyIndex, company);
    // 会社名の前から文言を取得
    const titleText = findTitleForCompany(lines, companyIndex);
    // Google検索URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(company)}`;

    // 住所情報（見つからない場合は「住所情報なし」）
    const addressInfo = address ? address : "住所情報なし";

    // 会社名からスペースを削除
    const companyWithoutSpaces = removeSpaces(company);

    // 会社名（スペース削除済み）、住所、URL、文言をタブ区切りで1行に表示（スプレッドシートで各項目が別セルに入るように）
    resultList.push(`${companyWithoutSpaces}\t${addressInfo}\t${searchUrl}\t${titleText}`);
  });

  chrome.runtime.sendMessage({ action: 'updateResult', data: resultList.join('\n') });
}