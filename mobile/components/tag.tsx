import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Tag, TagWithCount } from '../utils/types'
import Txt from './text'
import tw from '../tw'
import SFIcon from './sf-icon'
import Colors from '../constants/colors'

type TagProps = {
  tag: Tag | TagWithCount
  resultTag?: boolean
  canDelete?: boolean
}

const TagView = ({ tag, resultTag, canDelete }: TagProps) => {
  const { name, id } = tag

  return (
    <View
      key={id}
      style={tw`
        px-2 py-0.5
        rounded-full 
        bg-primary/10 dark:bg-primary/20
        ${resultTag ? 'bg-primary/20 dark:bg-primary/30' : ''} flex-row items-center gap-2
      `}
    >
      {canDelete && (
        <SFIcon
          name="xmark.circle.fill"
          size={14}
          color={Colors.primary}
        />
      )}
      <Txt
        twcn="
          text-primary dark:text-primary
          text-xs
        "
      >
        {name}
      </Txt>
    </View>
  )
}

export default TagView

const styles = StyleSheet.create({})
