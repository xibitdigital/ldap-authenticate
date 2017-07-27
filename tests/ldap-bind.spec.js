const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')
const {lorem, internet, name, random} = require('faker')
chai.should()
chai.use(sinonChai)

const {ldapBind} = require('../index')

const words = (num) => lorem.words(num).split(' ')

describe('ldap bind', function () {

  it('should bind', done => {
    const username = internet.userName()
    const password = internet.password()
    const mockClient = {
      id: random.uuid(),
      bind: sinon.stub().callsArgWith(2, null)
    }

    const mockFactory = sinon.stub().returns(mockClient)

    ldapBind(username, password, mockFactory)
      .then(client => {
        client.should.eql(mockClient)
        mockFactory.should.have.been.calledOnce
        mockClient.bind.should.have.been.calledOnce
        mockClient.bind.should.have.been.calledWith(username, password)
      })
      .then(done)
      .catch(done)
  })

  it('should NOT bind', done => {
    const username = internet.userName()
    const password = internet.password()
    const expError = new Error('<useful error message goes here>')
    const mockClient = {
      id: random.uuid(),
      bind: sinon.stub().callsArgWith(2, expError)
    }

    const mockFactory = sinon.stub().returns(mockClient)

    ldapBind(username, password, mockFactory)
      .then(() => {
        done(new Error('Should not have resolved'))
      })
      .catch(err => {
        mockFactory.should.have.been.calledOnce
        mockClient.bind.should.have.been.calledOnce
        mockClient.bind.should.have.been.calledWith(username, password)
        err.should.eql(expError)
        done()
      })
      .catch(done)
  })
})
