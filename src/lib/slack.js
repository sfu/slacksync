const axios = require('axios');
const { SLACK_REST_BASE, SLACK_SCIM_BASE } = require('./constants');

function getUserList(token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `${SLACK_REST_BASE}/users.list`,
      params: {
        token
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

function toggleUserActive(id, state, token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'patch',
      url: `${SLACK_SCIM_BASE}/Users/${id}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        active: state
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

function createUser(user, token) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: `${SLACK_SCIM_BASE}/Users`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        schemas: ['urn:scim:schemas:core:1.0'],
        ...user
      }
    })
      .then(response => {
        if (response.status === 201) {
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
  getUserList,
  toggleUserActive,
  createUser
};
