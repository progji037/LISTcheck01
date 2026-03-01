# 企業情報抽出機能改善計画

## 現状分析

現在の拡張機能は以下の情報を抽出しています：
- 企業名（「株式会社」などのキーワードを含む行）
- 住所（企業名の前後から都道府県と市区町村を含む行）
- Google検索URL（企業名をもとに生成）

出力フォーマット：`企業名\t住所\tURL`

## 改善要件

1. **企業名の前にある文言（求人タイトル）も取得する**
   - 例：「企画から関わるWEBデザイナー」（企業名「株式会社丸信」の前の行）
   - 文言にはリンクが付属しているのでそのまま保持

2. **出力フォーマットの変更**
   - 現在: `企業名\t住所\tURL`
   - 改善後: `企業名：住所：URL：文言`

## 実装方針

### 1. background.jsの修正

#### 新しい関数の追加
```javascript
// 会社名の前の行から文言を取得する関数
function findTitleForCompany(lines, companyIndex) {
  if (companyIndex > 0) {
    const titleLine = lines[companyIndex - 1];
    if (titleLine && titleLine.trim() !== '') {
      return titleLine;
    }
  }
  return "文言なし"; // 文言が見つからない場合
}
```

#### 結果リスト作成部分の修正
```javascript
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

  // 会社名、住所、URL、文言をコロン区切りで1行に表示
  resultList.push(`${company}：${addressInfo}：${searchUrl}：${titleText}`);
});
```

## 期待される結果

改善後は以下のような出力が得られます：

```
株式会社丸信：福岡県 久留米市 山川市ノ上町：https://www.google.com/search?q=株式会社丸信：企画から関わるWEBデザイナー
```

## 考慮事項

1. **文言の信頼性**
   - 単純に企業名の前の行を文言として取得するため、実際の求人タイトルでない可能性もある
   - より正確な抽出のためには、文言の特徴（長さや特定のキーワードなど）を考慮した判定ロジックの追加も検討

2. **区切り文字の変更**
   - タブ区切りからコロン区切りに変更するため、既存のデータ処理に影響がある場合は注意が必要

3. **エッジケース**
   - テキストの最初の行が企業名の場合、文言は「文言なし」となる
   - 複数行にわたる文言がある場合は、現在の実装では1行目のみ取得される