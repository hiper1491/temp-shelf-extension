document.getElementById('saveBtn').addEventListener('click', async () => {
  
  // 1. 抓到所有分頁
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // 2. 建立主資料夾 (加上時間，避免資料夾名稱重複)
  const now = new Date();
  const todayFolderName = `TempShelf_${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
  const rootFolder = await chrome.bookmarks.create({ title: todayFolderName });

  // 3. 建立分類子資料夾
  const categories = {
    shopping: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "🛒 購物暫存" }),
    tech: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "💻 技術資料" }),
    others: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "📝 待讀/其他" })
  };

  // 4. 開始收納
  for (const tab of tabs) {
    // 只要網址是以 http 開頭的（排除 Chrome 內建頁面）
    if (tab.url && tab.url.startsWith('http')) {
      
      // 重複檢查 (可選：如果想連重複的都收，可以把下面這兩行刪掉)
      const existing = await chrome.bookmarks.search({ url: tab.url });
      if (existing.length > 0) {
        console.log("重複了，但我們還是把它收進去新資料夾，確保分頁能關閉");
      }

      // --- 核心改進：預設目標是「其他」 ---
      let targetFolderId = categories.others.id; 
      const url = tab.url.toLowerCase();
      const title = (tab.title || "").toLowerCase();

      // 擴大購物偵測：加入 iherb 和更多的購物字眼
      const shopKeywords = ['shopee', 'momo', 'amazon', 'iherb', 'ruten', 'pchome', '買', '購', 'price', 'sale', '特價'];
      const techKeywords = ['github', 'stack', 'medium', '程式', '開發', 'tutorial', 'blog'];

      if (shopKeywords.some(key => url.includes(key) || title.includes(key))) {
        targetFolderId = categories.shopping.id;
      } else if (techKeywords.some(key => url.includes(key) || title.includes(key))) {
        targetFolderId = categories.tech.id;
      }

      // 執行儲存 (這一步現在保證會執行，因為至少會進 others)
      await chrome.bookmarks.create({
        parentId: targetFolderId,
        title: tab.title || "無標題網頁",
        url: tab.url
      });
    }
  }

  // 5. 確保全部處理完後，才執行關閉動作
  await chrome.tabs.create({ url: 'chrome://newtab' });
  const tabIds = tabs.map(tab => tab.id);
  await chrome.tabs.remove(tabIds);
  window.close();
});