import { AffiliateStrategy, AffiliateResult } from './types';
export interface AffiliateConfig {
    [domain: string]: {
        strategy: AffiliateStrategy;
        param?: string;
        code?: string;
    };
}
export declare class AffiliateManager {
    private affiliates;
    private codes;
    constructor(affiliates?: AffiliateConfig);
    private loadCodesFromEnv;
    applyAffiliate(url: string, brand?: string): AffiliateResult;
    updateAffiliate(domain: string, strategy: AffiliateStrategy, param?: string, code?: string): void;
    updateCode(brand: string, code: string): void;
    getAffiliateConfig(): AffiliateConfig;
    getCodes(): Map<string, string>;
}
export declare const affiliateManager: AffiliateManager;
export { AffiliateStrategy };
//# sourceMappingURL=affiliates.d.ts.map