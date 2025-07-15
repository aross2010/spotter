import { ScrollView, View, ViewProps } from 'react-native'
import { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type SafeViewProps = {
  children: ReactNode
  className?: string
  noHeader?: boolean
  noScroll?: boolean
} & ViewProps

const SafeView = ({
  children,
  className,
  noHeader,
  noScroll,
  ...rest
}: SafeViewProps) => {
  const insets = useSafeAreaInsets()

  const styles = {
    paddingTop: noHeader ? insets.top : 32,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  if (noScroll)
    return (
      <View
        style={styles}
        className={`bg-light-background dark:bg-dark-background flex-1 ${className}`}
        {...rest}
      >
        <View className="flex-1 px-4">{children}</View>
      </View>
    )

  return (
    <ScrollView
      style={{
        paddingTop: noHeader ? insets.top : 32,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      className={`bg-light-background dark:bg-dark-background flex-1 overflow-y-auto ${className}`}
      {...rest}
    >
      <View className="flex-1 px-4">{children}</View>
    </ScrollView>
  )
}

export default SafeView
