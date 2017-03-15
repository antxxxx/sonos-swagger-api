'use strict';
const clip = require('./clip');
const Promise = require('bluebird');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/say.js');
const voicerss = require('./tts_services/voicerss');
const google = require('./tts_services/google');

function playText(player, text, language, volume, settings) {
    const apiKey = settings.voicerssApiKey;
    const ttsProvider = settings.ttsProvider;
    const staticWebRootPath = settings.staticWebRootPath;
    const webRoot = settings.webRoot;

    return Promise.resolve()
        .then(() => {
            switch (ttsProvider) {
                case 'voicerss':
                    return voicerss;
                case 'google':
                    return google;
                default:
                    throw new Error('this service has not been implemented yet');
            }
        })
        .then((serviceImplemntation) => {
            return serviceImplemntation.downloadTTS(text, language, apiKey, staticWebRootPath);
        })
        .then((filename) => {
            const downloadUrl = `${webRoot}/static/tts/${filename}`;

            return clip.playClip(player, downloadUrl);
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}


module.exports = {
    playText
};
