'use strict';
const Promise = require('bluebird');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/say.js');
const rp = require('request-promise');
const fs = Promise.promisifyAll(require('fs'));
const util = require('util');
const crypto = require('crypto');
const path = require('path');


function downloadFile(uri, filename) {
    const options = {
        encoding: null,
        uri
    };

    return Promise.resolve()
        .then(() => {
            return rp(options);
        })
        .then((response) => {
            return fs.writeFileAsync(filename, response);
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

function downloadTTS(phrase, language, apiKey, staticWebRootPath) {
    const ttsRequestUrl = `http://translate.google.com/translate_tts?client=tw-ob&tl=${language}&q=${encodeURIComponent(phrase)}`;

    // Construct a filesystem neutral filename
    const hashedFilename = crypto.createHash('sha1').
        update(phrase).
        digest('hex');
    const filename = `${hashedFilename}-${language}.mp3`;
    const filepath = path.resolve(staticWebRootPath, 'tts', filename);

    return Promise.resolve()
        .then(() => {
            // Check if file exists
            try {
                return fs.statSync(filepath).isFile();
            } catch (err) {
                return false;
            }
        })
        .then((fileExists) => {
            if (!fileExists) {
                return downloadFile(ttsRequestUrl, filepath);
            }

            return 1;
        })
        .then(() => {
            return filename;
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

module.exports = {
    downloadTTS
};
