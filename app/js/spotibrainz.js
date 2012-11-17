var sp = getSpotifyApi(1);
var models, views;

exports.init = init;
function init() 
{
    models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");

    models.player.observe(models.EVENT.CHANGE, function(event) {
          if (event.data.curtrack == true){
              eventchange();
	  }
    });
}

function eventchange()
{
    trackData = models.player.track.data;
    album = trackData.album.name;
    year = trackData.album.year;
    track = trackData.name;
    number = trackData.trackNumber;
    duration = trackData.duration;
    artists = trackData.artists;
    albumArtist = trackData.album.artist.name;

    $.ajax({url: 'http://musicbrainz.org/ws/2/recording', 
            data: {fmt:'xml', 
                   query: 'recording:' + track + ' artist:' + albumArtist + ' release:' + album + ' date:' + year + ' number:' + number + ' dur:' + duration}, 
            success: function(data) { console.log(data); var resp = $(data); console.log(resp.find('recording-list').children('recording').filter(function() { return $(this).attr('ext:score') == 100 }).attr('id')); }, 
            dataType: 'xml'});
}
