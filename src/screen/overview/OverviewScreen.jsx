import AsyncStorage from '@react-native-async-storage/async-storage'
import { decode, encode } from 'base-64'
import moment from 'moment'
import React from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { BleManager } from 'react-native-ble-plx'
import { Icon } from 'react-native-elements'
import Modal from 'react-native-modal'
import { fetchMe } from '../../api/auth/authAPI'
import {
  createOneMetric,
  getLatestData,
  saveMetric,
} from '../../api/auth/metricAPI'

const { width, height } = Dimensions.get('window')
const myServiceUUID = '12345678-1234-1234-1234-12345678910a'

const device_ch = '12345678-1234-1234-1234-12345678910b'
const data_ch = '12345678-1234-1234-1234-12345678910a'
const manager = new BleManager()

export default function OverviewScreen({ navigation, route }) {
  // UI state
  const [focus, setFocus] = React.useState(
    `${new Date().getDate()}/${new Date().getMonth()}/${new Date().getFullYear()}`
  )
  const [tab, setTab] = React.useState('activity')
  const [email, setEmail] = React.useState('')
  const [modalVisible, setModalVisible] = React.useState(false)

  // ble state
  const [bluetoothStatus, setBluetoothStatus] = React.useState('PoweredOff')
  const [deviceInfo, setDeviceInfo] = React.useState([])
  const [connectedDevice, setConnectedDevice] = React.useState('')

  // metric
  const [temperature, setTemperature] = React.useState(-1)
  const [covid, setCovid] = React.useState(-1)
  const [heartBeat, setHeartBeat] = React.useState(-1)
  const [timeLastest, setTimeLastest] = React.useState(null)

  // scroll ref
  const scrollViewRef = React.useRef()

  // state action
  const [scanLoading, setScanLoading] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isRequest, setIsRequest] = React.useState(false)
  const [isLoadingData, setIsLoadingData] = React.useState(false)
  const [isFetchLastest, setIsFetchLastest] = React.useState(false)

  const scanDevice = () => {
    if (bluetoothStatus === 'PoweredOn') {
      setScanLoading(true)
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          Alert.alert('Scanning error', error.reason, [
            {
              text: 'OK',
            },
          ])
          setScanLoading(false)
          return null
        }
        // Scan thiết bị trong 5s
        setTimeout(() => {
          manager.stopDeviceScan()
          setScanLoading(false)
        }, 5000)
        // Cập nhật signal và thông tin thiết bị trong  5s
        setDeviceInfo((s) => {
          if (!device.id) {
            return s
          }
          if (s.map((item) => item.id).includes(device.id)) {
            const newS = s.map((item) =>
              item.id !== device.id ? item : device
            )
            return newS
          }
          return [...s, device]
        })
      })
    } else {
      Alert.alert('Permission', 'Turn on bluetooth?', [
        {
          text: 'OK',
          onPress: () => {
            manager.enable()
          },
        },
        {
          text: 'Cancel',
        },
      ])
    }
  }

  const connectDevice = async (id) => {
    try {
      setIsConnecting(id)
      const findDeviceWithId = deviceInfo.filter((item) => item.id === id)
      let device =
        Array.isArray(findDeviceWithId) && findDeviceWithId.length > 0
          ? findDeviceWithId[0]
          : null
      if (device === null) {
        Alert.alert(
          'Connecting Error',
          'Can not find this device, please scan again!',
          [{ text: 'OK' }]
        )
        return false
      }
      const isConnected = await manager.isDeviceConnected(id)
      if (!isConnected) {
        device = await manager.connectToDevice(id, {
          refreshGatt: 'OnConnected',
          autoConnect: true,
        })
        await device.discoverAllServicesAndCharacteristics()
      }
      monitor(id)
      handleSendTimeToHardware(id)

      // const services = await device.services()
      // const myService = services.filter((item) => item.uuid === myServiceUUID)
      // const characteristics = await device.characteristicsForService(
      //   myServiceUUID
      // )
      // const strService = services.map((item) => item.uuid).join(',')
      // const strChar = characteristics.map((item) => item.uuid).join(',')
      // Alert.alert('Test', `${strService}\n${strChar}`, [
      //   {
      //     text: 'OK',
      //   },
      // ])
      device.onDisconnected((error, device) => {
        if (error) {
          Alert.alert('Disconected Error', error.reason, [
            {
              text: 'OK',
            },
          ])
        }
        setIsRequest(false)
        setIsLoadingData(false)
        // if (device) {
        setConnectedDevice('')
        // Alert.alert(
        //   'Disconected',
        //   `DeviceId: ${device.id} is disconnected!`,
        //   [{ text: 'OK' }]
        // )
        // }
      })
      setIsConnecting('')
      setConnectedDevice(id)
    } catch (error) {
      console.log(error)
      Alert.alert('Connecting Error', `${error.toString()}`)
    }
  }

  const handleFetchOneMetric = async (data) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`

      const res = await createOneMetric(accessToken, {
        data,
      })

      if (res && res.data && res.data.success) {
        return null
      }
      throw new Error(res.data.message || 'Error')
    } catch (error) {
      console.log(error.toString())
      Alert.alert('Failure', `${error.toString()}`, [{ text: 'OK' }])
    }
  }
  const handleSaveMetric = async (data) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`

      const res = await saveMetric(accessToken, {
        data,
      })

      if (res && res.data && res.data.success) {
        return null
      }
      throw new Error(res.data.message || 'Error')
    } catch (error) {
      console.log(error.toString())
      Alert.alert('Failure', `${error.toString()}`, [{ text: 'OK' }])
    }
  }

  const handleFetchingLatest = async () => {
    try {
      setIsFetchLastest(true)
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        navigation.navigate('Auth')
        return null
      }
      const accessToken = `Bearer ${token}`

      const res = await getLatestData(accessToken, { date: focus })
      if (res && res.data && res.data.success) {
        const { temperature, spo2, heartBeat } = res.data.data
        setTemperature(temperature)
        setCovid(spo2)
        setHeartBeat(heartBeat)
        if (res.data.createdAt) {
          setTimeLastest(() => new Date(res.data.createdAt))
        }
        setIsFetchLastest(false)
        return null
      }
      throw new Error(res.data.message || 'Error')
    } catch (error) {
      console.log(error.toString())
      Alert.alert('Failure', `${error.toString()}`, [{ text: 'OK' }])
    }
  }
  const monitor = async (id) => {
    // Alert.alert('Test', `${myServiceUUID}\n${data_ch}`, [
    //   {
    //     text: 'OK',
    //   },
    // ])
    const subscription = manager.monitorCharacteristicForDevice(
      id,
      myServiceUUID,
      data_ch,
      (error, char) => {
        if (error) {
          console.log(error.errorCode)
          if (error.errorCode == 201) {
            connectDevice(id)
          } else if (error.errorCode != 2) {
            Alert.alert('Alert', `${error.errorCode}: ${error.reason}`)
          }
          return null
        }
        if (char.uuid === data_ch) {
          try {
            // header 4 - manual nut nhan app 3 data
            if (decode(char.value).charCodeAt(0) == 4) {
              if (decode(char.value).charCodeAt(5) === 0) {
                setIsLoadingData(false)
                setTimeLastest(null)
              }
              const temp =
                decode(char.value).charCodeAt(1) +
                decode(char.value).charCodeAt(2) * 0.125
              const cov = decode(char.value).charCodeAt(3)
              const beat = decode(char.value).charCodeAt(4)
              setTemperature(temp)
              setCovid(cov)
              setHeartBeat(beat)
              if (decode(char.value).charCodeAt(5) === 2) {
                setIsRequest(false)
              }
              handleFetchOneMetric({
                temperature: temp,
                spo2: cov,
                heartBeat: beat,
              })
            }
            // header 7 - gui dinh ky 1 data
            if (decode(char.value).charCodeAt(0) == 7) {
              setTimeLastest(null)
              const temp =
                decode(char.value).charCodeAt(1) +
                decode(char.value).charCodeAt(2) * 0.125
              const cov = decode(char.value).charCodeAt(3)
              const beat = decode(char.value).charCodeAt(4)
              setTemperature(temp)
              setCovid(cov)
              setHeartBeat(beat)

              setIsLoadingData(false)
              setIsRequest(false)

              handleFetchOneMetric({
                temperature: temp,
                spo2: cov,
                heartBeat: beat,
              })
            }

            // header 6 - old data
            if (decode(char.value).charCodeAt(0) === 6) {
              let listData = []
              let numberOfData = decode(char.value).charCodeAt(1)
              let iter = 1
              let resDecode = decode(char.value)
              while (iter <= numberOfData) {
                let startId = (iter - 1) * 8
                let temperature =
                  resDecode.charCodeAt(startId + 2) +
                  resDecode.charCodeAt(startId + 3) +
                  0.125
                let spo2 = resDecode.charCodeAt(startId + 4)
                let heartBeat = resDecode.charCodeAt(startId + 5)
                let day = resDecode.charCodeAt(startId + 6)
                let month = resDecode.charCodeAt(startId + 7)
                let year = resDecode.charCodeAt(startId + 8) + 1900
                let hours = resDecode.charCodeAt(startId + 9)
                listData.push({
                  temperature,
                  spo2,
                  heartBeat,
                  day,
                  month,
                  year,
                  hours,
                })
                iter = iter + 1
              }
              handleSaveMetric({ listData })
            }
          } catch (error) {
            Alert.alert('Error', error.toString(), [{ text: 'OK' }])
          }
        }
      },
      'monitoring'
    )
  }
  const requestData = async () => {
    try {
      if (connectedDevice.length > 0) {
        let device
        setIsRequest(true)
        setIsLoadingData(true)
        const isConnected = await manager.isDeviceConnected(connectedDevice)

        if (!isConnected) {
          device = await manager.connectToDevice(connectedDevice)
          await device.discoverAllServicesAndCharacteristics()
        }
        await manager.writeCharacteristicWithResponseForDevice(
          connectedDevice,
          myServiceUUID,
          device_ch,
          encode(String.fromCharCode(5))
        )
      } else {
        Alert.alert('Error', 'You have not connected any device yet!')
      }
    } catch (error) {
      Alert.alert('With Response Error', error.toString(), [{ text: 'OK' }])
    }
  }
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
        setEmail(res.data.user.username)
        return null
      }
      throw new Error('Unauthorized')
    } catch (error) {
      console.log(error)
      await AsyncStorage.clear()
      navigation.navigate('Auth')
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear()

      disconnectDevice()
      setDeviceInfo([])
      setEmail('')
      setHeartBeat(-1)
      setTemperature(-1)
      setCovid(-1)
      setTimeLastest(null)
      setTab('activity')
      navigation.navigate('Auth')
    } catch (error) {
      console.log(error)
      Alert.alert('Error', 'Cannot logout!')
    }
  }
  const disconnectDevice = async () => {
    try {
      setConnectedDevice('')
      // await manager.cancelDeviceConnection(id)
      // console.log('disconnect')
      manager.cancelTransaction('monitoring')
      await manager.disable()
      await manager.enable()
    } catch (error) {
      console.log(error)
      Alert.alert('Disconnecting Error', `${error.toString()}`)
    }
  }
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        // Geolocation.requestAuthorization();
        Alert.alert('We will not support ios in near future!', [
          { text: 'OK', onPress: () => handleLogout() },
        ])
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Covid Care App',
            message: 'Covid Care App access to your location!',
          }
        )
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Alert', 'Location permission denied', [
            {
              text: 'OK',
              onPress: () => handleLogout(),
            },
          ])
        }
      }
    } catch (err) {
      console.warn(err)
    }
  }
  const handleSendTimeToHardware = async (id) => {
    const currTime = new Date()
    // Send currTime whenever connection
    await manager.writeCharacteristicWithResponseForDevice(
      id,
      myServiceUUID,
      device_ch,
      encode(
        String.fromCharCode(1) +
          String.fromCharCode(currTime.getDate()) +
          String.fromCharCode(currTime.getMonth()) +
          String.fromCharCode(currTime.getYear()) +
          String.fromCharCode(currTime.getHours()) +
          String.fromCharCode(currTime.getMinutes()) +
          String.fromCharCode(currTime.getSeconds())
      )
    )
  }
  const handleDate = () => {
    const date = new Date(Date.now()).toDateString().split(' ')
    return `${date[0]}, ${date[1]} ${date[2]}, ${date[3]}`
  }
  const getAWeekAgo = () => {
    let week = []

    for (let i = 6; i >= 0; i--) {
      let curr = new Date()
      let first = curr.getDate() - i
      let day = new Date(curr.setDate(first)).toDateString()
      week.push(day)
    }
    return week
  }
  // Convert rssi signal to text
  const handleSignal = (signal) => {
    if (signal < -90) {
      return 'Very low'
    }
    if (signal < -80) {
      return 'Low'
    }
    if (signal < -70) {
      return 'Good'
    }
    if (signal < -60) {
      return 'Very good'
    }
    if (signal < -50) {
      return 'Excellent'
    }
    return 'Unknown'
  }

  React.useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      setBluetoothStatus(state)
    }, true)
    return () => subscription.remove()
  }, [manager])
  React.useEffect(() => {
    // side effects
    handleFetchMe()
    requestLocationPermission()
  }, [handleFetchMe, requestLocationPermission])

  // React.useEffect(() => {
  //   let subscription
  //   if (connectedDevice.length > 0) {
  //     subscription = manager.monitorCharacteristicForDevice(
  //       connectedDevice,
  //       myServiceUUID,
  //       data_ch,
  //       (error, char) => {
  //         if (error) {
  //           console.log(error.errorCode)
  //           if (error.errorCode == 201) {
  //             connectDevice(connectedDevice)
  //           } else {
  //             Alert.alert('Alert', `${error.errorCode}: ${error.reason}`)
  //           }
  //           return null
  //         }
  //         if (char.uuid === data_ch) {
  //           try {
  //             // console.log(decode(char.value).charCodeAt(0))
  //             // let i = 0
  //             // let str = ''
  //             // while (i < decode(char.value).length) {
  //             //   str = str + decode(char.value).charCodeAt(i) + ' '
  //             //   i = i + 1
  //             // }
  //             // console.log(str)
  //             // setTest(str)
  //             if (decode(char.value).charCodeAt(0) == 4) {
  //               if (decode(char.value).charCodeAt(5) === 0) {
  //                 setIsLoadingData(false)
  //               }
  //               const temp =
  //                 decode(char.value).charCodeAt(1) +
  //                 decode(char.value).charCodeAt(2) * 0.125
  //               const cov = decode(char.value).charCodeAt(3)
  //               const beat = decode(char.value).charCodeAt(4)
  //               // console.log({ temp, cov, beat })
  //               setTemperature(temp)
  //               setCovid(cov)
  //               setHeartBeat(beat)
  //               if (decode(char.value).charCodeAt(5) === 2) {
  //                 setIsRequest(false)
  //               }
  //               handleFetchOneMetric({
  //                 temperature: temp,
  //                 spo2: cov,
  //                 heartBeat: beat,
  //               })
  //             }
  //           } catch (error) {
  //             Alert.alert('Error', error.toString(), [{ text: 'OK' }])
  //           }
  //         }
  //       },
  //       'monitoring'
  //     )
  //     handleSendTimeToHardware(connectedDevice)
  //   }
  //   return () => {
  //     if (subscription) subscription.remove()
  //   }
  // }, [manager, connectedDevice])
  React.useEffect(() => {
    setTimeLastest(null)
    handleFetchingLatest()
  }, [focus])
  return (
    <View style={{ flex: 1 }}>
      {tab === 'activity' && (
        <ScrollView style={styles.container}>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.dateText}>{handleDate()}</Text>
              <Text style={styles.headerText}>Daily Activity</Text>
            </View>
            <Image
              style={styles.avatarContainer}
              source={require('../../asset/defaultAvatar.jpg')}
            />
          </View>
          <ScrollView
            style={styles.currWeek}
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current.scrollToEnd({ animated: true })
            }
          >
            {getAWeekAgo().map((item) => {
              const dateItem = new Date(item)
              const newKey = `${dateItem.getDate()}/${dateItem.getMonth()}/${dateItem.getFullYear()}`
              let arr = item.split(' ')
              return (
                <TouchableOpacity
                  key={newKey}
                  style={[
                    styles.currWeekBtn,
                    focus === newKey && { backgroundColor: '#439DEE' },
                  ]}
                  onPress={() => setFocus(newKey)}
                >
                  <Text
                    style={[
                      styles.btnDayText,
                      focus === newKey && { color: '#212437' },
                    ]}
                  >
                    {arr[0]}
                  </Text>
                  <Text style={styles.btnDateText}>{arr[2]}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View style={styles.overviewContainer}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-end',
                }}
              >
                <Text
                  style={[
                    styles.headerText,
                    {
                      fontSize: 20,
                    },
                  ]}
                >
                  Overview
                </Text>
              </View>
              {!isRequest ? (
                <TouchableOpacity
                  onPress={() => {
                    requestData()
                    setFocus(
                      `${new Date().getDate()}/${new Date().getMonth()}/${new Date().getFullYear()}`
                    )
                  }}
                >
                  <Icon name="reload1" type="ant-design" color={'#000'} />
                </TouchableOpacity>
              ) : (
                <ActivityIndicator color="#212437" size={25} />
              )}
            </View>
            <TouchableOpacity
              style={styles.goDetail}
              onPress={() =>
                navigation.navigate('Statistic', {
                  email: email || route?.params?.email,
                  date: focus,
                })
              }
            >
              <View style={styles.overviewComponent}>
                <Icon
                  name="temperature-low"
                  type="font-awesome-5"
                  color="#1BBBCF"
                  style={{
                    width: '30%',
                  }}
                  iconStyle={{ fontSize: 30 }}
                />
                {isLoadingData ? (
                  <Text style={styles.headerText}>-</Text>
                ) : isFetchLastest ? (
                  <ActivityIndicator color={'212437'} />
                ) : (
                  <Text
                    style={[
                      styles.headerText,
                      temperature > 38 && {
                        color: '#ff0000',
                      },
                    ]}
                  >
                    {temperature === -1
                      ? `-`
                      : temperature === 0
                      ? 'N/A'
                      : temperature}
                  </Text>
                )}
                <Text style={styles.btnDayText}>ºC</Text>
              </View>
              <View style={styles.overviewComponent}>
                <Text style={{ fontSize: 20, color: '#70B854' }}>
                  SpO<Text style={{ fontSize: 13, color: '#70B854' }}>2</Text>
                </Text>
                {isLoadingData ? (
                  <Text style={styles.headerText}>-</Text>
                ) : isFetchLastest ? (
                  <ActivityIndicator color={'212437'} />
                ) : (
                  <Text
                    style={[
                      styles.headerText,
                      covid < 96 &&
                        covid > 0 && {
                          color: '#ff0000',
                        },
                    ]}
                  >
                    {covid === -1 ? `-` : covid === 0 ? 'N/A' : covid}
                  </Text>
                )}
                <Text style={styles.btnDayText}>%</Text>
              </View>
              <View style={styles.overviewComponent}>
                <Icon
                  name="heartbeat"
                  type="font-awesome"
                  color="#E47272"
                  style={{
                    width: '30%',
                  }}
                  iconStyle={{ fontSize: 30 }}
                />
                {isLoadingData ? (
                  <Text style={styles.headerText}>-</Text>
                ) : isFetchLastest ? (
                  <ActivityIndicator color={'212437'} />
                ) : (
                  <Text
                    style={[
                      styles.headerText,
                      (heartBeat > 120 ||
                        (heartBeat < 50 && heartBeat > 0)) && {
                        color: '#ff0000',
                      },
                    ]}
                  >
                    {heartBeat === -1
                      ? `-`
                      : heartBeat === 0
                      ? 'N/A'
                      : heartBeat}
                  </Text>
                )}
                <Text style={styles.btnDayText}>BPM</Text>
              </View>
              {timeLastest && (
                <Text
                  style={[
                    styles.headerText,
                    {
                      fontSize: 12,
                      color: '#8D91BD',
                      fontStyle: 'italic',
                      position: 'absolute',
                      bottom: 5,
                      right: 10,
                    },
                  ]}
                >
                  {`at ${moment(timeLastest).format('HH:mm:ss')}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Modal
            isVisible={modalVisible}
            onBackdropPress={() => setModalVisible(false)}
            animationOut="slideOutUp"
          >
            <View
              style={{
                flex: 1,
                backgroundColor: '#F4F3F8',
                padding: 20,
                paddingTop: 40,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                style={{ position: 'absolute', right: 10, top: 10 }}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="closecircleo" type="ant-design" color="#ff0000" />
              </TouchableOpacity>
              {scanLoading && <ActivityIndicator color="#212437" />}
              <ScrollView
                style={{
                  flex: 1,
                  width: '100%',
                  marginTop: 25,
                }}
              >
                {Array.isArray(deviceInfo) &&
                  deviceInfo.length > 0 &&
                  deviceInfo.map((item, id) => (
                    <View
                      key={id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: 10,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <View>
                        <View style={styles.deviceInfoRow}>
                          <Icon
                            name="perm-device-information"
                            type="material-icons"
                            color="#212437"
                          />

                          <Text style={[styles.headerText, { fontSize: 13 }]}>
                            {item.id ? `: ${item.id}` : ': Unknown ID'}
                          </Text>
                        </View>
                        <View style={styles.deviceInfoRow}>
                          <Icon name="user" type="ant-design" color="#212437" />
                          <Text
                            style={[styles.headerText, { fontSize: 13 }]}
                            numberOfLines={1}
                          >
                            {item.name
                              ? item.name.length > 10
                                ? `: ${item.name.slice(0, 12)}...`
                                : `: ${item.name}`
                              : ': ???'}
                          </Text>
                        </View>
                        <View style={styles.deviceInfoRow}>
                          <Icon
                            name="signal-cellular-alt"
                            type="material-icons"
                            color="#212437"
                          />
                          <Text style={[styles.headerText, { fontSize: 13 }]}>
                            {item.rssi
                              ? `: ${handleSignal(item.rssi)}`
                              : `: No signal`}
                          </Text>
                        </View>
                      </View>
                      <View>
                        {isConnecting === item.id ? (
                          <ActivityIndicator
                            color="#212437"
                            size={'large'}
                            style={{ marginRight: 40 }}
                          />
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.connectButton,
                              connectedDevice === item.id
                                ? styles.connectedState
                                : styles.notConnectedState,
                            ]}
                            // Không thể connect nếu đang scan
                            disabled={scanLoading}
                            onPress={async () => {
                              if (connectedDevice === item.id) {
                                disconnectDevice(item.id)
                              } else {
                                connectDevice(item.id)
                              }
                            }}
                          >
                            <Text style={{ color: '#212437', fontSize: 15 }}>
                              {connectedDevice === item.id
                                ? 'Disconnect'
                                : 'Connect'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          </Modal>
        </ScrollView>
      )}
      {tab === 'settings' && (
        <ScrollView style={styles.container}>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.dateText}>{handleDate()}</Text>
              <Text style={styles.headerText}>Settings</Text>
            </View>
            <Image
              style={styles.avatarContainer}
              source={require('../../asset/defaultAvatar.jpg')}
            />
          </View>
          <View
            style={[
              styles.overviewContainer,
              {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              style={[
                styles.headerText,
                {
                  fontSize: 20,
                  opacity: 0.7,
                },
              ]}
            >{`Hi, ${email || route?.params?.email}!`}</Text>
            <View
              style={{
                marginTop: 15,
                backgroundColor: 'white',
                borderRadius: 10,
                padding: 18,
                width: 0.8 * width,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('ShareData')}
              >
                <Text
                  style={[
                    styles.headerText,
                    { fontSize: 18, textAlign: 'center' },
                  ]}
                >
                  Share Data With Others
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop: 15,
                backgroundColor: 'white',
                borderRadius: 10,
                padding: 18,
                width: 0.8 * width,
              }}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <Text
                  style={[
                    styles.headerText,
                    { fontSize: 18, textAlign: 'center' },
                  ]}
                >
                  Change Password
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop: 15,
                backgroundColor: 'white',
                borderRadius: 10,
                padding: 18,
                width: 0.8 * width,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Sign Out', 'Are you sure you want to sign out', [
                    {
                      text: 'Cancel',
                    },
                    {
                      text: 'OK',
                      onPress: () => handleLogout(),
                    },
                  ])
                }
              >
                <Text
                  style={[
                    styles.headerText,
                    { fontSize: 18, textAlign: 'center' },
                  ]}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {
            <Modal
              isVisible={modalVisible}
              onBackdropPress={() => setModalVisible(false)}
              animationOut="slideOutUp"
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F4F3F8',
                  padding: 20,
                  paddingTop: 40,
                  alignItems: 'center',
                }}
              >
                <TouchableOpacity
                  style={{ position: 'absolute', right: 10, top: 10 }}
                  onPress={() => setModalVisible(false)}
                >
                  <Icon name="closecircleo" type="ant-design" color="#ff0000" />
                </TouchableOpacity>

                {scanLoading && <ActivityIndicator color="#212437" />}
                <ScrollView
                  style={{
                    flex: 1,
                    width: '100%',
                    marginTop: 25,
                  }}
                >
                  {Array.isArray(deviceInfo) &&
                    deviceInfo.length > 0 &&
                    deviceInfo.map((item, id) => (
                      <View
                        key={id}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: 10,
                          padding: 10,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <View>
                          <View style={styles.deviceInfoRow}>
                            <Icon
                              name="perm-device-information"
                              type="material-icons"
                              color="#212437"
                            />

                            <Text style={[styles.headerText, { fontSize: 13 }]}>
                              {item.id ? `: ${item.id}` : ': Unknown ID'}
                            </Text>
                          </View>
                          <View style={styles.deviceInfoRow}>
                            <Icon
                              name="user"
                              type="ant-design"
                              color="#212437"
                            />
                            <Text
                              style={[styles.headerText, { fontSize: 13 }]}
                              numberOfLines={1}
                            >
                              {item.name
                                ? item.name.length > 10
                                  ? `: ${item.name.slice(0, 12)}...`
                                  : `: ${item.name}`
                                : ': ???'}
                            </Text>
                          </View>
                          <View style={styles.deviceInfoRow}>
                            <Icon
                              name="signal-cellular-alt"
                              type="material-icons"
                              color="#212437"
                            />
                            <Text style={[styles.headerText, { fontSize: 13 }]}>
                              {item.rssi
                                ? `: ${handleSignal(item.rssi)}`
                                : `: No signal`}
                            </Text>
                          </View>
                        </View>
                        <View style={{ height: '100%' }}>
                          <TouchableOpacity
                            style={[
                              styles.connectButton,
                              connectedDevice === item.id
                                ? styles.connectedState
                                : styles.notConnectedState,
                            ]}
                            // Không thể connect nếu đang scan
                            disabled={scanLoading}
                            onPress={() => {
                              if (connectedDevice === item.id) {
                                disconnectDevice(item.id)
                              } else {
                                connectDevice(item.id)
                              }
                            }}
                          >
                            {isConnecting === item.id ? (
                              <ActivityIndicator color="#212437" />
                            ) : (
                              <Text style={{ color: '#212437', fontSize: 15 }}>
                                {connectedDevice === item.id
                                  ? 'Disconnect'
                                  : 'Connect'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              </View>
            </Modal>
          }
        </ScrollView>
      )}
      <View style={styles.dashboardContainer}>
        <TouchableOpacity onPress={() => setTab('activity')}>
          <Icon
            name="activity"
            type="feather"
            color={tab === 'activity' ? '#439DEE' : '#70789C'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#439DEE',
            borderRadius: 20,
            width: 0.9 * 0.1 * height,
            height: '90%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            setModalVisible(true)
            scanDevice()
          }}
        >
          <Icon name="plus" type="feather" color="#212437" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('settings')}>
          <Icon
            name="settings"
            type="feather"
            color={tab === 'settings' ? '#439DEE' : '#70789C'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F8',
    height: height,
    width: width,
  },
  headerContainer: {
    flex: 1,
    width: width,
    height: 0.15 * height,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardContainer: {
    width: width,
    height: 0.1 * height,
    backgroundColor: '#F4F3F8',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatarContainer: {
    height: 0.05 * height,
    width: 0.05 * height,
    borderRadius: 100,
  },
  dateText: {
    color: '#212437',
    fontSize: 13,
  },
  headerText: {
    color: '#212437',
    fontSize: 22,
    fontWeight: 'bold',
  },
  currWeek: {
    width: width - 20,
    height: 70,
    marginLeft: 20,
  },
  currWeekBtn: {
    backgroundColor: 'white',
    width: 70,
    height: 70,
    borderRadius: 15,
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    marginRight: 10,
  },
  btnDayText: {
    color: '#8D91BD',
    fontSize: 12,
  },
  btnDateText: {
    color: '#212437',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overviewContainer: {
    marginTop: 10,
    padding: 20,
  },
  goDetail: {
    marginTop: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    padding: 25,
    height: 0.23 * height,
  },
  overviewComponent: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  deviceInfoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 20,
  },
  connectedState: {
    backgroundColor: '#ff0000',
  },
  notConnectedState: {
    backgroundColor: '#439DEE',
  },
})
