'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/clip.js');
const nowPlaying = require('./nowPlaying');
const playPause = require('./playpause');
const seek = require('./seek');
const commonFunctions = require('./commonFunctions');
const util = require('util');

function setTrackAndPosition(player, track, seconds) {
    return Promise.resolve()
        .then(() => {
            return seek.trackSeek(player, track);
        })
        .then(() => {
            return seek.timeSeek(player, seconds);
        })
        .catch((err) => {
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}


function playClip(player, clip) {
    const initialState = player.state;
    const initialMediaInfo = {
        avTransportUri: player.avTransportUri,
        avTransportUriMetadata: player.avTransportUriMetadata
    };

    let announceFinished;
    let afterPlayingStateChange;

    function onTransportChange(state) {
        logger.debug(`playback state switched to ${state.playbackState}`);
        if (state.playbackState === 'PLAYING') {
            logger.debug('announcement started');
            afterPlayingStateChange = announceFinished;
        }

        if (state.playbackState !== 'STOPPED') {
            return;
        }

        if (afterPlayingStateChange instanceof Function) {
            logger.debug('announcement finished because of STOPPED state identified');
            afterPlayingStateChange();
        }
    }

    return Promise.resolve()
        .then(() => {
            return nowPlaying.setNowPlaying(player, clip, '');
        })
        .then(() => {
            player.on('transport-state', onTransportChange);

            return playPause.playAsync(player);
        })
        .then(() => {
            return new Promise((resolve) => {
                announceFinished = resolve;
            });
        })
        .then(() => {
            player.removeListener('transport-state', onTransportChange);

            return nowPlaying.setNowPlaying(player, initialMediaInfo.avTransportUri, initialMediaInfo.avTransportUriMetadata);
        })
        .then(() => {
            if (!commonFunctions.isRadioOrLineIn(initialMediaInfo.avTransportUri) && initialState.trackNo > 0) {
                logger.debug('not a stream so setting position');

                return setTrackAndPosition(player, initialState.trackNo, initialState.elapsedTime);
            }

            return 1;
        })
        .then(() => {
            if (initialState.playbackState === 'PLAYING') {
                return playPause.play(player);
            }

            return 1;
        })
        .catch((err) => {
            player.removeListener('transport-state', onTransportChange);
            logger.error(util.inspect(err, null, false));
            throw err;
        });
}

module.exports = {
    playClip
};
