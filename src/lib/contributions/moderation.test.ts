import { describe, expect, it } from "vitest";

import { orderQueueGroups, type RawReportGroup } from "./moderation";

// The queue ranks targets by most open reports first, then most recent — the manual triage
// order (no auto-quarantine, OQ-009 deferred). This pins that ordering as a pure function so a
// regression can't reshuffle the moderators' worklist.

function group(
  targetId: string,
  count: number,
  latestReportAt: string,
): RawReportGroup {
  return { targetType: "market", targetId, count, latestReportAt: new Date(latestReportAt) };
}

describe("orderQueueGroups", () => {
  it("orders by open-report count descending", () => {
    const ordered = orderQueueGroups([
      group("a", 1, "2026-01-01T00:00:00Z"),
      group("b", 5, "2026-01-01T00:00:00Z"),
      group("c", 3, "2026-01-01T00:00:00Z"),
    ]);
    expect(ordered.map((g) => g.targetId)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by most-recent report", () => {
    const ordered = orderQueueGroups([
      group("older", 2, "2026-01-01T00:00:00Z"),
      group("newer", 2, "2026-02-01T00:00:00Z"),
    ]);
    expect(ordered.map((g) => g.targetId)).toEqual(["newer", "older"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      group("a", 1, "2026-01-01T00:00:00Z"),
      group("b", 2, "2026-01-01T00:00:00Z"),
    ];
    const snapshot = input.map((g) => g.targetId);
    orderQueueGroups(input);
    expect(input.map((g) => g.targetId)).toEqual(snapshot);
  });
});
