const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
require('sinon-as-promised')
const {lorem, internet, name, random} = require('faker')
chai.should()
chai.use(sinonChai)

const words = (num) => lorem.words(num).split(' ')
const uri = (num) => words(num).join('/')

const {ldapBuildSearchQuery} = require('../index')

describe('ldap compose search options', function () {

  it('compose query', () => {
    [
      {
        input: ['USERNAME_KEY', 'A_USERNAME', ['GROUP_1', 'GROUP_2']],
        output: '(&(USERNAME_KEY=A_USERNAME)(|(memberOf=GROUP_1)(memberOf=GROUP_2)))'
      },

      {
        input: ['B_USERNAME_KEY', 'B_USERNAME', ['GROUP_1']],
        output: '(&(B_USERNAME_KEY=B_USERNAME)(|(memberOf=GROUP_1)))'
      },

      {
        input: ['B_USERNAME_KEY', 'B_USERNAME', []],
        output: '(&(B_USERNAME_KEY=B_USERNAME))'
      }
    ]
    .forEach(({input, output}) => {
      ldapBuildSearchQuery.apply(null, input).should.eql(output)
    })
  })
})
