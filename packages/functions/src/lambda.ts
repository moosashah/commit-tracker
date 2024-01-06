import fetch from 'node-fetch'
import { Octokit } from '@octokit/core'
import { Config } from 'sst/node/config'

const headers = {
  'X-GitHub-Api-Version': '2022-11-28',
}
const owner = 'moosashah'
const repo = 'commit-tracker'
const tok = Config.GITHUB_TOKEN

interface Res {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: Array<{
            contributionDays: Array<{
              contributionCount: number
              color: string
              date: string
            }>
          }>
        }
      }
    }
  }
}

const octokit = new Octokit({
  auth: tok,
})

export const handler = async () => {
  const contributions = await getContributions()
  if (!contributions) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching contributions' }),
    }
  }
  const today = getTodaysContributions(contributions)
  if (!today) {
    await addDateToReadme()
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'added date to readme' }),
    }
  }
  const response = `We have ${today} contributions today!`
  return {
    statusCode: 200,
    body: JSON.stringify({ message: response }),
  }
}

const getContributions = async () => {
  const query = `
query {
  user(login: "moosashah") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays{ 
          contributionCount
            date
          }
        }
      }
    }
  }
}    `
  const opts = {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `bearer ${tok}`,
    },
  }
  try {
    return await fetch('https://api.github.com/graphql', opts).then(
      async (res) => {
        if (res.ok) {
          const data = await res.json()
          return data as Promise<Res>
        }
        console.log('res not okay')
        return null
      }
    )
  } catch (error) {
    console.error('error')
    console.error(error)
    return null
  }
}
const getTodaysContributions = (contributions: Res) => {
  const { weeks } =
    contributions.data.user.contributionsCollection.contributionCalendar
  const todayDate = new Date().toISOString().split('T')[0]
  let today
  for (const week of weeks) {
    const day = week.contributionDays.find((day) => day.date === todayDate)
    if (day) {
      today = day
      break
    }
  }
  return today?.contributionCount || 0
}
const getReadme = async () => {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/readme', {
    owner,
    repo,
    headers,
  })
  const currentReadmeContent = Buffer.from(data.content, 'base64').toString()
  return { currentReadmeContent, sha: data.sha }
}

const addDateToReadme = async () => {
  const { currentReadmeContent, sha } = await getReadme()
  const input = () =>
    new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })

  const content = Buffer.from(
    `${currentReadmeContent} \n 1. ${input()}`
  ).toString('base64')

  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: 'README.md',
    message: `no coding on ${input()}`,
    sha,
    content,
    headers,
  })
}
