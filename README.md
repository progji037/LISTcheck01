# LISTcheck01
chromeの拡張機能になります。

【Chrome拡張を「ソースコードをダウンロードしてから」追加する手順（サンプル版）】

1) GitHubからソースコードをダウンロード
- リポジトリページを開く
- 「Code」→「Download ZIP」をクリック

2) ZIPを解凍する
- ダウンロードしたZIPを右クリック →「すべて展開」
- 任意の場所に解凍する（例：デスクトップなど）

3) manifest.json の場所を確認（最重要）
- 解凍したフォルダを開く
- 「manifest.json」が “そのフォルダ直下” にあるか確認する

  ✅OK例：
  YOUR_FOLDER/
    manifest.json

  ❌NG例（1階層ズレ）：
  YOUR_FOLDER/
    project-main/
      manifest.json

  → NGの場合は「manifest.json が入っているフォルダ」をChromeで選ぶ

4) Chromeの拡張機能ページを開く
- Chromeのアドレスバーに入力してEnter
  chrome://extensions/

5) デベロッパーモードをON
- 右上の「デベロッパーモード」をONにする

6) 拡張機能を読み込む
- 左上の「パッケージ化されていない拡張機能を読み込む」をクリック
- ③で確認した「manifest.json があるフォルダ」を選択してOK

  （例：）
  C:\path\to\your-extension-folder

7) 動作確認
- 拡張機能一覧に表示される
- 必要ならパズルアイコンからピン留め

8) ソースを修正した場合（更新手順）
- chrome://extensions/ を開く
- 対象拡張の「更新（↻）」ボタンを押す

【よくあるエラー】
- 「Manifest file is missing」
  → 選択したフォルダが違う（manifest.json の直下フォルダを選ぶ）

- 「Service worker registration failed」
  → manifest.json の記述ミス or ファイルパス不一致