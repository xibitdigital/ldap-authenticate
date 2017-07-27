const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')
const {lorem, internet, name, random} = require('faker')
chai.should()
chai.use(sinonChai)

const {authenticate} = require('../index')

const words = (num) => lorem.words(num).split(' ')

describe('ldap', function () {
  let config, username, password, mockUserClient, mockAdminClient, mockUser

  beforeEach(() => {
    config = {
      clientFactory: sinon.stub(),
      clientUser: internet.userName(),
      clientPass: internet.password(),
      searchRoot: words().map(w => `dc=${w}`).join(','),
      usernameKey: 'AcountName',
      accessGroups: [
        words().map(w => `CN=${w}`).join(','),
        words().map(w => `CN=${w}`).join(',')
      ]
    }
    username = internet.userName()
    password = internet.password()
    mockUserClient = {creds: 'user bind'}
    mockAdminClient = {creds: 'admin bind'}
    mockUser = {
      displayName: `${name.firstName()} ${name.lastName()}`,
      groups: words()
    }
  })

  describe('authenticate', () => {

    it('authenticate successfully', done => {
      const bindStub = sinon.stub()
      bindStub.onCall(0).resolves(mockAdminClient)
      bindStub.onCall(1).resolves(mockUserClient)

      const handlers = {
        bind: bindStub,
        search: sinon.stub().resolves(mockUser),
        unbind: sinon.stub().resolves()
      }

      const auth = authenticate(config, handlers)

      auth(username, password)
        .then(user => {
          handlers.bind.should.have.been.calledWith(config.clientUser, config.clientPass, config.clientFactory)

          handlers.search.should.have.been.calledWith(mockAdminClient, config.searchRoot, config.usernameKey, username, config.accessGroups)

          handlers.bind.should.have.been.calledWith(username, password, config.clientFactory)

          handlers.unbind.should.have.been.calledWith(mockAdminClient)
          handlers.unbind.should.have.been.calledWith(mockUserClient)

          handlers.bind.should.have.been.calledTwice
          handlers.search.should.have.been.calledOnce
          handlers.unbind.should.have.been.calledTwice

          user.should.eql(mockUser)
        })
        .then(done)
        .catch(done)
    })

    it('handle invalid client credentials', done => {
      const expectedErr = new Error('invalid client credentials')
      const handlers = {
        bind: sinon.stub().rejects(expectedErr)
      }
      const auth = authenticate(config, handlers)

      auth(username, password)
        .then(() => {
          done(new Error('Should have not resolved'))
        })
        .catch(err => {
          handlers.bind.should.have.been.calledOnce
          err.should.equal(expectedErr)
          done()
        })
        .catch(done)
    })

    it('handle when user is not found', done => {
      const expectedErr = new Error('not found user')
      const handlers = {
        bind: sinon.stub().resolves(mockAdminClient),
        search: sinon.stub().rejects(expectedErr),
        unbind: sinon.stub().resolves()
      }
      const auth = authenticate(config, handlers)

      auth(username, password)
        .then(() => {
          done(new Error('Should have not resolved'))
        })
        .catch(err => {
          handlers.bind.should.have.been.calledOnce
          handlers.search.should.have.been.calledOnce
          handlers.unbind.should.have.been.calledOnce
          handlers.unbind.should.have.been.calledWith(mockAdminClient)
          err.should.equal(expectedErr)
          done()
        })
        .catch(done)
    })

    it('handle when user credentials are invalid', done => {
      const expectedErr = new Error('user credentials invalid')
      const bindStub = sinon.stub()
      bindStub.onCall(0).resolves(mockAdminClient)
      bindStub.onCall(1).rejects(expectedErr)
      const handlers = {
        bind: bindStub,
        search: sinon.stub().resolves(mockUser),
        unbind: sinon.stub().resolves()
      }
      const auth = authenticate(config, handlers)

      auth(username, password)
        .then(() => {
          done(new Error('Should have not resolved'))
        })
        .catch(err => {
          handlers.bind.should.have.been.calledTwice
          handlers.search.should.have.been.calledOnce
          handlers.unbind.should.have.been.calledOnce
          err.should.equal(expectedErr)
          done()
        })
        .catch(done)
    })
  })
})
