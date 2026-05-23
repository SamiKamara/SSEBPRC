import assert from "node:assert/strict";
import test from "node:test";
import { parseBlueprint } from "@/lib/blueprint-parser";

test("parser reads multiple grids, normalized type IDs, empty subtypes, and inventories", () => {
  const parsed = parseBlueprint({
    fileName: "bp.sbc",
    sourceType: "sbc",
    xml: `<?xml version="1.0"?>
      <Definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <ShipBlueprints>
          <ShipBlueprint>
            <DisplayName>Test Rig</DisplayName>
            <CubeGrids>
              <CubeGrid>
                <CubeBlocks>
                  <MyObjectBuilder_CubeBlock xsi:type="MyObjectBuilder_CubeBlock">
                    <SubtypeName>LargeBlockArmorBlock</SubtypeName>
                    <Items><Item /></Items>
                  </MyObjectBuilder_CubeBlock>
                  <MyObjectBuilder_Reactor xsi:type="MyObjectBuilder_Reactor">
                    <SubtypeName />
                  </MyObjectBuilder_Reactor>
                </CubeBlocks>
              </CubeGrid>
              <CubeGrid>
                <CubeBlocks>
                  <MyObjectBuilder_Thrust xsi:type="MyObjectBuilder_Thrust">
                    <SubtypeName>LargeBlockSmallThrust</SubtypeName>
                    <UnknownOptionalTag>ok</UnknownOptionalTag>
                  </MyObjectBuilder_Thrust>
                </CubeBlocks>
              </CubeGrid>
            </CubeGrids>
          </ShipBlueprint>
        </ShipBlueprints>
      </Definitions>`,
  });

  assert.equal(parsed.displayName, "Test Rig");
  assert.equal(parsed.gridCount, 2);
  assert.equal(parsed.blockCount, 3);
  assert.equal(parsed.blocks[0].typeId, "CubeBlock");
  assert.equal(parsed.blocks[1].typeId, "Reactor");
  assert.equal(parsed.blocks[1].subtypeId, "");
  assert.equal(parsed.blocks[2].displayKey, "Thrust/LargeBlockSmallThrust");
  assert.equal(parsed.warnings.some((warning) => warning.kind === "ignored-inventory"), true);
});

test("parser rejects malformed blueprint XML", () => {
  assert.throws(
    () =>
      parseBlueprint({
        fileName: "bp.sbc",
        sourceType: "sbc",
        xml: "<Definitions><CubeGrid>",
      }),
    /Blueprint XML/,
  );
});
