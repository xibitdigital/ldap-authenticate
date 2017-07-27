# LDAP Node lib

How to use it:

config:
```
const ldap = require('ldapjs')
const ldapAuth = require('index.js')

let config = {
  ldap: {
    clientFactory: () => ldap.createClient({url: process.env.AD_LOCATION}),
    clientUser: process.env.AD_BIND_ACCOUNT,
    clientPass: process.env.AD_BIND_PASSWORD,
    searchRoot: process.env.AD_SEARCH_ROOT,
    usernameKey: process.env.AD_USERNAME_KEY,
    accessGroups: (process.env.AD_ACCESS_GROUPS || '').split(';').filter(g => !!g)
  }
}

ldapauth.authenticate(config)
```
