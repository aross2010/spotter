import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import SafeView from '../../../components/safe-view'
import { useExerciseStore } from '../../../stores/exercise-store'
import Input from '../../../components/input'
import { MUSCLE_GROUPS } from '../../../constants/data'
import Button from '../../../components/button'
import { MuscleGroup } from '../../../utils/types'

// primary muscle groups: one button with swap indicator
// seondary muscle groups: buttons with x to remove, with button to add more
// modal holds the list of muscle groups to add
// workout type: selector (unilateral/bilateral) text to explain

type ExerciseInfo = {
  id: string
  name: string
  description: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  isUnilateral?: boolean
}

const ExerciseForm = () => {
  const {
    id,
    name,
    description,
    primaryMuscleGroup,
    secondaryMuscleGroups,
    isUnilateral,
  } = useLocalSearchParams()
  const { triggerRefresh } = useExerciseStore()
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null)

  useEffect(() => {
    if (!id) return

    let parsedSecondaryMuscleGroups: MuscleGroup[] = []
    if (secondaryMuscleGroups) {
      try {
        parsedSecondaryMuscleGroups = JSON.parse(
          secondaryMuscleGroups as string
        ) as MuscleGroup[]
      } catch {
        const muscleGroupsStr = secondaryMuscleGroups as string
        parsedSecondaryMuscleGroups = muscleGroupsStr
          .split(',')
          .filter(Boolean) as MuscleGroup[]
      }
    }

    setExercise({
      id: id as string,
      name: (name as string) || '',
      description: (description as string) || '',
      primaryMuscleGroup: (primaryMuscleGroup as MuscleGroup) || 'chest',
      secondaryMuscleGroups: parsedSecondaryMuscleGroups,
      isUnilateral: isUnilateral === 'true' ? true : false,
    })
  }, [])

  const handleSaveExercise = () => {
    // update
    triggerRefresh()
    router.back()
  }

  const renderedMuscleGroups = MUSCLE_GROUPS.map((group) => {
    return <Button key={group}></Button>
  })

  const handleChange = (field: keyof ExerciseInfo, value: string) => {
    setExercise((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
  }

  return (
    <SafeView twcnContentView="gap-6">
      <Input
        fullBorder
        label="Exercise Name"
        placeholder="e.g. Bench Press"
        value={exercise?.name}
        onChangeText={(text) => handleChange('name', text)}
      />
      <Input
        fullBorder
        multiline
        numberOfLines={4}
        label="Description"
        value={exercise?.description}
        onChangeText={(text) => handleChange('description', text)}
        placeholder="Form cues, equipment information, etc."
      />
    </SafeView>
  )
}

export default ExerciseForm

const styles = StyleSheet.create({})
