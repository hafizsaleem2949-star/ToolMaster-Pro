# ToolMaster Pro

Fresh multi-tool website foundation built with React + Vite.

## Included
- 100+ online tool entries and categories
- Search and category filtering
- Responsive modern UI
- Individual tool workspace
- Browser-local demo functions for many text/developer tools
- Admin dashboard foundation

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

This project is intentionally frontend-first. PDF processing, authentication, database storage, payments, and production admin APIs should be connected as separate secure backend modules rather than putting secrets in the browser.


## Student AI Helper
The Student AI Helper UI accepts questions and study-file uploads. For real AI answers, connect a secure server-side AI API. Never place an AI provider secret/API key in client-side React code.

## Text to Video
Includes a Text to Video project UI with prompt, style, duration and preview controls. Connect a secure server-side video generation provider for real rendering.
