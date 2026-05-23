# SSEBPRC

ShagatansSpaceEngineersBlueprintResourceCalculator is a local-first Next.js app for calculating Space Engineers blueprint resources.

## What it does

- Upload a `bp.sbc` file or a zipped blueprint folder.
- Parse every `CubeGrid` and `CubeBlocks` entry from the blueprint XML.
- Count blocks by normalized `TypeId/SubtypeId`.
- Resolve block component requirements and component ingot recipes.
- Show unresolved blocks/components as warnings instead of failing the whole calculation.
- Export totals as CSV, JSON, or TSV from the result tables.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run test
npm run lint
npm run build
```

## Definition Data

The bundled definition pack was generated from the local Space Engineers install and includes official vanilla blocks plus official DLC block definition files found under `Content\Data\CubeBlocks`.

Regenerate the pack after a Space Engineers update:

```bash
npm run generate-definitions -- "C:\Program Files (x86)\Steam\steamapps\common\SpaceEngineers\Content\Data"
```

The generator writes:

- `src/data/space-engineers/definitions-manifest.json`
- `src/data/space-engineers/vanilla-block-components.json`
- `src/data/space-engineers/vanilla-component-recipes.json`

Before publishing generated vanilla data, confirm that redistribution is allowed by the relevant game/data licenses.
