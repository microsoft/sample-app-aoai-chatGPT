import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioRadioButtons } from './BrioRadioButtons'

describe('BrioRadioButtons', () => {
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
            <BrioRadioButtons
              id="component-id"
              options={[
                { id: 'one', text: 'one' },
                { id: 'two', text: 'two' },
                { id: 'three', text: 'three' },
              ]}
            />
            <button type="submit" />
          </BrioForm>
        </BrioFormContextProvider>
      </DuploProvider>,
    ))
  })

  test('renders', () => {
    const [component] = container.querySelectorAll('input[name=component-id]')

    expect(component).toBeTruthy()
  })

  test('can be clicked', () => {
    const [one, two, three] = container.querySelectorAll('input')

    expect(one?.attributes.getNamedItem('value')?.value).toBe('one')
    expect(two?.attributes.getNamedItem('value')?.value).toBe('two')
    expect(three?.attributes.getNamedItem('value')?.value).toBe('three')

    fireEvent.click(one!)
    fireEvent.click(two!)
    fireEvent.click(three!)
  })

  test('is connected to form provider', async () => {
    const [one] = container.querySelectorAll('input')

    fireEvent.click(one!)

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': 'one' })
  })
})
