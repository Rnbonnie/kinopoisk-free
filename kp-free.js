// ==UserScript==
// @name         Кинопоиск free
// @namespace    https://github.com/Rnbonnie/kinopoisk-free
// @version      1.7.10
// @description  Позволяет бесплатно смотреть фильмы на кинопоиск
// @author       Rnbonnie
// @license      MIT
// @match        https://www.kinopoisk.ru/*
// @match        https://hd.kinopoisk.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kinopoisk.ru
// @grant        GM_addElement
// @sandbox      JavaScript
// @run-at       document-end
// @homepageURL  https://github.com/Rnbonnie/kinopoisk-free
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_DOMAIN = 'https://www.kinokino.vip';
    const GREEN_GRADIENT = 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)';

    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
        if (child && (child.dataset?.tampermonkeyHidden || child.classList?.contains('custom-buttons-wrapper'))) {
            return child;
        }
        return originalRemoveChild.apply(this, arguments);
    };

    const style = document.createElement('style');
    style.textContent = `
    button[data-test-id="Offer"],
    button[data-test-id="MainButton_offer"],
    button[data-test-id="watch-button"],
    button[data-test-id="ContentActions_bookmarkButton"],
    .kinopoisk-watch-online-button,
    .styles_watchOnlineButton__VufaL,
    button[title="Буду смотреть"]:not(.custom-bookmark-btn),
 [class*="watchOnlineButton"],
 [class*="MainButton_offer"],
 [class*="PurchaseButton"],
 [class*="HeroButton"],
 [data-test-id="play-button"] {
     display: none !important;
     opacity: 0 !important;
     width: 0 !important;
     height: 0 !important;
     padding: 0 !important;
     margin: 0 !important;
     overflow: hidden !important;
 }

 .styles_button__3MsZF:has([data-tampermonkey-hidden="true"]) {
     display: none !important;
 }
 `;
 (document.head || document.documentElement).appendChild(style);

 function waitForElement(selector, timeout = 3000) {
     return new Promise((resolve) => {
         const startTime = Date.now();
         let timerId = null;
         function check() {
             const el = document.querySelector(selector);
             if (el) {
                 clearTimeout(timerId);
                 resolve(el);
             } else if (Date.now() - startTime > timeout) {
                 clearTimeout(timerId);
                 resolve(null);
             } else {
                 timerId = setTimeout(check, 50);
             }
         }
         check();
     });
 }

 async function extractRealId() {
     let detailLink = document.querySelector('a[data-test-id="outerlink_a"]');
     if (!detailLink) {
         const tabs = document.querySelectorAll('button.styles_button__C5GSm, [data-tid="TabItem"] button');
         const detailsTab = Array.from(tabs).find(btn => btn.textContent.trim() === 'Детали');
         if (detailsTab) {
             detailsTab.click();
             detailLink = await waitForElement('a[data-test-id="outerlink_a"]', 3000);
         }
     }
     if (detailLink && detailLink.href) {
         try {
             const urlObj = new URL(detailLink.href);
             return urlObj.pathname;
         } catch (e) {
             console.error("Ошибка парсинга ссылки:", e);
         }
     }
     return null;
 }

 async function redirectToAlternative(e) {
     e.preventDefault();
     e.stopPropagation();

     let finalPath = window.location.pathname + window.location.search;
     if (window.location.hostname === 'hd.kinopoisk.ru') {
         const realIdPath = await extractRealId();
         if (realIdPath) {
             finalPath = realIdPath;
         } else {
             alert("Не удалось дождаться загрузки ID фильма. Проверьте интернет или вкладку 'Детали'.");
             return;
         }
     }
     window.open(TARGET_DOMAIN + finalPath, '_blank');
 }

 function getCleanButtonText() {
     const path = window.location.pathname;
     const pageTitle = document.querySelector('title')?.innerText || "";
     const bodyText = document.body.innerText || "";

     if (path.includes('/series/') || pageTitle.includes('сериал') || bodyText.includes('Сезоны и серии') || bodyText.includes('Выбрать серию')) {
         return 'Смотреть сериал';
     }
     return 'Смотреть фильм';
 }

 function createCustomWatchButton() {
     const btn = document.createElement('button');
     btn.className = 'custom-kinokino-btn';

     btn.innerHTML = `
     <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
     <path d="M8 5v14l11-7z"/>
     </svg>
     <span class="custom-btn-text" style="vertical-align: middle; font-weight: 500;">${getCleanButtonText()}</span>
     `;
     btn.style.background = GREEN_GRADIENT;
     btn.style.color = '#111111';
     btn.style.border = 'none';
     btn.style.borderRadius = '26px';
     btn.style.height = '52px';
     btn.style.padding = '0 24px';
     btn.style.fontSize = '15px';
     btn.style.cursor = 'pointer';
     btn.style.display = 'inline-flex';
     btn.style.alignItems = 'center';
     btn.style.justifyContent = 'center';
     btn.style.transition = 'transform 0.1s ease';
     btn.style.marginRight = '12px';
     btn.style.whiteSpace = 'nowrap';

     btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.98)');
     btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
     btn.addEventListener('click', redirectToAlternative, true);
     return btn;
 }

 function createCustomBookmarkButton(originalButton) {
     const btn = document.createElement('button');
     btn.className = 'custom-bookmark-btn';
     btn.title = 'Буду смотреть';

     btn.innerHTML = `
     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
     <line x1="12" y1="7" x2="12" y2="13"></line>
     <line x1="9" y1="10" x2="15" y2="10"></line>
     </svg>
     `;

     btn.style.width = '52px';
     btn.style.height = '52px';
     btn.style.borderRadius = '50%';
     btn.style.border = 'none';
     btn.style.cursor = 'pointer';
     btn.style.display = 'inline-flex';
     btn.style.alignItems = 'center';
     btn.style.justifyContent = 'center';
     btn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
     btn.style.color = '#fff';
     btn.style.transition = 'background-color 0.2s, transform 0.1s';

     btn.addEventListener('mouseenter', () => btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)');
     btn.addEventListener('mouseleave', () => btn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)');
     btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
     btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');

     btn.addEventListener('click', (e) => {
         e.preventDefault();
         e.stopPropagation();
         if (originalButton) {
             originalButton.click();
         } else {
             const fallbackBk = document.querySelector('button[data-test-id="ContentActions_bookmarkButton"]');
             if (fallbackBk) fallbackBk.click();
         }
     });

     return btn;
 }

 function processSingleButton(targetButton, isWatchLater = false, forcedContainer = null) {
     const host = window.location.hostname;
     const isHD = host === 'hd.kinopoisk.ru';

     // Не трогаем кнопку "Добавить в папку" и подобные
     if (targetButton) {
        const btnElement = targetButton.closest('button');
        if (btnElement && (btnElement.title?.includes('папку') || btnElement.innerText?.includes('папку'))) {
            return false;
        }
     }

     const actionsBlock = targetButton ? targetButton.closest('.styles_buttonsContainer__5GGuL, .styles_buttons__IoJ0k, [data-tid="ContentActions"]') : null;
     const container = forcedContainer || actionsBlock || (targetButton ? targetButton.parentElement : null);
     if (!container) return false;

     if (targetButton) {
         targetButton.style.setProperty('display', 'none', 'important');
         targetButton.style.setProperty('opacity', '0', 'important');
         targetButton.style.setProperty('width', '0', 'important');
         targetButton.style.setProperty('height', '0', 'important');
         targetButton.dataset.tampermonkeyHidden = 'true';
     }


     const existingWrapper = container.querySelector('.custom-buttons-wrapper');
     if (existingWrapper) {
         const txtSpan = existingWrapper.querySelector('.custom-btn-text');
         if (txtSpan) {
             const newText = getCleanButtonText();
             if (txtSpan.textContent !== newText) txtSpan.textContent = newText;
         }

         if (isWatchLater && !isHD && !existingWrapper.querySelector('.custom-bookmark-btn')) {
             const ourBookmarkButton = createCustomBookmarkButton(targetButton);
             existingWrapper.appendChild(ourBookmarkButton);
         }
         return true;
     }

     if (container.querySelector('.custom-kinokino-btn')) return false;

     const wrapper = document.createElement('div');
     wrapper.className = 'custom-buttons-wrapper';
     wrapper.style.display = 'inline-flex';
     wrapper.style.alignItems = 'center';
     wrapper.style.gap = '12px';

     const ourWatchButton = createCustomWatchButton();
     wrapper.appendChild(ourWatchButton);

     if (isWatchLater && !isHD) {
         const ourBookmarkButton = createCustomBookmarkButton(targetButton);
         wrapper.appendChild(ourBookmarkButton);
     }


     if (container.classList.contains('styles_buttonsContainer__5GGuL')) {
         const outerWrapper = document.createElement('div');
         outerWrapper.className = 'styles_button__3MsZF';
         outerWrapper.appendChild(wrapper);
         container.prepend(outerWrapper);
     } else {
         container.prepend(wrapper);
     }
     return true;
 }

 function checkPageElements() {
     const path = window.location.pathname;
     const host = window.location.hostname;
     const isHD = host === 'hd.kinopoisk.ru';

     if (host === 'www.kinopoisk.ru' && !path.includes('/film/') && !path.includes('/series/')) {
         document.querySelectorAll('.custom-buttons-wrapper').forEach(el => el.remove());
         style.disabled = true;
         return;
     }

     style.disabled = false;

     try {
         const watchButtons = document.querySelectorAll('button[data-test-id="Offer"], button[data-test-id="watch-button"], .kinopoisk-watch-online-button, button[data-test-id="MainButton_offer"], [class*="watchOnlineButton"]');

         watchButtons.forEach(btn => {
             if (!btn.classList.contains('custom-kinokino-btn') && !btn.closest('.custom-buttons-wrapper')) {
                 processSingleButton(btn, false);
             }
         });

         if (!isHD) {
             const bookmarkButtons = document.querySelectorAll('button[title="Буду смотреть"], button[data-test-id="ContentActions_bookmarkButton"]');
             bookmarkButtons.forEach(btn => {
                 if (!btn.classList.contains('custom-bookmark-btn') && !btn.closest('.custom-buttons-wrapper')) {
                     processSingleButton(btn, true);
                 }
             });
         }


         const actionsBlock = document.querySelector('[data-tid="ContentActions"], .styles_buttonsContainer__5GGuL, .styles_buttons__IoJ0k');
         if (actionsBlock && !actionsBlock.querySelector('.custom-buttons-wrapper') && !document.querySelector('.custom-kinokino-btn')) {
             processSingleButton(null, false, actionsBlock);
         }
     } catch (err) {
         console.debug("Кинопоиск Free: Ожидание стабильного DOM...");
     }
 }

 function startObserver() {
     if (!document.body || !document.querySelector('head')) {
         setTimeout(startObserver, 50);
         return;
     }

     const bodyObserver = new MutationObserver(() => {
         window.requestAnimationFrame(checkPageElements);
     });
     bodyObserver.observe(document.body, { childList: true, subtree: true });

     const headObserver = new MutationObserver(() => {
         checkPageElements();
     });

     const titleEl = document.querySelector('title');
     if (titleEl) {
         headObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
     }

     checkPageElements();
 }

 startObserver();

 window.addEventListener('popstate', checkPageElements);
 window.addEventListener('locationchange', checkPageElements);

})();
