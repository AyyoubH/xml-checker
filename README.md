# xml-check

A front-end web application to validate XML files against XSD schemas — entirely in your browser, no server required.

## Prerequisites

- Node.js (v16+)
- npm

## Installation

```bash
npm install
```

## Development

Start the local development server:

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. *(Optional)* Select one or more `.xsd` schema files.
2. Select the `.xml` file you want to validate.
3. Click **Validate**.
4. Results are shown immediately — no data leaves your browser.

## Build

Compile and bundle for production:

```bash
npm run build
```

The output is placed in the `dist/` directory and can be served by any static file host.

## Preview production build

```bash
npm run preview
```
