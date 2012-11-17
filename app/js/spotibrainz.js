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

function songkick()
{
    console.log("songkick!");
    mbid = "8f6bd1e4-fbe1-4f50-aa9b-94c450ec0f11";
    url = "http://api.songkick.com/api/3.0/artists/mbid:" + mbid + "/calendar.json?apikey=musichackday";
    $.ajax({url : url, success : songkick_callback });
}

function songkick_callback(data)
{
    $("#songkick").text(data);
}

function eventchange()
{
    var mbData = getMBData();

    console.log(mbData);
}

function getMBData()
{
    var trackData = models.player.track.data;
    var mbData = {};
    $.ajax({url: 'http://musicbrainz.org/ws/2/recording', 
            data: {fmt:'xml', 
                   query: 'recording:' + trackData.name + ' artist:' + trackData.album.artist.name + ' release:' + trackData.album.name + ' date:' + trackData.album.year + ' number:' + trackData.trackNumber + ' dur:' + trackData.duration}, 
            success: function(data) { mbData.recordingId = $(data).find('recording-list').children('recording').filter(function() { return $(this).attr('ext:score') == 100 }).attr('id'); }, 
            dataType: 'xml'});
    return mbData;
}
