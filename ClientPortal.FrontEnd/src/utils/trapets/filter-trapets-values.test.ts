import { FieldValues } from 'react-hook-form'
import { BrioNode } from '../../types'
import { filterTrapetsValues } from './filter-trapets-values'

describe('filterTrapetsValues', () => {
  let subNodes: BrioNode[]
  let values: FieldValues

  beforeEach(() => {
    subNodes = [
      {
        id: 'one',
        nodeType: 'CheckBox',
      },
      {
        id: 'two',
        nodeType: 'RadioButtons',
      },
      {
        id: 'three',
        nodeType: 'TextArea',
      },
      {
        id: 'four',
        nodeType: 'IntPositive',
      },
      {
        id: 'five',
        nodeType: 'TextBox',
      },
      {
        id: 'eight',
        nodeType: 'CheckBoxMulti',
      },
      {
        id: 'div',
        nodeType: 'Div',
        subNodes: [
          {
            id: 'nine',
            nodeType: 'TextArea',
          },
          {
            id: 'div',
            nodeType: 'Div',
            subNodes: [
              {
                id: 'ten',
                nodeType: 'TextArea',
              },
              {
                id: 'div',
                nodeType: 'Div',
                subNodes: [
                  {
                    id: 'eleven',
                    nodeType: 'TextArea',
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    values = {
      one: 'one',
      two: 'two',
      three: 'three',
      four: 'four',
      five: 'five',
      six: 'six',
      seven: 'seven',
      nine: 'nine',
      ten: 'ten',
      eleven: 'eleven',
    }
  })

  test('should resolve', () => {
    expect(filterTrapetsValues(values, subNodes)).toStrictEqual({
      one: 'one',
      two: 'two',
      three: 'three',
      four: 'four',
      five: 'five',
      nine: 'nine',
      ten: 'ten',
      eleven: 'eleven',
    })
  })
})
