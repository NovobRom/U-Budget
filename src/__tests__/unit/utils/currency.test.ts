import { describe, it, expect, vi, beforeEach } from 'vitest';

// We don't import the module statically because we need to reset it between tests
// import { fetchExchangeRate } from '../../../utils/currency';

describe('Currency Utils', () => {
    let fetchExchangeRate: any;

    beforeEach(async () => {
        vi.resetModules();
        vi.unstubAllGlobals(); // Reset globals like fetch

        // Mock localStorage
        const localStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: vi.fn((key: string) => store[key] || null),
                setItem: vi.fn((key: string, value: string) => {
                    store[key] = value.toString();
                }),
                clear: vi.fn(() => {
                    store = {};
                }),
            };
        })();

        vi.stubGlobal('localStorage', localStorageMock);

        // Mock fetch
        vi.stubGlobal('fetch', vi.fn());

        // Re-import the module
        const module = await import('../../../utils/currency');
        fetchExchangeRate = module.fetchExchangeRate;
    });

    it('should return 1 if base equals target', async () => {
        const rate = await fetchExchangeRate('USD', 'USD');
        expect(rate).toBe(1);
    });

    it('should fetch from Monobank and calculate direct rate', async () => {
        const mockMomoData = [
            {
                currencyCodeA: 840, // USD
                currencyCodeB: 980, // UAH
                date: 123456789,
                rateBuy: 40.0,
                rateSell: 41.0,
            },
        ];

        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMomoData,
        });

        const rate = await fetchExchangeRate('USD', 'UAH');

        expect(fetch).toHaveBeenCalledWith('/monobank/bank/currency');
        // rate should be (40+41)/2 = 40.5
        expect(rate).toBe(40.5);
    });

    it('should calculate cross rate via UAH', async () => {
        const mockMomoData = [
            {
                currencyCodeA: 840, // USD
                currencyCodeB: 980, // UAH
                rateBuy: 40.0, // USD -> UAH
                rateSell: 40.0,
            },
            {
                currencyCodeA: 978, // EUR
                currencyCodeB: 980, // UAH
                rateBuy: 44.0, // EUR -> UAH
                rateSell: 44.0,
            },
        ];

        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMomoData,
        });

        // USD -> EUR = (USD->UAH) / (EUR->UAH) = 40 / 44 = 0.909...
        const rate = await fetchExchangeRate('USD', 'EUR');
        expect(rate).toBeCloseTo(0.909, 3);
    });

    it('should use cache if available and fresh', async () => {
        const mockMomoData = [
            { currencyCodeA: 840, currencyCodeB: 980, rateBuy: 40.0, rateSell: 40.0 },
        ];

        // 1. First call to populate cache
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMomoData,
        });
        await fetchExchangeRate('USD', 'UAH');
        expect(fetch).toHaveBeenCalledTimes(1);

        // 2. Second call should use cache
        await fetchExchangeRate('USD', 'UAH');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to open.er-api if Monobank fails', async () => {
        // First call fails (Monobank)
        (fetch as any).mockResolvedValueOnce({ ok: false });

        // Second call succeeds (Fallback)
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ rates: { EUR: 0.9 } }),
        });

        const rate = await fetchExchangeRate('USD', 'EUR');

        // Should verify fallback called
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenLastCalledWith('https://open.er-api.com/v6/latest/USD');
        expect(rate).toBe(0.9);
    });
});
