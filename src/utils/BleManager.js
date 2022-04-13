import { BleManager } from 'react-native-ble-plx'

export default class BLE {
  constructor() {
    // super();
    this.manager = new BleManager()
  }
  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (err, device) => {
      if (err) {
        console.log('Lỗi con mẹ mày rồi')
        return
      }

      console.log(device)
    })
  }
}
