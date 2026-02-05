// Map Monobank MCC codes to U-Budget Category IDs
// NOTE: These IDs must (ideally) match the IDs in your categories service or be resolvable.
// For simplicity, we map to string keys, which user might need to map to their own category list manually or we auto-match.

export const MCC_TO_CATEGORY = {
    // Food & Groceries
    5411: 'food', // Grocery Stores
    5499: 'food', // Misc Food Stores
    5812: 'food', // Restaurants
    5814: 'food', // Fast Food

    // Transport
    4111: 'transport', // Commuter Transport
    4121: 'transport', // Taxicabs
    4131: 'transport', // Bus Lines
    5541: 'transport', // Service Stations

    // Shopping
    5311: 'shopping', // Department Stores
    5651: 'shopping', // Family Clothing Stores
    5941: 'shopping', // Sporting Goods

    // Utilities
    4900: 'utilities', // Utilities

    // Health
    5912: 'health', // Drug Stores
    8011: 'health', // Doctors

    // Entertainment
    7832: 'entertainment', // Motion Picture Theaters
    7997: 'entertainment', // Membership Clubs (Sports)

    // Transfers
    4829: 'transfer', // Money Orders - Wire Transfer
    6012: 'transfer', // Financial Institutions - Merchandise (elections to wallet)
    6011: 'transfer', // Financial Institutions - Automated Cash Disbursements

    // Default fallback
    0: 'other',
};

export const getCategoryByMcc = (mcc) => {
    return MCC_TO_CATEGORY[mcc] || 'other';
};
