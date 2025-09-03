import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNavigation } from 'expo-router'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import { ListFilter, Plus } from 'lucide-react-native'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'

const Workouts = () => {
  const navigation = useNavigation()

  navigation.setOptions({
    headerRight: () => {
      const numFilters = 0

      return (
        <View style={tw`flex-row items-center gap-4 pr-2`}>
          {numFilters > 0 && (
            <View style={tw`relative`}>
              <Link href="/notebook-filters">
                <ListFilter
                  strokeWidth={1.5}
                  size={24}
                  color={Colors.primary}
                />
              </Link>
            </View>
          )}
          <Link href="/workout-form">
            <Plus
              strokeWidth={1.5}
              size={24}
              color={Colors.primary}
            />
          </Link>
        </View>
      )
    },
  })

  return (
    <SafeView>
      <Txt>Workouts</Txt>
    </SafeView>
  )
}

export default Workouts
