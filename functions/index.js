const { logger } = require('firebase-functions');
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');
const fetch = require('node-fetch');

// Define secrets (stored securely in Google Secret Manager)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const allowedOrigins = [
    'https://smartbudget-7b00a.firebaseapp.com',
    'https://smartbudget-7b00a.web.app',
    'http://localhost:5173', // development
];

exports.monobank = onRequest(
    {
        cors: { origin: allowedOrigins, credentials: true },
        maxInstances: 10,
    },
    async (req, res) => {
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
        const token = req.get('X-Token');
        if (!token) {
            res.status(401).json({ error: 'Missing X-Token header' });
            return;
        }

        // 3. Forward Request to Monobank API
        const targetUrl = `https://api.monobank.ua${apiPath}`;
        logger.info(`Proxying to: ${targetUrl}`);

        try {
            const monoRes = await fetch(targetUrl, {
                method: req.method,
                headers: {
                    'X-Token': token,
                    'Content-Type': 'application/json',
                },
                body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
            });

            // Handle non-JSON responses (like 404 HTML pages)
            const contentType = monoRes.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await monoRes.text();
                logger.error(`Non-JSON response from Monobank: ${text.substring(0, 200)}`);
                res.status(monoRes.status).json({
                    error: 'Invalid response from Monobank API',
                    status: monoRes.status,
                });
                return;
            }

            if (monoRes.status === 429) {
                res.status(429).json({ error: 'Too many requests to Monobank (Limit 1 per 60s)' });
                return;
            }

            const data = await monoRes.json();
            res.status(monoRes.status).json(data);
        } catch (error) {
            logger.error('Monobank Proxy Error', error);
            res.status(500).json({ error: 'Proxy Failed', details: error.message });
        }
    }
);

/**
 * Gemini AI Categorization Function
 * Receives transaction descriptions, returns category assignments.
 * API key is stored securely in Google Secret Manager.
 */
exports.categorize = onRequest(
    {
        cors: { origin: allowedOrigins, credentials: true },
        maxInstances: 5,
        secrets: [geminiApiKey],
    },
    async (req, res) => {
        // Only POST allowed
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        const { descriptions, categories } = req.body;

        if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
            res.status(400).json({ error: "Missing 'descriptions' array" });
            return;
        }

        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            res.status(400).json({ error: "Missing 'categories' array" });
            return;
        }

        // Rate limit: max 50 descriptions per request
        if (descriptions.length > 50) {
            res.status(400).json({ error: 'Max 50 descriptions per request' });
            return;
        }

        const apiKey = geminiApiKey.value();
        if (!apiKey) {
            logger.error('GEMINI_API_KEY secret not configured');
            res.status(500).json({ error: 'AI service not configured' });
            return;
        }

        // Categories from request (expected: [{id, name}, ...])
        // If simple strings received, map them to {id, name}
        const categoriesList = categories.map((c) =>
            typeof c === 'string' ? { id: c, name: c } : c
        );

        // Build enhanced multi-language prompt with DYNAMIC categories
        const prompt = `You are a multilingual financial transaction categorizer.
Analyze bank transactions and assign ONE category ID from the list below to each transaction.

USER CATEGORIES (id: name):
${categoriesList.map((c) => `- ${c.id}: ${c.name}`).join('\n')}
- other: Uncategorized / Unknown

GUIDELINES:
1. Match transaction meaning to the closest User Category Name.
2. Context: MAXIMA/IKI=Lithuania, ATB/Silpo=Ukraine, Żabka=Poland.
3. Keywords mapping (use if category names match):
   - Food/Groceries: supermarkets, restaurants, cafe, bolt food
   - Transport/Car: fuel, parking, taxi, bolt, uber, public transport
   - Housing/Rent: rent, nuoma, оренда, czynsz, utilities
   - Shopping: clothes, electronics, online stores
4. If no suitable category exists in the list above, use "other".

TRANSACTIONS:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

RESPOND with JSON array ONLY - exact category IDs in same order:
["${categoriesList[0]?.id || 'other'}", "other", ...]`;

        // DEBUG LOGS
        logger.info(
            'Generated Prompt Categories:',
            categoriesList.map((c) => `${c.id}:${c.name}`)
        );

        try {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 4000,
                        },
                    }),
                }
            );

            if (!geminiRes.ok) {
                const errorText = await geminiRes.text();
                logger.error('Gemini API Error:', errorText);
                res.status(geminiRes.status).json({ error: 'AI Error', details: errorText });
                return;
            }

            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            logger.info('Gemini Raw Response:', text); // See what AI actually returns

            // Parse JSON array from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                logger.warn('No JSON array in Gemini response:', text);
                res.status(200).json({
                    categories: descriptions.map(() => 'other'),
                    partial: true,
                });
                return;
            }

            const resultCategories = JSON.parse(jsonMatch[0]);

            // Validate and sanitize
            const sanitized = resultCategories.map((c) =>
                typeof c === 'string' && categories.includes(c.toLowerCase())
                    ? c.toLowerCase()
                    : 'other'
            );

            res.status(200).json({ categories: sanitized });
        } catch (error) {
            logger.error('Categorization error:', error);
            res.status(500).json({ error: 'Categorization failed', details: error.message });
        }
    }
);
