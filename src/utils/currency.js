// src/utils/currency.js

// Monobank API URL
const MOMO_RATES_URL = '/monobank/bank/currency';

// ISO 4217 Code Mapping (Numeric -> Alpha)
// Monobank returns numeric codes (840 for USD, 980 for UAH, etc.)
const ISO_CODES = {
    840: 'USD',
    978: 'EUR',
    980: 'UAH',
    985: 'PLN',
    826: 'GBP',
    756: 'CHF',
    392: 'JPY',
    156: 'CNY',
    203: 'CZK',
    124: 'CAD',
    // Crypto map (Momo uses custom or standard? Usually standard ISO for fiat, but let's stick to main ones)
};

// Inverse map for lookup
const SNAP_CODES = Object.entries(ISO_CODES).reduce((acc, [num, str]) => {
    acc[str] = Number(num);
    return acc;
}, {});

// Simple in-memory cache
const rateCache = {
    data: [], // Array of rate objects from Monobank
    timestamp: 0,
};
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes (Momo allows 5 min updates)
const CACHE_STORAGE_KEY = 'smart-budget-momo-rates';

// Load persistent cache
const loadPersistentCache = () => {
    try {
        const stored = localStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24) {
                // 24h max age for safety
                rateCache.data = parsed.data;
                rateCache.timestamp = parsed.timestamp;
            }
        }
    } catch (e) {
        console.error('Failed to load rates cache:', e);
    }
};

loadPersistentCache();

/**
 * Fetches rates from Monobank
 */
const fetchMonobankRates = async () => {
    const now = Date.now();
    if (rateCache.data.length > 0 && now - rateCache.timestamp < CACHE_TTL) {
        return rateCache.data;
    }

    try {
        const response = await fetch(MOMO_RATES_URL);
        if (!response.ok) throw new Error('Monobank API Error');

        const data = await response.json();
        // data format: [ { "currencyCodeA": 840, "currencyCodeB": 980, "date": 155..., "rateBuy": 27.0, "rateSell": 27.2, "rateCross": 0 }, ... ]

        rateCache.data = data;
        rateCache.timestamp = now;

        localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify({
                data: data,
                timestamp: now,
            })
        );

        return data;
    } catch (error) {
        console.error('Error fetching Monobank rates:', error);
        // Fallback to cache even if expired
        return rateCache.data;
    }
};

/**
 * Find rate between two currencies using Monobank data
 * Momo rates are usually distinct lines like USD -> UAH.
 * We need to find path: Base -> Target.
 * Usually everything is cross-rated via UAH (980).
 */
const getCrossRate = (rates, baseCode, targetCode) => {
    // 1. Check direct pair in rates (A -> B or B -> A)
    const baseNum = SNAP_CODES[baseCode];
    const targetNum = SNAP_CODES[targetCode];

    if (!baseNum || !targetNum) {
        // Fallback or Crypto logic could go here, but for now strict Monobank
        return null;
    }

    // Attempt Direct
    // Case 1: Base is A, Target is B (Sell Base to Buy Target? No, usually rateCross or (Buy+Sell)/2)
    // We want price of 1 Base in Target.
    // data row: A=840 (USD), B=980 (UAH), rateSell=41.5 (Sell USD get UAH), rateBuy=41.0 (Buy USD with UAH)
    // 1 USD = ~41.25 UAH.

    const direct = rates.find(
        (r) =>
            (r.currencyCodeA === baseNum && r.currencyCodeB === targetNum) ||
            (r.currencyCodeA === targetNum && r.currencyCodeB === baseNum)
    );

    if (direct) {
        if (direct.currencyCodeA === baseNum && direct.currencyCodeB === targetNum) {
            // Base -> Target.
            // If rateCross exists, use it. Else average.
            if (direct.rateCross) return direct.rateCross;
            if (direct.rateBuy && direct.rateSell) return (direct.rateBuy + direct.rateSell) / 2; // Mid-market
            return direct.rateBuy || direct.rateSell;
        } else {
            // Target -> Base. (We have rate for Target in Base units nearby? No, usually typical pair)
            // If A=Target, B=Base. 1 Target = X Base.
            // We need 1 Base = ? Target. So 1/X.
            let rate = 0;
            if (direct.rateCross) rate = direct.rateCross;
            else if (direct.rateBuy && direct.rateSell)
                rate = (direct.rateBuy + direct.rateSell) / 2;
            else rate = direct.rateBuy || direct.rateSell;

            return rate > 0 ? 1 / rate : 1;
        }
    }

    // 2. Cross via UAH (980)
    // Most pairs are X -> UAH.
    // We want Base -> Target.
    // If we can get Base -> UAH (rate1) and Target -> UAH (rate2).
    // Then 1 Base = rate1 UAH. 1 Target = rate2 UAH.
    // 1 Base = (rate1 / rate2) Target.

    const uahNum = 980;
    if (baseNum === uahNum || targetNum === uahNum) return null; // Should have been caught by direct if available

    const baseToUah = rates.find(
        (r) =>
            (r.currencyCodeA === baseNum && r.currencyCodeB === uahNum) ||
            (r.currencyCodeA === uahNum && r.currencyCodeB === baseNum)
    );

    const targetToUah = rates.find(
        (r) =>
            (r.currencyCodeA === targetNum && r.currencyCodeB === uahNum) ||
            (r.currencyCodeA === uahNum && r.currencyCodeB === targetNum)
    );

    if (baseToUah && targetToUah) {
        // Resolve Base -> UAH
        let r1 = 0;
        if (baseToUah.currencyCodeA === baseNum) {
            // A=USD, B=UAH. Rate is USD/UAH.
            if (baseToUah.rateCross) r1 = baseToUah.rateCross;
            else r1 = (baseToUah.rateBuy + baseToUah.rateSell) / 2;
        } else {
            // A=UAH, B=USD (Unlikely for Momo but possible). Rate is UAH/USD.
            let x = 0;
            if (baseToUah.rateCross) x = baseToUah.rateCross;
            else x = (baseToUah.rateBuy + baseToUah.rateSell) / 2;
            r1 = x > 0 ? 1 / x : 0;
        }

        // Resolve Target -> UAH
        let r2 = 0;
        if (targetToUah.currencyCodeA === targetNum) {
            if (targetToUah.rateCross) r2 = targetToUah.rateCross;
            else r2 = (targetToUah.rateBuy + targetToUah.rateSell) / 2;
        } else {
            let x = 0;
            if (targetToUah.rateCross) x = targetToUah.rateCross;
            else x = (targetToUah.rateBuy + targetToUah.rateSell) / 2;
            r2 = x > 0 ? 1 / x : 0;
        }

        if (r1 > 0 && r2 > 0) {
            return r1 / r2;
        }
    }

    return null;
};

export const fetchExchangeRate = async (base, target, isCrypto = false) => {
    if (!base || !target) return 1;
    if (base.toLowerCase() === target.toLowerCase()) return 1;

    // Crypto fallback to old logic if needed (skipping for now based on user request focus on Monobank)
    // Actually user said "currency conversion broke", implies Fiat.
    // If strict crypto needed, we can re-add CoinGecko, but let's try Momo first for major currencies.

    try {
        const rates = await fetchMonobankRates();

        let rate = getCrossRate(rates, base.toUpperCase(), target.toUpperCase());

        if (rate) return rate;

        console.warn(`Monobank rate not found for ${base}->${target}, trying Fallback...`);

        // --- FALLBACK (Open Exchange Rates / CoinGecko) ---
        // Just keeping a minimal fallback for pure Crypto or unsupported ISOs
        if (
            isCrypto ||
            ['bitcoin', 'ethereum', 'tether', 'btc', 'eth', 'usdt'].includes(base.toLowerCase())
        ) {
            const coinId = base
                .toLowerCase()
                .replace('btc', 'bitcoin')
                .replace('eth', 'ethereum')
                .replace('usdt', 'tether');
            const vs = target.toLowerCase();
            const res = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vs}`
            );
            const d = await res.json();
            if (d[coinId] && d[coinId][vs]) return d[coinId][vs];
        }

        // Fallback fetch from open.er-api
        const res = await fetch(`https://open.er-api.com/v6/latest/${base.toUpperCase()}`);
        const d = await res.json();
        if (d.rates && d.rates[target.toUpperCase()]) return d.rates[target.toUpperCase()];
    } catch (e) {
        console.error(`Exchange rate error ${base}->${target}:`, e);
    }

    return 1;
};

// Aliases for compatibility
export const fetchExchangeRateCached = fetchExchangeRate;
