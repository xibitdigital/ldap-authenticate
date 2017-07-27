const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')
const {lorem, internet, name, random} = require('faker')
chai.should()
chai.use(sinonChai)

const {ldapUnBind} = require('../index')

describe('ldap unbind', function () {

  it('should unbind', done => {
    const mockClient = {
      unbind: sinon.stub().callsArgWith(0, null)
    }

    ldapUnBind(mockClient)
      .then(() => {
        mockClient.unbind.should.have.been.calledOnce
      })
      .then(done)
      .catch(done)
  })

  it('should NOT bind', done => {
    const expError = new Error('<useful error message goes here>')
    const mockClient = {
      unbind: sinon.stub().callsArgWith(0, expError)
    }

    ldapUnBind(mockClient)
      .then(() => {
        done(new Error('Should not have resolved'))
      })
      .catch(err => {
        mockClient.unbind.should.have.been.calledOnce
        err.should.eql(expError)
        done()
      })
      .catch(done)
  })
})
