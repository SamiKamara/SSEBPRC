# SSEBPRC

SSEBPRC, short for Shagatan's Space Engineers Blueprint Resource Calculator, is a Next.js app for calculating Space Engineers blueprint resource requirements.

Live app: https://ssebprc.vercel.app

Repository: https://github.com/SamiKamara/SSEBPRC

## What It Does

- Upload a `bp.sbc` file or a zipped blueprint folder.
- Parse every `CubeGrid` and `CubeBlocks` entry from the blueprint XML.
- Count blocks by normalized `TypeId/SubtypeId`.
- Resolve block component requirements from bundled vanilla Space Engineers definition data.
- Resolve component ingot recipes.
- Show unresolved blocks or components as warnings instead of failing the whole calculation.
- Export result tables as CSV, JSON, or TSV.

The app does not require an account. Uploaded files are parsed for the current calculation request and are not written to project storage.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- `fast-xml-parser` for blueprint XML parsing
- `jszip` for zipped blueprint uploads
- Node test runner with `tsx`

## Development

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Definition Data

The bundled definition pack was generated from a local Space Engineers install and includes official vanilla blocks plus official DLC block definition files found under `Content\Data\CubeBlocks`.

Regenerate the pack after a Space Engineers update:

```bash
npm run generate-definitions -- "C:\Program Files (x86)\Steam\steamapps\common\SpaceEngineers\Content\Data"
```

The generator writes:

- `src/data/space-engineers/definitions-manifest.json`
- `src/data/space-engineers/vanilla-block-components.json`
- `src/data/space-engineers/vanilla-component-recipes.json`

Before publishing generated vanilla data, confirm that redistribution is allowed by the relevant game and data licenses.

## Deployment

The production deployment is hosted on Vercel at https://ssebprc.vercel.app.

To deploy manually from this repository:

```bash
vercel deploy --prod
```
