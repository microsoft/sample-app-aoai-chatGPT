import { cloneDeep } from 'lodash'

import { AskResponse, Citation } from '../../api' // Ensure this path matches the location of your types

import { enumerateCitations, parseAnswer, ParsedAnswer } from './AnswerParser' // Update the path accordingly

const sampleCitations: Citation[] = [
  {
    id: 'doc1',
    filepath: 'file1.pdf',
    part_index: undefined,
    content: '',
    title: null,
    url: null,
    metadata: null,
    chunk_id: null,
    reindex_id: null
  },
  {
    id: 'doc2',
    filepath: 'file1.pdf',
    part_index: undefined,
    content: '',
    title: null,
    url: null,
    metadata: null,
    chunk_id: null,
    reindex_id: null
  },
  {
    id: 'doc3',
    filepath: 'file2.pdf',
    part_index: undefined,
    content: '',
    title: null,
    url: null,
    metadata: null,
    chunk_id: null,
    reindex_id: null
  }
]

const sampleAnswer: AskResponse = {
  answer: 'This is an example answer with citations [doc1] and [doc2].',
  citations: cloneDeep(sampleCitations),
  plotly_data: null
}

describe('enumerateCitations', () => {
  it('assigns unique part_index based on filepath', () => {
    const results = enumerateCitations(cloneDeep(sampleCitations))
    expect(results[0].part_index).toEqual(1)
    expect(results[1].part_index).toEqual(2)
    expect(results[2].part_index).toEqual(1)
  })
})

describe('parseAnswer', () => {
  it('reformats the answer text and reindexes citations', () => {
    const parsed: ParsedAnswer = parseAnswer(sampleAnswer)
    expect(parsed.markdownFormatText).toBe('This is an example answer with citations  ^1^  and  ^2^ .')
    expect(parsed.citations.length).toBe(2)
    expect(parsed.citations[0].id).toBe('1')
    expect(parsed.citations[0].reindex_id).toBe('1')
    expect(parsed.citations[1].id).toBe('2')
    expect(parsed.citations[1].reindex_id).toBe('2')
    expect(parsed.citations[0].part_index).toBe(1)
    expect(parsed.citations[1].part_index).toBe(2)
  })
})
