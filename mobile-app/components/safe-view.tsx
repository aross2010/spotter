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
    paddingTop: noHeader ? insets.top : 16,
    paddingBottom: insets.bottom,
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
  }

  if (noScroll)
    return (
      <View
        className={`bg-light-background dark:bg-dark-background flex-1 ${className}`}
        {...rest}
      >
        <View style={styles}>{children}</View>
      </View>
    )

  return (
    <ScrollView
      className={`bg-light-background dark:bg-dark-background flex-1 overflow-y-auto ${className}`}
      {...rest}
    >
      <View style={styles}>{children}</View>
    </ScrollView>
  )
}

export default SafeView
