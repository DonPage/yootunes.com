<?php


//Application Routes===================//


//http://localhost/controller/method/arguments


//User routes==========================//
Route::get('new-user/{email}/{pw}/{with}', 'UserController@newUser');

Route::get('get-user/{email}/{pw}', 'UserController@getUser');

Route::get('login-facebook', 'UserController@loginFacebook');

// Route::get('update-user', 'UserController@updateUser');

// Route::get('delete-user', 'UserController@deleteUser');

// Route::get('reset-user-password', 'UserController@resetUserPassword');

//Devices
// Route::get('new-device', 'UserController@newDevice');

// Route::get('get-device', 'UserController@getDevice');

// Route::get('get-devices', 'UserController@getDevices');

// Route::get('delete-device', 'UserController@deleteDevice');




//Client routes==========================//
// Route::get('new-client', 'ClientController@newClient');

// Route::get('get-client', 'ClientController@getClient');

// Route::get('get-clients', 'ClientController@getClient');

// Route::get('update-client', 'ClientController@updateClient');

// Route::get('delete-client', 'ClientController@deleteClient');

// Route::get('reset-client-password', 'ClientController@resetClientPassword');




//Search routes===========================//
Route::get('search/{q}', 'SearchController@search');




//Playlist routes==========================//
Route::get('new-playlist/{userId}/{songId}/{playlistName}', 'PlaylistsController@newPlaylist');

Route::get('get-playlist-songs/{playlistId}', 'PlaylistsController@getPlaylistSongs');

Route::get('get-playlists/{userId}', 'PlaylistsController@getPlaylists');

Route::get('add-to-playlist/{songId}/{playlistId}', 'PlaylistsController@addToPlaylist');

Route::get('delete-from-playlist/{songId}/{playlistId}', 'PlaylistsController@deleteFromPlaylist');

Route::get('delete-playlist/{playlistId}', 'PlaylistsController@deletePlaylist');

// Route::get('share-playlist', 'PlaylistsController@sharePlaylist');




//Library routes============================//
// Route::get('new-library', 'LibraryController@newLibrary');

Route::get('get-library/{id}/{sortBy}/{sortOrder}', 'LibraryController@getLibrary');

Route::get('add-to-library/{songId}/{userId}', 'LibraryController@addToLibrary');

Route::get('remove-from-library/{songId}/{userId}', 'LibraryController@removeFromLibrary');

// Route::get('delete-library', 'LibraryController@deleteLibrary');




//Song routes==============================//
// Route::get('get-song', 'SongController@getSong');

// Route::get('update-song', 'SongController@updateSong');

// Route::get('share-song', 'SongController@shareSong');




//Ad routes===============================//
// Route::get('new-ad', 'AdsController@newAd');

// Route::get('get-ad', 'AdsController@getAd');

// Route::get('get-ads', 'AdsController@getAds');

// Route::get('update-ad', 'AdsController@updateAd');

// Route::get('delete-ad', 'AdsController@deleteAd');





















