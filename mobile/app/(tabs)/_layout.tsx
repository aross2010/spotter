import { View } from 'react-native'
import { Link, Tabs } from 'expo-router'
import {
  Dumbbell,
  Book,
  BookOpen,
  Calendar,
  CalendarFold,
  Home,
  Settings,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import TopIndicatorTabBar from '../../components/tabbar'
import TextLogo from '../../assets/spotter-text-logo.svg'
import useTheme from '../hooks/theme'
import tw from '../../tw'
import { isLiquidGlassAvailable } from 'expo-glass-effect'
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs'

const TabsLayout = () => {
  const { theme } = useTheme()

  const liquidGlassTabs = (
    <NativeTabs
      iconColor={Colors.primary}
      labelStyle={
        {
          // fontFamily: 'Poppins400_Regular',
        }
      }
    >
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="workouts">
        <Label>Workouts</Label>
        <Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="exercises">
        <Label>Exercises</Label>
        <Icon sf="dumbbell.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notebook">
        <Label>Notebook</Label>
        <Icon sf="book.pages.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      {liquidGlassTabs}
    </View>
  )

  // return (
  //   <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
  //     <Tabs
  //       tabBar={(props) => (
  //         <TopIndicatorTabBar
  //           {...props}
  //           height={80}
  //           paddingTop={10}
  //           indicatorColor={theme.text}
  //         />
  //       )}
  //       screenOptions={{
  //         headerShadowVisible: false,
  //         animation: 'fade',
  //         headerStyle: [
  //           {
  //             backgroundColor: theme.background,
  //           },
  //         ] as any,
  //         headerTitleStyle: {
  //           fontSize: 26,
  //           fontFamily: 'Poppins_600SemiBold',
  //           color: theme.text,
  //         },
  //         headerTitleAlign: 'left',
  //         tabBarStyle: {
  //           backgroundColor: 'transparent',
  //           position: 'absolute',
  //           borderTopWidth: 0,
  //           elevation: 0,
  //         },
  //         sceneStyle: {
  //           backgroundColor: 'transparent',
  //         },
  //         headerTitleAllowFontScaling: false,
  //       }}
  //     >
  //       <Tabs.Screen
  //         name="home"
  //         options={{
  //           title: 'Home',
  //           tabBarIcon: ({ focused }) => (
  //             <Home
  //               strokeWidth={1.5}
  //               size={22}
  //               color={focused ? theme.text : theme.grayText}
  //             />
  //           ),

  //           headerTitle: () => (
  //             <View style={{ height: '100%', aspectRatio: 135 / 57 }}>
  //               <TextLogo
  //                 width={'100%'}
  //                 height={'100%'}
  //                 color={Colors.primary}
  //               />
  //             </View>
  //           ),
  //           headerRight: () => (
  //             <View style={tw`mr-4 pb-1`}>
  //               <Link
  //                 href="/settings"
  //                 accessibilityLabel="settings"
  //                 style={tw`bg-primary/10 rounded-2xl p-2`}
  //               >
  //                 <Settings
  //                   height={20}
  //                   width={20}
  //                   color={Colors.primary}
  //                 />
  //               </Link>
  //             </View>
  //           ),
  //         }}
  //       />
  //       <Tabs.Screen
  //         name="workouts"
  //         options={{
  //           title: 'Workouts',
  //           tabBarIcon: ({ focused }) =>
  //             focused ? (
  //               <CalendarFold
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.text}
  //               />
  //             ) : (
  //               <Calendar
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.grayText}
  //               />
  //             ),
  //         }}
  //       />
  //       <Tabs.Screen
  //         name="exercises"
  //         options={{
  //           title: 'Exercises',
  //           tabBarIcon: ({ focused }) =>
  //             focused ? (
  //               <Dumbbell
  //                 style={{
  //                   transform: [{ rotate: '45deg' }],
  //                 }}
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.text}
  //               />
  //             ) : (
  //               <Dumbbell
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.grayText}
  //               />
  //             ),
  //         }}
  //       />
  //       <Tabs.Screen
  //         name="notebook"
  //         options={{
  //           title: 'Notebook',
  //           tabBarIcon: ({ focused }) =>
  //             focused ? (
  //               <BookOpen
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.text}
  //               />
  //             ) : (
  //               <Book
  //                 strokeWidth={1.5}
  //                 size={22}
  //                 color={theme.grayText}
  //               />
  //             ),
  //         }}
  //       />
  //     </Tabs>
  //   </View>
  // )
}

export default TabsLayout
