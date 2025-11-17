import { StyleSheet } from 'react-native'
import React from 'react'
import { Tag, TagWithCount } from '../utils/types'
import Txt from './text'

type TagProps = {
  tag: Tag | TagWithCount
  resultTag?: boolean
}

const TagView = ({ tag, resultTag }: TagProps) => {
  const { name, id } = tag
  return (
    <Txt
      key={id}
      twcn="text-primary dark:text-primary"
    >
      #{name}
    </Txt>
  )
}

export default TagView

const styles = StyleSheet.create({})
