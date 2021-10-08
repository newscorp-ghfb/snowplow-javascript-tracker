exports.config = {
  specs: ['./test/integration/youtube.test.ts'],
  logLevel: 'warn',
  baseUrl: 'http://snowplow-js-tracker.local:8080',
  waitforTimeout: 30000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  specFileRetries: 1,
  framework: 'jasmine',
  reporters: ['spec'],
  truncateThreshold: 100000,
  jasmineNodeOpts: {
    defaultTimeoutInterval: 120000,
    isVerbose: true,
  },
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [],
      },
    },
  ],
  specFileRetries: 0,
  logLevel: 'error',
  bail: 1,
  services: [
    ['chromedriver', {}],
    [
      'static-server',
      {
        folders: [{ mount: '/', path: './test/pages' }],
        port: 8080,
      },
    ],
  ],
};
