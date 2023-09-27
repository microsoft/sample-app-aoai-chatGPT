const react = require('@vitejs/plugin-react-swc')

module.exports = {
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-react-i18next',
  ],
  core: {
    builder: '@storybook/builder-vite',
  },
  features: {
    storyStoreV7: true,
  },
  framework: '@storybook/react',
  staticDirs: ['../public', '../node_modules/@carnegie/duplo/public'],
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  // https://github.com/storybookjs/builder-vite/issues/210
  viteFinal: async config => {
    config.plugins = config.plugins.filter(
      plugin => !(Array.isArray(plugin) && plugin[0]?.name.includes('vite:react')),
    )
    config.plugins.push(
      react({
        exclude: [/\.stories\.(t|j)sx?$/, /node_modules/],
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
    )
    return config
  },
}
