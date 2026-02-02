export const fetchClientInfo = async (token) => {
    // During dev, use local proxy. In prod, this should point to a backend function.
    // NOTE: Direct calls to monobank from browser will fail CORS without proxy/backend.
    const baseUrl = import.meta.env.DEV ? '/monobank' : 'https://api.monobank.ua/api';

    try {
        const response = await fetch(`${baseUrl}/merchant/details`, { // Actually for clients it is /personal/client-info
            // Wait, the docs say /personal/client-info for personal token
        });

        // Correct endpoint for Personal Token
        const clientInfoUrl = `${baseUrl}/personal/client-info`;

        const res = await fetch(clientInfoUrl, {
            headers: {
                'X-Token': token
            }
        });

        if (!res.ok) {
            if (res.status === 429) {
                throw new Error("Too many requests. Please wait 60 seconds.");
            }
            throw new Error(`Monobank API Error: ${res.statusText}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Monobank fetch error:", error);
        throw error;
    }
};

export const fetchStatements = async (token, accountId, from, to) => {
    const baseUrl = import.meta.env.DEV ? '/monobank' : 'https://api.monobank.ua/api';
    const url = `${baseUrl}/personal/statement/${accountId}/${from}/${to}`;

    const res = await fetch(url, {
        headers: {
            'X-Token': token
        }
    });

    if (!res.ok) {
        if (res.status === 429) {
            throw new Error("Too many requests. Monobank allows 1 request per 60s.");
        }
        throw new Error(`Failed to fetch statements: ${res.statusText}`);
    }

    return await res.json();
};
