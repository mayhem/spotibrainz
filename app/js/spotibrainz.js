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
    $('.boxy-content').css("height", row_height - 90);
}

function set_title(title)
{
    $("#title-bar").html(title);
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
        $("#songkick").html("No upcoming concerts. Fuss.");
    }
}

function musixmatch(mbid)
{
    url = "http://api.musixmatch.com/ws/1.1/track.lyrics.get?track_mbid=" + mbid + "&apikey=989c3cfacabf2ed3254ed055544cacc9";
    $.ajax({url : url, success : musixmatch_callback, dataType : "json" });
}

function musixmatch_callback(data)
{
    if (data && data.message.body.lyrics && data.message.body.lyrics.lyrics_body != '')
    {
        text = data.message.body.lyrics.lyrics_body;
        text = text.replace(/\n/g, "<br/>");
        text = text.replace("\r", "");
        text += "<br/><br/>" + data.message.body.lyrics.lyrics_copyright + " ";
        text += '<img style="display:none" src="' + data.message.body.lyrics.pixel_tracking_url + '">';
        $("#musixmatch").html(text);
    }
    else
        $("#musixmatch").html("No lyrics available");
}

function twitter(username)
{
    if (username) {
        url = 'http://api.twitter.com/1/statuses/user_timeline.json?exclude_replies=true&count=3&screen_name=' + username;
        $.ajax({url : url, success : twitter_callback });
    } else {
        $('#twitter').html('No twitter feed. Bollocks!');
    }
}

function twitter_callback(data)
{
    if (data[0]) {
        var link = $('<small><a href="http://twitter.com/' + data[0].user.screen_name + '">@' + data[0].user.screen_name + '</a></small>');
        $('#twitter-header').html(link).prepend('Tweets ');
        var rendered = $('<ul></ul>');
        $.each(data, function(idx, value) {
           rendered.append('<li>' + value.text + '</li>') 
        });
        $('#twitter').html(rendered);
    } else {
        $('#twitter').html('No tweets. Quite unfortunate.');
    }
}

function wikipedia(pageUrl)
{
    if (pageUrl) {
        urlBase = pageUrl.replace(/(http:\/\/[^.]+.wikipedia.org)\/.*/, "$1");
        urlPageTitle = pageUrl.replace(/http:\/\/[^.]+.wikipedia.org\/wiki\/(.*)/, "$1");
        var link = $('<small><a href="' + pageUrl + '">' + urlPageTitle + '</a></small>');
        $('#wp-header').html(link).prepend('Wikipedia ');
        url = urlBase + "/w/api.php?action=query&prop=extracts&exintro=1&format=json&titles=" + urlPageTitle
        $.ajax({url : url, success : wikipedia_callback, dataType: 'json'});
    }
}

function wikipedia_callback(data)
{
     $('#wikipedia').html(data.query.pages[Object.keys(data.query.pages)[0]].extract);
}

function clearIfSpotifyIDChanged()
{
    var trackData = models.player.track.data;

    set_title("");
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
    $("#twitter").html("");
    $("#twitter-header").html("Tweets");
    $("#wikipedia").html("");
    $("#wp-header").html("Wikipedia");
}

function clearTrack()
{
    $("#musixmatch").html("");
}

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
    set_title(MB.mbData.artistName + ": " + MB.mbData.recordingName);
    songkick(MB.mbData.artistId);
    musixmatch(MB.mbData.recordingId);

    getArtistRels();
    setTimeout(afterArtistRels, 50);
}

function afterArtistRels() 
{
    if (MB.mbData.artistRelsLoaded) {
        twitter(extractTwitterUsername());
        wikipedia(extractWikipediaPage());
    } else {
        setTimeout(afterArtistRels, 50);
    }
}

function extractTwitterUsername()
{
    var username;
    var candidates = MB.mbData.artistRels.find('relation-list[target-type="url"]').find('relation[type="microblog"]').find('target');
    candidates.each(function() {
        if ($(this).text().match(/twitter.com/)) {
            username = $(this).text();
            username = username.replace(/http:\/\/twitter.com\//, "");
        }
    });
    return username;
}

function extractWikipediaPage()
{
    var pageName;
    var candidates = MB.mbData.artistRels.find('relation-list[target-type="url"]').find('relation[type="wikipedia"]').find('target');
    candidates.each(function() {
        if ($(this).text().match(/en.wikipedia.org/)) {
            pageName = $(this).text();
        }
    });
    return pageName;
}

function getMBData()
{
    var trackData = models.player.track.data;
    if (MB.mbData) { MB.mbData.loaded = false; }
    $.ajax({url: 'http://musicbrainz.org/ws/2/recording', 
            data: {fmt:'xml', 
                   query: 'recording:"' + trackData.name + '" artist:"' + trackData.album.artist.name + '" release:"' + trackData.album.name + '" date:' + trackData.album.year + ' number:' + trackData.trackNumber + ' dur:' + trackData.duration + ' tracksrelease:' + trackData.album.numTracks}, 
            success: function(data) { 
                    console.log(data);
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
