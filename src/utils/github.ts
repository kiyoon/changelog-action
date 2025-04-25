import type * as github from "@actions/github"

export async function getAllTags({
  gh,
  owner,
  repo,
  prefix = "",
}: {
  gh: ReturnType<typeof github.getOctokit>
  owner: string
  repo: string
  prefix?: string
}): Promise<string[]> {
  const allNames: string[] = []
  let hasNextPage = true
  let afterCursor: string | null = null

  while (hasNextPage) {
    const resp = await gh.graphql(
      `
      query($owner: String!, $repo: String!, $prefix: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          refs(
            first: 100
            refPrefix: "refs/tags/"
            query: $prefix
            orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
            after: $after
          ) {
            nodes { name }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
      {
        owner,
        repo,
        prefix, // even though we have a query field to filter, it returns all tags that contains the prefix
        after: afterCursor,
      },
    )

    const { nodes, pageInfo } = resp.repository.refs

    // The query field doesn't filter based on the prefix, so we need to filter it ourselves
    // Only keep tags that truly start with our prefix (e.g. "v")
    allNames.push(
      ...nodes.map(n => n.name).filter(name => name.startsWith(prefix)),
    )

    hasNextPage = pageInfo.hasNextPage
    afterCursor = pageInfo.endCursor
  }

  return allNames
}

interface CommitNode {
  oid: string
  messageHeadline: string
  committedDate: string
}

interface HistoryPage {
  repository: {
    ref: {
      target: {
        history: {
          nodes: CommitNode[]
          pageInfo: {
            hasNextPage: boolean
            endCursor: string | null
          }
        }
      } | null
    } | null
  }
}

interface GetInitialCommitParams {
  gh: ReturnType<typeof github.getOctokit>
  owner: string
  repo: string
  // which branch to walk (defaults to "refs/heads/main")
  branchRef?: string
}

/**
 * Walks the commit history on a branch in forward‐pages of 100
 * until no more pages remain, returning the oldest commit seen.
 */
export async function getInitialCommit({
  gh,
  owner,
  repo,
  branchRef = "refs/heads/main",
}: GetInitialCommitParams): Promise<CommitNode | null> {
  const QUERY = /* GraphQL */ `
    query historyPage(
      $owner: String!
      $repo:  String!
      $branch: String!
      $after:  String
    ) {
      repository(owner: $owner, name: $repo) {
        ref(qualifiedName: $branch) {
          target {
            ... on Commit {
              history(first: 100, after: $after) {
                nodes {
                  oid
                  messageHeadline
                  committedDate
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      }
    }
  `

  let after: string | null = null
  let oldest: CommitNode | null = null

  while (true) {
    const data = await gh.graphql<HistoryPage>(QUERY, {
      owner,
      repo,
      branch: branchRef,
      after,
    })

    const history = data.repository.ref?.target?.history
    if (!history) {
      // branch doesn't exist or no commits
      return null
    }

    // remember the last node in this page
    if (history.nodes.length > 0) {
      oldest = history.nodes[history.nodes.length - 1]
    }

    if (!history.pageInfo.hasNextPage) {
      // we've reached the very first commit
      break
    }

    // move forward
    after = history.pageInfo.endCursor
  }

  return oldest
}

interface DefaultBranchResponse {
  repository: {
    defaultBranchRef: {
      name: string
    } | null
  }
}

interface GetDefaultBranchParams {
  gh: ReturnType<typeof github.getOctokit>
  owner: string
  repo: string
}

/**
 * Retrieves the default branch name of a GitHub repository.
 *
 * @param params
 *  - gh:    an authenticated Octokit instance (`github.getOctokit(token)`)
 *  - owner: repository owner
 *  - repo:  repository name
 * @returns     the default branch name (e.g. "main" or "master"), or `null` if not found
 */
export async function getDefaultBranchName({
  gh,
  owner,
  repo,
}: GetDefaultBranchParams): Promise<string | null> {
  const QUERY = /* GraphQL */ `
    query defaultBranch($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          name
        }
      }
    }
  `

  const data = await gh.graphql<DefaultBranchResponse>(QUERY, {
    owner,
    repo,
  })

  return data.repository.defaultBranchRef?.name ?? null
}

// 1) Grab the raw “compareCommitsWithBasehead” response type
type CompareResponse = Awaited<
  ReturnType<
    ReturnType<
      typeof github.getOctokit
    >["rest"]["repos"]["compareCommitsWithBasehead"]
  >
>

// 2) Extract just the `.data.commits` array type
export type CommitsBetweenRefs = CompareResponse["data"]["commits"]

export async function getCommitsBetweenRefs({
  baseRef,
  headRef,
  gh,
  owner,
  repo,
  includeBase = false,
}: {
  baseRef: string
  headRef: string
  gh: ReturnType<typeof github.getOctokit>
  owner: string
  repo: string
  includeBase?: boolean // if true, prepend the baseRef commit itself
}): Promise<CommitsBetweenRefs | null> {
  let curPage = 0
  let totalCommits = 0
  let hasMoreCommits = false
  const commits: CommitsBetweenRefs = []

  // Optionally fetch and include the baseRef commit itself
  if (includeBase) {
    const { data: baseCommit } = await gh.rest.repos.getCommit({
      owner,
      repo,
      ref: baseRef,
    })
    commits.push(baseCommit)
  }

  do {
    hasMoreCommits = false
    curPage++
    const commitsRaw = await gh.rest.repos.compareCommitsWithBasehead({
      owner: owner,
      repo: repo,
      basehead: `${baseRef}...${headRef}`,
      page: curPage,
      per_page: 100,
    })
    // totalCommits = _.get(commitsRaw, "data.total_commits", 0)
    totalCommits = commitsRaw.data?.total_commits ?? 0
    // const rangeCommits = _.get(commitsRaw, "data.commits", [])
    const rangeCommits = commitsRaw.data?.commits ?? []
    commits.push(...rangeCommits)
    if ((curPage - 1) * 100 + rangeCommits.length < totalCommits) {
      hasMoreCommits = true
    }
  } while (hasMoreCommits)

  if (!commits || commits.length === 0) {
    // no commits found
    return null
  }

  return commits
}
