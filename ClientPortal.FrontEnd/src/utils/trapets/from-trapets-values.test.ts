import { convertSubnodes } from './from-trapets-values'

describe('fromTrapetsValues', () => {
  test('should resolve checkbox', () => {
    expect(
      convertSubnodes([
        {
          id: 'one',
          nodeType: 'CheckBox',
          value: 'True',
        },
        {
          id: 'two',
          nodeType: 'CheckBox',
          value: 'False',
        },
        {
          id: 'three',
          nodeType: 'CheckBox',
        },
      ]),
    ).toStrictEqual([
      {
        id: 'one',
        nodeType: 'CheckBox',
        value: true,
      },
      {
        id: 'two',
        nodeType: 'CheckBox',
        value: false,
      },
      {
        id: 'three',
        nodeType: 'CheckBox',
        value: null,
      },
    ])
  })

  test('should resolve decimal', () => {
    expect(
      convertSubnodes([
        {
          id: 'one',
          nodeType: 'Decimal',
          value: '0.123',
        },
        {
          id: 'two',
          nodeType: 'Decimal',
        },
      ]),
    ).toStrictEqual([
      {
        id: 'one',
        nodeType: 'Decimal',
        value: 0.123,
      },
      {
        id: 'two',
        nodeType: 'Decimal',
        value: null,
      },
    ])
  })

  test('should resolve integer', () => {
    expect(
      convertSubnodes([
        {
          id: 'one',
          nodeType: 'IntPositive',
          value: '123',
        },
        {
          id: 'two',
          nodeType: 'IntPositive',
        },
      ]),
    ).toStrictEqual([
      {
        id: 'one',
        nodeType: 'IntPositive',
        value: 123,
      },
      {
        id: 'two',
        nodeType: 'IntPositive',
        value: null,
      },
    ])
  })

  test('should resolve string', () => {
    expect(
      convertSubnodes([
        {
          id: 'one',
          nodeType: 'Date',
          value: 'date',
        },
        {
          id: 'two',
          nodeType: 'DropDownList',
          value: 'dropDownList',
        },
        {
          id: 'three',
          nodeType: 'RadioButtons',
          value: 'radioButtons',
        },
        {
          id: 'four',
          nodeType: 'TextArea',
          value: 'textArea',
        },
        {
          id: 'five',
          nodeType: 'TextBox',
          value: 'textBox',
        },
        {
          id: 'six',
          nodeType: 'TextBox',
        },
      ]),
    ).toStrictEqual([
      {
        id: 'one',
        nodeType: 'Date',
        value: 'date',
      },
      {
        id: 'two',
        nodeType: 'DropDownList',
        value: 'dropDownList',
      },
      {
        id: 'three',
        nodeType: 'RadioButtons',
        value: 'radioButtons',
      },
      {
        id: 'four',
        nodeType: 'TextArea',
        value: 'textArea',
      },
      {
        id: 'five',
        nodeType: 'TextBox',
        value: 'textBox',
      },
      {
        id: 'six',
        nodeType: 'TextBox',
        value: null,
      },
    ])
  })

  test('should resolve array', () => {
    expect(
      convertSubnodes([
        {
          id: 'one',
          nodeType: 'CheckBoxMulti',
          value: 'two;three;four',
        },
        {
          id: 'two',
          nodeType: 'DropDownListAddMore',
          value: 'five;six;seven',
        },
        {
          id: 'three',
          nodeType: 'DropDownListMulti',
          value: 'eight;nine;ten',
        },
        {
          id: 'four',
          nodeType: 'DropDownListMulti',
        },
      ]),
    ).toStrictEqual([
      {
        id: 'one',
        nodeType: 'CheckBoxMulti',
        value: ['two', 'three', 'four'],
      },
      {
        id: 'two',
        nodeType: 'DropDownListAddMore',
        value: ['five', 'six', 'seven'],
      },
      {
        id: 'three',
        nodeType: 'DropDownListMulti',
        value: ['eight', 'nine', 'ten'],
      },
      {
        id: 'four',
        nodeType: 'DropDownListMulti',
        value: [],
      },
    ])
  })

  describe('nested nodes', () => {
    test('should resolve', () => {
      expect(
        convertSubnodes([
          {
            id: 'one',
            nodeType: 'Div',
            subNodes: [
              {
                id: 'two',
                nodeType: 'Div',
                subNodes: [
                  {
                    id: 'three',
                    nodeType: 'CheckBox',
                    value: 'True',
                  },
                ],
              },
              {
                id: 'four',
                nodeType: 'IntPositive',
                value: '123',
              },
              {
                id: 'five',
                nodeType: 'Div',
                subNodes: [
                  {
                    id: 'six',
                    nodeType: 'DropDownListMulti',
                    value: 'seven;eight;nine',
                  },
                ],
              },
            ],
          },
        ]),
      ).toStrictEqual([
        {
          id: 'one',
          nodeType: 'Div',
          subNodes: [
            {
              id: 'two',
              nodeType: 'Div',
              subNodes: [
                {
                  id: 'three',
                  nodeType: 'CheckBox',
                  value: true,
                },
              ],
              value: null,
            },
            {
              id: 'four',
              nodeType: 'IntPositive',
              value: 123,
            },
            {
              id: 'five',
              nodeType: 'Div',
              subNodes: [
                {
                  id: 'six',
                  nodeType: 'DropDownListMulti',
                  value: ['seven', 'eight', 'nine'],
                },
              ],
              value: null,
            },
          ],
          value: null,
        },
      ])
    })
  })
})
