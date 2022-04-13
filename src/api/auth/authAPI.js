import axios from 'axios'

const baseURL = `http://f-iot-uet.herokuapp.com/api/auth`
export async function register(data) {
  return await axios({
    url: `${baseURL}/register`,
    method: 'POST',
    data,
  })
}
export async function login(data) {
  return await axios({
    url: `${baseURL}/login`,
    method: 'POST',
    data,
  })
}
export async function fetchMe(token) {
  return await axios({
    url: `${baseURL}/me`,
    method: 'GET',
    headers: {
      Authorization: token,
    },
  })
}
