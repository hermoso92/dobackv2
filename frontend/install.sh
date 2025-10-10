#!/bin/bash

# Instalar dependencias
npm install

# Instalar tipos de TypeScript
npm install --save-dev @types/react @types/react-dom @types/node

# Instalar dependencias de desarrollo
npm install --save-dev typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react

# Instalar dependencias de UI
npm install @mui/material @emotion/react @emotion/styled

# Instalar dependencias de estado y enrutamiento
npm install @reduxjs/toolkit react-redux react-router-dom

# Instalar dependencias de formularios
npm install formik yup

# Instalar dependencias de HTTP
npm install axios

# Crear archivo de configuración de TypeScript
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
EOL

# Crear archivo de configuración de ESLint
cat > .eslintrc.json << EOL
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "@typescript-eslint"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
EOL

echo "Instalación completada" 