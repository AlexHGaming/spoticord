const DiscordRPC = require('discord-rpc'),
      spotifyWeb = require('./spotify'),
      log = require("fancy-log"),
      events = require('events'),
      fs = require('fs');

const keys = require('./keys.json');

const rpc = new DiscordRPC.Client({ transport: keys.rpcTransportType }),
      s = new spotifyWeb.SpotifyWebHelper(),
      appClient = keys.appClientID,
      largeImageKey = keys.imageKeys.large,
      smallImageKey = keys.imageKeys.small;

var songEmitter = new events.EventEmitter(),
    currentSong = {};

async function checkSpotify() {
  s.getStatus(function(err, res) {
    if(err) {
      log.error("Failed to fetch Spotify data:", err);
      return;
    }

    if(!res.track.track_resource || !res.track.artist_resource) return;
    if(res.track.track_resource.uri == currentSong.uri) return;

    let start = parseInt(new Date().getTime().toString().substr(0, 10)),
        end = start + (res.track.length - res.playing_position);
    var song = {uri: res.track.track_resource.uri, name: res.track.track_resource.name, album: res.track.album_resource.name, artist: res.track.artist_resource.name, start, end};
    currentSong = song;
    console.log(res)
    songEmitter.emit('newSong', song);
  });
}

songEmitter.on('newSong', song => {
  rpc.setActivity({
    details: `🎵  ${song.name}`,
    state: `👤  ${song.artist}`,
	  startTimestamp: song.start,
		endTimestamp: song.end,
		largeImageKey: largeImageKey,
    smallImageKey: smallImageKey,
    largeImageText: `⛓  ${song.uri}`,
    smallImageText: `💿  ${song.album}`,
		instance: false,
  });

  log.info(`Updated song to: ${song.artist} - ${song.name}`);
});

rpc.on('ready', () => {
  log(`Connected to Discord! (${appClient})`);

  setInterval(() => {
    checkSpotify();
  }, 1500);
});

rpc.login(appClient).catch(log.error);
