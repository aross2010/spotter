import { View } from 'react-native'
import React, { Fragment } from 'react'
import { NotebookEntry } from '../utils/types'
import { Pencil, Pin, Trash, PinOff } from 'lucide-react-native'
import tw from '../tw'
import Txt from './text'
import useTheme from '../app/hooks/theme'
import Button from './button'
import { useNotebook } from '../context/notebook-context'
import { router } from 'expo-router'

type NotebookEntryOptionsProps = {
  entry: NotebookEntry
  setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const NotebookEntryOptions = ({
  entry,
  setIsOptionsOpen,
}: NotebookEntryOptionsProps) => {
  const { theme } = useTheme()
  const { pinEntry, unpinEntry, deleteEntry } = useNotebook()
  const { pinned, title, body, tags, id, date } = entry

  const handlePinToggle = async () => {
    if (pinned) await unpinEntry(id)
    else await pinEntry(id)
    setIsOptionsOpen(false)
  }

  const handleEdit = () => {
    setIsOptionsOpen(false)
    router.push({
      pathname: '/notebook-entry-form',
      params: {
        entryId: id,
        entryTitle: title || '',
        entryBody: body,
        entryDate: date,
        entryTags: JSON.stringify(tags),
      },
    })
  }

  const options = [
    {
      title: pinned ? 'Unpin' : 'Pin',
      onPress: handlePinToggle,
      icon: pinned ? PinOff : Pin,
    },
    {
      title: 'Edit',
      onPress: handleEdit,
      icon: Pencil,
    },
    {
      title: 'Delete',
      onPress: () => {
        deleteEntry(id)
        setIsOptionsOpen(false)
      },
      icon: Trash,
    },
  ]

  const renderedOptions = options.map(
    ({ title, onPress, icon: Icon }, index) => {
      return (
        <Button
          onPress={onPress}
          key={index}
        >
          <View
            key={index}
            style={tw`flex-row gap-6 p-3 items-center`}
          >
            <Icon
              size={22}
              color={theme.grayText}
              strokeWidth={1.5}
            />

            <View style={tw`flex-1`}>
              <Txt>{title}</Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <Fragment>
      <View>{renderedOptions}</View>
    </Fragment>
  )
}

export default NotebookEntryOptions
