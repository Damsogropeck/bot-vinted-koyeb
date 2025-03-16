
const fs = require('fs');

function getChromePath() {
    const possiblePaths = [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    ];
    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            console.log(`✅ Chrome trouvé à : ${path}`);
            return path;
        }
    }
    console.error("❌ Chrome introuvable ! Vérifiez l'installation de Chrome.");
    return null;
}

module.exports = {
    getChromePath,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
