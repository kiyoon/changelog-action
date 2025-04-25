import { describe, it } from "node/test"
import { cleanAndFilterVersions } from "./semver"

describe("cleanAndFilterVersions", () => {
  it("strips default 'v' prefix and filters invalid semvers", () => {
    const input = ["v1.2.3", "v2.0.0", "foo", "v1.2.3-beta", "bar1.0.0"]
    const expected = ["1.2.3", "2.0.0", "1.2.3-beta"]
    expect(cleanAndFilterVersions(input)).toEqual(expected)
  })

  it("supports a custom prefix and keeps unprefixed valid semvers", () => {
    const input = ["rel-1.0.0", "rel-2.1.0", "1.2.3"]
    const expected = ["1.0.0", "2.1.0", "1.2.3"]
    expect(cleanAndFilterVersions(input, "rel-")).toEqual(expected)
  })

  it("handles leading zeros and build metadata", () => {
    const input = ["v01.02.03", "v1.0.0+build", "vinvalid", "v"]
    const expected = ["1.2.3", "1.0.0+build"]
    expect(cleanAndFilterVersions(input)).toEqual(expected)
  })

  it("returns an empty array if no valid semvers are found", () => {
    const input = ["foo", "bar", ""]
    expect(cleanAndFilterVersions(input)).toEqual([])
  })

  it("returns an empty array for empty input", () => {
    expect(cleanAndFilterVersions([])).toEqual([])
  })

  it("is case-sensitive when stripping the prefix", () => {
    const input = ["V1.2.3", "v1.2.3"]
    const expected = ["1.2.3"]
    expect(cleanAndFilterVersions(input)).toEqual(expected)
  })

  it("works correctly with an empty prefix", () => {
    const input = ["1.2.3", "v1.2.3"]
    const expected = ["1.2.3", "1.2.3"]
    expect(cleanAndFilterVersions(input, "")).toEqual(expected)
  })
})
