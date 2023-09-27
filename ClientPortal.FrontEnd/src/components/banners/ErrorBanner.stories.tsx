import { ComponentMeta, ComponentStory } from '@storybook/react'
import { AxiosError } from 'axios'
import { ErrorBanner } from './ErrorBanner'

export default {
  title: 'Banners/ErrorBanner',
  component: ErrorBanner,
  argTypes: {},
  args: {
    error: new Error('This is the displayed error message'),
  },
} as ComponentMeta<typeof ErrorBanner>

const Template: ComponentStory<typeof ErrorBanner> = args => <ErrorBanner {...args} />

export const Default = Template.bind({})
Default.args = {}

export const With400 = Template.bind({})
With400.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 400,
  } as any),
}

export const With401 = Template.bind({})
With401.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 401,
  } as any),
}

export const With403 = Template.bind({})
With403.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 403,
  } as any),
}

export const With500 = Template.bind({})
With500.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 500,
  } as any),
}

export const With503 = Template.bind({})
With503.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 503,
  } as any),
}

export const With504 = Template.bind({})
With504.args = {
  error: new AxiosError('message', 'code', {} as any, {}, {
    status: 504,
  } as any),
}

export const WithParsed = Template.bind({})
WithParsed.args = {
  error: new AxiosError('parsed title', 'code', {} as any, {}, {
    data: JSON.stringify({ detail: 'parsed description' }),
    status: 499,
  } as any),
}
