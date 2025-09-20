import React from 'react'
import { StatusBar } from 'expo-status-bar'
import useTheme from '../hooks/theme'

type ThemedStatusBarProps = {
  override?: 'light' | 'dark' | 'auto'
}

const ThemedStatusBar = ({ override }: ThemedStatusBarProps) => {
  const { colorScheme } = useTheme()

  const getStatusBarStyle = () => {
    if (override && override !== 'auto') {
      return override
    }
    return colorScheme === 'dark' ? 'light' : 'dark'
  }

  return (
    <StatusBar
      animated
      style={getStatusBarStyle()}
    />
  )
}

export default ThemedStatusBar
