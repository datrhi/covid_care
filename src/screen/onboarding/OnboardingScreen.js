import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'
import { Dimensions, Image, StyleSheet, View } from 'react-native'
import { ActivityIndicator } from 'react-native'
import { fetchMe } from '../../api/auth/authAPI'

const { width, height } = Dimensions.get('window')

export default function OnboardingScreen({ navigation }) {
  const handleFetchMe = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`
      const res = await fetchMe(accessToken)
      if (res && res.data && res.data.success) {
        await AsyncStorage.setItem('token', token)
        await AsyncStorage.setItem('email', res.data.user.username)
        navigation.navigate('Overview', {
          email: res.data.user.username,
          token: token,
        })
        return null
      }
      throw new Error('Unauthorized')
    } catch (error) {
      console.log(error)
      await AsyncStorage.clear()
      navigation.navigate('Auth')
    }
  }
  React.useEffect(() => {
    const focusListener = navigation.addListener('focus', () => handleFetchMe())
    return () => focusListener.remove()
  }, [handleFetchMe, navigation])
  return (
    <View style={styles.screenContainer}>
      <Image
        resizeMethod="scale"
        resizeMode="stretch"
        style={styles.imageView}
        source={require('../../asset/onboarding_icon.png')}
      />
      <ActivityIndicator
        color="#439DEE"
        size="large"
        // style={{ transform: [{ scale: 1 }] }}
      />
    </View>
  )
}
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  imageView: {
    width: width * 0.8,
  },
})
