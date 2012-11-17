var sp = getSpotifyApi(1);
var models, views;

var MB = {};

var alwaysChange = true;

exports.init = init;
function init() 
{
    models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");

    models.player.observe(models.EVENT.CHANGE, function(event) {
          if (event.data.curtrack == true){
              eventChange();
	  }
    });

    $(window).resize(resize_window);
    $(window).trigger('resize');
    eventChange();
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
    if (data.resultsPage.totalEntries) {
        event = data.resultsPage.results.event[0];
        artist = event.performance[0].artist.displayName;
        date = event.start.date;
        loc = event.location.city;
        venue = event.venue.displayName;
        $("#songkick").html(artist + "<br/>" + date + "<br/>" + loc + "<br/>" + venue);
    } else {
        $("#songkick").html("No upcoming concerts.");
    }
}

function clearIfSpotifyIDChanged()
{
    var trackData = models.player.track.data;
    if (alwaysChange || !MB.prevTrack || MB.prevTrack.uri != trackData.uri) {
        console.log("Track has changed to " + trackData.uri);
        clearTrack();
    }
    if (alwaysChange || !MB.prevTrack || MB.prevTrack.album.uri != trackData.album.uri) {
        console.log("Album has changed to " + trackData.album.uri);
        clearAlbum();
    }
    if (alwaysChange || !MB.prevTrack || MB.prevTrack.album.artist.uri != trackData.album.artist.uri) {
        console.log("Artist has changed to " + trackData.album.artist.uri);
        clearArtist();
    }
    MB.prevTrack = trackData;
}

function clearArtist()
{
    $("#songkick").html("");
}

function clearTrack() {}

function clearAlbum() {}

function eventChange()
{
    clearIfSpotifyIDChanged();
    getMBData();
    setTimeout(afterGetData, 50);
}

function afterGetData() {
    if (MB.mbData && MB.mbData.loaded) {
        if (alwaysChange || !MB.mbDataOld || MB.mbDataOld.artistId != MB.mbData.artistId) {
            changedArtist();
        }
    } else {
        setTimeout(afterGetData, 50);
    }
}

function changedArtist()
{
    console.log("Artist has changed to " + MB.mbData.artistId);
    clearArtist();
    songkick(MB.mbData.artistId);

    //getArtistRels();
    //setTimeout(afterArtistRels, 50);
}

//function afterArtistRels() 
//{
//    if (MB.mbData.artistRelsLoaded) {
        //console.log(MB.mbData.artistRels);
//    } else {
//        setTimeout(afterArtistRels, 50);
//    }
//}

function getMBData()
{
    var trackData = models.player.track.data;
    if (MB.mbData) { MB.mbData.loaded = false; }
    $.ajax({url: 'http://musicbrainz.org/ws/2/recording', 
            data: {fmt:'xml', 
                   query: 'recording:"' + trackData.name + '" artist:"' + trackData.album.artist.name + '" release:"' + trackData.album.name + '" date:' + trackData.album.year + ' number:' + trackData.trackNumber + ' dur:' + trackData.duration + ' tracksrelease:' + trackData.album.numTracks}, 
            success: function(data) { 
                    MB.mbDataOld = MB.mbData; 
		    var recording = $(data).find('recording-list').children('recording').filter(function() { return $(this).attr('ext:score') > 90 }); 
                    MB.mbData = {};
		    MB.mbData.recordingId = recording.attr('id'); 
		    MB.mbData.recordingName = recording.find('title').first().text(); 
		    MB.mbData.releaseId = recording.find('release').attr('id');
                    MB.mbData.releaseName = recording.find('release').find('title').first().text();
		    MB.mbData.artistId = recording.find('artist').attr('id');
		    MB.mbData.artistName = recording.find('artist').find('name').first().text();
                    MB.mbData.loaded = true;
            }, 
            dataType: 'xml'});
}

function getArtistRels()
{
    var rels = {};
    $.ajax({url: 'http://musicbrainz.org/ws/2/artist/' + MB.mbData.artistId,
            data: {fmt: 'xml',
                   inc: 'url-rels'},
            dataType: 'xml',
            success: function(data) {
                MB.mbData.artistRels = $(data);
                MB.mbData.artistRelsLoaded = true;
            }});
}
