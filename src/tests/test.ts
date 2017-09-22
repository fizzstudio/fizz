import * as assert from "assert";
import * as demo from "../demo.js";

describe("add two", function() {
  it("should return a Number", function() {
    const mather = new demo.Mather();
    assert.equal(4, mather.addTwo(3, 1));
  });
});
