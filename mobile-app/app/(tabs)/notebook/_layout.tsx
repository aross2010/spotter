import { StyleSheet, Text, View } from 'react-native'
import { Link, Stack } from 'expo-router'
import Button from '../../../components/button'
import TextLogo from '../../../assets/spotter-text-logo.svg'
import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols'
import { Settings } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import { Icon } from 'expo-router/unstable-native-tabs'
import tw from '../../../tw'

const NotebookLayout = () => {
  const { theme } = useTheme()

  return <Stack />
}

export default NotebookLayout

const styles = StyleSheet.create({})
