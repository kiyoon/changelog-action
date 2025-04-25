import {
  cleanAndFilterVersions,
  findPreviousVersion,
  sortSemvers,
} from "./semver.ts"

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

  it("reject leading zeros", () => {
    const input = ["v01.02.03", "vinvalid", "v"]
    const expected = []
    expect(cleanAndFilterVersions(input)).toEqual(expected)
  })

  it("preserves build metadata", () => {
    const input = ["v1.0.0+build", "vinvalid", "v"]
    const expected = ["1.0.0+build"]
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

describe("sortSemvers", () => {
  it("sorts ascending by default", () => {
    const input = ["1.2.3", "2.0.0+build.1", "1.2.10", "1.2.3-beta"]
    // Pre-release comes before the corresponding release
    // build metadata does not affect sort order beyond the version core
    const expected = ["1.2.3-beta", "1.2.3", "1.2.10", "2.0.0+build.1"]
    expect(sortSemvers({ versions: input })).toEqual(expected)
  })

  it("sorts descending when descending = true", () => {
    const input = ["1.2.3", "1.2.10", "2.0.0", "1.2.3-alpha"]
    const expected = ["2.0.0", "1.2.10", "1.2.3", "1.2.3-alpha"]
    expect(sortSemvers({ versions: input, descending: true })).toEqual(expected)
  })

  it("handles an empty array", () => {
    expect(sortSemvers({ versions: [] })).toEqual([])
  })

  it("handles a single-element array", () => {
    expect(sortSemvers({ versions: ["0.0.1"] })).toEqual(["0.0.1"])
    expect(sortSemvers({ versions: ["0.0.1"], descending: true })).toEqual([
      "0.0.1",
    ])
  })

  it("is stable for equal versions", () => {
    const input = ["1.0.0", "1.0.0", "1.0.0+build.1"]
    // All have the same precedence (build metadata ignored), stable sort preserves input order among equals
    expect(sortSemvers({ versions: input })).toEqual([
      "1.0.0",
      "1.0.0",
      "1.0.0+build.1",
    ])
  })

  it("correctly orders complex versions", () => {
    const input = [
      "1.0.0-alpha.1",
      "1.0.0-alpha",
      "1.0.0-alpha.beta",
      "1.0.0-beta",
      "1.0.0-beta.2",
      "1.0.0-beta.11",
      "1.0.0-rc.1",
      "1.0.0",
    ]
    const expected = [
      "1.0.0-alpha",
      "1.0.0-alpha.1",
      "1.0.0-alpha.beta",
      "1.0.0-beta",
      "1.0.0-beta.2",
      "1.0.0-beta.11",
      "1.0.0-rc.1",
      "1.0.0",
    ]
    expect(sortSemvers({ versions: input })).toEqual(expected)
  })
})

describe("findPreviousVersion", () => {
  it("returns the immediate predecessor when the target exists", () => {
    const versions = ["2.0.0", "1.2.10", "1.2.3"]
    expect(findPreviousVersion(versions, "1.2.10")).toBe("1.2.3")
  })

  it("returns the greatest version less than target when target is absent", () => {
    const versions = ["2.0.0", "1.2.10", "1.2.3"]
    expect(findPreviousVersion(versions, "1.5.0")).toBe("1.2.10")
  })

  it("returns null if no smaller version exists", () => {
    const versions = ["1.0.0", "1.1.0", "1.2.0"]
    expect(findPreviousVersion(versions, "1.0.0")).toBeNull()
    expect(findPreviousVersion(versions, "0.9.0")).toBeNull()
  })

  it("handles unsorted input lists", () => {
    const versions = ["1.2.3", "2.0.0", "1.0.0"]
    // 1.2.3 → predecessor is 1.0.0
    expect(findPreviousVersion(versions, "1.2.3")).toBe("1.0.0")
    // 2.0.0 → predecessor is 1.2.3
    expect(findPreviousVersion(versions, "2.0.0")).toBe("1.2.3")
  })

  it("ignores build metadata when comparing", () => {
    const versions = ["1.2.3+build.1", "1.2.3", "1.2.2"]
    // Both "1.2.3+build.1" and "1.2.3" compare equal, so predecessor is 1.2.2
    expect(findPreviousVersion(versions, "1.2.3+build.1")).toBe("1.2.2")
  })

  it("correctly handles pre-release versions", () => {
    const versions = ["1.0.0-alpha", "1.0.0-beta", "1.0.0", "2.0.0"]
    // 1.0.0 → predecessor is 1.0.0-beta
    expect(findPreviousVersion(versions, "1.0.0")).toBe("1.0.0-beta")
    // 1.0.0-beta → predecessor is 1.0.0-alpha
    expect(findPreviousVersion(versions, "1.0.0-beta")).toBe("1.0.0-alpha")
  })
})
