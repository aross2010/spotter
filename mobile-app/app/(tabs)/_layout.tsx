import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import React, { useContext } from 'react'
import { Redirect, Tabs } from 'expo-router'
import {
  LayoutDashboard,
  Dumbbell,
  Book,
  BookOpen,
  BarChart,
  Calendar,
  CalendarFold,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import { AuthContext } from '../../context/auth-context'

// the main dashboard layout for the app for a logged in user

const TabsLayout = () => {
  const colorScheme = useColorScheme() ?? 'light'
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#807BCF',
          height: 90,
          paddingTop: 10,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.iconActive,
        tabBarInactiveTintColor: theme.iconInactive,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <LayoutDashboard
                size={24}
                color={theme.iconActive}
              />
            ) : (
              <LayoutDashboard
                size={24}
                color={theme.iconInactive}
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
                size={24}
                color={theme.iconActive}
              />
            ) : (
              <Calendar
                size={24}
                color={theme.iconInactive}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Dumbbell
                size={24}
                color={theme.iconActive}
              />
            ) : (
              <Dumbbell
                size={24}
                color={theme.iconInactive}
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
                size={24}
                color={theme.iconActive}
              />
            ) : (
              <Book
                size={24}
                color={theme.iconInactive}
              />
            ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout

const styles = StyleSheet.create({})
