import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioNumber } from './BrioNumber'

describe('BrioNumber', () => {
  let container: HTMLElement
  let submit: any

  beforeEach(() => {
    ;({ container } = render(
      <DuploProvider>
        <BrioFormContextProvider>
          <BrioForm
            onSubmit={values => {
              submit = values
            }}
          >
            <BrioNumber id="component-id" />
            <button type="submit" />
          </BrioForm>
        </BrioFormContextProvider>
      </DuploProvider>,
    ))
  })

  test('renders', () => {
    const component = container.querySelector('input[name=component-id]')

    expect(component).toBeTruthy()
  })

  test('updates value', () => {
    const component = container.querySelector('input')

    expect(component?.attributes.getNamedItem('value')?.value).toBe('')

    fireEvent.input(component!, {
      target: { value: '123' },
    })

    expect(component?.attributes.getNamedItem('value')?.value).toBe('123')
  })

  test('is connected to form provider', async () => {
    const component = container.querySelector('input')

    fireEvent.input(component!, {
      target: { value: '123' },
    })

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': 123 })
  })
})
