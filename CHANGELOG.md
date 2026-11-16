# Changelog

## 0.2.0 - 2026-11-16

- Refresh bundled Space Engineers definitions from Warfare 3, Steam build `26329893`.
- Add 73 block definitions, increasing coverage from 1,503 to 1,576 blocks. This includes torpedo launchers, separation charges, Prototech Microwave Emitters, longer conveyors, round atmospheric thrusters, expanded barred windows, and all 34 Warfare 3 Pack variants.
- Update six existing block costs: four barred windows, the small laser antenna, and the Prototech O2/H2 Generator. Refresh changed display names, including the Anti-Personnel Turret and Flare Launcher.
- Retain all 28 component recipes; the installed update does not change them.
- Apply assembler efficiency after summing ingots, preventing floating-point rounding from undercounting totals at half-unit boundaries.
- Add a 19-block blueprint fixture and regression checks for `.sbc` / ZIP calculation, exact component and ingot totals at `1x` / `3x` efficiency, and bundled definition integrity.
- Publish definition version `vanilla-2026-11-16`.
