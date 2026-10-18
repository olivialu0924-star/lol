# 投票計算網站

這是一個簡單的前端網站，將原本的 Jupyter / ipywidgets 投票計算邏輯改成可直接在瀏覽器中使用。

## 啟動方式

在專案資料夾中執行：

```bash
cd /workspaces/lol
python3 -m http.server 8000
```

接著打開瀏覽器，前往：

```text
http://localhost:8000
```

## 功能

- 設定候選人數量
- 動態產生各候選人的名次票數輸入欄位
- 自動計算：
  - 傳統一人一票制（第一名票數）
  - 排名計分制（Borda count）
- 檢查各名次總票數是否一致
- 顯示平手結果與統計報告
