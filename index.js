const Promise = require('bluebird')
const debug = require('debug')

const logger = {
  error: debug('authenticate:error'),
  info: debug('authenticate:info'),
  warning: debug('authenticate:warning')
}

const authenticate = (config, handlers) => {
  handlers = Object.assign({}, {
      bind: ldapBind,
      unbind: ldapUnBind,
      search: ldapSearch
    }, handlers)

  const {
    bind,
    search,
    unbind
  } = handlers

  const {
    clientUser,
    clientPass,
    clientFactory,
    searchRoot,
    usernameKey,
    accessGroups
  } = config

  return (username, password) => {
    return bind(clientUser, clientPass, clientFactory)
      .then(client => {
        return search(client, searchRoot, usernameKey, username, accessGroups)
          .catch(err => err).then(obj => {
            return unbind(client)
              .then(() => {
              if (obj.constructor === Error) {
                  throw obj
                }
              }).then(() => obj)
          })
          .then(user => {
            return bind(username, password, clientFactory)
              .then(client => {
                return unbind(client)
                  .then(() => user)
              })
          })
      })
  }
}

const ldapBind = (username, password, factory) => {
  return new Promise((resolve, reject) => {
    const client = factory()
    client.bind(username, password, err => {
      if (err) {
        logger.error('ldap bind error', {
          error: err
        })
        return reject(err)
      }
      resolve(client)
    })
  })
}

const ldapUnBind = (client) => new Promise((resolve, reject) => {
  client.unbind(err => {
    if (err) {
      logger.error('ldap unbind error', {
        error: err
      })
      reject(err)
    }
    resolve()
  })
})

const ldapBuildSearchQuery = (usernameKey, username, groups=[]) => {
  groups = (Array.isArray(groups) && groups.length) ? `(|${groups.map(g => `(memberOf=${g})`).join('')})` : ''
  return `(&(${usernameKey}=${username})${groups})`
}

const ldapSearch = (client, searchRoot, usernameKey, username, groups) => {
  return (new Promise((resolve, reject) => {
    client.search(searchRoot,
      ldapBuildSearchQuery(usernameKey, username, groups),
      (err, emitter) => {
        const entries = []
        emitter.on('searchEntry', e => entries.push(e))
        emitter.on('end', () => resolve(entries))
      })
  }))
    .then(entries => {
      const entry = entries[0]
      const user = entry.attributes.reduce((data, attr) => {
        data[attr.type] = attr.vals
        return data
      }, {objectName: entry.objectName})
      return user
    })
}

module.exports = {
  ldapBind: ldapBind,
  ldapUnBind: ldapUnBind,
  ldapBuildSearchQuery: ldapBuildSearchQuery,
  ldapSearch: ldapSearch,
  authenticate: authenticate
}
