const axios = require('axios');
const { MLREST_BASE } = require('./constants');

// workaround for MLREST's borked SSL cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function getMaillist(list, token) {
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

function getMaillistMembers(list, token) {
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

module.exports = { getMaillist, getMaillistMembers };
