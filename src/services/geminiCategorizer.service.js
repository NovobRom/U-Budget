/**
 * Gemini AI Categorizer Service
 * Calls Cloud Function to categorize transactions using Gemini AI.
 * API key is stored securely on server (Google Secret Manager).
 */

const CATEGORIZE_ENDPOINT = '/categorize';
const BATCH_SIZE = 30; // Transactions per request (reduced to avoid truncated response)

/**
 * Categorize transactions using AI via Cloud Function
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} categories - Array of category objects with 'id' field
 * @returns {Promise<Array>} - Transactions with 'category' field updated
 */
export const categorizeWithAI = async (transactions, categories) => {
    if (!transactions || transactions.length === 0) {
        return transactions;
    }

    // Get category objects (only expense categories)
    // We send {id, name} so the AI understands what each category means
    const categoryObjects = categories
        .filter((c) => c.type === 'expense' || !c.type)
        .map((c) => ({ id: c.id, name: c.name || c.id }));

    const categoryIds = categoryObjects.map((c) => c.id);

    // Add 'other' if not present
    if (!categoryIds.includes('other')) {
        categoryIds.push('other');
    }

    // Extract descriptions
    const descriptions = transactions.map(
        (tx) => tx._raw?.originalDescription || tx.comment || tx.description || ''
    );

    // Process in batches
    const results = [...transactions];

    for (let i = 0; i < descriptions.length; i += BATCH_SIZE) {
        const batchDescriptions = descriptions.slice(i, i + BATCH_SIZE);
        const batchStart = i;

        try {
            console.log(
                `[AI] Categorizing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(descriptions.length / BATCH_SIZE)}`
            );

            const response = await fetch(CATEGORIZE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descriptions: batchDescriptions,
                    categories: categoryObjects,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.warn('[AI] Batch failed:', error);
                continue; // Skip to next batch
            }

            const data = await response.json();
            console.log('[AI] Batch response data:', data);

            if (data.categories && Array.isArray(data.categories)) {
                data.categories.forEach((category, j) => {
                    const txIndex = batchStart + j;
                    if (categoryIds.includes(category)) {
                        results[txIndex] = { ...results[txIndex], category };
                    }
                });
            }

            // Rate limiting: wait 500ms between batches
            if (i + BATCH_SIZE < descriptions.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } catch (err) {
            console.error(`[AI] Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, err.message);
            // Continue with other batches, failed ones keep their original category
        }
    }

    return results;
};

/**
 * Check if AI categorization is available (Cloud Function deployed)
 */
export const isAIAvailable = async () => {
    try {
        // Just check if endpoint exists - actual functionality requires secret
        const response = await fetch(CATEGORIZE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                descriptions: ['test'],
                categories: [{ id: 'other', name: 'Other' }],
            }),
        });
        return response.ok || response.status !== 404;
    } catch {
        return false;
    }
};
