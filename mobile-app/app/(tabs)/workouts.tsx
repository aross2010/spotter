import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from 'expo-router'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import { ListFilter, Plus } from 'lucide-react-native'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const Workouts = () => {
  const navigation = useNavigation()

  useEffect(() => {
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
  }, [])

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, padding: 16 }}
      bottomOffset={100}
    >
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: 'black',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      />
    </KeyboardAwareScrollView>
  )
}

export default Workouts
