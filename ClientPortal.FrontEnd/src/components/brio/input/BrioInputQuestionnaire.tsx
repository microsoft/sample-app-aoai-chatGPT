import { Flex, Segment, Spacer } from '@carnegie/duplo'
import { FC } from 'react'
import { FieldValues, SubmitHandler } from 'react-hook-form'
import { BrioNavigation, BrioNode, BrioRuleViolation } from '../../../types'
import { FormItem } from '../../form-list/FormList'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioClose } from '../navigation/BrioClose'
import { BrioNext } from '../navigation/BrioNext'
import { BrioPagination } from '../navigation/BrioPagination'
import { FormAwareBrioPrevious } from '../navigation/FormAwareBrioPrevious'
import { BrioInputFinalPage } from './BrioInputFinalPage'
import { BrioInputRootNode } from './BrioInputRootNode'

type Props = {
  debug?: boolean
  finalPageForms?: FormItem[]
  loading?: 'next' | 'previous' | null
  navigation: BrioNavigation
  ruleViolations?: BrioRuleViolation[]
  subNodes?: BrioNode[]
  onClose(): void
  onFinalPageInterval(): void
  onNext: SubmitHandler<FieldValues>
  onPrevious: SubmitHandler<FieldValues>
}

export const BrioInputQuestionnaire: FC<Props> = ({
  debug = false,
  finalPageForms = [],
  loading = null,
  navigation,
  ruleViolations = [],
  subNodes = [],
  onFinalPageInterval,
  onClose,
  onNext,
  onPrevious,
}) => {
  const isFormOngoing =
    (navigation.currentPage < navigation.totalPages || !!subNodes.length) && navigation.next.enabled
  return (
    <BrioFormContextProvider debug={debug}>
      <BrioForm onSubmit={onNext}>
        {isFormOngoing && (
          <Flex alignItems="center" justifyContent="space-between" pb={8}>
            <Flex width="33%" justifyContent="flex-start">
              <FormAwareBrioPrevious
                disabled={!!loading && loading !== 'previous'}
                hidden={!navigation.previous.enabled}
                loading={loading === 'previous'}
                onClick={onPrevious}
              />
            </Flex>
            {navigation.currentPage && navigation.totalPages && (
              <BrioPagination
                currentPage={navigation.currentPage}
                totalPages={navigation.totalPages}
              />
            )}
            <Flex width="33%" justifyContent="flex-end">
              <BrioClose disabled={!!loading} onClick={onClose} />
            </Flex>
          </Flex>
        )}

        {isFormOngoing ? (
          <Segment>
            <BrioInputRootNode
              debug={debug}
              gap={32}
              subNodes={subNodes}
              ruleViolations={ruleViolations}
            />
            <Spacer height={32} />
            <BrioNext
              disabled={!!loading && loading !== 'next'}
              hidden={!navigation.next.enabled}
              loading={loading === 'next'}
              text={navigation.next.text}
            />
          </Segment>
        ) : (
          <BrioInputFinalPage
            forms={finalPageForms}
            onClose={onClose}
            onInterval={onFinalPageInterval}
          />
        )}
      </BrioForm>
    </BrioFormContextProvider>
  )
}
