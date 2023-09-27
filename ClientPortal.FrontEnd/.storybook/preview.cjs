import { DuploProvider } from '@carnegie/duplo'
import '@carnegie/duplo/lib/duplo.css'
import { Buffer } from 'buffer'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import i18n from './i18next.cjs'

window.Buffer = Buffer

// https://github.com/storybookjs/storybook/issues/14742#issuecomment-1013963235

export const decorators = [
  (Story, context) =>
    React.createElement(BrowserRouter, {
      children: [
        React.createElement(DuploProvider, {
          children: [React.createElement(Story, { ...context })],
        }),
      ],
    }),
]

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  date: new Date('2023-01-01'),
  i18n,
  locale: 'en',
  locales: {
    en: { title: 'English', left: '🇬🇧' },
    sv: { title: 'Svenska', left: '🇸🇪' },
  },
}
