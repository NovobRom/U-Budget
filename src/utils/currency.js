// src/utils/currency.js

// Список ID криптовалют для CoinGecko
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'tether'];

export const fetchExchangeRate = async (base, target, isCrypto = false) => {
    // 1. Якщо валюти однакові, курс 1
    if (!base || !target) return 1;
    if (base.toLowerCase() === target.toLowerCase()) return 1;

    try {
        // --- ЛОГІКА ДЛЯ КРИПТОВАЛЮТ (CoinGecko) ---
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
        
        // --- ЛОГІКА ДЛЯ ЗВИЧАЙНИХ ВАЛЮТ (Open Exchange Rates) ---
        // Ми замінили API на те, що підтримує UAH
        else {
            const from = base.toUpperCase();
            const to = target.toUpperCase();

            // Використовуємо Open.er-api (безкоштовний, підтримує UAH)
            const response = await fetch(
                `https://open.er-api.com/v6/latest/${from}`
            );

            if (!response.ok) throw new Error('Forex API Error');

            const data = await response.json();
            
            if (data.rates && data.rates[to]) {
                return data.rates[to];
            } else {
                console.warn(`Rate for ${to} not found inside ${from} response`);
                return 1; // Fallback, якщо валюта екзотична
            }
        }

    } catch (error) {
        console.error(`Error converting ${base} to ${target}:`, error);
        return 1; // Повертаємо 1, щоб не ламати UI, але в консолі буде помилка
    }
};