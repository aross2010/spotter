import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Tag, TagWithCount } from '../utils/types'
import Txt from './text'
import tw from '../tw'
import Button from './button'
import { X } from 'lucide-react-native'
import Colors from '../constants/colors'

type TagProps = {
  tag: Tag | TagWithCount
  resultTag?: boolean
  onRemove?: (id: string) => void
}

const TagView = ({ tag, resultTag, onRemove }: TagProps) => {
  const { name, id } = tag

  const tagInfo = (
    <Txt
      key={id}
      twcn="text-xs text-primary dark:text-primary"
    >
      #{name}
    </Txt>
  )

  if (onRemove) {
    return (
      <Button
        twcn="py-1 px-3 rounded-lg bg-primary/10 border border-primary flex-row items-center gap-2"
        onPress={() => onRemove(id)}
      >
        {tagInfo}
        <X
          size={12}
          color={Colors.primary}
        />
      </Button>
    )
  }

  return (
    <View style={tw`py-1 px-3 rounded-lg bg-primary/10 border border-primary`}>
      {tagInfo}
    </View>
  )
}

export default TagView

const styles = StyleSheet.create({})
