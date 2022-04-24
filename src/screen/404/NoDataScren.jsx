import React from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width, height } = Dimensions.get('window')

export default function NoDataScreen({ navigation }) {
  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>404</Text>
        <Text style={styles.subHeader}>Page Not Found!</Text>
      </View>
      <View style={styles.iconView}>
        <Image style={styles.imageView} source={require('../../asset/test2.jpg')} />
      </View>
      <View style={styles.actionView}>
        <Text style={styles.textView}>We're sorry, the page you requested could not be found. Please go back!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.textBtn}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flex: 3,
    paddingHorizontal: '10%',
    paddingTop: '10%',
    width: '100%',
  },
  header: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#439DEE',
  },
  imageView: {
    width: width*0.8,
  },  
  subHeader: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#439DEE',
  },
  iconView: {
    flex: 5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionView: {
    flex: 3,
    paddingHorizontal: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textView: {
    flex: 1,
    fontSize: 20,
    color: '#B4B4B4',
  },
  button: {
    backgroundColor: '#439DEE',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10%',
    borderRadius: 20
  },
  textBtn: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20
  }
})
