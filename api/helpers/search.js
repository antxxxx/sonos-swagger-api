'use strict';

const spotify = require('./music_services/spotify');
const library = require('./music_services/library');
const iplayer = require('./music_services/iplayer_on_demand');
const nowPlaying = require('./nowPlaying');
const playpause = require('./playpause');
const queue = require('./queue');
const util = require('util');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/search.js');

function search(player, service, type, query, offset, limit, settings) {
    let defaultedOffset = offset;
    let defaultedLimit = limit;

    if (typeof offset === 'undefined') {
        defaultedOffset = 0;
    }

    if (typeof limit === 'undefined') {
        defaultedLimit = 20;
    }

    return Promise.resolve()
        .then(() => {
            switch (service) {
                case 'spotify':
                    return spotify;
                case 'library':
                    return library;
                case 'iplayer':
                    return iplayer;
                default:
                    throw new Error('this service has not been implemented yet');
            }
        })
        .then((serviceImplemntation) => {
            return serviceImplemntation.search(player, type, query, defaultedOffset, defaultedLimit, settings);
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

function playArtistRadio(player, artist, service, settings) {
    const type = 'artist';

    return Promise.resolve()
        .then(() => {
            return search(player, service, type, artist, 0, 1, settings);
        })
        .then((results) => {
            return nowPlaying.setNowPlaying(player, results.items[0].uri, results.items[0].metadata);
        })
        .then(() => {
            return playpause.play(player);
        });
}

function playArtistTopTracks(player, artist, service, settings) {
    const type = 'artisttoptracks';

    return Promise.resolve()
        .then(() => {
            return search(player, service, type, artist, 0, 1, settings);
        })
        .then((results) => {
            return queue.replaceQueueAndPlay(player, results.items[0].uri, results.items[0].metadata);
        });
}

function playSong(player, artist, service, settings) {
    const type = 'song';

    return Promise.resolve()
        .then(() => {
            return search(player, service, type, artist, 0, 1, settings);
        })
        .then((results) => {
            return queue.addToQueueAndPlay(player, results.items[0].uri, results.items[0].metadata);
        });
}
module.exports = {
    search,
    playArtistRadio,
    playArtistTopTracks,
    playSong
};
