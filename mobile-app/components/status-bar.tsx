import React from 'react'
import { StatusBar } from 'expo-status-bar'
import useTheme from '../app/hooks/theme'

const ThemedStatusBar = () => {
  const { colorScheme } = useTheme()

  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
}

export default ThemedStatusBar
