import { useState, useEffect } from 'react';

import { fetchExchangeRateCached } from '../utils/currency';

export const useCurrencyRates = (currencyCodes, baseCurrency) => {
    const [rates, setRates] = useState({});

    useEffect(() => {
        let isMounted = true;

        const loadRates = async () => {
            if (!baseCurrency) return;

            // Filter unique codes needed
            const uniqueCodes = [...new Set(currencyCodes)];
            const newRates = {};
            let hasUpdates = false;

            await Promise.all(
                uniqueCodes.map(async (code) => {
                    if (code === baseCurrency) {
                        newRates[code] = 1;
                        return;
                    }

                    try {
                        const rate = await fetchExchangeRateCached(code, baseCurrency);
                        newRates[code] = rate;
                        hasUpdates = true;
                    } catch (e) {
                        console.error(`Failed to fetch rate for ${code}`, e);
                        newRates[code] = 1;
                    }
                })
            );

            if (isMounted && hasUpdates) {
                setRates((prev) => ({ ...prev, ...newRates }));
            }
        };

        if (currencyCodes.length > 0) {
            loadRates();
        }
    }, [currencyCodes.join(','), baseCurrency]); // Dependency on stringified array to avoid loops

    return rates;
};
