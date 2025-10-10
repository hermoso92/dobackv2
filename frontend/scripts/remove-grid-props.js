const fs = require('fs');
const path = require('path');

// Ruta al archivo Stability.tsx
const filePath = path.resolve(__dirname, '../src/pages/Stability.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Eliminar propiedades de Grid en Box
content = content.replace(/item\s*=\s*{\s*true\s*}/g, '');
content = content.replace(/xs\s*=\s*{\s*\d+\s*}/g, '');
content = content.replace(/sm\s*=\s*{\s*\d+\s*}/g, '');
content = content.replace(/md\s*=\s*{\s*\d+\s*}/g, '');
content = content.replace(/lg\s*=\s*{\s*\d+\s*}/g, '');
content = content.replace(/component\s*=\s*["']div["']/g, '');

// Eliminar espacios múltiples y atributos vacíos
content = content.replace(/\s{2,}/g, ' ');
content = content.replace(/Box\s+sx/g, 'Box sx');

// Guardar el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('Propiedades Grid eliminadas correctamente de Stability.tsx'); 