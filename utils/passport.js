import passport from 'passport'
import FacebookTokenStrategy from 'passport-facebook-token'
import { Strategy as GoogleTokenStrategy } from 'passport-google-token'
import config from 'config'

const GOOGLE_CLIENT_ID = config.get('google-client-id')
const GOOGLE_CLIENT_SECRET = config.get('google-client-secret')
const FACEBOOK_APP_ID = config.get('facebook-app-id')
const FACEBOOK_APP_SECRET = config.get('facebook-app-secret')

const FacebookTokenStrategyCallback = (accessToken, refreshToken, profile, callback) =>
  callback(null, {
    accessToken,
    refreshToken,
    profile
  })

const GoogleTokenStrategyCallback = (accessToken, refreshToken, profile, callback) =>
  callback(null, {
    accessToken,
    refreshToken,
    profile
  })

if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookTokenStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET
      },
      FacebookTokenStrategyCallback
    )
  )
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleTokenStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET
      },
      GoogleTokenStrategyCallback
    )
  )
}

export const authenticateFacebook = (req, res) =>
  new Promise((resolve, reject) => {
    passport.authenticate('facebook-token', { session: false }, (err, data, info) => {
      if (err) reject(err)
      resolve({ data, info })
    })(req, res)
  })

export const authenticateGoogle = (req, res) =>
  new Promise((resolve, reject) => {
    passport.authenticate('google-token', { session: false }, (err, data, info) => {
      if (err) reject(err)
      resolve({ data, info })
    })(req, res)
  })
