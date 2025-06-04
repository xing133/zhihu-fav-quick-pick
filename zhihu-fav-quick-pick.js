// ==UserScript==
// @name         Zhihu 收藏夹搜索过滤器 + 自动加载全部
// @namespace    https://github.com/xing133/zhihu-fav-quick-pick
// @version      0.3
// @description  “收藏到收藏夹”弹窗里增加搜索框，并自动滚动加载全部收藏夹
// @author       GengXinyuan
// @match        https://www.zhihu.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const DIALOG_SELECTOR = '.Modal.FavlistsModal';
  const LIST_SELECTOR   = '.Favlists-items[role="list"]';
  const ITEM_SELECTOR   = '.Favlists-item';

  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        const dialog = find(node, DIALOG_SELECTOR);
        if (dialog && !dialog.dataset.filterInjected) {
          const list = dialog.querySelector(LIST_SELECTOR);
          if (list) {
            injectFilter(dialog, list);
            autoLoadAll(list);          // <- 关键：自动滚动
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  /* ------------ 注入搜索框 ------------ */
  function injectFilter(dialog, list) {
    dialog.dataset.filterInjected = "1";

    const input = document.createElement("input");
    input.placeholder = "输入关键词过滤收藏夹…";
    input.style.cssText =
      "width:100%;box-sizing:border-box;margin:6px 0;padding:6px 8px;border:1px solid #ddd;border-radius:4px;";
    list.parentElement.insertBefore(input, list);
    input.addEventListener("input", () => {
      const kw = input.value.trim().toLowerCase();
      list.querySelectorAll(ITEM_SELECTOR).forEach(item => {
        const hit = !kw || item.innerText.toLowerCase().includes(kw);
        item.style.display = hit ? "" : "none";
      });
    });
    setTimeout(() => input.focus(), 0);
  }

  /* ------------ 自动滚到底加载全部 ------------ */
  function autoLoadAll(list) {
    let lastCount = 0, idleRounds = 0;                  // idleRounds 用来判定“再也没新内容”
    const loadLoop = () => {
      list.scrollTop = list.scrollHeight;              // 直接把滚动条甩到底
      const curCount = list.querySelectorAll(ITEM_SELECTOR).length;
      if (curCount !== lastCount) {                    // 有新收藏夹→继续
        lastCount = curCount;
        idleRounds = 0;
      } else {
        idleRounds++;
      }
      if (idleRounds < 5) {                            // 连续5轮没增加就算加载完
        setTimeout(loadLoop, 200);
      }
    };
    loadLoop();
  }

  /* ------------ 小工具 ------------ */
  function find(node, sel) {
    return (node instanceof HTMLElement)
      ? (node.matches(sel) ? node : node.querySelector(sel))
      : null;
  }
})();
