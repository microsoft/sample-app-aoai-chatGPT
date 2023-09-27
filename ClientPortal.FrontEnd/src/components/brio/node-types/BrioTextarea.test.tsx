import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioTextarea } from './BrioTextarea'

describe('BrioTextarea', () => {
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
            <BrioTextarea id="component-id" />
            <button type="submit" />
          </BrioForm>
        </BrioFormContextProvider>
      </DuploProvider>,
    ))
  })

  test('renders', () => {
    const component = container.querySelector('textarea')

    expect(component).toBeTruthy()
  })

  test('updates value', () => {
    const component = container.querySelector('textarea')

    expect(component?.textContent).toBe('')

    fireEvent.input(component!, {
      target: { value: 'updated value' },
    })

    expect(component?.textContent).toBe('updated value')
  })

  test('is connected to form provider', async () => {
    const component = container.querySelector('textarea')

    fireEvent.input(component!, {
      target: { value: 'updated value' },
    })

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': 'updated value' })
  })
})
