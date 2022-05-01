import axios from 'axios'

const baseURL = `http://f-iot-uet.herokuapp.com/api/sharing`
export async function addSharing(token, data) {
  return await axios({
    url: `${baseURL}/add-sharing`,
    method: 'POST',
    headers: {
      Authorization: token,
    },
    data,
  })
}
export async function getSharing(token, params) {
  return await axios({
    url: `${baseURL}/get-list-friend-data`,
    method: 'GET',
    headers: {
      Authorization: token,
    },
    params
  })
}
