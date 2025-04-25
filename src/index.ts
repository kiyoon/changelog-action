import assert from "node:assert/strict"
import fs from "node:fs"
import process from "node:process"
import { setTimeout } from "node:timers/promises"
import * as core from "@actions/core"
import * as github from "@actions/github"
import cc from "@conventional-commits/parser"

import {
  getAllTags,
  getCommitsBetweenRefs,
  getDefaultBranchName,
  getInitialCommit,
} from "@/utils/github.ts"
import { cleanAndFilterVersions, findPreviousVersion } from "@/utils/semver.ts"
import { intersection } from "@/utils/set.ts"

const githubServerUrl = process.env.GITHUB_SERVER_URL || "https://github.com"

const allTypes = [
  { types: ["feat", "feature"], header: "New Features", icon: ":sparkles:" },
  {
    types: ["fix", "bugfix"],
    header: "Bug Fixes",
    icon: ":bug:",
    relIssuePrefix: "fixes",
  },
  { types: ["perf"], header: "Performance Improvements", icon: ":zap:" },
  { types: ["refactor"], header: "Refactors", icon: ":recycle:" },
  { types: ["test", "tests"], header: "Tests", icon: ":white_check_mark:" },
  {
    types: ["build", "ci"],
    header: "Build System",
    icon: ":construction_worker:",
  },
  { types: ["doc", "docs"], header: "Documentation Changes", icon: ":memo:" },
  { types: ["style"], header: "Code Style Changes", icon: ":art:" },
  { types: ["chore"], header: "Chores", icon: ":wrench:" },
  { types: ["other"], header: "Other Changes", icon: ":flying_saucer:" },
]

const rePrId = /#([0-9]+)/g
const rePrEnding = /\(#([0-9]+)\)$/

interface BuildSubjectProps {
  writeToFile: boolean
  subject: string
  author?: string
  authorUrl?: string
  owner: string
  repo: string
}

function buildSubject({
  writeToFile,
  subject,
  author,
  authorUrl,
  owner,
  repo,
}: BuildSubjectProps) {
  const hasPR = rePrEnding.test(subject)
  const prs: string[] = []
  let output = subject
  if (writeToFile) {
    const authorLine = author ? ` by [@${author}](${authorUrl})` : ""
    if (hasPR) {
      const prMatch = subject.match(rePrEnding)
      assert(prMatch !== null)
      const msgOnly = subject.slice(0, prMatch[0].length * -1)
      output = msgOnly.replace(rePrId, (m, prId) => {
        prs.push(prId)
        return `[#${prId}](${githubServerUrl}/${owner}/${repo}/pull/${prId})`
      })
      output += `*(PR [#${prMatch[1]}](${githubServerUrl}/${owner}/${repo}/pull/${prMatch[1]})${authorLine})*`
    } else {
      output = subject.replace(rePrId, (m, prId) => {
        return `[#${prId}](${githubServerUrl}/${owner}/${repo}/pull/${prId})`
      })
      if (author) {
        output += ` *(commit by [@${author}](${authorUrl}))*`
      }
    }
  } else {
    if (hasPR) {
      output = subject.replace(rePrEnding, (m, prId) => {
        prs.push(prId)
        return author ? `*(PR #${prId} by @${author})*` : `*(PR #${prId})*`
      })
    } else {
      output = author ? `${subject} *(commit by @${author})*` : subject
    }
  }
  return {
    output,
    prs,
  }
}

async function main() {
  const token = core.getInput("token")
  const newVersionTagForFuture = core.getInput("new-version-tag-for-future")
  const newVersionRef = core.getInput("new-version-ref")
  const previousVersionTag = core.getInput("previous-version-tag")
  const tagPrefix = core.getInput("tag-prefix")
  // const tag = core.getInput("tag")
  // const fromTag = core.getInput("fromTag")
  // const toTag = core.getInput("toTag")
  const excludeTypes = (core.getInput("exclude-types") || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t)
  const excludeScopes = (core.getInput("exclude-scopes") || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t)
  const restrictToTypes = (core.getInput("restrict-to-types") || "")
    .split(",")
    .map(t => t.trim())
    .filter(t => t)
  const writeToFile = core.getBooleanInput("write-to-file")
  const changelogFilePath = core.getInput("changelog-file-path")
  const includeRefIssues = core.getBooleanInput("include-ref-issues")
  const useGitmojis = core.getBooleanInput("use-gitmojis")
  const includeInvalidCommits = core.getBooleanInput("include-invalid-commits")
  const reverseOrder = core.getBooleanInput("reverse-order")
  const gh = github.getOctokit(token)
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const currentISODate = new Date().toISOString().substring(0, 10)

  let includePreviousTag = false
  let previousVersionRef: string | null = previousVersionTag
  // If previousVersionTag is not set, infer.
  // 1. Get all tags and find the previous version based on the newVersionTagForFuture.
  // 2. initial commit of the default branch
  if (!previousVersionRef) {
    core.info(
      "previous-version-tag not set. Automatically determining from the tag.",
    )

    const allTags = await getAllTags({
      gh,
      owner,
      repo,
      prefix: tagPrefix,
    })

    // Remove "v" prefix and ignore all tags that are not semvar format
    const cleanedTags = cleanAndFilterVersions(allTags, tagPrefix)
    previousVersionRef = findPreviousVersion(
      cleanedTags,
      newVersionTagForFuture,
    )
    // add the "v" again
    if (previousVersionRef) {
      previousVersionRef = `${tagPrefix}${previousVersionRef}`
    }
  }

  if (!previousVersionRef) {
    core.info(
      "Previous tag not found. Searching from the initial commit of the default branch...",
    )
    const defaultBranch = await getDefaultBranchName({
      gh,
      owner,
      repo,
    })
    const initialCommit = await getInitialCommit({
      gh,
      owner,
      repo,
      branchRef: `refs/heads/${defaultBranch}`,
    })

    const oid = initialCommit?.oid
    if (!oid) {
      core.setFailed(
        "Couldn't find the initial commit. Make sure you have an existing commit or a previous tag.",
      )
      return
    }

    previousVersionRef = oid
    // Don't skip initial commit message.
    includePreviousTag = true
  }

  assert(previousVersionRef !== null, "previousVersionRef should not be null")

  core.info(`New version tag will be named as: ${newVersionTagForFuture}`)
  core.info(`Assuming the new version ref is: ${newVersionRef}`)
  core.info(`Using previous tag or ref: ${previousVersionRef}`)

  // GET COMMITS
  const commits = await getCommitsBetweenRefs({
    baseRef: previousVersionRef,
    headRef: newVersionRef,
    gh,
    owner,
    repo,
    includeBase: includePreviousTag,
  })

  if (!commits) {
    return
  }

  // PARSE COMMITS
  const commitsParsed = []
  const breakingChanges = []
  for (const commit of commits) {
    try {
      const cAst = cc.toConventionalChangelogFormat(
        cc.parser(commit.commit.message),
      )
      commitsParsed.push({
        ...cAst,
        type: cAst.type.toLowerCase(),
        sha: commit.sha,
        url: commit.html_url,
        // author: _.get(commit, "author.login"),
        // authorUrl: _.get(commit, "author.html_url"),
        author: commit.author?.login,
        authorUrl: commit.author?.html_url,
      })
      for (const note of cAst.notes) {
        if (note.title === "BREAKING CHANGE") {
          breakingChanges.push({
            sha: commit.sha,
            url: commit.html_url,
            subject: cAst.subject,
            // author: _.get(commit, "author.login"),
            // authorUrl: _.get(commit, "author.html_url"),
            author: commit.author?.login,
            authorUrl: commit.author?.html_url,
            text: note.text,
          })
        }
      }
      core.info(
        `[OK] Commit ${commit.sha} of type ${cAst.type} - ${cAst.subject}`,
      )
    } catch (err) {
      if (includeInvalidCommits) {
        commitsParsed.push({
          type: "other",
          subject: commit.commit.message,
          sha: commit.sha,
          url: commit.html_url,
          // author: _.get(commit, "author.login"),
          // authorUrl: _.get(commit, "author.html_url"),
          author: commit.author?.login,
          authorUrl: commit.author?.html_url,
        })
        core.info(
          `[OK] Commit ${commit.sha} with invalid type, falling back to other - ${commit.commit.message}`,
        )
      } else {
        core.info(
          `[INVALID] Skipping commit ${commit.sha} as it doesn't follow conventional commit format.`,
        )
      }
    }
  }

  if (commitsParsed.length === 0) {
    return core.setFailed("No valid commits parsed since previous tag.")
  }

  if (reverseOrder) {
    commitsParsed.reverse()
  }

  // BUILD CHANGELOG

  const changesFile = []
  const changesVar = []
  let idx = 0

  // -> Handle breaking changes
  if (breakingChanges.length > 0) {
    changesFile.push(
      useGitmojis ? "### :boom: BREAKING CHANGES" : "### BREAKING CHANGES",
    )
    changesVar.push(
      useGitmojis ? "### :boom: BREAKING CHANGES" : "### BREAKING CHANGES",
    )
    for (const breakChange of breakingChanges) {
      const body = breakChange.text
        .split("\n")
        .map(ln => `  ${ln}`)
        .join("  \n")
      const subjectFile = buildSubject({
        writeToFile: true,
        subject: breakChange.subject,
        author: breakChange.author,
        authorUrl: breakChange.authorUrl,
        owner,
        repo,
      })
      const subjectVar = buildSubject({
        writeToFile: false,
        subject: breakChange.subject,
        author: breakChange.author,
        authorUrl: breakChange.authorUrl,
        owner,
        repo,
      })
      changesFile.push(
        `- due to [\`${breakChange.sha.substring(0, 7)}\`](${breakChange.url}) - ${subjectFile.output}:\n\n${body}\n`,
      )
      changesVar.push(
        `- due to [\`${breakChange.sha.substring(0, 7)}\`](${breakChange.url}) - ${subjectVar.output}:\n\n${body}\n`,
      )
    }
    idx++
  }

  // -> Filter types
  const types = []
  for (const type of allTypes) {
    if (restrictToTypes.length > 0) {
      if (intersection(type.types, restrictToTypes).length > 0) {
        types.push(type)
      }
    } else {
      if (intersection(type.types, excludeTypes).length === 0) {
        types.push(type)
      }
    }
  }
  core.info(`Selected Types: ${types.map(t => t.types.join(", ")).join(", ")}`)

  // -> Group commits by type
  for (const type of types) {
    const matchingCommits = commitsParsed.filter(c =>
      type.types.includes(c.type),
    )
    if (matchingCommits.length === 0) {
      continue
    }
    if (idx > 0) {
      changesFile.push("")
      changesVar.push("")
    }
    changesFile.push(
      useGitmojis ? `### ${type.icon} ${type.header}` : `### ${type.header}`,
    )
    changesVar.push(
      useGitmojis ? `### ${type.icon} ${type.header}` : `### ${type.header}`,
    )

    const relIssuePrefix = type.relIssuePrefix || "addresses"

    for (const commit of matchingCommits) {
      if (excludeScopes.length > 0 && excludeScopes.includes(commit.scope)) {
        continue
      }
      const scope = commit.scope ? `**${commit.scope}**: ` : ""
      const subjectFile = buildSubject({
        writeToFile: true,
        subject: commit.subject,
        author: commit.author,
        authorUrl: commit.authorUrl,
        owner,
        repo,
      })
      const subjectVar = buildSubject({
        writeToFile: false,
        subject: commit.subject,
        author: commit.author,
        authorUrl: commit.authorUrl,
        owner,
        repo,
      })
      changesFile.push(
        `- [\`${commit.sha.substring(0, 7)}\`](${commit.url}) - ${scope}${subjectFile.output}`,
      )
      changesVar.push(
        `- [\`${commit.sha.substring(0, 7)}\`](${commit.url}) - ${scope}${subjectVar.output}`,
      )

      if (includeRefIssues && subjectVar.prs.length > 0) {
        for (const prId of subjectVar.prs) {
          core.info(`Querying related issues for PR ${prId}...`)
          await setTimeout(500) // Make sure we don't go over GitHub API rate limits
          try {
            const issuesRaw = await gh.graphql(
              `
              query relIssues ($owner: String!, $repo: String!, $prId: Int!) {
                repository (owner: $owner, name: $repo) {
                  pullRequest(number: $prId) {
                    closingIssuesReferences(first: 50) {
                      nodes {
                        number
                        url
                        author {
                          login
                          url
                        }
                      }
                    }
                  }
                }
              }
            `,
              {
                owner,
                repo,
                prId: Number.parseInt(prId),
              },
            )
            const relIssues =
              issuesRaw.repository.pullRequest.closingIssuesReferences.nodes

            for (const relIssue of relIssues) {
              const authorLogin = relIssue.author?.login
              if (authorLogin) {
                changesFile.push(
                  `  - :arrow_lower_right: *${relIssuePrefix} issue [#${relIssue.number}](${relIssue.url}) opened by [@${authorLogin}](${relIssue.author.url})*`,
                )
                changesVar.push(
                  `  - :arrow_lower_right: *${relIssuePrefix} issue #${relIssue.number} opened by @${authorLogin}*`,
                )
              } else {
                changesFile.push(
                  `  - :arrow_lower_right: *${relIssuePrefix} issue [#${relIssue.number}](${relIssue.url})*`,
                )
                changesVar.push(
                  `  - :arrow_lower_right: *${relIssuePrefix} issue #${relIssue.number}*`,
                )
              }
            }
          } catch (err) {
            core.warning(
              `Failed to query issues related to PR ${prId}. Skipping.`,
            )
          }
        }
      }
    }
    idx++
  }

  if (changesFile.length > 0) {
    changesFile.push("")
    changesVar.push("")
  } else {
    return core.warning(
      "Nothing to add to changelog because of excluded types.",
    )
  }

  core.setOutput("changes", changesVar.join("\n"))

  if (!writeToFile) {
    return
  }

  // PARSE EXISTING CHANGELOG

  let chglog = ""
  try {
    chglog = await fs.promises.readFile(changelogFilePath, "utf8")
  } catch (err) {
    core.info(`Couldn\'t find a ${changelogFilePath}, creating a new one...`)
    chglog = `# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`
  }

  // UPDATE CHANGELOG CONTENTS

  const lines = chglog.replace(/\r/g, "").split("\n")
  let firstVersionLine = lines.findIndex(l => l.startsWith("## "))

  if (
    firstVersionLine >= 0 &&
    lines[firstVersionLine].startsWith(`## [${newVersionTagForFuture}`)
  ) {
    return core.notice(
      "This version already exists in the CHANGELOG! No change will be made to the CHANGELOG.",
    )
  }

  if (firstVersionLine < 0) {
    firstVersionLine = lines.length
  }

  let output = ""
  if (firstVersionLine > 0) {
    output += `${lines.slice(0, firstVersionLine).join("\n")}\n`
  }
  output += `## [${newVersionTagForFuture}] - ${currentISODate}\n${changesFile.join("\n")}\n`
  if (firstVersionLine < lines.length) {
    output += `\n${lines.slice(firstVersionLine).join("\n")}`
  }

  // add newline character at end of output if it doesn't already exists
  if (!output.endsWith("\n")) {
    output += "\n"
  }
  output += `[${newVersionTagForFuture}]: ${githubServerUrl}/${owner}/${repo}/compare/${previousVersionRef}...${newVersionTagForFuture}\n`

  // WRITE CHANGELOG TO FILE

  await fs.promises.writeFile(changelogFilePath, output)
}

main()
