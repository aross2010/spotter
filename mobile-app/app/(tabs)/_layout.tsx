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
  Plus,
  Sliders,
  ListFilter,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import TopIndicatorTabBar from '../../components/tabbar'
import TextLogo from '../../assets/spotter-text-logo.svg'
import Log from '../../components/log'
import MyModal from '../../components/modal'
import useTheme from '../hooks/theme'
import Button from '../../components/button'
import tw from '../../tw'

// the main dashboard layout for the app for a logged in user

const TabsLayout = () => {
  const { theme } = useTheme()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        tabBar={(props) => (
          <TopIndicatorTabBar
            {...props}
            height={90}
            paddingTop={10}
            barColor={theme.background}
            indicatorColor={theme.text}
          />
        )}
        screenOptions={{
          headerShadowVisible: false,
          animation: 'fade',
          headerStyle: [
            {
              backgroundColor: theme.background,
            },
          ] as any,
          headerTitleStyle: {
            fontSize: 20,
            fontFamily: 'Geologica_600SemiBold',
            color: theme.text,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) =>
              focused ? (
                <Home
                  strokeWidth={1.5}
                  size={28}
                  color={theme.text}
                />
              ) : (
                <Home
                  strokeWidth={1.5}
                  size={28}
                  color={theme.grayText}
                />
              ),
            headerTitle: () => (
              <View style={{ height: '100%', aspectRatio: 135 / 57 }}>
                <TextLogo
                  width={'100%'}
                  height={'100%'}
                  color={Colors.primary}
                />
              </View>
            ),
            headerLeft: () => (
              <Link
                href="/settings"
                accessibilityLabel="settings"
                className="p-2"
              >
                <Settings
                  height={24}
                  width={24}
                  color={theme.grayText}
                />
              </Link>
            ),
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ focused }) =>
              focused ? (
                <CalendarFold
                  strokeWidth={1.5}
                  size={28}
                  color={theme.text}
                />
              ) : (
                <Calendar
                  strokeWidth={1.5}
                  size={28}
                  color={theme.grayText}
                />
              ),
          }}
        />

        <Tabs.Screen
          name="log-placeholder"
          options={{
            title: 'Log',
            tabBarIcon: () => (
              <CirclePlus
                strokeWidth={1.5}
                size={28}
                color={theme.grayText}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault()
              setIsLogModalOpen(true)
            },
          }}
        />

        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ focused }) =>
              focused ? (
                <Dumbbell
                  style={{
                    transform: [{ rotate: '45deg' }],
                  }}
                  strokeWidth={1.5}
                  size={28}
                  color={theme.text}
                />
              ) : (
                <Dumbbell
                  strokeWidth={1.5}
                  size={28}
                  color={theme.grayText}
                />
              ),
          }}
        />
        <Tabs.Screen
          name="notebook"
          options={{
            title: 'Notebook',
            tabBarIcon: ({ focused }) =>
              focused ? (
                <BookOpen
                  strokeWidth={1.5}
                  size={28}
                  color={theme.text}
                />
              ) : (
                <Book
                  strokeWidth={1.5}
                  size={28}
                  color={theme.grayText}
                />
              ),
          }}
        />
      </Tabs>
      <MyModal
        isOpen={isLogModalOpen}
        setIsOpen={setIsLogModalOpen}
      >
        <Log setIsOpen={setIsLogModalOpen} />
      </MyModal>
    </View>
  )
}

export default TabsLayout
