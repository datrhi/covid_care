import AsyncStorage from '@react-native-async-storage/async-storage'
import { decode, encode } from 'base-64'
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

const { width, height } = Dimensions.get('window')
const myServiceUUID = '12345678-1234-1234-1234-12345678910a'

const device_ch = '12345678-1234-1234-1234-12345678910b'
const data_ch = '12345678-1234-1234-1234-12345678910a'
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
  const [connectedDevice, setConnectedDevice] = React.useState([])

  // test
  const [test, setTest] = React.useState('')

  // metric
  const [temperature, setTemperature] = React.useState(-1)
  const [covid, setCovid] = React.useState(-1)
  const [heartBeat, setHeartBeat] = React.useState(-1)

  // scroll ref
  const scrollViewRef = React.useRef()

  // state action
  const [scanLoading, setScanLoading] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isRequest, setIsRequest] = React.useState(false)
  const [isLoadingData, setIsLoadingData] = React.useState(false)
  const manager = new BleManager()
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
      setIsConnecting(true)
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
        device = await manager.connectToDevice(id)
        await device.discoverAllServicesAndCharacteristics()
      }
      const currTime = new Date()
      monitor(id)
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
        if (device) {
          setConnectedDevice((s) => {
            const newS = s.filter((item) => item !== device.id)
            return newS
          })
          Alert.alert(
            'Disconected',
            `DeviceId: ${device.id} is disconnected!`,
            [{ text: 'OK' }]
          )
        }
      })
      setConnectedDevice((s) => [...new Set([...s, id])])
      setIsConnecting(false)
    } catch (error) {
      console.log(error)
      Alert.alert('Connecting Error', `${error.toString()}`)
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
          Alert.alert('Alert', `${error.errorCode}: ${error.reason}`)
          return null
        }
        if (char.uuid === data_ch) {
          try {
            if (
              // decode(char.value).length === 11 &&
              decode(char.value).charCodeAt(0) === 4
            ) {
              setIsLoadingData(false)
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
            }

            if (decode(char.value).charCodeAt(0) === 6) {
              let data = ''
              let numberOfData = decode(char.value).charCodeAt(1)
              let iter = 1
              let resDecode = decode(char.value)
              // test = decode(char.value)
              while (iter <= numberOfData) {
                let startId = (iter - 1) * 10
                let temp =
                  resDecode.charCodeAt(startId + 2) +
                  resDecode.charCodeAt(startId + 3) +
                  0.125
                let cov = resDecode.charCodeAt(startId + 4)
                let beat = resDecode.charCodeAt(startId + 5)
                let date = resDecode.charCodeAt(startId + 6)
                let month = resDecode.charCodeAt(startId + 7)
                let year = resDecode.charCodeAt(startId + 8)
                let hour = resDecode.charCodeAt(startId + 9)
                let minute = resDecode.charCodeAt(startId + 10)
                let second = resDecode.charCodeAt(startId + 11)
                let newData = `${date}/${month}/${year} ${hour}:${minute}:${second}\nNhiet do: ${temp}, SpO2: ${cov}, Nhip tim: ${beat}\n`
                data = data + newData
                // resDecode = resDecode.slice(10)
                iter = iter + 1
              }
              setTest(data)
              // Alert.alert(
              //   'DATA',
              //   `Total record: ${numberOfData}\nData: ${data}`
              // )
            }
            // let test = decode(char.value)
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
        setIsRequest(true)
        setIsLoadingData(true)
        const isConnected = await manager.isDeviceConnected(connectedDevice[0])

        if (!isConnected) {
          device = await manager.connectToDevice(connectedDevice[0])
          await device.discoverAllServicesAndCharacteristics()
        }
        await manager.writeCharacteristicWithResponseForDevice(
          connectedDevice[0],
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
      manager.cancelTransaction('monitoring')

      // if (connectedDevice.length > 0) {
      //   const isConnected = await manager.isDeviceConnected(connectedDevice[0])
      //   if (isConnected) {
      //     await manager.cancelDeviceConnection(connectedDevice[0])
      //   } else {
      //     device = await manager.connectToDevice(connectedDevice[0])
      //     await device.discoverAllServicesAndCharacteristics()
      //     await manager.cancelDeviceConnection(connectedDevice[0])
      //   }
      // }
      await manager.disable()
      await manager.enable()
      setDeviceInfo([])
      setEmail('')
      setHeartBeat(0)
      setTemperature(0)
      setCovid(0)
      setTab('activity')
      await AsyncStorage.clear()
      navigation.navigate('Auth')
    } catch (error) {
      console.log(error)
      Alert.alert('Error', 'Cannot logout!')
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

  const renderCurrentWeek = React.useMemo(
    () =>
      getAWeekAgo().map((item) => {
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
      }),
    [setFocus, getAWeekAgo, focus]
  )
  const renderOverview = React.useMemo(
    () => (
      <View style={styles.overviewContainer}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
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
          {!isRequest && (
            <TouchableOpacity onPress={() => requestData()}>
              <Icon name="reload1" type="ant-design" color={'#000'} />
            </TouchableOpacity>
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
              <ActivityIndicator />
            ) : (
              <Text style={styles.headerText}>
                {temperature === -1 ? `-` : temperature}
              </Text>
            )}
            <Text style={styles.btnDayText}>Celsius</Text>
          </View>
          <View style={styles.overviewComponent}>
            <Text style={{ fontSize: 23, color: '#70B854' }}>
              SpO<Text style={{ fontSize: 13, color: '#70B854' }}>2</Text>
            </Text>
            {isLoadingData ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.headerText}>
                {covid === -1 ? `-` : covid}
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
              <ActivityIndicator />
            ) : (
              <Text style={styles.headerText}>
                {heartBeat === -1 ? `-` : heartBeat}
              </Text>
            )}
            <Text style={styles.btnDayText}>BPM</Text>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [sendSignal, connectedDevice.length, temperature, covid, heartBeat]
  )
  const renderDashboard = () => (
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
        onPress={() => setModalVisible(true)}
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
  )
  const renderModal = React.useMemo(
    () => (
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
          <Text
            style={[styles.headerText, { textAlign: 'center' }]}
          >{`Bluetooth status`}</Text>
          <Text
            style={[
              styles.headerText,
              { textAlign: 'center', color: '#439DEE' },
            ]}
          >
            {bluetoothStatus}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 25,
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 15,
              width: 0.75 * width,
            }}
            disabled={scanLoading}
            onPress={() => scanDevice()}
          >
            <Text
              style={[styles.headerText, { textAlign: 'center', fontSize: 15 }]}
            >
              {scanLoading ? <ActivityIndicator color="#212437" /> : 'SCAN'}
            </Text>
          </TouchableOpacity>
          <Text>{test}</Text>
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
                  <View style={{ height: '100%' }}>
                    <TouchableOpacity
                      style={[
                        styles.connectButton,
                        connectedDevice.includes(item.id)
                          ? styles.connectedState
                          : styles.notConnectedState,
                      ]}
                      // Không thể connect nếu đang scan
                      disabled={
                        scanLoading || connectedDevice.includes(item.id)
                      }
                      onPress={() => connectDevice(item.id)}
                    >
                      {isConnecting ? (
                        <ActivityIndicator color="#212437" />
                      ) : (
                        <Text style={{ color: '#212437', fontSize: 15 }}>
                          {connectedDevice?.includes(item.id)
                            ? 'Connected'
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
    ),
    [
      connectDevice,
      scanLoading,
      bluetoothStatus,
      scanDevice,
      modalVisible,
      setModalVisible,
      handleSignal,
      deviceInfo,
      connectedDevice,
      test,
    ]
  )
  const renderActivity = React.useMemo(
    () => (
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
          {renderCurrentWeek}
        </ScrollView>
        {renderOverview}
        {renderModal}
      </ScrollView>
    ),
    [handleDate, renderCurrentWeek, renderOverview, renderModal]
  )
  const renderSettings = React.useMemo(
    () => (
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
            { display: 'flex', justifyContent: 'center', alignItems: 'center' },
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
              padding: 25,
            }}
          >
            <TouchableOpacity onPress={() => handleLogout()}>
              <Text style={styles.headerText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        {renderModal}
      </ScrollView>
    ),
    [email, route?.params?.email, renderModal]
  )
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

  return (
    <View style={{ flex: 1 }}>
      {tab === 'activity' && renderActivity}
      {tab === 'settings' && renderSettings}
      {renderDashboard()}
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
    height: 0.2 * height,
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
