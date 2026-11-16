# SSEBPRC

SSEBPRC, short for Shagatan's Space Engineers Blueprint Resource Calculator, is a Next.js app for calculating Space Engineers blueprint resource requirements.

Live app: https://ssebprc.vercel.app

Repository: https://github.com/SamiKamara/SSEBPRC

## What It Does

- Load a `bp.sbc` file or a zipped blueprint folder in the browser.
- Parse every `CubeGrid` and `CubeBlocks` entry from the blueprint XML.
- Count blocks by normalized `TypeId/SubtypeId`.
- Resolve block component requirements from bundled vanilla Space Engineers definition data.
- Resolve component ingot recipes.
- Apply a configurable assembler efficiency multiplier to ingot and ore totals, defaulting to `3x`.
- Show unresolved blocks or components as warnings instead of failing the whole calculation.
- Copy result tables as two-column lists with `Name` and `Count`.

The app does not require an account. Blueprint files are parsed in the user's browser and are not uploaded to the host server. The heavier calculation code and bundled Space Engineers definition data are lazy-loaded only after a valid blueprint file is selected.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- `fast-xml-parser` for blueprint XML parsing
- `jszip` for zipped blueprint loading
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

The current pack covers the [Warfare 3 update](https://www.spaceengineersgame.com/warfare3/), released on November 16, 2026 (Steam build `26329893`). It contains **1,576 block definitions** and **28 component recipes**, including Warfare 3 Pack variants and the updated costs of existing blocks. The definition version is `vanilla-2026-11-16`.

The `fixtures/warfare3-bp.sbc` regression fixture checks 19 free, DLC, and updated blocks across large and small grids. Tests exercise both direct `.sbc` and zipped blueprints with exact component and ingot totals at `1x` and `3x` assembler efficiency. Non-craftable items such as Prototech Frames remain in the component totals and produce a missing-recipe warning instead of an invented ingot cost.

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

## Releases

See [CHANGELOG.md](CHANGELOG.md) for changes. App releases use matching `package.json` / `package-lock.json` versions and GitHub tags such as `v0.2.0`. Before publishing, regenerate definitions from the updated game install and run all four checks listed above. Push the tested commit, publish its GitHub release, and verify that the production `/api/definitions` manifest reports the new definition version.
