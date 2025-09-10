import { AffiliateManager, AffiliateStrategy } from './affiliates';

describe('AffiliateManager', () => {
  let affiliateManager: AffiliateManager;

  beforeEach(() => {
    // Clear environment variables for clean tests
    delete process.env.AMAZON_ASSOCIATE_TAG;
    delete process.env.LOUNGEFLY_CODE;
    
    affiliateManager = new AffiliateManager({
      'amazon.com': {
        strategy: AffiliateStrategy.APPEND_PARAM,
        param: 'tag'
      },
      'loungefly.com': {
        strategy: AffiliateStrategy.CODE_MESSAGE
      }
    });
  });

  describe('applyAffiliate', () => {
    it('should append parameter for Amazon URLs', () => {
      affiliateManager.updateCode('amazon', 'test-tag-20');
      
      const result = affiliateManager.applyAffiliate('https://amazon.com/product/123');
      
      expect(result.url).toBe('https://amazon.com/product/123?tag=test-tag-20');
      expect(result.codeMessage).toBeUndefined();
    });

    it('should return code message for Loungefly', () => {
      affiliateManager.updateCode('loungefly', 'SAVE20');
      
      const result = affiliateManager.applyAffiliate('https://loungefly.com/product/123');
      
      expect(result.url).toBe('https://loungefly.com/product/123');
      expect(result.codeMessage).toBe('Use code **SAVE20** at checkout');
    });

    it('should handle URLs without affiliate config', () => {
      const result = affiliateManager.applyAffiliate('https://unknown-site.com/product/123');
      
      expect(result.url).toBe('https://unknown-site.com/product/123');
      expect(result.codeMessage).toBeUndefined();
    });

    it('should handle invalid URLs gracefully', () => {
      const result = affiliateManager.applyAffiliate('not-a-url');
      
      expect(result.url).toBe('not-a-url');
      expect(result.codeMessage).toBeUndefined();
    });

    it('should handle www subdomain correctly', () => {
      affiliateManager.updateCode('amazon', 'test-tag-20');
      
      const result = affiliateManager.applyAffiliate('https://www.amazon.com/product/123');
      
      expect(result.url).toBe('https://www.amazon.com/product/123?tag=test-tag-20');
    });
  });

  describe('updateAffiliate', () => {
    it('should update affiliate configuration', () => {
      affiliateManager.updateAffiliate('newsite.com', AffiliateStrategy.APPEND_PARAM, 'ref', 'test123');
      
      const config = affiliateManager.getAffiliateConfig();
      expect(config['newsite.com']).toEqual({
        strategy: AffiliateStrategy.APPEND_PARAM,
        param: 'ref',
        code: 'test123'
      });
    });
  });

  describe('updateCode', () => {
    it('should update code for known brands', () => {
      affiliateManager.updateCode('loungefly', 'NEWCODE');
      
      const result = affiliateManager.applyAffiliate('https://loungefly.com/product/123');
      expect(result.codeMessage).toBe('Use code **NEWCODE** at checkout');
    });

    it('should handle unknown brands gracefully', () => {
      // Should not throw error
      affiliateManager.updateCode('unknown-brand', 'CODE123');
      
      const codes = affiliateManager.getCodes();
      expect(codes.has('unknown-brand.com')).toBe(false);
    });
  });
});
