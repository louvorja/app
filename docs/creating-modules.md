# 🧩 Criando Novos Módulos

## 📁 Estrutura Base

Crie uma pasta dentro de:

```bash
src/modules/NomeDoModulo/
```

Estrutura mínima:

```bash
NomeDoModulo/
├── index.js
├── manifest.json
├── interface/
├── components/
└── lang/
```

---

## 📄 manifest.json

Define metadados do módulo:

```json
{
  "name": "Nome do Módulo",
  "icon": "mdi-star"
}
```

## 📄 index.js

Responsável por registrar o módulo:

```javascript
export default {
  install(app) {
    console.log("Módulo carregado")
  }
}
```

---

## 🖥 Interface

Coloque os componentes principais dentro de:

```bash
interface/
```

Exemplo:

```bash
interface/Main.vue
```

---

🌎 Traduções

Dentro de:

```bash
lang/pt.json
lang/es.json
interface/Main.vue
```
