import React from 'react'
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'
import { Icon } from 'react-native-elements'
import {
  Area,
  Chart,
  HorizontalAxis,
  Line,
  Tooltip,
  VerticalAxis,
} from 'react-native-responsive-linechart'

const { width, height } = Dimensions.get('window')
const padding = { left: 40, bottom: 20, right: 20, top: 30 }
const mockSpO2 = [
  { x: 0, y: 86 },
  { x: 1, y: 90 },
  { x: 2, y: 96 },
  { x: 3, y: 80 },
  { x: 4, y: 100 },
  { x: 5, y: 96 },
  { x: 6, y: 98 },
  { x: 7, y: 100 },
  { x: 8, y: 96 },
  { x: 9, y: 90 },
  { x: 11, y: 95 },
  { x: 12, y: 91 },
  { x: 13, y: 87 },
  { x: 14, y: 98 },
  { x: 15, y: 99 },
  { x: 16, y: 100 },
  { x: 17, y: 95 },
  { x: 18, y: 92 },
  { x: 19, y: 84 },
  { x: 20, y: 91 },
  { x: 21, y: 92 },
  { x: 22, y: 95 },
  { x: 23, y: 87 },
]
const mockTemp = [
  { x: 0, y: 35 },
  { x: 1, y: 36.125 },
  { x: 2, y: 37 },
  { x: 3, y: 38 },
  { x: 4, y: 35 },
  { x: 5, y: 40 },
  { x: 6, y: 41 },
  { x: 7, y: 37 },
  { x: 8, y: 35.125 },
  { x: 9, y: 36.625 },
  { x: 11, y: 38.625 },
  { x: 12, y: 40 },
  { x: 13, y: 37 },
  { x: 14, y: 38 },
  { x: 15, y: 39 },
  { x: 16, y: 36 },
  { x: 17, y: 37 },
  { x: 18, y: 36 },
  { x: 19, y: 38 },
  { x: 20, y: 39 },
  { x: 21, y: 37 },
  { x: 22, y: 37 },
  { x: 23, y: 37 },
]
const mockHb = [
  { x: 0, y: Math.random() * 100 + 70 },
  { x: 1, y: Math.random() * 100 + 70 },
  { x: 2, y: Math.random() * 100 + 70 },
  { x: 3, y: Math.random() * 100 + 70 },
  { x: 4, y: Math.random() * 100 + 70 },
  { x: 5, y: Math.random() * 100 + 70 },
  { x: 6, y: Math.random() * 100 + 70 },
  { x: 7, y: Math.random() * 100 + 70 },
  { x: 8, y: Math.random() * 100 + 70 },
  { x: 9, y: Math.random() * 100 + 70 },
  { x: 11, y: Math.random() * 100 + 70 },
  { x: 12, y: Math.random() * 100 + 70 },
  { x: 13, y: Math.random() * 100 + 70 },
  { x: 14, y: Math.random() * 100 + 70 },
  { x: 15, y: Math.random() * 100 + 70 },
  { x: 16, y: Math.random() * 100 + 70 },
  { x: 17, y: Math.random() * 100 + 70 },
  { x: 18, y: Math.random() * 100 + 70 },
  { x: 19, y: Math.random() * 100 + 70 },
  { x: 20, y: Math.random() * 100 + 70 },
  { x: 21, y: Math.random() * 100 + 70 },
  { x: 22, y: Math.random() * 100 + 70 },
  { x: 23, y: Math.random() * 100 + 70 },
]
export default function StatisticScreen({ navigation, route }) {
  const [greetings, setGreetings] = React.useState('Good Morning')

  const [focus, setFocus] = React.useState('Temperature')
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
  React.useLayoutEffect(() => {
    if (new Date().getHours() < 12 && new Date().getHours() >= 5) {
      setGreetings('Good Morning')
    } else if (new Date().getHours() < 18 && new Date().getHours() >= 12) {
      setGreetings('Good Afternoon')
    } else {
      setGreetings('Good Evening')
    }
  }, [new Date().getHours(), setGreetings])
  const renderMetricSelect = React.useMemo(
    () =>
      ['Temperature', 'SpO2', 'Heart rate'].map((item) => {
        return (
          <TouchableOpacity
            key={item}
            style={[
              styles.metricSelectButton,
              focus === item && { backgroundColor: '#F3F4F8' },
            ]}
            onPress={() => setFocus(item)}
          >
            {item === 'Temperature' && (
              <Icon
                name="temperature-low"
                type="font-awesome-5"
                color="#1BBBCF"
                iconStyle={{ fontSize: 40 }}
              />
            )}
            {item === 'Heart rate' && (
              <Icon
                name="heartbeat"
                type="font-awesome"
                color="#E47272"
                iconStyle={{ fontSize: 40 }}
              />
            )}
            {item === 'SpO2' && (
              <Text style={{ fontSize: 23, color: '#70B854' }}>
                SpO<Text style={{ fontSize: 13, color: '#70B854' }}>2</Text>
              </Text>
            )}
            <Text
              style={[
                styles.btnMetricText,
                focus === item && { color: '#212437' },
              ]}
            >
              {item}
            </Text>
            <Text style={[styles.btnMetricText, { fontSize: 12 }]}>
              {item === 'Temperature'
                ? 'Celsius/hour'
                : item === 'SpO2'
                ? '%/hour'
                : 'BPM/hour'}
            </Text>
          </TouchableOpacity>
        )
      }),
    [setFocus, focus]
  )
  return (
    <View style={mapGreetingsToStyle(greetings, 'container')}>
      <View style={mapGreetingsToStyle(greetings, 'headerContainer')}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" type="material-icons" color="#000" />
        </TouchableOpacity>
        <Text
          style={mapGreetingsToStyle(greetings, 'headerText')}
        >{`${greetings}`}</Text>
      </View>
      <ScrollView style={mapGreetingsToStyle(greetings, 'screenContainer')}>
        <View
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 8,
          }}
        >
          <Text
            style={[
              mapGreetingsToStyle(greetings, 'headerText'),
              { fontSize: 15 },
            ]}
          >
            {`Yourself on ${route?.params?.date}`}
          </Text>

          <Chart
            style={{ height: 200, width: '100%' }}
            data={
              focus === 'Temperature'
                ? mockTemp
                : focus === 'SpO2'
                ? mockSpO2
                : mockHb
            }
            padding={padding}
            xDomain={{ min: 0, max: 23 }}
            yDomain={
              focus === 'Temperature'
                ? { min: 30, max: 50 }
                : focus === 'SpO2'
                ? { min: 0, max: 100 }
                : { min: 0, max: 220 }
            }
            viewport={{ size: { width: 12 } }}
          >
            <VerticalAxis
              tickValues={
                focus === 'Temperature'
                  ? [36, 40, 50]
                  : focus === 'SpO2'
                  ? [50, 100]
                  : [0, 50, 100, 150, 200, 220]
              }
              theme={{
                axis: {
                  visible: true,
                  stroke: { color: '#000', width: 1 },
                },
              }}
            />
            <HorizontalAxis
              tickValues={[
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                19, 20, 21, 22, 23,
              ]}
              theme={{
                axis: {
                  visible: true,
                  stroke: { color: '#000', width: 1 },
                },
              }}
            />
            <Line
              tooltipComponent={<Tooltip />}
              theme={{
                stroke: { color: '#44bd32', width: 5 },
                scatter: {
                  default: { width: 8, height: 8, rx: 4, color: '#44ad32' },
                  selected: { color: 'red' },
                },
              }}
            />
          </Chart>

          <ScrollView
            style={styles.metricScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {renderMetricSelect}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F8',
    padding: 20,
  },
  screenContainer: {
    flex: 1,
    // width: width,
    height: height,
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
  metricSelectButton: {
    backgroundColor: 'rgba(244, 243, 248, 0.3)',
    width: 140,
    height: 140,
    borderRadius: 15,
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    marginRight: 10,
  },
  btnMetricText: {
    color: '#8D91BD',
    fontSize: 16,
  },
  metricScroll: {
    width: width - 80,
    height: 140,
  },
})
