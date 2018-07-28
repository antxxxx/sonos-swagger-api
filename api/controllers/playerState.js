'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('zoneDetail.js');
const players = require('../helpers/players');
const playpause = require('../helpers/playpause');
const volume = require('../helpers/volume');
const mute = require('../helpers/mute');
const seek = require('../helpers/seek');
const nextprevious = require('../helpers/nextprevious');
const favourite = require('../helpers/favourite');
const playlist = require('../helpers/playlist');
const playmode = require('../helpers/playmode');
const linein = require('../helpers/linein');
const clip = require('../helpers/clip');
const say = require('../helpers/say');
const zones = require('../helpers/zones');
const searchHelper = require('../helpers/search');
const _ = require('lodash');

const commonFunctions = require('../helpers/commonFunctions');

function setPlayerState(ctx, next) {
    logger.debug(`params ${commonFunctions.returnFullObject(ctx.request.swagger.params.body.value)}`);
    const discovery = ctx.request.discovery;
    const settings = ctx.request.settings;
    const playerName = ctx.request.swagger.params.playerName.value;
    const async = ctx.request.swagger.params.async.value;

    const requestedFavorite = _.get(ctx.request.swagger.params.body.value, 'currentTrack.favourite');
    const requestedPlaylist = _.get(ctx.request.swagger.params.body.value, 'currentTrack.playlist');
    const requestedClip = _.get(ctx.request.swagger.params.body.value, 'currentTrack.clip');
    const requestedText = _.get(ctx.request.swagger.params.body.value, 'currentTrack.text');
    const requestedSkip = _.get(ctx.request.swagger.params.body.value, 'currentTrack.skip');
    const requestedSource = _.get(ctx.request.swagger.params.body.value, 'currentTrack.source');
    const requestedLineinSource = _.get(ctx.request.swagger.params.body.value, 'currentTrack.lineinSource');

    const requestedVolume = _.get(ctx.request.swagger.params.body.value, 'volume');
    const requestedMute = _.get(ctx.request.swagger.params.body.value, 'mute');
    const requestedTrackNumber = _.get(ctx.request.swagger.params.body.value, 'trackNo');
    const requestedTime = _.get(ctx.request.swagger.params.body.value, 'elapsedTime');
    const requestedPlaybackState = _.get(ctx.request.swagger.params.body.value, 'playbackState');

    const requestedRepeatMode = _.get(ctx.request.swagger.params.body.value, 'playMode.repeat');
    const requestedShuffleMode = _.get(ctx.request.swagger.params.body.value, 'playMode.shuffle');
    const requestedCrossfadeMode = _.get(ctx.request.swagger.params.body.value, 'playMode.crossfade');
    const requestedArtistTopTracks = _.get(ctx.request.swagger.params.body.value, 'currentTrack.artistTopTracks');
    const requestedArtistRadio = _.get(ctx.request.swagger.params.body.value, 'currentTrack.artistRadio');
    const requestedSong = _.get(ctx.request.swagger.params.body.value, 'currentTrack.song');

    const clipVolume = 20;

    let player;

    if (async) {
        const response = {
            message: 'OK'
        };

        commonFunctions.sendResponse(ctx, 202, response, next);
    }
    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }
            player = discovery.getPlayer(playerName);

            if (requestedVolume) {
                return volume.setVolume(player, requestedVolume);
            }
            if (requestedMute) {
                return mute.setMuteStatus(player, requestedMute);
            }
            if (requestedTrackNumber) {
                return seek.trackSeek(player, requestedTrackNumber);
            }
            if (requestedTime) {
                return seek.timeSeek(player, requestedTime);
            }
            if (requestedPlaybackState) {
                return playpause.setPlaybackState(player, requestedPlaybackState);
            }
            if (requestedRepeatMode) {
                return playmode.setRepeatStatus(player, requestedRepeatMode);
            }
            if (requestedShuffleMode) {
                return playmode.setShuffleStatus(player, requestedShuffleMode);
            }
            if (requestedCrossfadeMode) {
                return playmode.setCrossfadeStatus(player, requestedCrossfadeMode);
            }
            if (requestedFavorite) {
                return favourite.playFavourite(player, requestedFavorite);
            }
            if (requestedPlaylist) {
                return playlist.playPlaylist(player, requestedPlaylist);
            }
            if (requestedClip) {
                return clip.playClip(player, requestedClip);
            }
            if (requestedText) {
                return say.playText(player, requestedText, 'en-GB', clipVolume, ctx.request.settings);
            }
            if (requestedSkip === 'next') {
                return nextprevious.next(player);
            }
            if (requestedSkip === 'previous') {
                return nextprevious.previous(player);
            }
            if (requestedSource) {
                return linein.setLinein(player, requestedLineinSource);
            }
            if (requestedArtistRadio) {
                const service = 'spotify';

                return searchHelper.playArtistRadio(player, requestedArtistRadio, service, settings);
            }
            if (requestedArtistTopTracks) {
                const service = 'spotify';

                return searchHelper.playArtistTopTracks(player, requestedArtistTopTracks, service, settings);
            }
            if (requestedSong) {
                const service = 'spotify';

                return searchHelper.playSong(player, requestedSong, service, settings);
            }

            return null;
        })
        .then(() => {
            return players.getPlayer(discovery, playerName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 201, results.state, next, async);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }
            if (error.message === 'favourite not found') {
                const response = {
                    code: 'favourite.not.found',
                    message: `cant find favourite ${requestedFavorite}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }
            if (error.message === 'Playlist not found') {
                const response = {
                    code: 'playlist.not.found',
                    message: `cant find playlist ${requestedPlaylist}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next, async);
            }

            if (error.message === 'nothing to play') {
                const response = {
                    code: 'nothing.to.play',
                    message: `cant play on player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 500, response, next, async);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

function getPlayerState(ctx, next) {
    const discovery = ctx.request.discovery;
    const playerName = ctx.request.swagger.params.playerName.value;

    zones.areZonesDiscovered(discovery)
        .then(() => {
            return players.isValidPlayer(discovery, playerName);
        })
        .then((isValidPlayer) => {
            if (!isValidPlayer) {
                throw new Error('player not found');
            }

            return players.getPlayer(discovery, playerName);
        })
        .then((results) => {
            return commonFunctions.sendResponse(ctx, 200, results.state, next);
        })
        .catch((error) => {
            logger.error(error);
            if (error.message === 'player not found') {
                const response = {
                    code: 'player.not.found',
                    message: `cant find player ${playerName}`
                };

                return commonFunctions.sendResponse(ctx, 404, response, next);
            }

            return commonFunctions.errorHandler(ctx, error, next);
        });
}

module.exports = {
    getPlayerState,
    setPlayerState
};

