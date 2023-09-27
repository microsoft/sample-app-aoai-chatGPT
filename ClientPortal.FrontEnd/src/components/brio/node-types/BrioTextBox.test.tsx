import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioTextBox } from './BrioTextBox'

describe('BrioTextBox', () => {
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
            <BrioTextBox id="component-id" />
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
      target: { value: 'updated value' },
    })

    expect(component?.attributes.getNamedItem('value')?.value).toBe('updated value')
  })

  test('is connected to form provider', async () => {
    const component = container.querySelector('input')

    fireEvent.input(component!, {
      target: { value: 'updated value' },
    })

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': 'updated value' })
  })
})
