import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioCheckboxMulti } from './BrioCheckboxMulti'

describe('BrioCheckboxMulti', () => {
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
            <BrioCheckboxMulti
              id="component-id"
              options={[
                { id: 'one', text: 'one' },
                { id: 'two', text: 'two' },
              ]}
            />
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

  test('updates values', () => {
    const [one, two] = container.querySelectorAll('input')

    expect(one?.attributes.getNamedItem('value')?.value).toBe('')

    fireEvent.click(one!)
    fireEvent.click(two!)

    expect(one?.attributes.getNamedItem('value')?.value).toBe('one,two')
  })

  test('is connected to form provider', async () => {
    const [one, two] = container.querySelectorAll('input')

    fireEvent.click(one!)
    fireEvent.click(two!)

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': ['one', 'two'] })
  })
})
