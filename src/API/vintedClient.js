const puppeteer = require('puppeteer');
const { getChromePath, userAgent } = require('./config');
const parseVintedPage = require('./parser');

async function search(url) {
    console.log(`🚀 Lancement de Puppeteer pour : ${url}`);
    const chromePath = getChromePath();

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath || undefined, // fallback automatique si getChromePath ne renvoie rien
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent(userAgent);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const data = await parseVintedPage(page);
        console.log(`✅ ${data.length} articles trouvés.`);
        return data;
    } catch (err) {
        console.error("❌ Erreur pendant le scraping :", err);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { search };
