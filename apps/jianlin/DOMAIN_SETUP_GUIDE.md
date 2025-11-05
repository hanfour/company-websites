# jianlin.com.tw 網域設定指南

## 設定方式：使用 Nameservers（推薦）

這是將 PChome 購買的網域 `jianlin.com.tw` 連接到 Vercel 部署的完整指南。

---

## 📝 設定步驟檢查清單

### ✅ 步驟 1：在 Vercel Dashboard 新增網域

1. **前往 Vercel 專案頁面**
   ```
   https://vercel.com/hanfours-projects/jianlin
   ```

2. **進入 Domains 設定**
   - 點擊頂部的 "Settings" 標籤
   - 在左側選單點擊 "Domains"

3. **新增自訂網域**
   - 點擊 "Add" 按鈕
   - 在輸入框輸入：`jianlin.com.tw`
   - 點擊 "Add" 確認

4. **選擇 Nameservers 方式**
   - Vercel 會偵測這是外部註冊的網域
   - 選擇 **"Use Nameservers"** 或 **"Configure Nameservers"**
   - Vercel 會顯示兩個 Nameserver 位址

5. **記錄 Nameserver 位址**

   Vercel 提供的 Nameservers 通常是：
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

   **重要：請記下實際顯示的位址！**

---

### ✅ 步驟 2：在 PChome 設定 Nameservers

1. **登入 PChome 網域管理**
   ```
   https://domain.pchome.com.tw/
   ```
   - 使用您的 PChome 帳號登入
   - 進入「網域管理」頁面

2. **找到 jianlin.com.tw**
   - 在網域列表中找到 `jianlin.com.tw`
   - 點擊「管理」或「設定」按鈕

3. **修改名稱伺服器（Nameservers）**

   尋找以下任一名稱的選項：
   - 「名稱伺服器設定」
   - 「DNS 伺服器」
   - 「Nameservers」
   - 「NS 設定」

4. **輸入 Vercel Nameservers**

   將原本的 Nameservers 改為（使用步驟 1 記下的實際位址）：
   ```
   主要名稱伺服器：ns1.vercel-dns.com
   次要名稱伺服器：ns2.vercel-dns.com
   ```

5. **確認設定**
   - 點擊「儲存」或「確認」按鈕
   - PChome 可能會顯示警告訊息，例如：
     > "修改名稱伺服器後，現有的 DNS 記錄將失效"
   - 這是正常的，點擊「確認」繼續

---

### ✅ 步驟 3：等待 DNS 生效

**生效時間**
- 最快：15-30 分鐘
- 一般：2-6 小時
- 最慢：48 小時

**如何檢查是否生效**

在終端機執行以下命令：

```bash
# 檢查 Nameservers 是否已更新
dig jianlin.com.tw NS

# 或使用 nslookup
nslookup -type=NS jianlin.com.tw
```

**成功的結果應該顯示：**
```
jianlin.com.tw.    nameserver = ns1.vercel-dns.com.
jianlin.com.tw.    nameserver = ns2.vercel-dns.com.
```

---

### ✅ 步驟 4：在 Vercel 確認網域生效

1. **返回 Vercel Dashboard**
   - Settings → Domains
   - 找到 `jianlin.com.tw`

2. **等待驗證完成**
   - 當 DNS 生效後，Vercel 會自動驗證
   - 網域狀態會變成綠色勾勾 ✓
   - SSL 憑證會自動申請並配置

3. **測試網站**
   ```
   https://jianlin.com.tw
   ```
   - 應該可以正常訪問
   - 瀏覽器顯示安全鎖頭圖示（SSL 已啟用）

---

### ✅ 步驟 5：（可選）新增 www 子網域

如果您也想支援 `www.jianlin.com.tw`：

1. 在 Vercel Domains 頁面點擊 "Add"
2. 輸入：`www.jianlin.com.tw`
3. 點擊 "Add"
4. Vercel 會自動設定，並將 www 重新導向到根網域

**不需要在 PChome 做任何設定**（因為已使用 Nameservers）

---

## 🔍 驗證與測試

### 檢查 DNS 設定

```bash
# 檢查網域指向
dig jianlin.com.tw

# 檢查 Nameservers
dig jianlin.com.tw NS

# 檢查 SSL 憑證
curl -I https://jianlin.com.tw
```

### 線上檢查工具

- **DNS 檢查**: https://dnschecker.org/
  - 輸入 `jianlin.com.tw`
  - 選擇記錄類型：NS
  - 查看全球 DNS 伺服器的更新狀態

- **SSL 檢查**: https://www.sslshopper.com/ssl-checker.html
  - 輸入 `https://jianlin.com.tw`
  - 確認憑證是否有效

---

## ⚠️ 常見問題排除

### 問題 1：PChome 不讓我修改 Nameservers

**可能原因：**
- 網域啟用了「網域鎖定」功能
- 網域正在「轉移中」狀態
- 網域註冊後 60 天內有轉移限制

**解決方案：**
1. 檢查網域狀態，確認沒有啟用鎖定
2. 如果有「解鎖」按鈕，先點擊解鎖
3. 聯絡 PChome 客服：0800-007-299

---

### 問題 2：DNS 設定後很久都沒生效

**解決方案：**

1. **清除本地 DNS 快取**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

2. **使用不同的 DNS 查詢**
   ```bash
   # 使用 Google DNS 查詢
   dig @8.8.8.8 jianlin.com.tw NS

   # 使用 Cloudflare DNS 查詢
   dig @1.1.1.1 jianlin.com.tw NS
   ```

3. **檢查 PChome 設定是否真的保存**
   - 重新登入 PChome 網域管理
   - 確認 Nameservers 設定確實是 Vercel 的位址

---

### 問題 3：Vercel 顯示 SSL 憑證錯誤

**解決方案：**
- Vercel 會在 DNS 生效後自動申請 Let's Encrypt SSL 憑證
- 通常需要 5-15 分鐘
- 如果超過 1 小時仍未完成：
  1. 在 Vercel Domains 頁面找到網域
  2. 點擊網域旁的「⋯」選單
  3. 選擇「Refresh」或「Renew Certificate」

---

### 問題 4：網站顯示 404 Not Found

**解決方案：**
- 確認 Vercel 專案有成功部署
- 檢查最新部署狀態：https://vercel.com/hanfours-projects/jianlin
- 如果部署正常但網域 404，嘗試：
  1. 移除網域後重新新增
  2. 聯絡 Vercel Support

---

## 📞 支援聯絡資訊

### PChome 客服
- 電話：0800-007-299
- 網站：https://domain.pchome.com.tw/

### Vercel Support
- Help Center: https://vercel.com/help
- Community: https://github.com/vercel/vercel/discussions

---

## 📚 相關文件

- [Vercel Custom Domains 官方文件](https://vercel.com/docs/concepts/projects/domains)
- [DNS 設定完整指南](https://vercel.com/docs/concepts/projects/domains/add-a-domain)
- [Nameservers 說明](https://vercel.com/docs/concepts/projects/domains/add-a-domain#nameservers)

---

## 🎉 設定完成後

當所有步驟完成，您應該可以：

1. ✅ 訪問 `https://jianlin.com.tw` 看到網站
2. ✅ 瀏覽器顯示安全鎖頭（SSL 已啟用）
3. ✅ 在 Vercel Dashboard 看到綠色勾勾
4. ✅ 未來每次 `git push` 自動更新到自訂網域

**恭喜！您已成功設定自訂網域！** 🎊

---

**最後更新**：2025-11-05
**專案**：jianlin
**網域**：jianlin.com.tw
**部署平台**：Vercel
