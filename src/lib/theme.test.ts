import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_THEME, isThemeId, THEME_INIT_SCRIPT, THEME_KEY, THEMES } from "./theme";

describe("themes", () => {
  it("offers blue, green and purple, with blue as the default", () => {
    assert.deepEqual(THEMES.map((t) => t.id), ["blue", "green", "purple"]);
    assert.equal(DEFAULT_THEME, "blue");
  });
  it("recognizes valid theme ids only", () => {
    assert.ok(isThemeId("blue"));
    assert.ok(!isThemeId("orange"));
    assert.ok(!isThemeId(undefined));
  });
  it("gives every theme its own color", () => assert.equal(new Set(THEMES.map((t) => t.color)).size, THEMES.length));
  it("the early script reads the same storage key and knows every non-default theme", () => {
    assert.ok(THEME_INIT_SCRIPT.includes(THEME_KEY));
    for (const t of THEMES.filter((t) => t.id !== DEFAULT_THEME)) assert.ok(THEME_INIT_SCRIPT.includes(`"${t.id}"`));
  });
});
