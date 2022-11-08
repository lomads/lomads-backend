const Persist = require('../modules/persist/persist.model');
const _ = require('lodash');
const axios = require('axios')
const moment = require('moment')
const { Block } = require('@nishans/permissions')
const config = require('@config/config')

const parseCookie = str =>
  str.split(';').map(v => v.split('=')).reduce((acc, v) => {
      acc[v[0].trim()] = v[1] ? v[1].trim() : null;
      return acc;
  }, {});

const options = auth => {
    return {
        headers: {
            Cookie: `token_v2=${auth.token_v2}`,
            'Content-Type': 'application/json',
        }
    }
}

const login = async () => {
    axios.post(`https://www.notion.so/api/v3/loginWithEmail`, {
        email: config.notion.email,
        password: config.notion.password
    })
    .then(async res => {
        if(typeof res.data !== 'string'){
            const tokenCookie = res.headers['set-cookie'].filter(c => c.indexOf('token_v2') > -1)
            let cookie = parseCookie(tokenCookie[0])
            console.log(cookie.token_v2)
            let payload = {
                token_v2: cookie.token_v2,
                userId: res.data.userId
            }
            await Persist.findOneAndUpdate({ key: 'APP_NOTION_CREDENTIALS' }, { key: "APP_NOTION_CREDENTIALS", value: payload }, { new: true, upsert: true });
            console.log("getNotionToken::fresh-fetch", payload)
            return payload
        } else {
            return null
        }
    })
    .catch(e => {
        console.log(e)
        return null
    })
}

const getNotionToken = async () => {
   const credentials = await Persist.findOne({ key: 'APP_NOTION_CREDENTIALS' })
   if(credentials && credentials.value) {
        return axios.post('https://www.notion.so/api/v3/getSpaces', {}, options(credentials.value))
        .then(res => {
            console.log("getNotionToken::database", credentials.value)
            return credentials.value;
        })
        .catch(async e => {
            console.log(e)
            if(e.response.status === 401) {
                return await login();
            }
            return null;
        })
   } 
   return await login();
}

const getSpaceByDomain = async domain => {
    const auth = await getNotionToken();
    if(auth) {
        console.log(domain)
        return axios.post('https://www.notion.so/api/v3/getPublicPageData', { "type":"block-space", "name":"space", "spaceDomain":domain, "requestedOnPublicDomain":false }, options(auth))
        .then(result => {
             console.log(result.data)
             return result.data;
         })
         .catch(async e => {
            console.log(e)
             if(e.response.status === 401)
                return await login()
             return e;
         })
    }
}

const checkSpaceAdminStatus = async domain => {
    const auth = await getNotionToken();
    if(auth) {
        const space = await getSpaceByDomain(domain);
        if(space && space.spaceId) {
            return axios.post('https://www.notion.so/api/v3/getSpaces', {}, options(auth))
            .then(res => {
                if(res && typeof res.data !== 'string') {
                    const spc = _.get(res.data, `${auth.userId}.space.${space.spaceId}`, null)
                    if(spc && spc.role === 'editor') {
                        console.log(spc.value.permissions)
                        return { status: true }
                    }
                    return { status: false, message: `Something went wrong. Please try after sometime` }
                }
                return { status: false, message: `No admin privilege for ${config.notion.email}` }
            })
        } else {
            return { status: false, message: 'Domain does not exist' }
        }
    }
}

const findNotionUserByEmail = async email => {
    const auth = await getNotionToken();
    if(auth) {
        return axios.post(`https://www.notion.so/api/v3/findUser`, { email }, options(auth)).then(res => res.data)
    }
}

const inviteUserToNotionBlock = async ({ spaceId, blockId, inviteeId }) => {
    const auth = await getNotionToken();
    if(auth) {
        const payload = await prepareInviteObject({ spaceId, blockId, inviteeId, auth })
        return axios.post(`https://www.notion.so/api/v3/saveTransactions`, payload, options(auth))
        .then(res => console.log(res))
    }
}

const removeUserFromNotionBlock = async ({ spaceId, blockId, inviteeId }) => {
    const auth = await getNotionToken();
    if(auth) {
        const payload = await prepareRemoveUserObject({ spaceId, blockId, inviteeId, auth })
        return axios.post(`https://www.notion.so/api/v3/saveTransactions`, payload, options(auth))
        .then(res => console.log(res))
    }
}

const prepareInviteObject = async ({ spaceId, blockId, inviteeId, auth }) => {
    console.log(auth)
    return {
        "requestId": "9eed1920-af7d-417d-9c0b-e0cffd233498",
        "transactions": [
          {
            "id": "cf31a408-6e1b-40d4-8a15-48b8aef5d15c",
            "spaceId": `${spaceId}`,
            "debug": {
              "userAction": "permissionsActions.savePermissionItems"
            },
            "operations": [
              {
                "pointer": {
                  "table": "invite",
                  "id": "1c369f20-efee-4217-9306-1e7a1aee3691",
                  "spaceId": `${spaceId}`,
                },
                "path": [
      
                ],
                "command": "update",
                "args": {
                  "id": "1c369f20-efee-4217-9306-1e7a1aee3691",
                  "version": 1,
                  "flow_id": "d9115fce-d735-4520-b5fa-4dead59b3b30",
                  "space_id": "b1c59f07-989d-44fa-9e5c-01aedfae2a92",
                  "target_id": `${blockId}`,
                  "target_table": "block",
                  "inviter_id": `${auth.userId}`,
                  "inviter_table": "notion_user",
                  "invitee_id": `${inviteeId}`,
                  "invitee_table_or_group": "notion_user",
                  "message": "",
                  "created_time": moment().valueOf(),
                  "attributes": {
                    "permission": {
                      "type": "user_permission",
                      "role": "editor",
                      "user_id": `${inviteeId}`,
                      "invite_id": "1c369f20-efee-4217-9306-1e7a1aee3691"
                    },
                    "origin_type": "page_share_modal"
                  }
                }
              },
              {
                "pointer": {
                  "table": "block",
                  "id": `${blockId}`,
                  "spaceId": `${spaceId}`,
                },
                "command": "setPermissionItem",
                "path": [
                  "permissions"
                ],
                "args": {
                  "type": "user_permission",
                  "role": "editor",
                  "user_id": `${inviteeId}`,
                  "invite_id": "1c369f20-efee-4217-9306-1e7a1aee3691"
                }
              },
              {
                "pointer": {
                  "table": "block",
                  "id": `${blockId}`,
                  "spaceId": `${spaceId}`,
                },
                "path": [
      
                ],
                "command": "update",
                "args": {
                  "last_edited_time": moment().valueOf()
                }
              }
            ]
          }
        ]
      }
}

const prepareRemoveUserObject = async ({ spaceId, blockId, inviteeId, auth }) => {
    return {
        "requestId": "e76d56d7-5d81-407c-bcc2-2951c925daf6",
        "transactions": [
          {
            "id": "51c0d47e-cff5-4985-b71e-9ac974182eb3",
            "spaceId": `${spaceId}`,
            "debug": {
              "userAction": "BlockPermissionsSettings.handlePermissionItemChange"
            },
            "operations": [
              {
                "pointer": {
                  "table": "block",
                  "id": `${blockId}`,
                  "spaceId": `${spaceId}`
                },
                "command": "setPermissionItem",
                "path": [
                  "permissions"
                ],
                "args": {
                  "role": "none",
                  "type": "user_permission",
                  "user_id": `${inviteeId}`,
                  "invite_id": "1c369f20-efee-4217-9306-1e7a1aee3691"
                }
              },
              {
                "pointer": {
                  "table": "block",
                  "id": `${blockId}`,
                  "spaceId": `${spaceId}`
                },
                "path": [
      
                ],
                "command": "update",
                "args": {
                  "last_edited_time": moment().valueOf(),
                  "last_edited_by_id": auth.userId,
                  "last_edited_by_table": "notion_user"
                }
              }
            ]
          }
        ]
      }
}


module.exports = {
    checkSpaceAdminStatus, findNotionUserByEmail, getSpaceByDomain, prepareInviteObject, inviteUserToNotionBlock, removeUserFromNotionBlock
}