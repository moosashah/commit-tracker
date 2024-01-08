import { Cron, StackContext, Config } from 'sst/constructs'

export function cron({ stack }: StackContext) {
  const GITHUB_TOKEN = new Config.Secret(stack, 'GITHUB_TOKEN')
  new Cron(stack, 'Cron', {
    schedule: 'cron(30 23 * * ? *)',
    job: {
      function: {
        handler: 'packages/functions/src/lambda.handler',
        bind: [GITHUB_TOKEN],
      },
    },
  })
}
