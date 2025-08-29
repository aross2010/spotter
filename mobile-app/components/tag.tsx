import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Tag } from '../utils/types'
import Txt from './text'

type TagProps = {
  tag: Tag | (Tag & { used: number })
  resultTag?: boolean
}

const TagView = ({ tag, resultTag }: TagProps) => {
  const { name, id } = tag
  return (
    <Txt
      key={id}
      twcn="text-xs text-primary"
    >
      #{name}
    </Txt>
  )
}

export default TagView

const styles = StyleSheet.create({})
