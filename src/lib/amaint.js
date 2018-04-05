const axios = require('axios');
const { AOBREST_BASE } = require('./constants');

function getUserBio(username, token) {
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

module.exports = {
  getUserBio
};
