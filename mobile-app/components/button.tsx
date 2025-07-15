import { StyleSheet, Text, View, Pressable, PressableProps } from 'react-native'
import React, { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  textClassName?: string
  className?: string
} & PressableProps

const Button = ({
  children,
  textClassName,
  className,
  ...props
}: ButtonProps) => {
  return (
    <Pressable
      className={`active:opacity-75 disabled:opacity-50 ${className}`}
      {...props}
    >
      <Text className={`${textClassName}`}>{children}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({})
