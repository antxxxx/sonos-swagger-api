'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const log4js = require('log4js');
const logger = log4js.getLogger('startupHelpers.js');
const path = require('path');
const sway = require('sway');
const yaml = require('js-yaml');
const _ = require('lodash');
const nconf = require('nconf');
const Datastore = require('nedb');

function filePathExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err && err.code === 'ENOENT') {
                return resolve(false);
            } else if (err) {
                return reject(err);
            }
            if (stats.isFile() || stats.isDirectory()) {
                return resolve(true);
            }

            return resolve(true);
        });
    });
}

function createTtsDirectory(ttsDir) {
    return Promise.resolve()
        .then(() => {
            return filePathExists(ttsDir);
        })
        .then((ttsExists) => {
            if (!ttsExists) {
                return fs.mkdirAsync(ttsDir);
            }

            return null;
        })
        .catch((err) => {
            logger.warn(`Could not create tts directory ${ttsDir}, please create it manually for all features to work.`);
            logger.warn(`Error : ${err}`);

            return null;
        });
}

function createDatabaseDirectory(databaseDir) {
    return Promise.resolve()
        .then(() => {
            return filePathExists(databaseDir);
        })
        .then((ttsExists) => {
            if (!ttsExists) {
                return fs.mkdirAsync(databaseDir);
            }

            return null;
        })
        .catch((err) => {
            logger.warn(`Could not create database directory ${databaseDir}, please create it manually for all features to work.`);
            logger.warn(`Error : ${err}`);

            return null;
        });
}

function createRunningSwaggerFile(webRoot) {
    // This copies swagger.yaml to production.swagger.yaml and replaces host and schemes if necessary
    // It also validates the new swagger file to make sure it is all ok
    const orignalSwaggerFile = path.resolve(__dirname, './api/swagger/swagger.yaml');
    const runtimeSwaggerFile = path.resolve(__dirname, './api/swagger/production.swagger.yaml');
    let swaggerJsonObject;


    return Promise.resolve()
        .then(() => {
            return fs.readFileAsync(orignalSwaggerFile, 'utf8');
        })
        .then((fileContents) => {
            return yaml.safeLoad(fileContents);
        })
        .then((swaggerObject) => {
            swaggerJsonObject = swaggerObject;
            swaggerJsonObject.host = webRoot.replace(/http(s)*:\/\//, '');
            if (webRoot.startsWith('https')) {
                swaggerJsonObject.schemes = ['https'];
            }

            return sway.create({
                definition: swaggerJsonObject
            });
        })
        .then((swaggerObj) => {
            const result = swaggerObj.validate();
            let errors = result.errors;
            let warnings = result.warnings;

            if (_.isEmpty(errors)) {
                errors = null;
            }

            if (_.isEmpty(warnings)) {
                warnings = null;
            }
            logger.warn(errors, warnings);
            if (errors) {
                throw errors;
            }

            return fs.writeFileAsync(runtimeSwaggerFile, yaml.safeDump(swaggerJsonObject));
        })
        .catch((error) => {
            logger.error('Error occurred modifying swagger file:', error);

            throw error;
        });
}

function loadConfig() {
    // Load settings and set defaults
    nconf.file(path.resolve(__dirname, './settings.json'));
    nconf.defaults({
        settings: {
            port: 10010,
            staticWebRootPath: path.resolve(__dirname, 'static'),
            ttsProvider: 'google',
            webRoot: 'http://localhost:10010',
            databasePath: path.resolve(__dirname, 'localDatabase')
        }
    });

    // Store settings so they can be easily accessed
    return nconf.get('settings');
}

function loadDatabases(settings) {
    const iplayerPodcastDB = Promise.promisifyAll(new Datastore({
        filename: path.resolve(settings.databasePath, 'iplayerPodcastDB.json'),
        autoload: true
    }));
    const refreshSettingsDB = Promise.promisifyAll(new Datastore({
        filename: path.resolve(settings.databasePath, 'refreshSettingsDB.json'),
        autoload: true
    }));
    const iplayerProgramDB = Promise.promisifyAll(new Datastore({
        filename: path.resolve(settings.databasePath, 'iplayerProgramDB.json'),
        autoload: true
    }));
    const dbSettings = {
        iplayerPodcastDB,
        refreshSettingsDB,
        iplayerProgramDB
    };

    return dbSettings;
}
module.exports = {
    createRunningSwaggerFile,
    createTtsDirectory,
    createDatabaseDirectory,
    loadConfig,
    loadDatabases
};
