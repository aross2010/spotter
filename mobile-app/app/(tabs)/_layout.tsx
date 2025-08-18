import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { useState } from 'react'
import { Link, Redirect, router, Tabs } from 'expo-router'
import Modal from 'react-native-modal'
import {
  LayoutDashboard,
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
import MyModal from '../../components/modal'

// the main dashboard layout for the app for a logged in user

const TabsLayout = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <TopIndicatorTabBar
            {...props}
            height={90}
            paddingTop={10}
          />
        )}
        screenOptions={{
          headerShadowVisible: false,
          animation: 'fade',
          headerTitleStyle: {
            fontSize: 22,
            fontFamily: 'Geologica_600SemiBold',
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
              console.log('Log tab pressed')
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
    </>
  )
}

export default TabsLayout
