import { View } from 'react-native'
import { usePathname } from 'expo-router'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'
import tw from '../../tw'
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs'

const TabsLayout = () => {
  const liquidGlassTabs = (
    <NativeTabs iconColor={Colors.primary}>
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="workouts">
        <Label>Workouts</Label>
        <Icon sf="figure.strengthtraining.traditional" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exercises">
        <Label>Exercises</Label>
        <Icon sf="dumbbell.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notebook">
        <Label>Notebook</Label>
        <Icon sf="book.pages.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights">
        <Label>Insights</Label>
        <Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      {liquidGlassTabs}
    </View>
  )
}

export default TabsLayout
