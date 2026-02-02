export const fetchClientInfo = async (token) => {
    // Use relative path '/monobank' which is handled by Vite proxy in Dev
    // and Firebase Hosting rewrite in Prod.
    const baseUrl = '/monobank';

    try {


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
    const baseUrl = '/monobank';
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
