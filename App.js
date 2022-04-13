import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AuthScreen from './src/screen/auth/AuthScreen'
import NoDataScreen from './src/screen/404/NoDataScren'
import TestUtilScreen from './src/screen/test/TestUtilScreen'
import OverviewScreen from './src/screen/overview/OverviewScreen'
import SplashScreen from 'react-native-splash-screen'
import OnboardingScreen from './src/screen/onboarding/OnboardingScreen'
import StatisticScreen from './src/screen/stat/StatisticScreen'

const Stack = createNativeStackNavigator()
const { Navigator, Screen } = Stack
export default function App() {
  React.useEffect(() => {
    SplashScreen?.hide()
  }, [])
  return (
    <NavigationContainer>
      <Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Screen name="Onboarding" component={OnboardingScreen} />
        <Screen name="Overview" component={OverviewScreen} />
        <Screen name="Auth" component={AuthScreen} />
        <Screen name="Statistic" component={StatisticScreen} />
        <Screen name="TestUtil" component={TestUtilScreen} />
        <Screen name="NoData" component={NoDataScreen} />
      </Navigator>
    </NavigationContainer>
  )
}
