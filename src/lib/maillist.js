import axios from 'axios';
import { MLREST_BASE } from './constants';

// workaround for MLREST's borked SSL cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export function getMaillist(list, token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `${MLREST_BASE}/maillists/${list}?sfu_token=${token}`
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

export function getMaillistMembers(list, token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `${MLREST_BASE}/maillists/${list}/members?sfu_token=${token}`
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
