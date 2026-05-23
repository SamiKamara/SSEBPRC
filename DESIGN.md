# ShagatansSpaceEngineersBlueprintResourceCalculator

Design document for a Next.js / Vercel web application that calculates Space Engineers blueprint resource requirements.

## 1. Purpose

SSEBPRC is a browser-based blueprint resource calculator for Space Engineers.

The user uploads a local blueprint file, usually `bp.sbc` or a zipped blueprint folder, and the app returns:

- how many blocks of each type the blueprint contains
- how many components must be assembled
- how many ingots are required to assemble those components
- which blocks or components could not be matched to the known definition data
- exportable summaries for planning, assembler queues, and inventory checks

The core value is fast survival build planning: upload blueprint, see exact material demand, then decide whether the project is affordable.

## 2. Architecture Fit With Etsimi

The app should follow the same basic architecture style as `C:\Users\samin\Desktop\Etsimi`:

- Next.js App Router under `src/app`
- TypeScript throughout
- Tailwind CSS for UI
- one main client component for the interactive tool
- API route handlers under `src/app/api`
- domain logic isolated in `src/lib`
- simple typed request/response contracts in `src/lib/types.ts`
- Node.js runtime for API routes that need filesystem-like parsing libraries
- optional Upstash Redis only for shared/saved records, not for the core calculation

Etsimi is a small focused application, not a large service mesh. SSEBPRC should keep that same shape: the UI calls one or two local API endpoints, and the real work lives in small library modules that are easy to test.

## 3. MVP Scope

### Included

- Upload `bp.sbc` XML directly.
- Upload `.zip` containing a blueprint folder and extract the first valid `bp.sbc`.
- Parse all `CubeGrid` elements and all `CubeBlocks` in a blueprint.
- Normalize block IDs from blueprint form to definition form:
  - blueprint `xsi:type="MyObjectBuilder_Thrust"` -> `Thrust`
  - empty `<SubtypeName />` remains an empty subtype, because Space Engineers uses default subtype definitions for some blocks
  - definition `TypeId` may appear with or without `MyObjectBuilder_`; normalize both
- Sum block counts by `TypeId/SubtypeId`.
- Resolve each block into component requirements.
- Sum component totals.
- Resolve each component into ingot requirements.
- Display unresolved blocks and unresolved components clearly.
- Export results as JSON and CSV.

### Excluded From MVP

- Reading binary `bp.sbcB5` without the XML `bp.sbc`.
- Automatically supporting every modded block from Workshop.
- Calculating ore requirements from refinery yield.
- Calculating production time by assembler tier and modules.
- User accounts.
- Persistent upload storage.

## 4. User Flow

1. User opens the app.
2. User drops a `bp.sbc` file or zipped blueprint folder into the upload area.
3. Client validates file extension and size before upload.
4. Client sends the file to `POST /api/calculate` as `multipart/form-data`.
5. Server parses the file and calculates resources.
6. Client renders:
   - headline totals
   - block list
   - component assembly list
   - ingot list
   - warnings for missing definitions
7. User exports CSV/JSON or uploads another blueprint.

## 5. Proposed File Structure

```text
SSEBPRC/
  src/
    app/
      api/
        calculate/
          route.ts
        definitions/
          route.ts
      globals.css
      layout.tsx
      page.tsx
    components/
      BlueprintResourceCalculator.tsx
      FileDropzone.tsx
      ResultsSummary.tsx
      ResourceTable.tsx
      WarningPanel.tsx
    data/
      space-engineers/
        definitions-manifest.json
        vanilla-block-components.json
        vanilla-component-recipes.json
    lib/
      blueprint-parser.ts
      calculator.ts
      compatibility.ts
      definition-loader.ts
      export.ts
      file-validation.ts
      normalization.ts
      types.ts
      zip-reader.ts
    scripts/
      generate-definitions.ts
  public/
  package.json
  README.md
```

This mirrors Etsimi's layout while splitting the calculator into a few smaller components because the result UI has several natural panels.

## 6. Data Model

### Input Types

```ts
export type UploadedBlueprint = {
  fileName: string;
  sourceType: "sbc" | "zip";
  xml: string;
};

export type BlueprintBlockRef = {
  rawTypeId: string;
  rawSubtypeId: string;
  typeId: string;
  subtypeId: string;
  displayKey: string;
  gridIndex: number;
};
```

### Definition Types

```ts
export type BlockDefinition = {
  typeId: string;
  subtypeId: string;
  displayName?: string;
  components: ComponentAmount[];
};

export type ComponentRecipe = {
  subtypeId: string;
  ingots: IngotAmount[];
  source: "vanilla" | "custom";
};

export type ComponentAmount = {
  subtypeId: string;
  count: number;
};

export type IngotAmount = {
  subtypeId: string;
  amount: number;
};
```

### Calculation Response

```ts
export type CalculateResponse = {
  blueprint: {
    fileName: string;
    displayName?: string;
    gridCount: number;
    blockCount: number;
  };
  blocks: CountRow[];
  components: CountRow[];
  ingots: CountRow[];
  warnings: CalculationWarning[];
  definitionVersion: string;
};

export type CountRow = {
  key: string;
  label: string;
  count: number;
};

export type CalculationWarning = {
  kind:
    | "missing-block-definition"
    | "missing-component-recipe"
    | "ignored-inventory"
    | "schema-drift-detected"
    | "unsupported-file";
  severity: "info" | "warning" | "error";
  key?: string;
  message: string;
};
```

## 7. Core Calculation

### Parser

`src/lib/blueprint-parser.ts` reads XML and returns normalized block refs.

Responsibilities:

- parse XML safely
- reject malformed XML with a clear error
- find `ShipBlueprint` using tolerant local-name traversal, not brittle absolute string paths
- read optional blueprint display name
- iterate every `CubeGrid`, even if wrapper metadata changes around it
- iterate every block under `CubeBlocks`, regardless of block element concrete name
- ignore inventory `Items`, because those are cargo contents, not build cost
- preserve raw `xsi:type` and raw `SubtypeName` values for diagnostics
- normalize known type prefixes in one shared helper, not inline in multiple places
- ignore unknown tags by default and warn only when a required calculation field is missing
- return all block refs with grid index

Recommended dependency: `fast-xml-parser`.

Do not use regex as the main parser. Space Engineers blueprints are XML and may contain nested terminal settings, inventories, scripts, and DLC metadata.

The parser should be permissive about small Space Engineers updates. It should depend only on stable semantic anchors:

- a blueprint contains one or more grids
- a grid contains cube blocks
- each block has a type and usually a subtype
- build cost is derived from block definitions, not from decorative or runtime state stored in the blueprint

If Keen changes a wrapper tag, adds extra metadata, changes tag order, or adds optional fields, the parser should keep working.

### Definition Loader

`src/lib/definition-loader.ts` loads static JSON generated from known Space Engineers definitions.

The app should not parse the full game `Content\Data` tree on every Vercel request. Instead:

1. `scripts/generate-definitions.ts` runs locally.
2. It reads installed game files:
   - `Content\Data\CubeBlocks\*.sbc`
   - `Content\Data\Blueprints*.sbc`
3. It writes compact JSON into `src/data/space-engineers/`.
4. Vercel deploy serves those JSON files as bundled app data.

This keeps requests fast and makes the deployed calculator deterministic.

### Calculator

`src/lib/calculator.ts` does pure deterministic aggregation:

1. Count blocks by normalized `typeId/subtypeId`.
2. For each block count, lookup matching `BlockDefinition`.
3. Sum required components.
4. For each component count, lookup matching `ComponentRecipe`.
5. Sum required ingots.
6. Return sorted rows and warnings.

The calculator should be pure and unit-testable: input data in, result object out.

## 8. Definition Generation

The generator should mimic the reliable local calculation pattern:

- Block definitions:
  - source: `CubeBlocks/**/*.sbc`
  - key: normalized `TypeId/SubtypeId`
  - component list: all `<Component Subtype="..." Count="..." />` entries, summed because some blocks repeat the same component
- Component recipes:
  - source: `Blueprints*.sbc`
  - find blueprint results where `TypeId="Component"`
  - divide prerequisites by result amount if a recipe returns more than one component
  - keep the `IsPrimary=true` recipe when duplicate component outputs exist
  - only include `TypeId="Ingot"` prerequisites for ingot totals
- Normalization:
  - use the same `normalization.ts` helpers as runtime parsing
  - accept both `TypeId>Projector</TypeId>` and `TypeId>MyObjectBuilder_Projector</TypeId>`
  - preserve raw source keys in generated metadata for debugging

The generated manifest should include:

```json
{
  "game": "Space Engineers",
  "generatedAt": "ISO timestamp",
  "definitionVersion": "manual label, e.g. vanilla-2026-05-23",
  "blockDefinitionCount": 0,
  "componentRecipeCount": 0
}
```

Potential licensing note: before publishing, confirm whether generated vanilla definition JSON can be redistributed. If not, keep a documented local generation step and ship only a small example dataset.

## 9. Forward Compatibility Strategy

The application should be designed to survive normal Space Engineers updates without requiring code changes every time the game adds fields, reorders XML, or slightly changes definition tags.

### Compatibility Principles

- Prefer semantic XML traversal over fixed paths. Search by local tag names such as `CubeGrid`, `CubeBlocks`, `SubtypeName`, `Id`, `TypeId`, and `Components`.
- Centralize all type and subtype normalization in `src/lib/normalization.ts`.
- Keep `src/lib/compatibility.ts` as the only place for known aliases, deprecated tags, and fallback lookup rules.
- Treat unknown optional tags as data to ignore, not errors.
- Treat missing required cost fields as warnings when possible, not fatal errors.
- Return partial results with warnings instead of failing the entire calculation when one modded or future block is unknown.
- Store definition data with a manifest version so users can see whether their calculator data is older than their game install.
- Make the definition generator rerunnable by users after a game update, even if the deployed app's bundled data lags behind.

### Runtime Lookup Fallbacks

Block lookup should try these keys in order:

1. normalized `typeId/subtypeId`
2. normalized type with empty subtype
3. compatibility alias from `compatibility.ts`
4. optional user-imported definition pack, if that feature exists later

Component recipe lookup should:

- prefer exact normalized component subtype
- allow aliases for renamed components
- warn when a component has no recipe but still include it in the component table

### Schema Drift Detection

The parser should collect lightweight observations:

- unknown block type count
- blocks missing subtype nodes
- blueprint wrapper tags that were not recognized
- XML parse mode used
- definition manifest version

If those observations suggest a new game format, the response should include a `schema-drift-detected` warning. This makes the app honest without making it fragile.

### Update Workflow

When the game updates, the preferred maintenance path should be:

1. run `npm run generate-definitions`
2. inspect manifest diff
3. run fixture tests
4. deploy updated definition JSON if needed

Code changes should only be necessary when the underlying meaning changes, not when new optional tags or block definitions appear.

## 10. API Design

### `POST /api/calculate`

Runtime:

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

Request:

- `multipart/form-data`
- field: `blueprint`
- accepted extensions: `.sbc`, `.zip`

Response:

- `200` with `CalculateResponse`
- `400` for invalid upload, unsupported file, malformed blueprint
- `413` for too large file
- `500` only for unexpected server failures

Server steps:

1. validate upload
2. read XML or extract `bp.sbc` from zip
3. parse blueprint
4. load definitions
5. calculate totals
6. return JSON

### `GET /api/definitions`

Returns manifest and supported data version. Useful for footer/debug UI.

### Optional `POST /api/reports`

Only if shareable reports are desired.

Use the same Etsimi-style storage abstraction:

- local development writes to `.data/reports.json`
- Vercel production writes to Upstash Redis when configured
- without Redis, report saving is disabled but calculation still works

## 11. UI Design

The first screen should be the tool, not a marketing landing page.

Main layout:

- top compact title bar: `SSEBPRC`
- upload dropzone with file picker
- current definition version
- result tabs:
  - Ingots
  - Components
  - Blocks
  - Warnings
- export buttons with icons
- upload reset button

Result table behavior:

- sortable by count and name
- default sort: largest count first
- copy row value
- copy whole table as TSV
- CSV download
- JSON download

States:

- idle
- drag-over
- validating file
- uploading/calculating
- success
- warning success with missing definitions
- recoverable error

Tone should be practical and compact. This is a workshop tool, so the UI should be dense enough to scan, with clear totals and no decorative hero section.

## 12. Error Handling

Common user-facing errors:

- "Tiedosto ei ole tuettu. Lataa bp.sbc tai zipattu blueprint-kansio."
- "Zipistä ei löytynyt bp.sbc-tiedostoa."
- "Blueprint XML:ää ei voitu lukea."
- "Blueprintissä ei löytynyt CubeBlocks-rakennetta."
- "Tiedosto on liian suuri."
- "Osa lohkoista jäi laskematta, koska määritelmää ei löytynyt."
- "Blueprintissä on tuntemattomia kenttiä, mutta laskenta jatkui yhteensopivuustilassa."

Missing definitions are warnings, not fatal errors. The app should still return all known totals and list unresolved keys.

## 13. Security And Privacy

- Do not store uploaded files by default.
- Do not send uploaded blueprints to external services.
- Parse XML on the server with a parser that does not resolve external entities.
- Reject extremely large files before parsing.
- For zip uploads:
  - limit total uncompressed size
  - limit file count
  - reject nested archive recursion
  - only read candidate `.sbc` files
- Strip or ignore programmable block script content in UI responses.
- Do not echo raw uploaded XML back to the client.

## 14. Performance

Expected blueprint sizes are small enough for a single serverless request, but large grids can still be heavy.

Performance choices:

- bundle compact definition JSON
- lazy-load definitions once per server instance and cache in module scope
- use Maps for key lookups
- aggregate numbers in one pass
- avoid returning per-block positions unless a debug mode is added

For very large blueprints, the API can return a `413` with a suggestion to upload a smaller blueprint or raise the configured limit for self-hosting.

## 15. Testing Plan

Unit tests:

- XML parser reads a simple one-grid blueprint
- parser handles multiple `CubeGrid` elements
- parser preserves empty subtype IDs
- calculator sums duplicate block definitions correctly
- calculator sums repeated component entries inside one block definition
- component recipe division works when result amount is not `1`
- unresolved block produces warning and does not crash
- added unknown optional XML tags do not break parsing
- changed XML tag order does not break parsing
- `MyObjectBuilder_` prefix variants normalize to the same key
- compatibility aliases resolve renamed block or component keys

Fixture tests:

- include a tiny fixture blueprint with known totals
- include a fixture with:
  - default subtype block
  - repeated components
  - inventory contents that must be ignored
  - one unknown modded block
- a future-format fixture with extra wrapper metadata and harmless unknown tags

Manual tests:

- upload real `bp.sbc`
- upload zip containing blueprint folder
- export CSV
- export JSON
- deploy preview on Vercel and verify calculation matches local script
- regenerate definitions after a game update and verify no code changes are required for normal new blocks

## 16. Implementation Milestones

### Milestone 1: Static Tool Skeleton

- create Next app using Etsimi-style dependencies
- add Tailwind and lucide icons
- build upload UI and empty result panels
- add `src/lib/types.ts`
- add `normalization.ts` and `compatibility.ts` before writing parser logic

### Milestone 2: Local Parser And Calculator

- implement `blueprint-parser.ts`
- implement `calculator.ts`
- add static small definition fixtures
- make `/api/calculate` return real results for fixture data
- add compatibility tests for harmless blueprint format changes

### Milestone 3: Vanilla Definition Generator

- implement `scripts/generate-definitions.ts`
- generate vanilla block/component JSON from local Space Engineers installation
- add manifest
- verify against a known real blueprint
- make generator tolerant of new `.sbc` files and optional tags

### Milestone 4: Production Hardening

- file limits
- zip safety
- better errors
- CSV/JSON export
- deploy to Vercel

### Milestone 5: Optional Definition Pack Import

- allow advanced users to upload a local generated definition pack
- validate manifest compatibility
- calculate against imported definitions for newer game versions or modded servers
- keep all imported data session-local unless saved reports are explicitly added

### Milestone 6: Optional Saved Reports

- add `report-store.ts` modeled after Etsimi's `store.ts`
- local `.data` fallback
- Upstash Redis support on Vercel
- shareable report IDs with optional expiry

## 17. Open Questions

- Should the public app ship vanilla Space Engineers definition data, or should users generate/import their own definition pack?
- Should modded blocks be supported by uploading mod `.sbc` files alongside the blueprint?
- Should the app calculate only ingots, or also ore quantities using refinery yield?
- Should inventories inside cargo containers be ignored always, or shown separately as "blueprint stored items"?
- Should assembler queue export target Isy's Inventory Manager, vanilla production queue naming, or simple CSV only?
- How much schema drift should trigger a visible warning versus silent compatibility handling?

## 18. Recommended MVP Decision

Build the first version as a stateless calculator:

- no login
- no database
- no saved uploads
- one upload endpoint
- bundled vanilla definition JSON
- clear warnings for unknown modded blocks
- tolerant parser and rerunnable definition generator from the start

This keeps the app close to Etsimi's simple Next/Vercel shape while avoiding persistence complexity until shareable reports are actually needed.
