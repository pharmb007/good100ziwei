# 紫微・諮詢工作室
Brian 的私人諮詢工作台，部署於 ChatGPT Sites。

## 已實作
- 使用 ChatGPT Sites 登入身分，D1 儲存客戶紀錄，伺服器端依 owner 隔離。
- Renhuai123/ziwei-doushu 排盤引擎：十二宮、本命四化、大限／流年四化疊層、五行局與引擎四柱。
- 手動確認時間，國曆生日、晚子時換日與閏月設定；不自動作時區、夏令時間或真太陽時校正。
- TXT／MD／SRT 文字匯入、原文分段與關鍵字分類、逐段編輯／審閱。
- 定稿保存不可變快照；版本衝突檢查；輸入變更後取消相關審閱狀態。舊逐字稿保存於伺服器版本歷史。
- 客戶報告預覽、Markdown 文字下載、瀏覽器列印／另存 PDF。
- 每月提醒草稿／確認、複製訊息、ICS 行事曆下載。

## 尚未啟用
- AI 改寫、錄音上傳與自動轉錄。
- LINE／Email 自動發送、背景排程、客戶登入與外部報告分享。
- 完整流月盤、八字五行強弱與喜用神。
不要把 UI 中的「內容已確認」理解成已發送。所有示範客戶資料明確標示，不是真實命理解讀。

## 本機
使用 Node.js 22.13 以上：
```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```
平台上的身份由 Sites 注入；本機測試不要擅自移除 production API 的身份檢查。
D1 migration 在 drizzle/；依 Sites 流程套用 migration。資料庫與執行狀態不進入 Git。

## 來源與授權
- 排盤程式來源：https://github.com/Renhuai123/ziwei-doushu
- 本次來源 tree：78eafbf54d4b571833c78b921b1898be256e7dac（擷取時 main）
- 上游 MIT 授權保留於 UPSTREAM-LICENSE。
- 未匯入 docs/tianji-ziwei 原話語料或解讀資料集。
- iztro 與 lunar-javascript 為 npm 套件，各自遵守原授權。
- Sites starter 的相關授權保留於原檔。

## 報告樣板
docs/ziwei_consultation_report_template_v0.1.md 是客戶報告與後台流程規格；部分進階功能依上方「尚未啟用」清單為準。

## GitHub 備份
指定目標：https://github.com/pharmb007/good100ziwei
已透過 pharmb007 帳號完成初版來源快照備份。
部署來源 commit：4285149e410082791bb1fd198deee1bc5733cbf2；詳見 BACKUP.md。
程式碼備份不包含客戶資料、逐字稿、錄音、D1 資料庫、環境密鑰或登入憑證。
主部署來源由 Sites 管理，請勿將 GitHub 備份誤認為已啟用雙向同步或持續鏡像。

