import * as core from '@actions/core'
import * as github from '@actions/github'
import fetch from 'node-fetch'

function getInputs(): {repoToken: string; giphyToken: string} {
  const repoToken: string = core.getInput('repo-token')
  const giphyToken: string = core.getInput('giphy-token')

  return {
    repoToken,
    giphyToken
  }
}

async function pushComment(repoToken: string, comment: string): Promise<void> {
  const {
    payload: {pull_request: pullRequest, repository}
  } = github.context

  const repoFullName = repository?.full_name

  if (!pullRequest || !repoFullName) {
    core.error('this action only works on pull_request events')
    core.setOutput('comment-created', 'false')
  } else {
    const {number: issueNumber} = pullRequest

    const [owner, repo] = repoFullName.split('/')

    const octokit = new github.GitHub(repoToken)

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: comment
    })

    core.setOutput('comment-created', 'true')
  }
}

async function getGifUrl(token: string): Promise<string> {
  const res = await fetch(
    `http://api.giphy.com/v1/gifs/random?api_key=${token}`
  )

  const body = await res.json()
  return body.data.image_url
}
async function run(): Promise<void> {
  try {
    core.debug(`Initializing our action`)

    const {repoToken, giphyToken} = getInputs()
    const randomGifUrl = await getGifUrl(giphyToken)

    await pushComment(repoToken, `![](${randomGifUrl})`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
