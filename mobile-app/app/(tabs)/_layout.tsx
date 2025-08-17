import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
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

// the main dashboard layout for the app for a logged in user

const TabsLayout = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Tabs
      tabBar={(props) => (
        <TopIndicatorTabBar
          {...props}
          height={90}
          paddingTop={10}
        />
      )}
      screenOptions={{
        tabBarShowLabel: false,
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
                size={28}
                color={Colors.light.background}
              />
            ) : (
              <Home
                size={28}
                color={Colors.light.background}
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
                size={28}
                color={Colors.light.background}
              />
            ) : (
              <Calendar
                size={28}
                color={Colors.light.background}
              />
            ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => (
            <CirclePlus
              size={28}
              color={Colors.light.background}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault()
            console.log('Add button pressed, redirecting to create something.')
            // route to (modals)/add
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
                size={28}
                color={Colors.light.background}
              />
            ) : (
              <Dumbbell
                size={28}
                color={Colors.light.background}
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
                size={28}
                color={Colors.light.background}
              />
            ) : (
              <Book
                size={28}
                color={Colors.light.background}
              />
            ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout

const styles = StyleSheet.create({})
