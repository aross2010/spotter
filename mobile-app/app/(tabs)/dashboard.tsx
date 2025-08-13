import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SafeView from '../../components/safe-view'
import { useAuth } from '../../context/auth-context'
import Button from '../../components/button'

const Dashboard = () => {
  const { fetchWithAuth, user, signOut } = useAuth()

  console.log(user)

  return (
    <SafeView>
      <Text>Dashboard</Text>
      <Button
        onPress={async () => {
          const response = await fetchWithAuth(
            `http://localhost:3000/api/user/${user?.sub}`,
            {
              method: 'GET',
            }
          )
          const data = await response.json()
          console.log(data)
        }}
      >
        Fetch User Data
      </Button>
      <Button onPress={signOut}>Sign Out</Button>
    </SafeView>
  )
}

export default Dashboard
