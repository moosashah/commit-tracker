import { SSTConfig } from 'sst'
import { cron } from './stacks/cron'

export default {
  config(_input) {
    return {
      name: 'commit-tracker',
      region: 'us-east-1',
    }
  },
  stacks(app) {
    app.stack(cron)
  },
} satisfies SSTConfig
