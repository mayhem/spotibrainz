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

    $(window).resize(resize_window);
}

function resize_window()
{
    height = $(window).height();
    title = $("#title-bar").height();
    row_height = Math.floor((height - title) / 2);

    $("#top-row").css("height", row_height);
    $("#bottom-row").css("height", row_height);
}

function songkick(mbid)
{
    url = "http://api.songkick.com/api/3.0/artists/mbid:" + mbid + "/calendar.json?apikey=hackday";
    $.ajax({url : url, success : songkick_callback });
}

function songkick_callback(data)
{
    console.log(data.resultsPage.results.event[0].displayName);
    $("#songkick").text(data.resultsPage.results.event[0].displayName);
}

function eventchange()
{
    var mbData = getMBData();

    songkick(mbData.artistId);
}

function getMBData()
{
    var trackData = models.player.track.data;
    var mbData = {};
    $.ajax({url: 'http://musicbrainz.org/ws/2/recording', 
            data: {fmt:'xml', 
                   query: 'recording:' + trackData.name + ' artist:' + trackData.album.artist.name + ' release:' + trackData.album.name + ' date:' + trackData.album.year + ' number:' + trackData.trackNumber + ' dur:' + trackData.duration + ' tracksrelease:' + trackData.album.numTracks}, 
            success: function(data) { 
		    var recording = $(data).find('recording-list').children('recording').filter(function() { return $(this).attr('ext:score') > 90 }); 
		    mbData.recordingId = recording.attr('id'); 
		    mbData.releaseId = recording.find('release').attr('id');
		    mbData.artistId = recording.find('artist').attr('id');
            }, 
            dataType: 'xml',
            async: false});
    return mbData;
}
