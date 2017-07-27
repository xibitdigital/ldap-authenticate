const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')
const {lorem, internet, name, random} = require('faker')
chai.should()
chai.use(sinonChai)

const words = (num) => lorem.words(num).split(' ')
const uri = (num) => words(num).join('/')

const {ldapSearch, ldapBuildSearchQuery} = require('../index')

describe('ldap search', function () {

  const searchRoot = uri(),
    usernameKey = 'username',
    username = internet.userName(),
    password = internet.password(),
    groups = words()

  it('should search, find and extract', done => {
    const evenOnStub = sinon.stub()
    const mockEntry = {
      objectName: words().map(w => `cn=${w}`).join(','),
      attributes: [
        {
          type: 'displayName',
          vals: `${name.firstName()} ${name.lastName()}`
        },
        {
          type: 'memberOf',
          vals: words()
        }
      ]
    }

    evenOnStub.withArgs('searchEntry').yields(mockEntry)
    evenOnStub.withArgs('end').yields()

    const mockEmitter = {
      on: evenOnStub
    }
    const mockClient = {
      search: sinon.stub().callsArgWith(2, null, mockEmitter)
    }

    ldapSearch(mockClient, searchRoot, usernameKey, username, groups)
      .then(user => {
        user.should.eql({
          objectName: mockEntry.objectName,
          displayName: mockEntry.attributes[0].vals,
          memberOf: mockEntry.attributes[1].vals
        })

        mockClient.search.should.have.been.calledOnce
        mockClient.search.should.have.been.calledWith(
          searchRoot,
          ldapBuildSearchQuery(usernameKey, username, groups)
        )
      })
      .then(done)
      .catch(done)
  })

  it('should reject when anything other than >0 users are found', done => {
    const evenOnStub = sinon.stub()
    evenOnStub.withArgs('end').yields()

    const mockEmitter = {
      on: evenOnStub
    }
    const mockClient = {
      search: sinon.stub().callsArgWith(2, null, mockEmitter)
    }

    ldapSearch(mockClient, searchRoot, usernameKey, username, groups)
      .then(() => {
        done(new Error('should not have resolved'))
      })
      .catch(() => {
        done()
      })
  })
})
