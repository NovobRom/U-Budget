const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const fetch = require("node-fetch");

exports.monobank = onRequest({
    cors: true,
    maxInstances: 10
}, async (req, res) => {
    // Firebase Hosting rewrite sends /monobank/** to this function
    // req.path will be "/monobank/personal/client-info" - we need to strip "/monobank"

    // 1. Strip /monobank prefix from path
    let apiPath = req.path;
    if (apiPath.startsWith('/monobank')) {
        apiPath = apiPath.replace('/monobank', '');
    }

    // Ensure path starts with /
    if (!apiPath.startsWith('/')) {
        apiPath = '/' + apiPath;
    }

    // 2. Validate Token
    const token = req.get("X-Token");
    if (!token) {
        res.status(401).json({ error: "Missing X-Token header" });
        return;
    }

    // 3. Forward Request to Monobank API
    const targetUrl = `https://api.monobank.ua${apiPath}`;
    logger.info(`Proxying to: ${targetUrl}`);

    try {
        const monoRes = await fetch(targetUrl, {
            method: req.method,
            headers: {
                "X-Token": token,
                "Content-Type": "application/json"
            },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        // Handle non-JSON responses (like 404 HTML pages)
        const contentType = monoRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await monoRes.text();
            logger.error(`Non-JSON response from Monobank: ${text.substring(0, 200)}`);
            res.status(monoRes.status).json({
                error: "Invalid response from Monobank API",
                status: monoRes.status
            });
            return;
        }

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
