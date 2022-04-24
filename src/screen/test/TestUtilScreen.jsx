import React from 'react'
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native'
import { BleManager } from 'react-native-ble-plx'
const { width, height } = Dimensions.get('window')
export default function TestUtilScreen({ navigation }) {
  const [bluetoothStatus, setBluetoothStatus] = React.useState('PoweredOff')
  const [errorScan, setErrorScan] = React.useState('')
  const [deviceInfo, setDeviceInfo] = React.useState([])
  const manager = new BleManager()
  React.useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      setBluetoothStatus(state)
    }, true)
    return () => subscription.remove()
  }, [manager])
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'FIOT APP',
          message: 'FIOT App access to your location ',
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Alert', 'Success!', [
          {
            text: 'OK',
          },
        ])
      } else {
        Alert.alert('Alert', 'Location permission denied', [
          {
            text: 'OK',
          },
        ])
      }
    } catch (err) {
      console.warn(err)
    }
  }
  const scanAndConnect = () => {
    if (bluetoothStatus === 'PoweredOn') {
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          setErrorScan(error.reason)
          return null
        }
        setDeviceInfo((s) => {
          if (s.map((item) => item.id).includes(device.id)) {
            const newS = s.map((item) =>
              item.id !== device.id
                ? item
                : {
                    id: device.id,
                    name: device.name,
                    localName: device.localName,
                    signalNumber: device.rssi,
                  }
            )
            return newS
          }
          return [
            ...s,
            {
              id: device.id,
              name: device.name,
              localName: device.localName,
              signalNumber: device.rssi,
            },
          ]
        })
      })
    } else {
      Alert.alert('Alert', 'Need to turn bluetooth on', [
        {
          text: 'OK',
        },
      ])
    }
  }
  const stopScan = () => {
    manager.stopDeviceScan()
  }
  return (
    <ScrollView style={styles.containerView}>
      <Text
        style={styles.textView}
      >{`Bluetooth state: ${bluetoothStatus}`}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { width: width * 0.7 }]}
          onPress={requestLocationPermission}
        >
          <Text style={{ color: '#fff' }}>Manual Get Location Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => scanAndConnect()}
        >
          <Text style={{ color: '#fff' }}>Start scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => stopScan()}>
          <Text style={{ color: '#fff' }}>Stop scan</Text>
        </TouchableOpacity>
      </View>
      {Array.isArray(deviceInfo) &&
        deviceInfo.length > 0 &&
        deviceInfo.map((device) => (
          <Text>
            {`ID: ${device.id} - Name: ${
              device.name ? device.name : 'No name'
            } - Local name: ${
              device.localName ? device.localName : 'No Local name'
            } - Signal: ${
              device.signalNumber ? device.signalNumber : 'No signal'
            }`}{' '}
          </Text>
        ))}
      {errorScan !== '' && <Text>{errorScan}</Text>}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    width: width,
    height: height,
  },
  buttonContainer: {
    marginTop: 10,
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#439DEE',
    width: width * 0.5,
    height: height * 0.1,
    borderRadius: 20,
    marginBottom: 20,
  },
  textView: {
    width: width,
    textAlign: 'center',
    fontSize: 20,
  },
})
