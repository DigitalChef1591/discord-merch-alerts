"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateStrategy = exports.affiliateManager = exports.AffiliateManager = void 0;
const types_1 = require("./types");
Object.defineProperty(exports, "AffiliateStrategy", { enumerable: true, get: function () { return types_1.AffiliateStrategy; } });
const logger_1 = require("./logger");
// Default affiliate configurations
const defaultAffiliates = {
    'amazon.com': {
        strategy: types_1.AffiliateStrategy.APPEND_PARAM,
        param: 'tag'
    },
    'entertainmentearth.com': {
        strategy: types_1.AffiliateStrategy.APPEND_PARAM,
        param: 'id'
    },
    'loungefly.com': {
        strategy: types_1.AffiliateStrategy.CODE_MESSAGE
    },
    'boxlunch.com': {
        strategy: types_1.AffiliateStrategy.CODE_MESSAGE
    },
    'hottopic.com': {
        strategy: types_1.AffiliateStrategy.CODE_MESSAGE
    },
    'disneystore.com': {
        strategy: types_1.AffiliateStrategy.CODE_MESSAGE
    },
    'lego.com': {
        strategy: types_1.AffiliateStrategy.CODE_MESSAGE
    }
};
class AffiliateManager {
    constructor(affiliates = defaultAffiliates) {
        this.codes = new Map();
        this.affiliates = affiliates;
        this.loadCodesFromEnv();
    }
    loadCodesFromEnv() {
        // Load affiliate codes from environment variables
        const envCodes = {
            'amazon.com': process.env.AMAZON_ASSOCIATE_TAG,
            'entertainmentearth.com': process.env.ENTERTAINMENT_EARTH_AFFILIATE_ID,
            'loungefly.com': process.env.LOUNGEFLY_CODE,
            'hottopic.com': process.env.HOTTOPIC_CODE,
            'boxlunch.com': process.env.BOXLUNCH_CODE,
            'disneystore.com': process.env.DISNEYSTORE_CODE,
            'lego.com': process.env.LEGO_CODE
        };
        for (const [domain, code] of Object.entries(envCodes)) {
            if (code) {
                this.codes.set(domain, code);
            }
        }
    }
    applyAffiliate(url, brand) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            const config = this.affiliates[domain];
            if (!config) {
                logger_1.logger.debug(`No affiliate config found for domain: ${domain}`);
                return { url };
            }
            const code = this.codes.get(domain) || config.code;
            if (!code && config.strategy !== types_1.AffiliateStrategy.CODE_MESSAGE) {
                logger_1.logger.warn(`No affiliate code found for domain: ${domain}`);
                return { url };
            }
            switch (config.strategy) {
                case types_1.AffiliateStrategy.APPEND_PARAM:
                    if (config.param && code) {
                        urlObj.searchParams.set(config.param, code);
                        return { url: urlObj.toString() };
                    }
                    break;
                case types_1.AffiliateStrategy.REPLACE_DOMAIN:
                    // For future use if needed
                    break;
                case types_1.AffiliateStrategy.CODE_MESSAGE:
                    if (code) {
                        return {
                            url,
                            codeMessage: `Use code **${code}** at checkout`
                        };
                    }
                    break;
            }
            return { url };
        }
        catch (error) {
            logger_1.logger.error('Error applying affiliate link', { error, url });
            return { url };
        }
    }
    updateAffiliate(domain, strategy, param, code) {
        this.affiliates[domain] = { strategy, param, code };
        if (code) {
            this.codes.set(domain, code);
        }
        logger_1.logger.info(`Updated affiliate config for ${domain}`, { strategy, param });
    }
    updateCode(brand, code) {
        // Find domain by brand name (simplified mapping)
        const brandToDomain = {
            'loungefly': 'loungefly.com',
            'hot topic': 'hottopic.com',
            'boxlunch': 'boxlunch.com',
            'disney': 'disneystore.com',
            'lego': 'lego.com',
            'amazon': 'amazon.com',
            'entertainment earth': 'entertainmentearth.com'
        };
        const domain = brandToDomain[brand.toLowerCase()];
        if (domain) {
            this.codes.set(domain, code);
            logger_1.logger.info(`Updated code for ${brand}: ${code}`);
        }
        else {
            logger_1.logger.warn(`Unknown brand for code update: ${brand}`);
        }
    }
    getAffiliateConfig() {
        return { ...this.affiliates };
    }
    getCodes() {
        return new Map(this.codes);
    }
}
exports.AffiliateManager = AffiliateManager;
exports.affiliateManager = new AffiliateManager();
//# sourceMappingURL=affiliates.js.map