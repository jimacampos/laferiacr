import { describe, expect, it } from "vitest";

import { voteErrorKey } from "./voteErrors";

describe("voteErrorKey", () => {
  it("maps each known error code to its specific message key", () => {
    expect(voteErrorKey("auth_required")).toBe("proposals.error.signIn");
    expect(voteErrorKey("banned")).toBe("proposals.error.banned");
    expect(voteErrorKey("not_found")).toBe("proposals.error.notFound");
    expect(voteErrorKey("not_open")).toBe("proposals.error.notOpen");
    expect(voteErrorKey("self_vote")).toBe("proposals.error.selfVote");
  });

  it("treats transport/availability failures as a network error", () => {
    expect(voteErrorKey("network_error")).toBe("proposals.error.network");
    expect(voteErrorKey("unavailable")).toBe("proposals.error.network");
  });

  it("falls back to the generic error for unknown or missing codes", () => {
    expect(voteErrorKey(undefined)).toBe("contribute.error");
    expect(voteErrorKey("")).toBe("contribute.error");
    expect(voteErrorKey("something_else")).toBe("contribute.error");
  });
});
