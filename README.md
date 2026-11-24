# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## MDMS mock API

The mock data is generated with Indian names and Karnataka addresses. `npm run seed`
replaces `db.json` with a repeatable sample dataset and validates meter ownership
and zone relationships. Start the API with `npm run api` and the Vite app with
`npm run dev` in separate terminals.

This project uses `json-server@1.0.0-beta.15`. Its query syntax is:

```text
# Exact filters can be combined
/meters?zoneId=zone-mangalore&status=active

# Conditions use field:operator=value
/bills?status:eq=overdue&amount:gte=500

# Search one string field (case-insensitive substring)
/users?name:contains=an

# Sort ascending, or prefix a field with "-" for descending
/bills?_sort=issuedAt
/bills?_sort=-issuedAt,amount

# Filter, sort, and paginate together
/bills?ownerId=customer-001&_sort=-issuedAt&_page=1&_per_page=10
```

Supported condition operators include `eq`, `ne`, `lt`, `lte`, `gt`, `gte`,
`in`, `contains`, `startsWith`, and `endsWith`. String search uses a field
operator such as `name:contains`; this version does not use the older `_limit`
pagination option. Pagination uses `_page` and `_per_page` and returns an
object with `data` and paging metadata.
