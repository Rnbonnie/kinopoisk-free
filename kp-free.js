// ==UserScript==
// @name         Кинопоиск free
// @namespace    https://github.com/Rnbonnie/kinopoisk-free
// @version      1.5.1
// @description  Позволяет бесплатно смотреть фильмы на кинопоиск
// @author       Rnbonnie
// @match        https://www.kinopoisk.ru/film/*
// @match        https://www.kinopoisk.ru/series/*
// @match        https://hd.kinopoisk.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kinopoisk.ru
// @grant        none
// @run-at       document-end
// @homepageURL  https://github.com/Rnbonnie/kinopoisk-free
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_DOMAIN = 'https://www.kinokino.vip';
    const GREEN_GRADIENT = 'linear-gradient(135deg, #00ff87 0%, #60efff 100%)';

    function waitForElement(selector, timeout = 3000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            function check() {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                } else if (Date.now() - startTime > timeout) {
                    resolve(null);
                } else {
                    setTimeout(check, 50);
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

    function createCustomWatchButton() {
        const btn = document.createElement('button');
        btn.className = 'custom-kinokino-btn';

        const isSeries = window.location.pathname.includes('/series/');
        const buttonText = isSeries ? 'Смотреть сериал' : 'Смотреть фильм';

        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
                <path d="M8 5v14l11-7z"/>
            </svg>
            <span style="vertical-align: middle; font-weight: 500;">${buttonText}</span>
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

        btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.98)');
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('click', redirectToAlternative, true);
        return btn;
    }

    function rearrangeButtons(watchLaterButton) {
        if (watchLaterButton.dataset.tampermonkeyProcessed) return;
        watchLaterButton.dataset.tampermonkeyProcessed = 'true';

        const container = watchLaterButton.parentElement;
        if (!container) return;

        const textNode = Array.from(watchLaterButton.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.remove(); 
        
        watchLaterButton.querySelectorAll('span').forEach(span => {
            if (span.innerText.includes('Буду смотреть')) span.remove();
        });

        watchLaterButton.style.width = '52px';
        watchLaterButton.style.height = '52px';
        watchLaterButton.style.borderRadius = '50%';
        watchLaterButton.style.padding = '0';
        watchLaterButton.style.display = 'inline-flex';
        watchLaterButton.style.alignItems = 'center';
        watchLaterButton.style.justifyContent = 'center';
        watchLaterButton.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        watchLaterButton.style.color = '#fff';

        const ourButton = createCustomWatchButton();
        container.insertBefore(ourButton, watchLaterButton);
        container.style.display = 'flex';
        container.style.alignItems = 'center';
    }

    const observer = new MutationObserver((mutations) => {
        if (window.location.hostname === 'hd.kinopoisk.ru') {
            const hdButton = document.querySelector('button[data-test-id="MainButton_offer"]');
            if (hdButton && !hdButton.dataset.tampermonkeyProcessed) {
                hdButton.dataset.tampermonkeyProcessed = 'true';
                hdButton.style.background = GREEN_GRADIENT;
                hdButton.style.color = '#111111';
                const svgIcon = hdButton.querySelector('svg');
                if (svgIcon) svgIcon.setAttribute('fill', '#111111');
                hdButton.addEventListener('click', redirectToAlternative, true);
            }
            return;
        }

        const primaryWatchButton = document.querySelector('button[data-test-id="Offer"], .kinopoisk-watch-online-button');
        if (primaryWatchButton) {
            if (!primaryWatchButton.dataset.tampermonkeyProcessed) {
                primaryWatchButton.dataset.tampermonkeyProcessed = 'true';
                primaryWatchButton.style.background = GREEN_GRADIENT;
                primaryWatchButton.style.color = '#111111';
                primaryWatchButton.addEventListener('click', redirectToAlternative, true);
            }
            return;
        }

        const watchLaterButton = document.querySelector('button[title="Буду смотреть"]');
        if (watchLaterButton && watchLaterButton.innerText.includes('Буду смотреть')) {
            rearrangeButtons(watchLaterButton);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
