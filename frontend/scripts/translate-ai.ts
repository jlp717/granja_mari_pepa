
// @ts-nocheck
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Configuration
const EN_PATH = path.join(__dirname, '../messages/en.json');
const ES_PATH = path.join(__dirname, '../messages/es.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Context for the AI
const SYSTEM_PROMPT = `
You are a professional translator for "Granja Mari Pepa", a premium food distribution company for HORECA (Hotels, Restaurants, Catering) in Spain.
Your tone must be:
- Professional and B2B oriented.
- "Premium" and exclusive (avoid cheap-sounding words).
- Concise but impactful.
- Direct (Spanish from Spain).

Translate the provided JSON keys from English to Spanish. Return ONLY valid JSON.
`;

async function main() {
    if (!OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY environment variable is not set.');
        console.log('👉 Please run: set OPENAI_API_KEY=your_key_here && npm run i18n:sync');
        process.exit(1);
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Read files
    const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
    let es = {};
    if (fs.existsSync(ES_PATH)) {
        es = JSON.parse(fs.readFileSync(ES_PATH, 'utf8'));
    }

    // Find missing keys (simplistic implementation for flat/nested structures)
    // For a robust production script, we would use a library like 'flat' to compare keys dot-notation.
    // Here we will do a deep crawl comparison.

    const missing = {};

    function findMissing(source, target, path = '') {
        for (const key in source) {
            const currentPath = path ? `${path}.${key}` : key;
            if (typeof source[key] === 'object' && source[key] !== null) {
                if (!target[key]) target[key] = {};
                findMissing(source[key], target[key], currentPath);
            } else {
                if (!target[key] || target[key] === '') {
                    // Found a missing or empty key
                    // Helper to set value in missing obj
                    let current = missing;
                    const keys = currentPath.split('.');
                    keys.forEach((k, i) => {
                        if (i === keys.length - 1) current[k] = source[key]; // Store English value to translate
                        else {
                            current[k] = current[k] || {};
                            current = current[k];
                        }
                    });
                }
            }
        }
    }

    findMissing(en, es);

    if (Object.keys(missing).length === 0) {
        console.log('✅ All keys are present in Spanish!');
        return;
    }

    console.log('🔍 Found missing keys, asking OpenAI to translate...');
    console.log(JSON.stringify(missing, null, 2));

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(missing) }
            ],
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
        });

        const translated = JSON.parse(completion.choices[0].message.content);

        // Merge translated back into ES
        function mergeDeep(target, source) {
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    Object.assign(source[key], mergeDeep(target[key], source[key]));
                }
            }
            Object.assign(target || {}, source);
            return target;
        }

        // Simple deep merge for this script (lodash.merge is better for prod)
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    Object.assign(source[key], deepMerge(target[key], source[key]));
                }
            }
            Object.assign(target || {}, source);
            return target;
        }

        // We need to merge 'translated' into 'es'
        // Actually, since 'missing' structure mirrors 'es', 'translated' should too if AI followed instructions.
        // Let's assume AI returns the same structure.

        // Recursively merge translated content into 'es' object
        const mergeTranslation = (target, source) => {
            for (const key in source) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!target[key]) target[key] = {};
                    mergeTranslation(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };

        mergeTranslation(es, translated);

        // Sort keys to match EN (optional but good for diffs)
        // ... skipping sort for simplicity, just writing file.

        fs.writeFileSync(ES_PATH, JSON.stringify(es, null, 4), 'utf8');
        console.log(`✨ Successfully translated ${Object.keys(missing).length} blocks/keys to es.json`);

    } catch (error) {
        console.error('❌ AI Translation failed:', error);
    }
}

main();
