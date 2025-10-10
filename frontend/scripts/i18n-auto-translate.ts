import fs from 'fs';
import path from 'path';

interface Translations { [key: string]: string; }

const LOCALES_DIR = path.resolve('locales');
const SOURCE_LANG = 'es';
const TARGET_LANGS = ['en', 'fr'];

// Endpoint alternativo — suele ser más estable que libretranslate.de
const LT_ENDPOINT = process.env.LT_ENDPOINT || 'https://translate.argosopentech.com/translate';

// Pequeña ayuda para pausar entre reintentos
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const translateOne = async (text: string, target: string, attempt = 1): Promise<string> => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const res = await fetch(LT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text, source: SOURCE_LANG, target, format: 'text' }),
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { translatedText: string };
        return data.translatedText;
    } catch (err) {
        if (attempt >= 4) throw err;
        const wait = attempt * 2000;
        console.warn(`      ↻ reintento (${attempt}) en ${wait / 1000}s…`);
        await sleep(wait);
        return translateOne(text, target, attempt + 1);
    }
};

const fetchTranslateBatch = async (texts: string[], target: string): Promise<string[]> => {
    const results: string[] = [];
    for (const t of texts) {
        try {
            const translated = await translateOne(t, target);
            results.push(translated);
        } catch {
            results.push(t); // fallback
        }
    }
    return results;
};

const loadSource = (): Translations => {
    const filePath = path.join(LOCALES_DIR, SOURCE_LANG, 'translation.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Translations;
};

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const placeholderTokens = (str: string) => {
    const matches = [...str.matchAll(/{{\s*[^{}]+\s*}}/g)].map((m) => m[0]);
    const map = new Map<string, string>();
    let idx = 0;
    let safe = str;
    matches.forEach((ph) => {
        const token = `__PH_${idx++}__`;
        map.set(token, ph);
        safe = safe.replace(ph, token);
    });
    return { safe, map };
};

const restoreTokens = (str: string, map: Map<string, string>) => {
    let restored = str;
    map.forEach((ph, token) => {
        restored = restored.replace(token, ph);
    });
    return restored;
};

(async () => {
    const source = loadSource();
    for (const lang of TARGET_LANGS) {
        const outDir = path.join(LOCALES_DIR, lang);
        ensureDir(outDir);
        const outPath = path.join(outDir, 'translation.json');
        const targetTranslations: Translations = {};
        console.log(`Traduciendo a ${lang}…`);

        const BATCH_SIZE = 2; // lotes pequeños para evitar time-outs en servidor local
        for (let i = 0; i < Object.keys(source).length; i += BATCH_SIZE) {
            const slice = Object.keys(source).slice(i, i + BATCH_SIZE);
            const maps: Map<string, string>[] = [];
            const texts = slice.map((k) => {
                const { safe, map } = placeholderTokens(source[k]);
                maps.push(map);
                return safe;
            });
            let translated: string[] = [];
            try {
                translated = await fetchTranslateBatch(texts, lang);
            } catch (err) {
                console.warn(`  ⚠️  Error traduciendo lote [${i}-${i + slice.length}] → copiamos original`);
                translated = texts; // fallback
            }
            slice.forEach((k, idx) => {
                const restored = restoreTokens(translated[idx] || source[k], maps[idx]);
                targetTranslations[k] = restored;
            });
            console.log(`    ✓ ${i + slice.length} / ${Object.keys(source).length}`);
        }
        fs.writeFileSync(outPath, JSON.stringify(targetTranslations, null, 2));
        console.log(`✔️  Archivo generado: ${outPath}`);
    }
})(); 