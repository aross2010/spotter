import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { useState } from 'react'
import { Redirect, router, Tabs } from 'expo-router'
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
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import TopIndicatorTabBar from '../../components/tabbar'
import Txt from '../../components/text'
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

const styles = StyleSheet.create({})
