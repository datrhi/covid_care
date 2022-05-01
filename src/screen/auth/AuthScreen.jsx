import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { login, register } from '../../api/auth/authAPI'

const { width, height } = Dimensions.get('window')
export default function AuthScreen({ navigation }) {
  // true - Sign In --- false Sign Up
  const [mode, setMode] = React.useState(true)
  const [email, setEmail] = React.useState('')
  const [verifyEmail, setVerifyEmail] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [verifyPassword, setVerifyPassword] = React.useState('')
  const [checkPassword, setCheckPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [registerError, setRegisterError] = React.useState('')
  const [loginError, setLoginError] = React.useState('')
  const handleRegister = async () => {
    try {
      setLoading(true)
      const res = await register({ username: email, password: password })
      setLoading(false)
      if (res && res.data && res.data.success) {
        Alert.alert('Alert', res.data.message, [
          {
            text: 'OK',
            onPress: () => setMode(true),
          },
        ])
        return null
      }
      throw new Error(res.data.message || 'Unknown error!!!')
    } catch (error) {
      console.log(error)
      setRegisterError(error.toString())
    }
    return null
  }
  const handleLogin = async () => {
    try {
      setLoading(true)
      const res = await login({ username: email, password: password })
      setLoading(false)
      if (res && res.data && res.data.success) {
        await AsyncStorage.setItem('token', res.data.accessToken)
        await AsyncStorage.setItem('email', email)
        navigation.navigate('Overview', { email: email })
        return null
      }
      throw new Error(res.data.message || 'Unknown error!!!')
    } catch (error) {
      console.log(error)
      setLoginError(error.toString())
    }
    return null
  }
  const SignUpView = React.useMemo(
    () => (
      <View style={styles.inputContainer}>
        <Text style={{ color: '#ff0000', marginBottom: 5 }}>
          {registerError}
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
        <TextInput
          secureTextEntry={true}
          style={styles.inputStyle}
          placeholder="Password"
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
            Verify password is not matched
          </Text>
        )}
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={{ color: '#439DEE', fontWeight: 'bold' }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [email, password, verifyPassword, checkPassword, registerError]
  )
  const SignInView = React.useMemo(
    () => (
      <View style={styles.inputContainer}>
        <Text style={{ color: '#ff0000', marginBottom: 5 }}>{loginError}</Text>

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
        <TextInput
          secureTextEntry={true}
          style={styles.inputStyle}
          placeholder="Password"
          onChangeText={setPassword}
          value={password}
        />
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={{ color: '#439DEE', fontWeight: 'bold' }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [email, password, verifyEmail, loginError]
  )
  const validateRegister =
    email === '' ||
    password === '' ||
    verifyPassword === '' ||
    checkPassword ||
    verifyEmail
  const validateLogin = email === '' || password === '' || verifyEmail
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, alignItems: 'center' }}
      behavior={Platform.OS === 'ios' ? 'position' : ''}
    >
      <ScrollView style={styles.container}>
        <View style={styles.switchContainer}>
          <Text
            style={[
              styles.defaultMode,
              mode ? styles.activeMode : styles.deactiveMode,
            ]}
            onPress={() => setMode(true)}
          >
            Sign In
          </Text>
          <Text
            style={[
              styles.defaultMode,
              mode ? styles.deactiveMode : styles.activeMode,
            ]}
            onPress={() => setMode(false)}
          >
            Sign Up
          </Text>
        </View>

        {(!mode && SignUpView) || SignInView}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              mode
                ? validateLogin && { opacity: 0.65 }
                : validateRegister && { opacity: 0.65 },
            ]}
            onPress={mode ? handleLogin : handleRegister}
            disabled={(mode ? validateLogin : validateRegister) || loading}
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
                {mode ? `Sign In` : `Sign Up`}
              </Text>
            )}
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => navigation.navigate('NoData')}>
            <Text style={{ color: '#439DEE', fontWeight: 'bold' }}>
              Privacy Policy
            </Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    height: height,
    width: width,
  },
  activeMode: {
    color: '#439DEE',
  },
  deactiveMode: {
    color: '#B4B4B4',
  },
  defaultMode: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  switchContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: '10%',
    height: height * 0.4,
  },
  inputContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '5%',
    height: height * 0.3,
  },
  actionContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    height: height * 0.2,
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
  forgotPassword: {
    marginLeft: 'auto',
  },
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
})
