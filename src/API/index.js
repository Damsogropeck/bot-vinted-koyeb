// src/API/index.js
const puppeteer = require('puppeteer');

async function search(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const items = await page.evaluate(() => {
            const results = [];
            const itemElements = document.querySelectorAll('.feed-grid__item');
            itemElements.forEach(itemEl => {
                const urlEl = itemEl.querySelector('a[href*="/items/"]');
                const url = urlEl?.href || null;
                const idMatch = url?.match(/\/items\/(\d+)/);
                const id = idMatch ? idMatch[1] : null;
                const titleEl = itemEl.querySelector('[data-testid$="--title"]');
                const title = titleEl?.textContent.trim() || "Article";
                const brandEl = itemEl.querySelector('[data-testid$="--description-title"]');
                const brand = brandEl?.textContent.trim() || null;
                const sizeEl = itemEl.querySelector('[data-testid$="--description-subtitle"]');
                const size = sizeEl?.textContent.trim() || null;
                const priceEl = itemEl.querySelector('[data-testid$="--price-text"]');
                const price = priceEl?.textContent.trim() || null;
                const conditionMatch = urlEl?.title?.match(/état: ([^,]+)/i);
                const condition = conditionMatch ? conditionMatch[1].trim() : null;
                const imageEl = itemEl.querySelector('img[data-testid$="--image--img"]');
                const image = imageEl?.getAttribute('src') || null;

                if (id && url) {
                    results.push({ id, url, title, brand, price, size, condition, image });
                }
            });

            return results;
        });

        return items;

    } catch (err) {
        console.error('❌ Erreur scraping catalogue :', err);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { search };
