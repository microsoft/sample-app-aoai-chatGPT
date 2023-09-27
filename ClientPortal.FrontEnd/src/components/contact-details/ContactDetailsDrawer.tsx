import { Button, FlexCol, Input, SideDrawer, Text } from '@carnegie/duplo'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ErrorBanner } from '../banners/ErrorBanner'

export type ContactDetails = {
  email: string
  phoneNumber: string
}

type Props = {
  debug?: boolean
  email?: string
  error?: Error
  loading?: boolean
  open: boolean
  phoneNumber?: string
  onClose(): void
  onSave(fieldValues: ContactDetails): void
}

export const ContactDetailsDrawer: FC<Props> = ({
  debug = false,
  email,
  error,
  loading = false,
  open,
  phoneNumber,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation('components')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactDetails>()

  return (
    <SideDrawer
      title={t('contactDetailsDrawer.title')}
      sidebarContent={
        <form onSubmit={handleSubmit(onSave)}>
          <FlexCol gap={16}>
            <FlexCol gap={4}>
              <Input
                id="phoneNumber"
                type={'tel' as any}
                pattern="^[ \d\(\)\-+]{5,18}$"
                label={t('contactDetailsDrawer.phoneNumber')}
                defaultValue={phoneNumber}
                helperText={errors.phoneNumber}
                required
                {...register('phoneNumber')}
              />
              <Text variant="support2" color="text-low-emphasis" pl={4}>
                {t('contactDetailsDrawer.phoneHelperText')}
              </Text>
            </FlexCol>
            <Input
              id="email"
              type={'email' as any}
              label={t('contactDetailsDrawer.email')}
              defaultValue={email}
              helperText={errors.email}
              required
              {...register('email')}
            />
            <Button size="large" type="submit" variant="primary" width="full" loading={loading}>
              {t('contactDetailsDrawer.save')}
            </Button>
            {error && <ErrorBanner debug={debug} error={error} />}
          </FlexCol>
        </form>
      }
      variant="slide"
      open={open}
      onClose={onClose}
    />
  )
}
