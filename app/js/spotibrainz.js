var sp = getSpotifyApi(1);
var models, views;

function init() 
{
    models = sp.require('sp://import/scripts/api/models');
    views = sp.require("sp://import/scripts/api/views");
}
