import React, { FunctionComponent } from 'react'

export type ParentFC<T = Record<string, unknown>> = FunctionComponent<
  T & {
    children?: React.ReactNode
  }
>
