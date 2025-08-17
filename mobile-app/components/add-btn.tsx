import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Plus, PlusCircle } from 'lucide-react-native'
import Colors from '../constants/colors'

const AddButton = () => {
  return (
    <Pressable className="absolute -top-1 self-center items-center rounded-full justify-center">
      <PlusCircle
        size={48}
        fill={Colors.secondary}
        color={Colors.primary}
      />
    </Pressable>
  )
}

export default AddButton

const styles = StyleSheet.create({})
