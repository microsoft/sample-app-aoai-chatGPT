import React from 'react'
import { Icon, Label, Stack, IStackStyles, ILabelStyles, IIconProps, FontSizes } from '@fluentui/react'

// Define styles for the Chip component
const stackStyles: IStackStyles = {
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    marginLeft: 15,
    border: '1px solid #93A099',
    borderRadius: '50px',
    padding: '7px 15px',
    gap: '10px',
    lineHeight: '100%',
    flexGrow: 1, // Allow the stack to grow
    '@media all and (max-width:575px)': {
      gap: '7px'
    }
  }
}

const labelStyles: ILabelStyles = {
  root: {
    color: '#93A099',
    padding: '0',
    fontWeight: 'normal',
    fontSize: '18px',
    '@media all and (max-width:767px)': {},
    '@media all and (max-width:575px)': {
      fontSize: '16px'
    }
  }
}

const iconStyles: IIconProps = {
  iconName: 'Cancel',
  styles: {
    root: {
      fontSize: '16px',
      color: '#93A099',
      cursor: 'pointer',
      '@media all and (max-width:575px)': {
        fontSize: '14px'
      }
    }
  }
}

interface ChipProps {
  label: string
  onRemove: () => void
}

const Chip: React.FC<ChipProps> = ({ label, onRemove }) => {
  return (
    <Stack horizontal styles={stackStyles}>
      <Label styles={labelStyles}>{label}</Label>
      <Icon {...iconStyles} onClick={onRemove} />
    </Stack>
  )
}

export default Chip
