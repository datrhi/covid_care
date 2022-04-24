import React from 'react'
import {
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Icon } from 'react-native-elements'
import { Line } from 'react-native-responsive-linechart'
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import {
  AreaChart,
  Grid,
  LineChart,
  XAxis,
  YAxis,
} from 'react-native-svg-charts'
const { width, height } = Dimensions.get('window')
const padding = { left: 40, bottom: 20, right: 20, top: 30 }

export default function StatisticScreen({ navigation, route }) {
  const [greetings, setGreetings] = React.useState('Good Morning')

  const [focus, setFocus] = React.useState('Temperature')
  const [keyList] = React.useState([...Array(24).keys()])
  const [chartData, setChartData] = React.useState([])

  const [unit, setUnit] = React.useState('ºC')
  const size = React.useRef(keyList.length)

  const [positionX, setPositionX] = React.useState(-1) // The currently selected X coordinate position
  const apx = (size = 0) => {
    let width = Dimensions.get('window').width - 60
    return (width / 750) * size
  }
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        updatePosition(evt.nativeEvent.locationX)
        return true
      },
      onPanResponderMove: (evt, gestureState) => {
        updatePosition(evt.nativeEvent.locationX)
        return true
      },
      // onPanResponderRelease: () => {
      //   setPositionX(-1)
      // },
    })
  )

  const updatePosition = (x) => {
    const YAxisWidth = apx(130)
    const x0 = apx(0) // x0 position
    const chartWidth = apx(750) - YAxisWidth - x0
    const xN = x0 + chartWidth //xN position
    const xDistance = chartWidth / size.current // The width of each coordinate point
    if (x <= x0) {
      x = x0
    }
    if (x >= xN) {
      x = xN
    }

    // console.log((x - x0) )

    // The selected coordinate x :
    // (x - x0)/ xDistance = value
    let value = ((x - x0) / xDistance).toFixed(0)
    if (value >= size.current - 1) {
      value = size.current - 1 // Out of chart range, automatic correction
    }

    setPositionX(Number(value))
  }

  const CustomGrid = ({ x, y, ticks }) => (
    <G>
      {
        // Horizontal grid
        ticks.map((tick) => (
          <Line
            key={tick}
            x1="0%"
            x2="100%"
            y1={y(tick)}
            y2={y(tick)}
            stroke="green"
          />
        ))
      }
      {
        // Vertical grid
        chartData.map((_, index) => (
          <Line
            key={index.toString()}
            y1="0%"
            y2="100%"
            x1={x(index)}
            x2={x(index)}
            stroke="green"
          />
        ))
      }
    </G>
  )

  const CustomLine = ({ line }) => (
    <Path key="line" d={line} stroke="green" strokeWidth={apx(6)} fill="none" />
  )

  const CustomGradient = () => (
    <Defs key="gradient">
      <LinearGradient id="gradient" x1="0" y="0%" x2="0%" y2="100%">
        {/* <Stop offset="0%" stopColor="rgb(134, 65, 244)" /> */}
        {/* <Stop offset="100%" stopColor="rgb(66, 194, 244)" /> */}

        <Stop offset="0%" stopColor="green" stopOpacity={0.25} />
        <Stop offset="100%" stopColor="green" stopOpacity={0} />
      </LinearGradient>
    </Defs>
  )

  const Tooltip = ({ x, y, ticks }) => {
    if (positionX < 0) {
      return null
    }

    const ind = keyList[positionX]

    return (
      <G x={x(positionX)} key="tooltip">
        <G
          x={positionX > size.current / 2 ? -apx(300 + 10) : apx(10)}
          y={y(chartData[positionX]) - apx(10)}
        >
          <Rect
            y={-apx(24 + 24 + 20) / 2}
            rx={apx(12)} // borderRadius
            ry={apx(12)} // borderRadius
            width={apx(300)}
            height={apx(96)}
            stroke="rgba(254, 190, 24, 0.27)"
            fill="rgba(255, 255, 255, 0.8)"
          />

          <SvgText x={apx(20)} fill="green" opacity={0.65} fontSize={apx(24)}>
            {ind}h
          </SvgText>
          <SvgText
            x={apx(20)}
            y={apx(24 + 20)}
            fontSize={apx(24)}
            fontWeight="bold"
            fill="red"
          >
            {`${chartData[positionX]} ${unit}`}
          </SvgText>
        </G>

        <G x={x}>
          <Line
            y1={ticks[0]}
            y2={ticks[Number(ticks.length)]}
            stroke="#FEBE18"
            strokeWidth={apx(4)}
            strokeDasharray={[6, 3]}
          />

          <Circle
            cy={y(chartData[positionX])}
            r={apx(20 / 2)}
            stroke="#fff"
            strokeWidth={apx(2)}
            fill="green"
          />
        </G>
      </G>
    )
  }

  const verticalContentInset = { top: apx(40), bottom: apx(40) }
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
      [
        { typeChart: 'Temperature', unit: 'ºC' },
        { typeChart: 'SpO2', unit: '%' },
        { typeChart: 'Heart rate', unit: 'BPM' },
      ].map((item) => {
        return (
          <TouchableOpacity
            key={item.typeChart}
            style={[
              styles.metricSelectButton,
              focus === item.typeChart && { backgroundColor: '#F3F4F8' },
            ]}
            onPress={() => {
              setFocus(item.typeChart)
              setUnit(item.unit)
              setPositionX(-1)
            }}
          >
            {item.typeChart === 'Temperature' && (
              <Icon
                name="temperature-low"
                type="font-awesome-5"
                color="#1BBBCF"
                iconStyle={{ fontSize: 40 }}
              />
            )}
            {item.typeChart === 'Heart rate' && (
              <Icon
                name="heartbeat"
                type="font-awesome"
                color="#E47272"
                iconStyle={{ fontSize: 40 }}
              />
            )}
            {item.typeChart === 'SpO2' && (
              <Text style={{ fontSize: 23, color: '#70B854' }}>
                SpO<Text style={{ fontSize: 13, color: '#70B854' }}>2</Text>
              </Text>
            )}
            <Text
              style={[
                styles.btnMetricText,
                focus === item.typeChart && { color: '#212437' },
              ]}
            >
              {item.typeChart}
            </Text>
            {/* <Text style={[styles.btnMetricText, { fontSize: 12 }]}>
              {item.typeChart === 'Temperature'
                ? 'Celsius/hour'
                : item.typeChart === 'SpO2'
                ? '%/hour'
                : 'BPM/hour'}
            </Text> */}
          </TouchableOpacity>
        )
      }),
    [setFocus, focus]
  )

  React.useEffect(() => {
    switch (focus) {
      case 'Temperature':
        setChartData(
          Array(24)
            .fill()
            .map(() => Math.round(36 + Math.random() * 4))
        )
        break

      case 'SpO2':
        setChartData(
          Array(24)
            .fill()
            .map(() => Math.round(80 + Math.random() * 20))
        )
      case 'Heart rate':
        setChartData(
          Array(24)
            .fill()
            .map(() => Math.round(50 + Math.random() * 100))
        )
      default:
        break
    }
  }, [focus])
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

          {/* Chart  */}
          <View
            style={{
              flexDirection: 'row',
              width: apx(750),
              height: apx(570),
              alignSelf: 'stretch',
            }}
          >
            <View style={{ flex: 1 }} {...panResponder.current.panHandlers}>
              <AreaChart
                style={{ flex: 1, paddingLeft: 20 }}
                data={chartData}
                // curve={shape.curveNatural}
                // curve={shape.curveMonotoneX}
                contentInset={{ ...verticalContentInset }}
                svg={{ fill: 'url(#gradient)' }}
              >
                <CustomLine />
                <CustomGrid />
                <CustomGradient />
                <Tooltip />
              </AreaChart>
            </View>

            <YAxis
              style={{ width: apx(130) }}
              data={chartData}
              contentInset={verticalContentInset}
              svg={{ fontSize: apx(20), fill: '#617485' }}
            />
          </View>
          <XAxis
            style={{
              alignSelf: 'stretch',
              // marginTop: apx(57),
              width: apx(750),
              height: apx(60),
            }}
            numberOfTicks={7}
            data={chartData}
            formatLabel={(value, index) => keyList[value]}
            contentInset={{
              left: apx(36),
              right: apx(130),
            }}
            svg={{
              fontSize: apx(20),
              fill: '#617485',
              y: apx(20),
              // originY: 30,
            }}
          />
          {/* End Chart  */}
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
