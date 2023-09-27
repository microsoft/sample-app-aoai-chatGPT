import {
  Box,
  Checkbox,
  FlexCol,
  Heading6,
  Input,
  Segment,
  Select,
  SkeletonRect,
  Text,
} from '@carnegie/duplo'
import { FC, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBanks } from '../../hooks/react-query/use-banks'
import { useDefaultBankAccount } from '../../hooks/react-query/use-default-bank-account'
import { ErrorBanner } from '../banners/ErrorBanner'
import { BrioNext } from '../brio/navigation/BrioNext'

export const AccountInfo: FC = () => {
  const { t } = useTranslation('components', { keyPrefix: 'accountInfo' })
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext()
  const { data: bankOptions, error: bankError } = useBanks()
  const {
    isLoading: isLoadingBankAccount,
    data: bankAccount,
    error: bankAccountError,
  } = useDefaultBankAccount()

  useEffect(() => {
    if (bankAccount) {
      setValue('bankId', bankAccount.bankId)
      setValue('accountNo', bankAccount.accountNo)
    }
  }, [bankAccount])

  if (bankError || bankAccountError) {
    return (
      <ErrorBanner debug={window.ENV?.DEBUG} error={bankError ?? bankAccountError ?? undefined} />
    )
  }

  return (
    <FlexCol space={16}>
      <Heading6>{t('chooseAccountHeading')}</Heading6>
      <Box borderRadius={4} p={8} backgroundColor="off-white" border="medium">
        <Checkbox label={t('depotAccount')} checked disabled />
      </Box>
      <Text pb={16} variant="support1">
        {t('chooseAccountText')}
      </Text>
      <Heading6>{t('withdrawalAccountHeading')}</Heading6>
      <Segment>
        <FlexCol gap={8}>
          <Text variant="subtitle1">{t('addWithdrawalAccount')}</Text>
          {!bankOptions || isLoadingBankAccount ? (
            <SkeletonRect height={38} />
          ) : (
            <Select
              size="medium"
              native={true}
              label={t('chooseBank')}
              error={!!errors.bankId}
              helperText={errors.bankId?.message as string}
              readOnly={!!bankAccount}
              disabled={!!bankAccount}
              {...register('bankId', { required: t('bankRequiredText') })}
            >
              <option value=""></option>
              {bankOptions.map(bank => (
                <option key={bank.bankId} value={bank.bankId}>
                  {bank.name}
                </option>
              ))}
            </Select>
          )}
          {isLoadingBankAccount ? (
            <SkeletonRect height={38} />
          ) : (
            <Input
              {...register('accountNo', { required: t('accountRequiredText') })}
              defaultValue={bankAccount?.accountNo}
              readOnly={!!bankAccount}
              error={!!errors.accountNo}
              helperText={errors.accountNo?.message}
              placeholder={t('addWithdrawalAccountPlaceholder')}
            />
          )}
        </FlexCol>
      </Segment>
      <Text mb={16} variant="support1">
        {t('withdrawalAccountText')}
      </Text>
      <BrioNext disabled={!!errors.accountNo} />
    </FlexCol>
  )
}
