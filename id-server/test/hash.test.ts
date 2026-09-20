import { expect } from "chai";
import { constantTimeEqual, sha256Hex } from "../src/hash.js";

describe("hash", () => {
  it("produces a stable sha256 hex digest", () => {
    expect(sha256Hex("secret")).to.equal(
      "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
    );
  });

  it("compares secrets in constant time", () => {
    expect(constantTimeEqual("secret", "secret")).to.equal(true);
    expect(constantTimeEqual("secret", "other")).to.equal(false);
    expect(constantTimeEqual("", "")).to.equal(true);
    expect(constantTimeEqual("", "x")).to.equal(false);
  });
});
