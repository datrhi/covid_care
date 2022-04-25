import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Icon } from 'react-native-elements'
import { changePassword } from '../../api/auth/authAPI'

const { width, height } = Dimensions.get('window')

export default function ChangePasswordScreen({ navigation }) {
  const [greetings, setGreetings] = React.useState('Good Morning')
  const [password, setPassword] = React.useState('')
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [verifyPassword, setVerifyPassword] = React.useState('')
  const [checkPassword, setCheckPassword] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const mapGreetingsToStyle = React.useCallback(
    (greeting, elements) => {
      if (greeting === 'Good Evening') {
        return styles[elements]
      } else {
        return styles[elements]
      }
    },
    [styles]
  )
  const handleChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`
      const res = await changePassword(accessToken, {
        currentPassword: currentPassword,
        newPassword: password,
      })

      if (res && res.data && res.data.success) {
        Alert.alert('Success', `${res.data.message}`, [
          { text: 'OK', onPress: () => navigation.navigate('Overview') },
        ])
        return null
      }
      throw new Error(res.data.message || 'Error')
    } catch (error) {
      console.log(error)
      Alert.alert('Failure', `${error.toString()}`, [
        { text: 'OK', onPress: () => navigation.navigate('Overview') },
      ])
    }
  }
  React.useLayoutEffect(() => {
    if (new Date().getHours() < 12 && new Date().getHours() >= 5) {
      setGreetings('Good Morning')
    } else if (new Date().getHours() < 18 && new Date().getHours() >= 12) {
      setGreetings('Good Afternoon')
    } else {
      setGreetings('Good Evening')
    }
  }, [new Date().getHours(), setGreetings])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, alignItems: 'center' }}
      behavior={Platform.OS === 'ios' ? 'position' : ''}
    >
      <View style={mapGreetingsToStyle(greetings, 'container')}>
        <View style={mapGreetingsToStyle(greetings, 'headerContainer')}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios" type="material-icons" color="#000" />
          </TouchableOpacity>
          <Text
            style={mapGreetingsToStyle(greetings, 'headerText')}
          >{`Change Password`}</Text>
        </View>

        <ScrollView style={mapGreetingsToStyle(greetings, 'screenContainer')}>
          <View
            style={{
              flex: 1,
              padding: 20,
              backgroundColor: '#fff',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ff0000', marginBottom: 5 }}>{error}</Text>

            <TextInput
              secureTextEntry={true}
              style={styles.inputStyle}
              placeholder="Current password"
              onChangeText={setCurrentPassword}
              value={currentPassword}
            />
            <TextInput
              secureTextEntry={true}
              style={styles.inputStyle}
              placeholder="New password"
              onChangeText={setPassword}
              value={password}
            />
            <TextInput
              secureTextEntry={true}
              style={styles.inputStyle}
              placeholder="Verify Password"
              onChangeText={(value) => {
                setVerifyPassword(value)
                if (value !== password) {
                  setCheckPassword(true)
                } else {
                  setCheckPassword(false)
                }
              }}
            />
            {checkPassword && (
              <Text style={{ color: '#ff0000', marginBottom: 5 }}>
                Verify new password is not matched
              </Text>
            )}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.mainButton]}
                disabled={loading || checkPassword}
                onPress={() => handleChangePassword()}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: 18,
                    }}
                  >
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}
const styles = StyleSheet.create({
  mainButton: {
    marginTop: 20,
    backgroundColor: '#439DEE',
    alignItems: 'center',
    padding: 15,
    width: '70%',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
    elevation: 24,
    marginBottom: 20,
  },
  actionContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    height: height * 0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F3F8',
    padding: 20,
  },
  screenContainer: {
    flex: 1,
    width: width - 40,
    // height: height,
    backgroundColor: '#F4F3F8',
  },
  headerContainer: {
    // width: width,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#212437',
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputStyle: {
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 100,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 15,
  },
})
