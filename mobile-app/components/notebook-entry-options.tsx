import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NotebookEntry } from '../utils/types'
import { Pencil, Trash } from 'lucide-react-native'
import Button from './button'
import Colors from '../constants/colors'
import tw from '../tw'
import Txt from './text'
import { formatDate } from '../functions/formatted-date'
import DragHandle from './drag-handle'

type NotebookEntryOptionsProps = {
  entry: NotebookEntry
}

const options = [
  {
    title: 'Edit Entry',
    onPress: () => {},
    icon: Pencil,
  },
  {
    title: 'Delete Entry',
    onPress: () => {},
    icon: Trash,
  },
]

const NotebookEntryOptions = ({ entry }: NotebookEntryOptionsProps) => {
  const renderedOptions = options.map(
    ({ title, onPress, icon: Icon }, index) => {
      return (
        <Button
          onPress={onPress}
          key={index}
        >
          <View
            key={index}
            style={tw`bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg px-4 py-6 flex-row gap-6 items-center`}
          >
            <Icon
              color={Colors.primary}
              height={20}
              width={20}
            />

            <View style={tw`flex-1 gap-1`}>
              <Txt twcn="font-poppinsMedium">{title}</Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <View
      style={tw`bg-light-background dark:bg-dark-background rounded-xl px-4 pt-10 pb-12 gap-4 relative`}
    >
      <DragHandle />

      <View style={tw`flex-col gap-2`}>{renderedOptions}</View>
    </View>
  )
}

export default NotebookEntryOptions

const styles = StyleSheet.create({})
