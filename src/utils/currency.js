// src/utils/currency.js

// Crypto IDs for CoinGecko
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'tether'];

// Simple in-memory cache: "BASE-TARGET" => { rate: 1.2, timestamp: 123456789 }
const rateCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const fetchExchangeRate = async (base, target, isCrypto = false) => {
    // 1. Same currency check
    if (!base || !target) return 1;
    if (base.toLowerCase() === target.toLowerCase()) return 1;

    try {
        // --- CRYPTO LOGIC (CoinGecko) ---
        if (isCrypto || CRYPTO_IDS.includes(base.toLowerCase())) {
            const coinId = base.toLowerCase();
            const vsCurrency = target.toLowerCase();

            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}`
            );

            if (!response.ok) throw new Error('CoinGecko API Error');

            const data = await response.json();
            
            if (data[coinId] && data[coinId][vsCurrency]) {
                return data[coinId][vsCurrency];
            } else {
                throw new Error('Rate not found in CoinGecko');
            }
        } 
        
        // --- FIAT LOGIC (Open Exchange Rates) ---
        else {
            const from = base.toUpperCase();
            const to = target.toUpperCase();

            // Using Open.er-api (supports UAH, free)
            const response = await fetch(
                `https://open.er-api.com/v6/latest/${from}`
            );

            if (!response.ok) throw new Error('Forex API Error');

            const data = await response.json();
            
            if (data.rates && data.rates[to]) {
                return data.rates[to];
            } else {
                console.warn(`Rate for ${to} not found inside ${from} response`);
                return 1; // Fallback
            }
        }

    } catch (error) {
        console.error(`Error converting ${base} to ${target}:`, error);
        return 1; // Return 1 to avoid UI crash
    }
};

// Cached wrapper to prevent waterfall requests
export const fetchExchangeRateCached = async (base, target, isCrypto = false) => {
    const key = `${base}-${target}-${isCrypto}`;
    const now = Date.now();

    if (rateCache.has(key)) {
        const cached = rateCache.get(key);
        if (now - cached.timestamp < CACHE_TTL) {
            return cached.rate;
        }
    }

    const rate = await fetchExchangeRate(base, target, isCrypto);
    rateCache.set(key, { rate, timestamp: now });
    return rate;
};