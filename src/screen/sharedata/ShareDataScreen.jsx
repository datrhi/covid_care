import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'
import {
  ActivityIndicator,
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
import { addSharing } from '../../api/auth/sharingAPI'

const { width, height } = Dimensions.get('window')

export default function ShareDataScreen({ navigation }) {
  const [greetings, setGreetings] = React.useState('Good Morning')
  const [email, setEmail] = React.useState('')
  const [verifyEmail, setVerifyEmail] = React.useState(false)

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
  const handleConfirmEmail = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`
      const res = await addSharing(accessToken, {
        email: email,
      })

      setLoading(false)
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
          >{`Share Data With Others`}</Text>
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
            <Text
              style={[
                mapGreetingsToStyle(greetings, 'headerText'),
                { fontSize: 13, marginBottom: 15, color: '#439DEE' },
              ]}
            >
              Enter email of person who you want to see your data
            </Text>
            <TextInput
              style={styles.inputStyle}
              placeholder="Email"
              onChangeText={(value) => {
                setEmail(value)
                let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/
                if (reg.test(value) === false) {
                  setVerifyEmail(true)
                } else {
                  setVerifyEmail(false)
                }
              }}
              value={email}
            />
            {verifyEmail && (
              <Text style={{ color: '#ff0000', marginBottom: 5 }}>
                Email is not valid!
              </Text>
            )}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.mainButton]}
                disabled={loading || verifyEmail}
                onPress={() => handleConfirmEmail()}
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
                    Confirm
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
