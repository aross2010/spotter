import { Text, Pressable, PressableProps } from 'react-native'
import React, { ReactNode } from 'react'
import Txt from './text'
import tw from '../tw'

type ButtonProps = {
  children?: ReactNode
  text?: string
  twcnText?: string
  twcn?: string
  loading?: boolean
  loadingText?: string
} & PressableProps

const Button = ({
  children,
  text,
  twcnText,
  twcn,
  loading,
  loadingText = 'Loading...',
  disabled,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading

  if (text) {
    return (
      <Pressable
        style={tw`active:opacity-75 ${isDisabled ? 'opacity-50' : ''} ${twcn ?? ''}`}
        disabled={isDisabled}
        {...props}
      >
        <Txt twcn={twcnText}>{loading ? loadingText : text}</Txt>
        {children}
      </Pressable>
    )
  }

  return (
    <Pressable
      style={tw`active:opacity-75 ${isDisabled ? 'opacity-50' : ''} ${twcn ?? ''}`}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </Pressable>
  )
}

export default Button
