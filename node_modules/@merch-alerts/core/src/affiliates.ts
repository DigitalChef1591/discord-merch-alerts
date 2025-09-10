import { AffiliateStrategy, AffiliateResult } from './types';
import { logger } from './logger';

export interface AffiliateConfig {
  [domain: string]: {
    strategy: AffiliateStrategy;
    param?: string;
    code?: string;
  };
}

// Default affiliate configurations
const defaultAffiliates: AffiliateConfig = {
  'amazon.com': {
    strategy: AffiliateStrategy.APPEND_PARAM,
    param: 'tag'
  },
  'entertainmentearth.com': {
    strategy: AffiliateStrategy.APPEND_PARAM,
    param: 'id'
  },
  'loungefly.com': {
    strategy: AffiliateStrategy.CODE_MESSAGE
  },
  'boxlunch.com': {
    strategy: AffiliateStrategy.CODE_MESSAGE
  },
  'hottopic.com': {
    strategy: AffiliateStrategy.CODE_MESSAGE
  },
  'disneystore.com': {
    strategy: AffiliateStrategy.CODE_MESSAGE
  },
  'lego.com': {
    strategy: AffiliateStrategy.CODE_MESSAGE
  }
};

export class AffiliateManager {
  private affiliates: AffiliateConfig;
  private codes: Map<string, string> = new Map();

  constructor(affiliates: AffiliateConfig = defaultAffiliates) {
    this.affiliates = affiliates;
    this.loadCodesFromEnv();
  }

  private loadCodesFromEnv() {
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

  public applyAffiliate(url: string, brand?: string): AffiliateResult {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      const config = this.affiliates[domain];
      if (!config) {
        logger.debug(`No affiliate config found for domain: ${domain}`);
        return { url };
      }

      const code = this.codes.get(domain) || config.code;
      if (!code && config.strategy !== AffiliateStrategy.CODE_MESSAGE) {
        logger.warn(`No affiliate code found for domain: ${domain}`);
        return { url };
      }

      switch (config.strategy) {
        case AffiliateStrategy.APPEND_PARAM:
          if (config.param && code) {
            urlObj.searchParams.set(config.param, code);
            return { url: urlObj.toString() };
          }
          break;

        case AffiliateStrategy.REPLACE_DOMAIN:
          // For future use if needed
          break;

        case AffiliateStrategy.CODE_MESSAGE:
          if (code) {
            return {
              url,
              codeMessage: `Use code **${code}** at checkout`
            };
          }
          break;
      }

      return { url };
    } catch (error) {
      logger.error('Error applying affiliate link', { error, url });
      return { url };
    }
  }

  public updateAffiliate(domain: string, strategy: AffiliateStrategy, param?: string, code?: string) {
    this.affiliates[domain] = { strategy, param, code };
    if (code) {
      this.codes.set(domain, code);
    }
    logger.info(`Updated affiliate config for ${domain}`, { strategy, param });
  }

  public updateCode(brand: string, code: string) {
    // Find domain by brand name (simplified mapping)
    const brandToDomain: { [key: string]: string } = {
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
      logger.info(`Updated code for ${brand}: ${code}`);
    } else {
      logger.warn(`Unknown brand for code update: ${brand}`);
    }
  }

  public getAffiliateConfig(): AffiliateConfig {
    return { ...this.affiliates };
  }

  public getCodes(): Map<string, string> {
    return new Map(this.codes);
  }
}

export const affiliateManager = new AffiliateManager();

// Export AffiliateStrategy for tests
export { AffiliateStrategy };
