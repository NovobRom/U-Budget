const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const fetch = require("node-fetch");

exports.monobank = onRequest({
    cors: true,
    maxInstances: 10
}, async (req, res) => {
    // 1. Get path from query or URL params (e.g., /api/monobank/personal/client-info)
    // Our rewrite rule in vite sends: /api/monobank -> but in cloud functions it is /monobank

    // Usage: https://us-central1-YOUR-PROJECT.cloudfunctions.net/monobank/personal/client-info
    // req.path will be "/personal/client-info"

    // 2. Validate Token
    const token = req.get("X-Token");
    if (!token) {
        res.status(401).json({ error: "Missing X-Token header" });
        return;
    }

    // 3. Forward Request
    const targetUrl = `https://api.monobank.ua${req.path}`;
    logger.info(`Proxying to: ${targetUrl}`);

    try {
        const monoRes = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "X-Token": token
            },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        if (monoRes.status === 429) {
            res.status(429).json({ error: "Too many requests to Monobank (Limit 1 per 60s)" });
            return;
        }

        const data = await monoRes.json();
        res.status(monoRes.status).json(data);
    } catch (error) {
        logger.error("Monobank Proxy Error", error);
        res.status(500).json({ error: "Proxy Failed", details: error.message });
    }
});
