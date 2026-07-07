import { describe, expect, it } from "vitest";

import { dictionaries, LANGUAGES } from "@/i18n/dictionaries";

import { ROLE_INFO } from "./roleInfo";
import { ROLES } from "./rolesPolicy";

describe("ROLE_INFO", () => {
  it("covers every role, in policy order", () => {
    expect(ROLE_INFO.map((r) => r.role)).toEqual([...ROLES]);
  });

  it("derives the expected label + description keys", () => {
    for (const { role, labelKey, descriptionKey } of ROLE_INFO) {
      expect(labelKey).toBe(`role.${role}`);
      expect(descriptionKey).toBe(`role.${role}.desc`);
    }
  });

  it("has a non-empty label + description for every role in each language", () => {
    for (const lang of LANGUAGES) {
      const messages = dictionaries[lang];
      for (const { labelKey, descriptionKey } of ROLE_INFO) {
        expect(messages[labelKey]?.trim(), `${lang}:${labelKey}`).toBeTruthy();
        expect(
          messages[descriptionKey]?.trim(),
          `${lang}:${descriptionKey}`,
        ).toBeTruthy();
      }
    }
  });
});
