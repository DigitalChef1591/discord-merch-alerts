"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAlertHash = generateAlertHash;
exports.sleep = sleep;
exports.addJitter = addJitter;
exports.formatPrice = formatPrice;
exports.extractDomain = extractDomain;
exports.isValidUrl = isValidUrl;
exports.truncateText = truncateText;
exports.categorizeProduct = categorizeProduct;
const crypto_1 = require("crypto");
function generateAlertHash(source, url, sku, type) {
    const dateBucket = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hashInput = `${source}|${url}|${sku || 'no-sku'}|${type}|${dateBucket}`;
    return (0, crypto_1.createHash)('sha1').update(hashInput).digest('hex');
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function addJitter(baseMs, jitterPercent = 0.1) {
    const jitter = baseMs * jitterPercent * (Math.random() - 0.5) * 2;
    return Math.max(0, baseMs + jitter);
}
function formatPrice(price) {
    if (price === undefined)
        return undefined;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    }
    catch {
        return 'unknown';
    }
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
function categorizeProduct(title, brand, tags = []) {
    const titleLower = title.toLowerCase();
    const brandLower = brand?.toLowerCase() || '';
    const allText = `${titleLower} ${brandLower} ${tags.join(' ').toLowerCase()}`;
    // Sneakers
    if (allText.includes('sneaker') || allText.includes('shoe') || allText.includes('jordan') ||
        allText.includes('nike') || allText.includes('adidas') || allText.includes('yeezy')) {
        return 'sneakers';
    }
    // GPUs
    if (allText.includes('gpu') || allText.includes('graphics card') || allText.includes('rtx') ||
        allText.includes('gtx') || allText.includes('nvidia') || allText.includes('amd')) {
        return 'gpus';
    }
    // LEGO
    if (allText.includes('lego') || brandLower === 'lego') {
        return 'toys';
    }
    // Funko
    if (allText.includes('funko') || allText.includes('pop!') || brandLower === 'funko') {
        return 'collectibles';
    }
    // Loungefly
    if (allText.includes('loungefly') || brandLower === 'loungefly') {
        return 'collectibles';
    }
    // Trading Cards
    if (allText.includes('pokemon') || allText.includes('magic the gathering') || allText.includes('mtg') ||
        allText.includes('yugioh') || allText.includes('yu-gi-oh') || allText.includes('one piece') ||
        allText.includes('lorcana') || allText.includes('trading card')) {
        return 'trading-cards';
    }
    // Streetwear
    if (allText.includes('hoodie') || allText.includes('t-shirt') || allText.includes('sweatshirt') ||
        allText.includes('jacket') || allText.includes('supreme') || allText.includes('bape')) {
        return 'streetwear';
    }
    // Default to collectibles
    return 'collectibles';
}
//# sourceMappingURL=utils.js.map