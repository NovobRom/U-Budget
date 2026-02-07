# Bug Fix Checklist: AI Categorization Always Returns "Other"

## Root Cause

**File:** `functions/index.js`, line 206

```javascript
// BUG: `categories` is req.body.categories — an array of OBJECTS [{id, name}, ...]
// .includes() compares a STRING ("food") against OBJECTS — always returns false
const sanitized = resultCategories.map((c) =>
    typeof c === 'string' && categories.includes(c.toLowerCase())  // <-- ALWAYS FALSE
        ? c.toLowerCase()
        : 'other'   // <-- every category falls here
);
```

`categories` (line 102) = `req.body.categories` = `[{id: "food", name: "Food & Dining"}, ...]`

`categories.includes("food")` compares string to objects = **always `false`** = everything becomes `"other"`.

The correct variable `categoriesList` (line 129) was already created and used for the prompt, but the validation on line 206 uses the wrong variable.

---

## Checklist

### Bug 1 (CRITICAL) — Fix category validation in Cloud Function

- [ ] **File:** `functions/index.js`, lines 204-209
- [ ] Replace `categories` with `categoriesList` and compare against `.id`

```javascript
// BEFORE (broken):
const sanitized = resultCategories.map((c) =>
    typeof c === 'string' && categories.includes(c.toLowerCase())
        ? c.toLowerCase()
        : 'other'
);

// AFTER (fixed):
const validIds = categoriesList.map((cat) => cat.id.toLowerCase());
validIds.push('other');
const sanitized = resultCategories.map((c) =>
    typeof c === 'string' && validIds.includes(c.toLowerCase())
        ? c.toLowerCase()
        : 'other'
);
```

---

### Bug 2 (MEDIUM) — Case sensitivity mismatch

- [ ] **File:** `functions/index.js`, lines 206-207
- [ ] Cloud Function lowercases AI results (`c.toLowerCase()`), but client-side validation (`geminiCategorizer.service.js`, line 72) does exact match with `categoryIds.includes(category)`. If original category IDs have mixed case, they won't match after lowercasing.

**Option A** — Preserve original casing (recommended):

```javascript
const idMap = new Map(categoriesList.map((cat) => [cat.id.toLowerCase(), cat.id]));
idMap.set('other', 'other');
const sanitized = resultCategories.map((c) =>
    typeof c === 'string' && idMap.has(c.toLowerCase())
        ? idMap.get(c.toLowerCase())
        : 'other'
);
```

**Option B** — Lowercase on both sides (client fix):

```javascript
// In geminiCategorizer.service.js, line 72:
if (categoryIds.includes(category.toLowerCase())) {
```

---

### Bug 3 (LOW) — `isAIAvailable` sends wrong category format

- [ ] **File:** `src/services/geminiCategorizer.service.js`, lines 97-101
- [ ] `isAIAvailable()` sends `categories: ['other']` (string) but Cloud Function expects `[{id, name}]`
- [ ] Works by accident (Cloud Function has string fallback on line 129-131), but should be consistent

```javascript
// BEFORE:
body: JSON.stringify({ descriptions: ['test'], categories: ['other'] }),

// AFTER:
body: JSON.stringify({ descriptions: ['test'], categories: [{ id: 'other', name: 'Other' }] }),
```

---

### Bug 4 (LOW) — No response length validation

- [ ] **File:** `functions/index.js`, after line 202
- [ ] Gemini may return fewer or more items than input. Unmatched transactions stay uncategorized silently.

```javascript
const resultCategories = JSON.parse(jsonMatch[0]);

// Add after parse:
while (resultCategories.length < descriptions.length) {
    resultCategories.push('other');
}
resultCategories.length = descriptions.length; // truncate if too many
```

---

### Bug 5 (LOW) — Duplicate `descriptions` key (lint error)

- [ ] **File:** `src/services/geminiCategorizer.service.js`, line 56
- [ ] ESLint reports `no-dupe-keys`. Verify no duplicate property in the request body object.
- [ ] Current code looks clean — may have been fixed already. Verify and close.

---

## Testing Plan

- [ ] Deploy the Cloud Function after fixing Bug 1
- [ ] Check Cloud Function logs — verify `Generated Prompt Categories` shows actual categories (not empty)
- [ ] Check `Gemini Raw Response` log — verify AI returns real category IDs (not all "other")
- [ ] Import a CSV with obvious transactions (e.g., "Starbucks Coffee", "Uber ride", "Netflix")
- [ ] Verify imported transactions get correct categories (`food`, `transport`, `entertainment`)
- [ ] **Edge cases:**
  - [ ] Import with only income transactions (should get "other" since only expense categories are sent)
  - [ ] Import with empty/missing descriptions
  - [ ] Import with >50 transactions (batching across multiple requests)
  - [ ] Budget with custom categories (custom categories may not have a `type` field — check filter `c.type === 'expense' || !c.type`)

---

## Files to Modify

| File | Priority | What to Change |
|------|----------|----------------|
| `functions/index.js` (lines 204-209) | CRITICAL | Fix validation: `categories` -> `categoriesList`, compare against `.id` |
| `functions/index.js` (after line 202) | LOW | Add response length validation |
| `src/services/geminiCategorizer.service.js` (line 72) | MEDIUM | Case-insensitive comparison (if not fixing on server) |
| `src/services/geminiCategorizer.service.js` (line 100) | LOW | Fix `isAIAvailable` category format |
