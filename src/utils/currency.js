// src/utils/currency.js

// Crypto IDs for CoinGecko
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'tether'];

// Simple in-memory cache: "BASE-TARGET" => { rate: 1.2, timestamp: 123456789 }
const rateCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Persistent cache configuration
const CACHE_STORAGE_KEY = 'smart-budget-exchange-rates-cache';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours for persistent cache

// Load persistent cache on init
const loadPersistentCache = () => {
    try {
        const stored = localStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.entries(parsed).forEach(([key, value]) => {
                rateCache.set(key, value);
            });
        }
    } catch (e) {
        console.error('Failed to load persistent cache:', e);
    }
};

// Save to localStorage
const savePersistentCache = () => {
    try {
        const cacheObj = {};
        rateCache.forEach((value, key) => {
            cacheObj[key] = value;
        });
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
        console.error('Failed to save cache:', e);
    }
};

// Initialize on module load
loadPersistentCache();

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

        // Try to use cached rate if available (even if expired)
        const key = `${base}-${target}-${isCrypto}`;
        if (rateCache.has(key)) {
            const cached = rateCache.get(key);
            const age = Date.now() - cached.timestamp;

            if (age < CACHE_MAX_AGE) {
                console.warn(`Using cached rate (${(age/1000/60).toFixed(0)}min old):`, cached.rate);
                return cached.rate;
            } else {
                console.warn(`Cached rate too old (${(age/1000/60/60).toFixed(1)}h), discarding`);
            }
        }

        // No valid cache - throw error instead of returning 1
        throw new Error(`Failed to fetch rate ${base}->${target}: ${error.message}`);
    }
};

// Cached wrapper to prevent waterfall requests
export const fetchExchangeRateCached = async (base, target, isCrypto = false) => {
    const key = `${base}-${target}-${isCrypto}`;
    const now = Date.now();

    // Check in-memory cache first
    if (rateCache.has(key)) {
        const cached = rateCache.get(key);
        if (now - cached.timestamp < CACHE_TTL) {
            return cached.rate;
        }
    }

    // Fetch fresh rate
    const rate = await fetchExchangeRate(base, target, isCrypto);

    // Update cache
    rateCache.set(key, { rate, timestamp: now });

    // Persist to localStorage
    savePersistentCache();

    return rate;
};