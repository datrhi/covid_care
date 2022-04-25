import axios from 'axios'

const baseURL = `http://f-iot-uet.herokuapp.com/api/metric`
export async function createOneMetric(token, data) {
  return await axios({
    url: `${baseURL}/create-metric`,
    method: 'POST',
    headers: {
      Authorization: token,
    },
    data,
  })
}
export async function getLatestData(token, params) {
  return await axios({
    url: `${baseURL}/get-lastest`,
    method: 'GET',
    headers: {
      Authorization: token,
    },
    params
  })
}