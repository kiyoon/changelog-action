import semver from "semver"

/**
 * Remove a leading prefix from each tag, then return only those
 * that are valid semvers (without the prefix).
 *
 * @param tags     Array of raw tag strings (e.g. ["v1.2.3","vfoo","v2.0.0"])
 * @param prefix   The prefix to strip (default: "v")
 * @returns        Array of cleaned semver strings (e.g. ["1.2.3","2.0.0"])
 *
 * @example
 * ```ts
 * import { cleanAndFilterVersions } from './cleanAndFilterVersions';
 *
 * const rawTags = ["v1.2.3", "v2.0.0", "foo", "v1.2.3-beta"];
 * const cleaned = cleanAndFilterVersions(rawTags);
 * console.log(cleaned);
 * // Output: ["1.2.3", "2.0.0", "1.2.3-beta"]
 * ```
 */
export function cleanAndFilterVersions(
  tags: string[],
  prefix: string = "v",
): string[] {
  return (
    tags
      // 1) strip the prefix if present
      .map(tag => (tag.startsWith(prefix) ? tag.slice(prefix.length) : tag))
      // 2) parse; semver.parse keeps prerelease + build in its .build field
      .map(candidate => semver.parse(candidate))
      // 3) drop invalids, format the rest (format() will include build metadata)
      .filter((parsed): parsed is semver.SemVer => parsed !== null)
      // 4) reconstruct with build metadata if any
      // .map(parsed => parsed.format()) will exclude build metadata
      .map(p => {
        const core = `${p.major}.${p.minor}.${p.patch}`
        const pre = p.prerelease.length > 0 ? `-${p.prerelease.join(".")}` : ""
        const build = p.build.length > 0 ? `+${p.build.join(".")}` : ""
        return `${core}${pre}${build}`
      })
  )
}

/**
 * Sort an array of semver strings in ascending or descending order.
 * Assumes each input string is already a valid, cleaned semver.
 *
 * @param versions   - Array of semver strings (e.g. ["1.2.3", "2.0.0-beta", "1.2.10"])
 * @param descending - If true, sort from highest to lowest; otherwise lowest to highest.
 * @returns          - A new array of sorted semver strings.
 */
export function sortSemvers({
  versions,
  descending = false,
}: {
  versions: string[]
  descending?: boolean
}): string[] {
  // Use a shallow copy so we don’t mutate the original array
  const sorted = [...versions].sort(
    descending ? semver.rcompare : semver.compare,
  )
  return sorted
}

/**
 * Find the semver that immediately precedes `target` in the given list.
 *
 * @param versions  - An array of valid semver strings (cleaned, may include prerelease/build).
 * @param target    - The version whose predecessor you want to find.
 * @returns         - The semver immediately below `target`, or `null` if `target` is not in the list
 *                    or if it’s the smallest version.
 */
export function findPreviousVersion(
  versions: string[],
  target: string,
): string | null {
  const sorted = sortSemvers({ versions, descending: true })

  // 2) Scan for the first version < target
  for (const v of sorted) {
    if (semver.compare(v, target) < 0) {
      return v
    }
  }

  // 3) If we never found one, there is no predecessor
  return null
}
