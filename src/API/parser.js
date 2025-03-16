// === src/API/parser.js ===

function parseVintedPage() {
    const items = [];

    const productLinks = document.querySelectorAll('a[href*="/items/"]');

    const seenIds = new Set(); // éviter les doublons

    productLinks.forEach(link => {
        const url = link.href;
        const idMatch = url.match(/\/items\/(\d+)/);
        const id = idMatch ? idMatch[1] : null;

        if (!id || seenIds.has(id)) return;
        seenIds.add(id);

        // ✅ Récupération du titre à partir du title complet
        const fullTitle = link.getAttribute('title') || '';
        const title = fullTitle.split(',')[0]?.trim() || 'Article';

        // ✅ Récupération du prix dans les enfants du lien
        const priceEl = link.querySelector('[data-testid*="price-text"], .web_ui__Text__muted');
        const price = priceEl?.innerText?.trim() || null;

        // ✅ Marque
        const brandMatch = fullTitle.match(/marque:\s?([^,]+)/i);
        const brand = brandMatch ? brandMatch[1].trim() : null;

        // ✅ Condition (état)
        const conditionMatch = fullTitle.match(/état:\s?([^,]+)/i);
        const condition = conditionMatch ? conditionMatch[1].trim() : null;

        // ✅ Taille
        const sizeMatch = fullTitle.match(/taille:\s?([^,]+)/i);
        const size = sizeMatch ? sizeMatch[1].trim() : null;

        // ✅ Image (dans le lien, souvent première image)
        const imgEl = link.querySelector('img');
        const image = imgEl?.src || null;

        items.push({
            id,
            title,
            url,
            price,
            brand,
            condition,
            size,
            image
        });
    });

    return items;
}

module.exports = parseVintedPage;
