import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { JsxText, Project, SyntaxKind } from 'ts-morph';

const SRC_DIR = path.resolve('src');
const LOCALE_DIR = path.resolve('locales', 'es');
const LOCALE_FILE = path.join(LOCALE_DIR, 'translation.json');

if (!fs.existsSync(LOCALE_DIR)) {
    fs.mkdirSync(LOCALE_DIR, { recursive: true });
}
let translations: Record<string, string> = {};
if (fs.existsSync(LOCALE_FILE)) {
    translations = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'));
}

const project = new Project({ tsConfigFilePath: path.resolve('tsconfig.json') });

// Añadimos explícitamente los archivos fuente
project.addSourceFilesAtPaths([
    `${SRC_DIR}/components/**/*.tsx`,
    `${SRC_DIR}/components/**/*.ts`,
    `${SRC_DIR}/pages/**/*.tsx`,
    `${SRC_DIR}/pages/**/*.ts`
]);

const files = project.getSourceFiles();

const generateKey = (text: string): string => {
    const base = slugify(text, { lower: true, strict: true, locale: 'es' }).replace(/-+/g, '_');
    let key = base;
    let i = 1;
    while (translations[key]) {
        key = `${base}_${i++}`;
    }
    return key;
};

console.log(`Total archivos analizados: ${files.length}`);
let totalTexts = 0;

files.forEach((source) => {
    let modified = false;

    // Ensure import { t } from '../i18n'; exists
    const importDecls = source.getImportDeclarations().filter((d) => {
        try {
            const val = d.getModuleSpecifierValue();
            return typeof val === 'string' && val.endsWith('i18n');
        } catch {
            return false;
        }
    });
    if (importDecls.length === 0) {
        const relativePath = path.relative(path.dirname(source.getFilePath()), path.resolve('src', 'i18n')).replace(/\\/g, '/');
        source.addImportDeclaration({ namedImports: ['t'], moduleSpecifier: relativePath.startsWith('.') ? relativePath : `./${relativePath}` });
        modified = true;
    }

    // Replace plain JSXText
    source.forEachDescendant((node) => {
        if (node.getKind() === SyntaxKind.JsxText) {
            const jsxText = node as JsxText;
            const text = jsxText.getText();
            const clean = text.replace(/\s+/g, ' ').trim();
            if (clean && /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clean)) {
                totalTexts++;
                const key = generateKey(clean);
                translations[key] = clean;
                jsxText.replaceWithText(`{t('${key}')}`);
                modified = true;
            }
        }
        // Nota: omitimos StringLiteral para evitar tocar imports u otros strings que no son UI
    });

    if (modified) {
        source.saveSync();
    }
});

console.log(`Textos candidatos encontrados: ${totalTexts}`);

fs.writeFileSync(LOCALE_FILE, JSON.stringify(translations, null, 2));

console.log(`Codemod terminado. Archivos modificados y ${Object.keys(translations).length} claves en locales/es/translation.json`);
// Fin del script
