const axios = require('axios');
const request = require('request-promise-native');
const puppeteer = require('puppeteer');

const {
  SLACK_REST_BASE,
  SLACK_SCIM_BASE,
  SLACK_ADMIN_URL,
  SLACK_USER_INVITE_API,
  SLACK_USER_SET_RESTRICTED_API
} = require('./constants');

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

const getSlackTokens = async (username, password) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(SLACK_ADMIN_URL);

    await page.evaluate(text => {
      document.querySelector('#email').value = text;
    }, username);
    await page.evaluate(text => {
      document.querySelector('#password').value = text;
    }, password);

    await page.click('#signin_btn');
    await page.waitFor(6000);

    const xId = await page.evaluate(
      () =>
        `${
          window.TS && window.TS.boot_data && window.TS.boot_data.version_uid
            ? window.TS.boot_data.version_uid.substring(0, 8)
            : 'noversion'
        }-${Date.now() / 1000}`
    );

    const apiToken = await page.evaluate(
      () =>
        window.TS && window.TS.boot_data && window.TS.boot_data.api_token
          ? window.TS.boot_data.api_token
          : undefined
    );

    const slackApiTS = await page.evaluate(
      () =>
        window.TS && window.TS.boot_data && window.TS.boot_data.version_ts
          ? window.TS.boot_data.version_ts
          : undefined
    );

    const cookies = await page.cookies();

    await browser.close();
    return { xId, apiToken, slackApiTS, cookies };
  } catch (e) {
    throw e;
  }
};

const getPendingInvitations = async (username, password) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${SLACK_ADMIN_URL}%2Finvites`);

    await page.evaluate(text => {
      document.querySelector('#email').value = text;
    }, username);
    await page.evaluate(text => {
      document.querySelector('#password').value = text;
    }, password);

    await page.click('#signin_btn');

    await page.waitForFunction(
      () => window && window.boot_data && window.boot_data.pending_invites,
      {
        timeout: 60000,
        polling: 500
      }
    );
    const pending = await page.evaluate(
      () =>
        window && window.boot_data && window.boot_data.pending_invites
          ? window.boot_data.pending_invites
          : undefined
    );
    await browser.close();
    return pending;
  } catch (e) {
    throw e;
  }
};

const generateInviteDataForUser = (u, channels, token, message) => {
  const data = {
    ...u,
    token,
    channels: channels.join(','),
    source: 'invite_modal',
    mode: 'manual',
    set_active: 'true'
  };

  if (channels.length === 1) {
    data['ultra_restricted'] = '1';
  } else {
    data['restricted'] = '1';
  }

  if (message) {
    data.extra_message = message;
  }
  return data;
};

const generatePromotionRequestDataForUser = (u, channels, token) => ({
  user: u.id,
  channels: channels.join(','),
  token
});

// this uses `request` instead of `axios` since the former
// natively supports FormData, while the latter doesn't
const generateInvitationRequest = (formData, { xId, slackApiTS, cookies }) =>
  request({
    method: 'POST',
    url: `${SLACK_USER_INVITE_API}?_x_id=${xId}`,
    formData,
    headers: {
      accept: '*/*',
      'cache-control': 'no-cache',
      cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      'x-slack-version-ts': slackApiTS,
      origin: 'https://sfuits.slack.com',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    }
  });

const convertSingleChannelGuestToMultiChannel = (
  formData,
  { xId, slackApiTS, cookies }
) =>
  request({
    method: 'POST',
    url: `${SLACK_USER_SET_RESTRICTED_API}?_x_id=${xId}`,
    formData,
    headers: {
      accept: '*/*',
      'cache-control': 'no-cache',
      cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      'x-slack-version-ts': slackApiTS,
      origin: 'https://sfuits.slack.com',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    }
  });

const getUserChannelIds = (user, token) =>
  new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: `${SLACK_REST_BASE}/users.conversations`,
      params: {
        token,
        user,
        exclude_archived: true,
        limit: 1000,
        types: 'public_channel'
      }
    })
      .then(response => {
        if (response.status === 200) {
          const ids = response.data.channels.map(c => c.id);
          resolve(ids);
        } else {
          reject(response);
        }
      })
      .catch(response => {
        reject(response);
      });
  });

const inviteUserToChannels = async (data, token) => {
  const { user, inviteTo } = data;
  const promises = inviteTo.map(
    (channel, i) =>
      new Promise((resolve, reject) =>
        axios({
          method: 'post',
          url: `${SLACK_REST_BASE}/channels.invite`,
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: {
            channel,
            user: user.id
          }
        })
          .then(response => {
            if (response.status === 200) {
              if (response.data.ok) {
                resolve({
                  user,
                  ok: response.data.ok,
                  channel: response.data.channel.id
                });
              } else {
                resolve({
                  user,
                  ok: response.data.ok,
                  error: response.data.error
                });
              }
            } else {
              reject(response);
            }
          })
          .catch(response => {
            reject(response);
          })
      )
  );
  return await Promise.all(promises);
};

module.exports = {
  getUserList,
  toggleUserActive,
  createUser,
  getSlackTokens,
  getPendingInvitations,
  generateInviteDataForUser,
  generatePromotionRequestDataForUser,
  generateInvitationRequest,
  convertSingleChannelGuestToMultiChannel,
  getUserChannelIds,
  inviteUserToChannels
};
