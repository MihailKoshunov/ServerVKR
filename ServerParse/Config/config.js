'use strict'

const path = require('path');

const donetv = require('dotenv').config({path: path.resolve(__dirname + '/.env')});

const {
    PORT,
    HOST,
    API_KEY,
    AUTH_DOMAIN,
    DATABASE_URL,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
    MEASUREMENT_ID,
    CLIENT_ID,
    SECRET_CLIENT_ID,
    URL_RES,
    authorizationTokenMailer,

} = process.env;

module.exports = {
    port: PORT,
    host: HOST,
    firebaseConfig: {

        apiKey: API_KEY,
        authDomain: AUTH_DOMAIN,
        databaseURL: DATABASE_URL,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID,
        measurementId: MEASUREMENT_ID
    },
    CLIENT_ID: CLIENT_ID,
    SECRET_CLIENT_ID: SECRET_CLIENT_ID,
    URL_RES: URL_RES,
    tokenMailer:authorizationTokenMailer,
}