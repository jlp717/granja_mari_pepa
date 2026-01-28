const fs = require('fs');
const path = require('path');

// Configuration
const TEXTS_DIR = path.join(__dirname, '../messages');
const SOURCE_LANG = 'es'; // Spanish is the source of truth
const TARGET_LANGS = ['en', 'de', 'it', 'zh'];

// Helper to read JSON
const readJson = (lang) => {
    const filePath = path.join(TEXTS_DIR, `${lang}.json`);
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Helper to write JSON
const writeJson = (lang, data) => {
    const filePath = path.join(TEXTS_DIR, `${lang}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`✅ Updated ${lang}.json`);
};

// Recursive function to ensure keys exist
const syncKeys = (source, target, langCode) => {
    const result = { ...target }; // copy target to maintain existing translations

    for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            // If it's an object, recurse
            result[key] = syncKeys(source[key], result[key] || {}, langCode);
        } else {
            // If it's a value
            if (result[key] === undefined || result[key] === "") {
                // MISSING KEY: Use a fallback strategy
                // For now, we COPY the Spanish text but mark it (optional) or leave it as Spanish 
                // so it doesn't break the UI with "footer.contact".
                // Ideally, we would translate this.
                // But for now, having Spanish text is better than "footer.contact".
                result[key] = source[key];
                console.log(`[${langCode}] Added missing key: ${key}`);
            }
        }
    }
    return result;
};

// Main execution
const main = () => {
    console.log(`🔄 Syncing keys from ${SOURCE_LANG.toUpperCase()} to [${TARGET_LANGS.join(', ')}]...`);

    try {
        const sourceData = readJson(SOURCE_LANG);

        TARGET_LANGS.forEach(lang => {
            const targetData = readJson(lang);
            const syncedData = syncKeys(sourceData, targetData, lang);
            writeJson(lang, syncedData);
        });

        console.log('✨ All languages synced successfully!');
    } catch (error) {
        console.error('❌ Error syncing keys:', error);
    }
};

main();
