// src/test-search.js
const { search } = require('./API');

(async () => {
    const results = await search('https://www.vinted.fr/vetements?order=newest_first&page=1');
    console.log(JSON.stringify(results, null, 2));
})();
