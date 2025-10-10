module.exports = {
  locales: ['es', 'en', 'fr'],
  defaultNamespace: 'translation',
  output: 'locales/$LOCALE/translation.json',
  input: ['src/**/*.{ts,tsx}'],
  keySeparator: false,
  nsSeparator: false,
  createOldCatalogs: false,
  lexers: {
    tsx: ['JsxLexer'],
    ts: ['JsxLexer']
  }
}; 