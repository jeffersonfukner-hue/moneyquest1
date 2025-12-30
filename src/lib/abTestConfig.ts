export interface ABTestConfig {
  name: string;
  variants: readonly string[];
  weights?: number[]; // Optional weights for each variant (default: equal)
}

export const AB_TESTS = {
  adBanner: {
    name: 'ad_banner_v1',
    variants: ['internal_promo', 'adsense'] as const,
    weights: [0.5, 0.5], // 50/50 split
  },
  premiumBannerModal: {
    name: 'premium_banner_modal_v1',
    variants: ['default'] as const,
    weights: [1.0], // Single variant for tracking only
  },
  bannerCopy: {
    name: 'banner_copy_v1',
    variants: ['single_line', 'two_line'] as const,
    weights: [0.5, 0.5], // 50/50 split
  },
} as const;

export type ABTestName = keyof typeof AB_TESTS;
export type AdBannerVariant = typeof AB_TESTS.adBanner.variants[number];
