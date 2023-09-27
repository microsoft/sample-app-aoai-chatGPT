import { act, fireEvent, render } from '@testing-library/react'
import { DuploProvider } from '../../../context/app/duplo-provider'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioButtonSwitchYesNo } from './BrioButtonSwitchYesNo'

describe('BrioButtonSwitchYesNo', () => {
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
            <BrioButtonSwitchYesNo
              id="component-id"
              options={[
                { id: 'yes', text: 'yes' },
                { id: 'no', text: 'no' },
              ]}
            />
            <button type="submit" />
          </BrioForm>
        </BrioFormContextProvider>
      </DuploProvider>,
    ))
  })

  test('renders', () => {
    const [component] = container.querySelectorAll('button[type=button]')

    expect(component).toBeTruthy()
  })

  test('can be clicked', () => {
    const [yes, no] = container.querySelectorAll('button[type=button]')

    fireEvent.click(yes!)
    fireEvent.click(no!)
  })

  test('is connected to form provider', async () => {
    const [yes] = container.querySelectorAll('button[type=button]')

    fireEvent.click(yes!)

    await act(() => fireEvent.submit(container.querySelector('button[type=submit]')!))

    expect(submit).toStrictEqual({ 'component-id': 'yes' })
  })
})
