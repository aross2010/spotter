import { Alert, StyleSheet, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import SafeView from '../../../components/safe-view'
import {
  useExerciseStore,
  useExerciseTabStore,
} from '../../../stores/exercise-store'
import Input from '../../../components/input'
import { MUSCLE_GROUPS } from '../../../constants/data'
import Button from '../../../components/button'
import { MuscleGroup } from '../../../utils/types'
import Txt from '../../../components/text'
import Colors from '../../../constants/colors'
import tw from '../../../tw'
import useTheme from '../../hooks/theme'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import { toTitleCase } from '../../../functions/utils'
import SFIcon from '../../../components/sf-icon'
import Spinner from '../../../components/activity-indicator'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import MyBottomSheet from '../../../components/bottom-sheet'

type ExerciseInfo = {
  id: string
  name: string
  description: string
  primaryMuscleGroup: MuscleGroup | null
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
  const { triggerRefresh: triggerExerciseTabRefresh } = useExerciseTabStore()
  const { fetchWithAuth } = useAuth()
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null)
  const [initialExercise, setInitialExercise] = useState<ExerciseInfo | null>(
    null
  )
  const [isSwapMode, setIsSwapMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const ref = useRef<BottomSheetModal | null>(null)
  const navigation = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const canUpdate = hasChanges && !loading
        return (
          <View style={tw`flex-row items-center`}>
            {loading ? (
              <Spinner
                fullScreen={false}
                twcn="w-9"
              />
            ) : (
              <Button
                onPress={handleSaveExercise}
                hitSlop={12}
                accessibilityLabel="Save Exercise Details"
                disabled={!canUpdate}
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="checkmark"
                  size={26}
                  color={canUpdate ? Colors.primary : theme.grayText}
                />
              </Button>
            )}
          </View>
        )
      },
    })
  }, [loading, exercise, hasChanges, navigation])

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
    const exercise = {
      id: id as string,
      name: (name as string) || '',
      description: (description as string) || '',
      primaryMuscleGroup: (primaryMuscleGroup as MuscleGroup) || null,
      secondaryMuscleGroups: parsedSecondaryMuscleGroups,
      isUnilateral: isUnilateral === 'true' ? true : false,
    }

    setExercise(exercise)
    setInitialExercise(exercise)
  }, [])

  useEffect(() => {
    if (!exercise) return
    // Check for changes compared to initialExercise
    const changesExist =
      exercise.name.trim() !== initialExercise?.name ||
      exercise.description.trim() !== initialExercise?.description ||
      exercise.primaryMuscleGroup !== initialExercise?.primaryMuscleGroup ||
      exercise.isUnilateral !== initialExercise?.isUnilateral ||
      exercise.secondaryMuscleGroups.length !==
        initialExercise?.secondaryMuscleGroups.length ||
      exercise.secondaryMuscleGroups.some(
        (muscle) => !initialExercise?.secondaryMuscleGroups.includes(muscle)
      )

    setHasChanges(changesExist)
  }, [exercise])

  const handleSaveExercise = async () => {
    // update
    try {
      setLoading(true)
      const res = await fetchWithAuth(
        `${BASE_URL}/api/exercises/${exercise?.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exercise),
        }
      )
      await res.json()
      triggerRefresh()
      triggerExerciseTabRefresh()
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMuscleGroup = (muscleGroup: MuscleGroup) => {
    setExercise((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        secondaryMuscleGroups: prev.secondaryMuscleGroups.filter(
          (m) => m !== muscleGroup
        ),
      }
    })
  }

  const handleAddMuscleGroup = (muscleGroup: MuscleGroup) => {
    setExercise((prev) => {
      if (!prev) return prev

      // If there's no primary muscle group, set this as primary
      if (!prev.primaryMuscleGroup) {
        return {
          ...prev,
          primaryMuscleGroup: muscleGroup,
        }
      }

      // Otherwise, add as secondary if not already there
      if (prev.secondaryMuscleGroups.includes(muscleGroup)) return prev
      if (prev.primaryMuscleGroup === muscleGroup) return prev
      return {
        ...prev,
        secondaryMuscleGroups: [...prev.secondaryMuscleGroups, muscleGroup],
      }
    })
  }

  const handleSwapPrimaryMuscleGroup = (muscleGroup: MuscleGroup) => {
    setExercise((prev) => {
      if (!prev || !prev.primaryMuscleGroup) return prev

      const currentPrimary = prev.primaryMuscleGroup
      const isClickedSecondary =
        prev.secondaryMuscleGroups.includes(muscleGroup)

      if (isClickedSecondary) {
        // Swap: clicked muscle becomes primary, old primary becomes secondary
        return {
          ...prev,
          primaryMuscleGroup: muscleGroup,
          secondaryMuscleGroups: prev.secondaryMuscleGroups
            .filter((m) => m !== muscleGroup)
            .concat(currentPrimary),
        }
      } else {
        // Replace: clicked muscle becomes primary, old primary becomes neither
        return {
          ...prev,
          primaryMuscleGroup: muscleGroup,
        }
      }
    })
    ref.current?.present()
    setIsSwapMode(false)
  }

  const renderedMuscleGroups =
    exercise &&
    MUSCLE_GROUPS.map((group) => {
      const isAPrimary = exercise.primaryMuscleGroup === group.toLowerCase()
      const isASecondary = exercise.secondaryMuscleGroups.includes(
        group.toLowerCase()
      )
      const exists = isAPrimary || isASecondary

      if (isSwapMode) {
        // In swap mode, show swap icon for all muscles and highlight selected ones
        return (
          <Button
            key={group}
            onPress={() => handleSwapPrimaryMuscleGroup(group.toLowerCase())}
            twcn={`px-3 py-1 rounded-lg border ${exists ? 'border-primary bg-primary/10' : 'border-light-grayBorder dark:border-dark-grayBorder'} flex-row items-center gap-2`}
          >
            <Txt
              twcn={`text-xs ${exists ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
            >
              {toTitleCase(group)}
            </Txt>
            <SFIcon
              name="arrow.left.arrow.right"
              size={12}
              color={exists ? Colors.primary : theme.grayText}
            />
          </Button>
        )
      }

      // Normal add mode
      return (
        <Button
          key={group}
          onPress={
            !exists
              ? () => handleAddMuscleGroup(group.toLowerCase())
              : undefined
          }
          twcn={`px-3 py-1 rounded-lg border ${!exists ? 'border-light-grayBorder dark:border-dark-grayBorder' : 'border-primary bg-primary/10'} flex-row items-center gap-2`}
        >
          <Txt
            twcn={`text-xs ${!exists ? 'text-light-grayText dark:text-dark-grayText' : 'text-primary dark:text-primary'}`}
          >
            {toTitleCase(group)}
          </Txt>
          {!exists ? (
            <SFIcon
              name="plus"
              size={12}
              color={theme.grayText}
            />
          ) : (
            <SFIcon
              name="checkmark"
              size={12}
              color={Colors.primary}
            />
          )}
        </Button>
      )
    })

  const renderedSecondaryMuscleGroups =
    exercise &&
    exercise.secondaryMuscleGroups.map((m) => {
      return (
        <Button
          key={m}
          onPress={() => handleRemoveMuscleGroup(m)}
          twcn="px-3 py-1 rounded-lg border border-primary bg-primary/10 flex-row items-center gap-2"
        >
          <Txt twcn="text-xs text-primary dark:text-primary">
            {toTitleCase(m)}
          </Txt>
          <SFIcon
            name="xmark"
            size={12}
            color={Colors.primary}
          />
        </Button>
      )
    })

  const handleChange = (field: keyof ExerciseInfo, value: string) => {
    setExercise((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
  }

  return (
    exercise && (
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
          twcnInput="rounded-2xl"
        />
        <View>
          <Txt twcn="mb-2 text-base font-semibold">Primary Muscle Group</Txt>
          {exercise.primaryMuscleGroup ? (
            <Button
              onPress={() => {
                setIsSwapMode(true)
                ref.current?.present()
              }}
              twcn="px-3 py-1 rounded-lg border border-primary bg-primary/10 flex-row items-center gap-2 self-start"
            >
              <Txt twcn="text-xs text-primary dark:text-primary">
                {toTitleCase(exercise.primaryMuscleGroup as string)}
              </Txt>
              <SFIcon
                name="arrow.left.arrow.right"
                size={12}
                color={Colors.primary}
              />
            </Button>
          ) : (
            <View style={tw`flex-row flex-wrap gap-2`}>
              <Button
                onPress={() => {
                  setIsSwapMode(false)
                  ref.current?.present()
                }}
                twcn="px-3 py-1 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder flex-row items-center gap-2"
              >
                <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                  Add
                </Txt>
                <SFIcon
                  name="plus"
                  size={12}
                  color={theme.grayText}
                />
              </Button>
            </View>
          )}
        </View>
        <View>
          <Txt twcn="mb-2 text-base font-semibold">Secondary Muscle Groups</Txt>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {renderedSecondaryMuscleGroups}
            <Button
              onPress={() => {
                setIsSwapMode(false)
                ref.current?.present()
              }}
              twcn="px-3 py-1 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder flex-row items-center gap-2"
            >
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                Add
              </Txt>
              <SFIcon
                name="plus"
                size={12}
                color={theme.grayText}
              />
            </Button>
          </View>
        </View>

        <View>
          <Txt twcn="mb-2 text-base font-semibold">Workout Type</Txt>
          <View style={tw`flex-row gap-2`}>
            <Button
              onPress={() =>
                setExercise((prev) =>
                  prev ? { ...prev, isUnilateral: false } : prev
                )
              }
              twcn={`px-3 py-1 rounded-lg border flex-row items-center gap-2 ${
                exercise.isUnilateral === false
                  ? 'border-secondary bg-secondary/10'
                  : 'border-light-grayBorder dark:border-dark-grayBorder'
              }`}
            >
              <Txt
                twcn={`text-xs ${
                  exercise.isUnilateral === false
                    ? 'text-secondary dark:text-secondary'
                    : 'text-light-grayText dark:text-dark-grayText'
                }`}
              >
                Bilateral
              </Txt>
            </Button>
            <Button
              onPress={() =>
                setExercise((prev) =>
                  prev ? { ...prev, isUnilateral: true } : prev
                )
              }
              twcn={`px-3 py-1 rounded-lg border flex-row items-center gap-2 ${
                exercise.isUnilateral === true
                  ? 'border-secondary bg-secondary/10'
                  : 'border-light-grayBorder dark:border-dark-grayBorder'
              }`}
            >
              <Txt
                twcn={`text-xs ${
                  exercise.isUnilateral === true
                    ? 'text-secondary dark:text-secondary'
                    : 'text-light-grayText dark:text-dark-grayText'
                }`}
              >
                Unilateral
              </Txt>
            </Button>
          </View>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText mt-4">
            Bilateral: Exercises that work both sides of the body simultaneously
            (e.g., Squats, Bench Press, DB Press, etc.).{'\n\n'}
            Unilateral: Exercises that target one side of the body at a time,
            track sets for each side separately (e.g., Single Arm Lateral
            Raises).
          </Txt>
        </View>

        <MyBottomSheet ref={ref}>
          <Txt twcn="mb-2 font-semibold text-base">
            {isSwapMode ? 'Swap Primary Muscle Group' : 'Muscle Groups'}
          </Txt>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {renderedMuscleGroups}
          </View>
        </MyBottomSheet>
      </SafeView>
    )
  )
}

export default ExerciseForm

const styles = StyleSheet.create({})
