import { View, Animated } from 'react-native'
import { useState, Fragment, useRef } from 'react'
import { Link, Tabs } from 'expo-router'
import {
  Dumbbell,
  Book,
  BookOpen,
  Calendar,
  CalendarFold,
  CirclePlus,
  Home,
  Settings,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import TopIndicatorTabBar from '../../components/tabbar'
import TextLogo from '../../assets/spotter-text-logo.svg'
import Log from '../../components/log'
import useTheme from '../../hooks/theme'
import Button from '../../components/button'
import tw from '../../tw'
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs'

// the main dashboard layout for the app for a logged in user

const TabsLayout = () => {
  const { theme } = useTheme()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  return (
    <NativeTabs
      backgroundColor={Colors.primary}
      minimizeBehavior="onScrollDown"
      tintColor={Colors.primary}
    >
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf={'house.fill'} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="workouts">
        <Label>Workouts</Label>
        <Icon sf={'calendar.badge.checkmark'} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exercises">
        <Label>Exercises</Label>
        <Icon sf={'dumbbell.fill'} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        options={{
          title: 'Notebook',
        }}
        name="notebook"
      >
        <Label>Notebook</Label>
        <Icon sf={'book.fill'} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

export default TabsLayout
