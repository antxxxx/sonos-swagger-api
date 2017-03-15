'use strict';
const path = require('path');
const SwaggerExpress = require('swagger-express-mw');
const express = require('express');
const log4js = require('log4js');
const logger = log4js.getLogger('app.js');
const SonosDiscovery = require('sonos-discovery');
const util = require('util');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const discovery = new SonosDiscovery();
const startupHelpers = require('./startupHelpers');


// Store settings so they can be easily accessed
const settings = startupHelpers.loadConfig();

logger.debug(settings);

// Create tts directory if it does not exist
const ttsDir = path.resolve(settings.staticWebRootPath, 'tts');

startupHelpers.createTtsDirectory(ttsDir)
    .then(() => {
        return startupHelpers.createDatabaseDirectory(settings.databasePath);
    })
    .then(() => {
        settings.dbSettings = startupHelpers.loadDatabases(settings);

        return null;
    })
    .then(() => {
        // Write a file with webroot in it so that swagger ui loads the swagger document
        const webRootSettingPath = path.resolve(settings.staticWebRootPath, 'docs', 'webRootSetting.js');
        const webRootSettingContents = `var webRoot = "${settings.webRoot}";`;

        return fs.writeFileAsync(webRootSettingPath, webRootSettingContents);
    })
    .then(() => {
        // Replace the host in swagger file with webroot so that it can be used in swagger-ui
        // Note - this creates a new file production.swagger.yaml which is used to control the program
        return startupHelpers.createRunningSwaggerFile(settings.webRoot);
    })
    .then(() => {
        const app = express();
        const config = {
            appRoot: path.resolve(__dirname, './api'),
            swaggerFile: path.resolve(__dirname, './api/swagger/production.swagger.yaml'),
            validateResponse: true
        };

        SwaggerExpress.create(config, (err, swaggerExpress) => {
            if (err) {
                throw err;
            }

            // Serve /docs from ./static/docs folder - path in request is added to directory below
            app.use('/docs', express.static(path.resolve(__dirname, 'static/docs')));
            // Serve /static from ./static folder
            app.use('/static', express.static(path.resolve(__dirname, 'static')));

            // Inject discovery and settings into request
            app.use((req, res, next) => {
                req.discovery = discovery;
                req.settings = settings;
                next();
            });

            // Inject discovery and settings into request
            app.use((req, res, next) => {
                logger.debug(`request came into ${req.method} ${req.url}`);
                next();
            });

            // Install middleware
            swaggerExpress.register(app);
            // Install response validation listener (this will only be called if there actually are any errors or warnings)
            swaggerExpress.runner.on('responseValidationError', (validationResponse) => {
                // Log response validation errors...
                logger.error(util.inspect(validationResponse.errors, false, null));
            });
            app.listen(settings.port);
            logger.info('The server has started');
        });
    })
    .catch((error) => {
        return logger.error('Error occurred : ', error);
    });
