document.getElementById('saveBtn').addEventListener('click', async () => {
  
  // 1. 抓到現在開著的所有分頁
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // 2. 建立一個今天的大資料夾
  const now = new Date();
  const todayFolderName = `TempShelf_${now.getMonth() + 1}${now.getDate()}`;
  const rootFolder = await chrome.bookmarks.create({ title: todayFolderName });

  // 3. 準備三個分類小框框 (子資料夾)
  const categories = {
    shopping: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "🛒 購物暫存" }),
    tech: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "💻 技術資料" }),
    others: await chrome.bookmarks.create({ parentId: rootFolder.id, title: "📝 待讀/其他" })
  };

  // 4. 一個一個檢查分頁，決定要放哪
  for (const tab of tabs) {
    if (tab.url.startsWith('http')) {
      
      // --- 重複檢查邏輯 ---
      const existing = await chrome.bookmarks.search({ url: tab.url });
      if (existing.length > 0) {
        console.log("這網頁存過了，跳過！");
        continue; // 如果存過了，就不再存一次
      }

      // --- 自動分類邏輯 ---
      let targetFolderId = categories.others.id; // 預設放其他
      const url = tab.url.toLowerCase();

      if (url.includes('shopee') || url.includes('momo') || url.includes('amazon')) {
        targetFolderId = categories.shopping.id;
      } else if (url.includes('github') || url.includes('stackoverflow') || url.includes('medium')) {
        targetFolderId = categories.tech.id;
      }

      await chrome.bookmarks.create({
        parentId: targetFolderId,
        title: tab.title,
        url: tab.url
      });
    }
  }

  // 5. 收工：開新分頁、關掉舊的
  await chrome.tabs.create({ url: 'chrome://newtab' });
  const tabIds = tabs.map(tab => tab.id);
  await chrome.tabs.remove(tabIds);
  window.close();
});