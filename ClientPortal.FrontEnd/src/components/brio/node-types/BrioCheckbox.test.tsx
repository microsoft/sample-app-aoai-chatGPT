import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioCheckbox } from './BrioCheckbox'

describe('BrioCheckbox', () => {
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
            <BrioCheckbox id="component-id" />
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

    fireEvent.click(component!)

    expect(component?.attributes.getNamedItem('value')?.value).toBe('true')
  })

  test('is connected to form provider', async () => {
    const component = container.querySelector('input')
    fireEvent.click(component!)

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': true })
  })
})
