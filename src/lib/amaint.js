import axios from 'axios';
import { AOBREST_BASE } from './constants';

export function getUserBio(username, token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `${AOBREST_BASE}/datastore2/global/userBio.js`,
      params: {
        username,
        art: token
      }
    })
      .then(response => {
        if (response.status === 200) {
          resolve(response.data);
        } else {
          reject(response);
        }
      })
      .catch(response => {
        reject(response);
      });
  });
}
