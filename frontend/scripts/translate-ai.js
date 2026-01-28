
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// Configuration
const EN_PATH = path.join(__dirname, '../messages/en.json');
const TARGET_LANGS = ['es', 'de', 'it', 'zh'];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Language Names for Prompt
const LANG_NAMES = {
    es: 'Spanish (Spain)',
    de: 'German (Formal)',
    it: 'Italian',
    zh: 'Chinese (Simplified)',
};

const SYSTEM_PROMPT = (langName) => `
You are a professional translator for "Granja Mari Pepa", a premium food distribution company for HORECA (Hotels, Restaurants, Catering).
Target Language: ${langName}

Your tone must be:
- Professional and B2B oriented.
- "Premium" and exclusive.
- Concise but impactful.
- For UI terms (Save, Cancel), use standard conventions.

Translate the provided JSON keys from English to the target language.
Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
`;

// Helper to determine if a value is an object
const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);

async function translateLanguage(openai, en, langCode) {
    const targetPath = path.join(__dirname, `../messages/${langCode}.json`);
    let targetData = {};

    if (fs.existsSync(targetPath)) {
        try {
            targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        } catch (e) {
            console.log(`⚠️  Could not parse existing ${langCode}.json, starting fresh.`);
        }
    }

    // Find missing keys
    const missing = {};
    let missingCount = 0;

    function findMissing(source, target, collection) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) target[key] = {};

                // Create a sub-collection for this key to maintain structure
                const subCollection = {};
                const hasMissingChildren = findMissing(source[key], target[key], subCollection);

                if (hasMissingChildren) {
                    collection[key] = subCollection;
                }
            } else {
                // It's a string (or close enough)
                if (!target[key] || target[key] === '' || target[key] === source[key]) {
                    // Translate if missing or identical to English (assuming copy-paste placeholder)
                    // Exception: es might be identical to en for "Email", "Zoom", etc. but usually distinct.
                    // For de/it/zh, identical = missing.
                    collection[key] = source[key];
                    missingCount++;
                }
            }
        }
        return Object.keys(collection).length > 0;
    }

    findMissing(en, targetData, missing);

    if (missingCount === 0) {
        console.log(`✅ ${langCode}: Up to date.`);
        return;
    }

    console.log(`🌍 Translating ${missingCount} keys to ${LANG_NAMES[langCode]}...`);

    // Chunking logic can refer to original TS if needed, we assume < 4000 tokens for now.

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT(LANG_NAMES[langCode]) },
                { role: 'user', content: JSON.stringify(missing) }
            ],
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const rawContent = completion.choices[0].message.content;
        const translatedChunk = JSON.parse(rawContent);

        // Merge back
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (isObject(source[key]) && key in target) {
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };

        deepMerge(targetData, translatedChunk);

        fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 4), 'utf8');
        console.log(`💾 Saved ${langCode}.json`);

    } catch (error) {
        console.error(`❌ Failed to translate ${langCode}:`, error.message);
    }
}

async function main() {
    console.log('🚀 Starting AI Translation Service (JS Mode)...');

    if (!OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY environment variable is not set.');
        process.exit(1);
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

    // Sequential execution
    for (const lang of TARGET_LANGS) {
        await translateLanguage(openai, en, lang);
    }

    console.log('✨ All translations completed!');
}

main();
