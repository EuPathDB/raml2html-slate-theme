'use strict'
const expect = require('chai').expect
const path = require('path')
const rewire = require('rewire')

const curlCommandBuilder = require(path.join(__dirname, '../lib/curl-command-builder.js'))
const testModule = rewire(path.join(__dirname, '../lib/curl-command-builder.js'))

describe('curl command builder exports', () => {
  it('should export an object', () => {
    expect(curlCommandBuilder).to.be.an('object')
  })

  it('should export forMethod function', () => {
    expect(curlCommandBuilder).to.have.property('forMethod').that.is.a('function')
  })
})

describe('curlOAuth2', () => {
  let curlOAuth2 = testModule.__get__('curlOAuth2')
  let securityScheme, result

  it('returns an array with an entry for the header', () => {
    securityScheme = {
      describedBy: {
        headers: [
          {
            name: 'Authorization',
            type: 'string'
          }
        ]
      }
    }

    result = curlOAuth2(securityScheme)
    expect(result).to.be.an('array').and.deep.equal([{
      headers: ['-H "Authorization: Bearer string"']
    }])
  })

  it('returns an array with an entry for the query string', () => {
    securityScheme = {
      describedBy: {
        queryParameters: [
          {
            name: 'access_token',
            type: 'string'
          }
        ]
      }
    }

    result = curlOAuth2(securityScheme)
    expect(result).to.be.an('array').and.deep.equal([{
      params: ['access_token=string']
    }])
  })

  it('returns an array with an entry for both the header and the query string', () => {
    securityScheme = {
      describedBy: {
        headers: [
          {
            name: 'Authorization',
            type: 'string'
          }
        ],
        queryParameters: [
          {
            name: 'access_token',
            type: 'string'
          }
        ]
      }
    }

    result = curlOAuth2(securityScheme)
    expect(result).to.be.an('array').and.deep.equal([
      {
        headers: ['-H "Authorization: Bearer string"']
      },
      {
        params: ['access_token=string']
      }
    ])
  })
})

describe('curlOAuth1', () => {
  let curlOAuth1 = testModule.__get__('curlOAuth1')
  let securityScheme, result

  it('when a signature scheme is provided, returns an array with an entry for the header and for the query string', () => {
    securityScheme = {
      name: 'oauth1',
      type: 'OAuth 1.0',
      settings: {
        signatures: ['HMAC-SHA1']
      }
    }

    result = curlOAuth1(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      {
        headers: ['-H \'Authorization: OAuth realm="API",\\\n\toauth_consumer_key="consumer_key",\\\n\toauth_token="token",\\\n\toauth_signature_method="HMAC-SHA1",\\\n\toauth_signature="computed_signature",\\\n\toauth_timestamp="timestamp",\\\n\toauth_nonce="nonce",\\\n\toauth_version="1.0"\'']
      },
      {
        params: [
          'oauth_consumer_key=consumer_key',
          'oauth_token=token',
          'oauth_signature_method=HMAC-SHA1',
          'oauth_signature=computed_signature',
          'oauth_timestamp=timestamp',
          'oauth_nonce=nonce',
          'oauth_version=1.0'
        ]
      }
    ])
  })

  it('when a signature scheme is NOT provided, returns an array with an entry for the header and for the query string', () => {
    securityScheme = {
      name: 'oauth1',
      type: 'OAuth 1.0'
    }

    result = curlOAuth1(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      {
        headers: ['-H \'Authorization: OAuth realm="API",\\\n\toauth_consumer_key="consumer_key",\\\n\toauth_token="token",\\\n\toauth_signature_method="RSA-SHA1",\\\n\toauth_signature="computed_signature",\\\n\toauth_timestamp="timestamp",\\\n\toauth_nonce="nonce",\\\n\toauth_version="1.0"\'']
      },
      {
        params: [
          'oauth_consumer_key=consumer_key',
          'oauth_token=token',
          'oauth_signature_method=RSA-SHA1',
          'oauth_signature=computed_signature',
          'oauth_timestamp=timestamp',
          'oauth_nonce=nonce',
          'oauth_version=1.0'
        ]
      }
    ])
  })
})

describe('curlBasicAuth', () => {
  let curlBasicAuth = testModule.__get__('curlBasicAuth')
  let securityScheme, result

  it('returns an array with a single command line option', () => {
    securityScheme = {
      name: 'basicAuth',
      type: 'Basic Authentication'
    }

    result = curlBasicAuth(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      { options: ['--user username:password'] }
    ])
  })
})

describe('curlDigestAuth', () => {
  let curlDigestAuth = testModule.__get__('curlDigestAuth')
  let securityScheme, result

  it('returns an array with a single command line option', () => {
    securityScheme = {
      name: 'digestAuth',
      type: 'Digest Authentication'
    }

    result = curlDigestAuth(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      {
        options: ['--user username:password', '--digest']
      }
    ])
  })
})

describe('curlPassThroughAuth', () => {
  let curlPassThroughAuth = testModule.__get__('curlPassThroughAuth')
  let securityScheme, result

  it('adds headers and query string parameters for every entry in the scheme', () => {
    securityScheme = {
      name: 'passThrough',
      type: 'Pass Through',
      describedBy: {
        headers: [
          {
            name: 'X-Auth',
            type: 'string'
          },
          {
            name: 'X-Auth-Again',
            type: 'string'
          }
        ],
        queryParameters: [
          {
            name: 'auth_token',
            type: 'string'
          }
        ]
      }
    }

    result = curlPassThroughAuth(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      {
        headers: [
          '-H "X-Auth: string"',
          '-H "X-Auth-Again: string"'
        ],
        params: [
          'auth_token=string'
        ]
      }
    ])
  })
})

describe('curlXCustomAuth', () => {
  let curlXCustomAuth = testModule.__get__('curlXCustomAuth')
  let securityScheme, result

  it('adds headers for every entry in the scheme', () => {
    securityScheme = {
      name: 'customAuth',
      type: 'x-custom',
      describedBy: {
        headers: [
          {
            name: 'X-API-Key',
            type: 'string'
          }
        ]
      }
    }

    result = curlXCustomAuth(securityScheme)

    expect(result).to.be.an('array').and.deep.equal([
      {
        headers: [
          '-H "X-API-Key: string"'
        ]
      }
    ])
  })
})

describe('curlNullAuth', () => {
  let curlNullAuth = testModule.__get__('curlNullAuth')
  let result

  it('returns an array with an empty object', () => {
    result = curlNullAuth()
    expect(result).to.be.an('array').and.deep.equal([{}])
  })
})
