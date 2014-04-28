(function(){
define(['jquery', 'js/libs/keyHash.js', 'getCookies', 'Content', 'socketService'], function($, Key, getCookies, Content, socketService){




	//Instances
	var _key = Key;





	//private vars
	var _player 			= {};

	var _playerPlaying      = false;
	var	_playerNewVideo		= true;
	var _updateInterval;

	var _seek 				= {};
		_seek.scrubber		= '#seek-dot',
		_seek.seekPos 		= 0,
		_seek.duration 		= 0,
		_dragging 			= false;

	var _resultLength 		= 0;
	var _currentIndex 		= 0;
	var _shuffleIndexes 	= [];
	// var _shuffleList 		= [];
	var _prevIndex 			= 0;
	var _playingVideo     	= '';

	var _playMode 			= {};
		_playMode.loop 		= false;
		_playMode.shuffle 	= false;

	// var socketServer 	= 'http://yooss.pw:3001';
	var _socketConnect 		= socketService.socket;
	var _socket 			= null;


	var _thisDevice;
	var _playOnDevice;//default
	var _userId 			=  '';

	var _data;




	//constructor method
	var player = function(){

		console.log(_socketConnect);





		//Retrieve cookies & set device & userId
		var userCookies = getCookies;

		_thisDevice 	= userCookies.thisDevice;
		_playOnDevice 	= userCookies.thisDevice;//default device
		_userId 		= userCookies.userId;





		//If a reload was picked up from conten.js app rendered
		//_thisDevice needs to be set for the first time
		$(document).on('reloadDevices', function(event){

			//Set this device once a new one is created
			_thisDevice = event.newDeviceId;
		});



		//on playOn change, pause video to enable transition
		$(document).on('change', '#play-on', function(){

			pause();
		});





		//If this was a page refresh make sure server removes previous connections to room
		_socketConnect.disconnectRoom(getCookies.userId);




		//Listen for rendered
		$(document).on('rendered', function(event){

			//When libary items have loaded
			if(event.template === '#libraryItem'){

				//When list is loaded, if list item video is playing, set icon to pause

				$('.playIconImg[data-videoid=' + _playingVideo + ']').attr('src', 'images/icons/pause-drk.png');


				//NOTE:*** Moved to library rendered in content-----
				// //Loop through all list items to assign an index number
				// $('.resultItems').each(function(index, value){

				// 	//Sets an index number to each li item
				// 	$('.resultItems:eq(' + index + ')').attr('data-index', index);


				// });//each
			};//#libraryItem
		});//on rendered









		$(document).on('click', '#playAll', function(event){

			playAll();

		});









		$(document).on('click', '#loopSong', function(event){


			if(!_playMode.loop){

				_playMode.loop = !_playMode.loop;

				//Reset shuffle button and boolean val
				_playMode.shuffle 	= false;
				$('#shuffleResults').attr('src', 'images/icons/shuffle-icon.png');

				//Change icon to indicate selection
				$(this).attr('src', 'images/icons/loop-icon-red.png');
			}else{

				_playMode.loop = !_playMode.loop;


				$(this).attr('src', 'images/icons/loop-icon.png');
			}

		});









		$(document).on('click', '#shuffleResults', function(event){

			if(!_playMode.shuffle){

				_playMode.shuffle 	= !_playMode.shuffle;

				//Reset loop button and boolean val
				_playMode.loop 		= false;
				$('#loopSong').attr('src', 'images/icons/loop-icon.png');

				//Change icon to indicate selection
				$(this).attr('src', 'images/icons/shuffle-icon-red.png');

			}else{

				_playMode.shuffle = !_playMode.shuffle;

				//Change oicon back
				$(this).attr('src', 'images/icons/shuffle-icon.png');
			}

		});









		//Prev/Next Click Handler=======//
		$(document).on('click', '#prev-btn', function(){

			//If shuffle is enabled, load a new random song
			if(_playMode.shuffle){


				_prevIndex -= 1 ;

				//Gets index number of previous shuffle videos stored in shuffleIndex array
		    	var prevVideo = $('.resultItems[data-index="' + _shuffleIndexes[_prevIndex + _shuffleIndexes.length] + '"]').attr('data-videoId');

				//Start playing
				// _player.loadVideoById(prevVideo);

				play(prevVideo);


			}else{//Normal prev button behavior

				//set current index
				_currentIndex = parseInt(_currentIndex, 10) - 1;

		    	var prevVideo = $('.resultItems[data-index="' + _currentIndex + '"]').attr('data-videoId');

				//Start playing
				// _player.loadVideoById(prevVideo);

				play(prevVideo);
			}



		});


		//Next btn  Click Handler=======//
		$(document).on('click', '#next-btn', function(){

			//If shuffle is enabled, load a new random song
			if(_playMode.shuffle){

				playRandom();


			}else{//Normal next button behavior

				//set current index
				_currentIndex = parseInt(_currentIndex, 10) + 1;

		    	var nextVideo = $('.resultItems[data-index="' + _currentIndex + '"]').attr('data-videoId');

				//Start playing
				// _player.loadVideoById(nextVideo);

				play(nextVideo);
			}
		});












		//Listens for the player API to load
		window.onYouTubePlayerAPIReady = function() {
			// create the global player from the specific iframe (#video)
			_player = new YT.Player('video', {
				playerVars: {
					controls 		: 0,
					enablejsapi 	: 1,
					rel 			: 0,
					showinfo		: 0,
					modestbranding 	: 1,
					origin 			: 'http://yootunes.com'
				},
			    events: {
			      // call this function when player is ready to use
			      'onStateChange'	: onPlayerStateChange,
			      'onReady'			: onPlayerReady
			    }
		  });
		}






		//Fires when player returns ready
		window.onPlayerReady = function(event) {

			// //Makes play icons visible on ready
			// $('.playIconImg').css({
			// 	'opacity' : '1'
			// });

			var youtubeId = "";

			//Play Button Click Handler=======//
			$(document).on('click', '#play-btn', function(){

				//Check if a video is loaded. If not, playall
				if($('#fbShareMain').attr('href') === ""){

					playAll();
					_playerPlaying = !_playerPlaying;


				}else{

					//Play if not already playing
					if(!_playerPlaying){

						play(youtubeId);

					//Stop playing if already playing
					}else{

						pause();
					}
				}//playAll else
			});









			//NOTE:: ** Only allow if serach is NOT in FOCUS
			//Keypress controls for play/pause etc.
			// $(document).on('keypress', function(event){

				//var youtubeId = "";

			// 	//If Spacebar pressed
			// 	if(_key.Space){
			// 		//Play if not already playing
			// 		if(!_playerPlaying){

			// 			play(youtubeId);

			// 		//Stop playing if already playing
			// 		}else{

			// 			pause();
			// 		}
			// 	}

			// 	event.preventDefault();
			// 	return false;

			// });




			//Volume Handler=======//
			var prevVolume;
			$(document).on('mousemove', '#volumeRange', function(){

				var rangeVolume = $('#volumeRange').val();

				//No need for sockets if this is the device we're playing on
				if(_socket === null){

					_player.setVolume(rangeVolume);


				}else{//PlayOn


					//Build obj for socket transmission
					var data = {
						'device' 			: _playOnDevice,
						'volume' 			: rangeVolume,
						'controllerDevice' 	: _thisDevice
					}


					//=============================//
					//Socket EMIT volume stream
					//=============================//


					if(rangeVolume !== prevVolume){

						_socketConnect.emit('volume', data);

						prevVolume = rangeVolume;
					}




						//=============================//
						//Listen for socket ON
						//=============================//
						_socketConnect.on('volumeOn', function(response){

							//Check to see if this client matches the volumeOn command
							if(data.device === _thisDevice || data.controllerDevice === _thisDevice){

								//Sets the controlling device volume to 0.
								//Most efficient way of setting up controller/slave
								if(data.controllerDevice === _thisDevice){
									_player.mute();

								}

								//set volume
								_player.setVolume(response.volume);

							}//if
						});//_socketConnect.on
				}//else
			});//volume mousemove









			//NOTE: May need to add an event fired from the "return to search results
			//interaction" to reset the play button to a pause button
			//Play icon Click Handler=======//
			$(document).on('click', '.play-icon', function(event){

				var playerId = _player.getVideoData().video_id;
				var id = $(this).attr('data-videoid');

				//Makes video ctrl transparent so user can see youtube loading gif
				$('.video-size-ctrl').css({'opacity':'.5'});

				//Sets the current index to enable autoplay feature funcitonality
				_currentIndex = $(this).parent().attr('data-index');

				this.newVideo;

				//Checks to see if loaded video matches this video
				if(playerId !== id){
					this.newVideo = false;
				}


					//Determines if new video needs to be loaded
					if(!this.newVideo){


						play(id);


						//sets new video to false & playing to true
						this.newVideo = true;
						// _playerNewVideo = !_playerNewVideo;

						_playerPlaying = true;



					//Runs play w/out loading new video
					}else{




						//Pause playback handler
						if(_playerPlaying){
							//Pause playback
							pause();

							//Set playAll icon to play icon if it wasn't already
							// $('#playAllIcon').attr('src', 'images/icons/play-drk.png');

							_playerPlaying= false;

						}else{
							var youtubeId = "";

							play(youtubeId);

							//sets playing to true
							_playerPlaying = true;
						}//else
					}//else
			});//onclick play icon




		//================================//
		};//On Player Ready
		//================================//





		//LIstens for Player API state change message
		window.onPlayerStateChange = function(event){

			var id = _player.getVideoData().video_id;


			//================================//
			//Playing code
			//================================//
			if (event.data === 1){


				//Set song data & UI Changes
				var playing 			= $('.play-icon[data-videoId=' + id + ']');
				var song 				= $('#infoTitle');
				var artist 				= $('#infoArtist');
				var album 				= $('#infoAlbum');
				var dataSong 			= $(playing).attr('data-song');
				var dataArtist 			= $(playing).attr('data-artist');
				var dataAlbum 			= $(playing).attr('data-album');
				var fbShareMain 		= $('#fbShareMain');
				var googleShareMain 	= $('#googleShareMain');
				var twitterShareMain 	= $('#twitterShareMain');
				var linkShareMain 		= $('#linkShareMain');
				var youtubeUrl 			= 'https://www.youtube.com/watch?v=' + id;

				song.html(dataSong);
				artist.html(dataArtist);
				album.html(dataAlbum);
				fbShareMain.attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + youtubeUrl);
				googleShareMain.attr('href', 'https://plus.google.com/share?url=' + youtubeUrl);
				twitterShareMain.attr('href', 'https://twitter.com/home?status=' + youtubeUrl);
				linkShareMain.attr('href', youtubeUrl);

				//Resets video ctrl container to opaque (hides loading icon)
				$('.video-size-ctrl').css({'opacity':'1'});

				//Dynamically add video url to play on icon in video ctrl box
				$('#watchOnYoutube').attr('href', 'http://youtube.com/watch?v=' + id);

				//NOTE:*****
				//This is actually the current index. Clean up possible duplicate setting of this value later.
				//This is the ideal place to set current index
				_currentIndex = playing.parent().attr('data-index');


				//Set playing variable for use by the onrendered event
				_playingVideo = id;

				//Calls updateTime() on regular intervals
				_updateInterval = setInterval(updateTime, 100);


		      	//If user plays video from click on video, change play/pause
		      	$('#play-btn').attr('src', 'images/icons/pause.png');



		      	//Sets list icon play/pause img
				$('.playIconImg').attr('src', 'images/icons/play-drk.png');
				$('.playIconImg[data-videoid=' + id + ']').attr('src', 'images/icons/pause-drk.png');


				//Set info section animation to playing wave animation
				$('.playingAnimation').attr('src', 'images/icons/wave-animated.gif');





			//================================//
			//Paused code
			//================================//
		    }else if(event.data < 1){



		    	//Clears above update interval
		    	clearInterval(_updateInterval);

		    	//If user plays video from click on video, change play/pause
		    	$('#play-btn').attr('src', 'images/icons/play-wht.png');

		    	//Sets list icon play/pause img
		    	$('.playIconImg[data-videoid=' + id + ']').attr('src', 'images/icons/play-drk.png');

		    	//Set info section animation to noto logomark
				$('.playingAnimation').attr('src', 'images/icons/note.svg');

		    }




		    //================================//
		    //If video has ended
		    //================================//
		    if(event.data === 0){//video ended

		    	//======================//
		    	//If loop is enabled
		    	//======================//
		    	if(_playMode.loop){

		    		//Start playing same video again
					// _player.loadVideoById(id);

					play(id);



				//======================//
				//if shuffle enabled
				//======================//
		    	}else if(_playMode.shuffle){

		    		playRandom();



				//======================//
				//Autoplay
				//======================//
		    	}else{

		    		//Handles autoplaying next video
			    	//set current index converted from string to int
					_currentIndex = parseInt(_currentIndex, 10) + 1;

			    	var currentVideo = $('.resultItems[data-index="' + _currentIndex + '"]').attr('data-videoId');

					//Start playing
					// _player.loadVideoById(currentVideo);

					play(currentVideo);


		    	}
		    }
		};








		//Mute/unmute on volume icon click
		$(document).on('click', '.vol-icon', function(event){

			if($(this).attr('src') === 'images/icons/volume-icon.svg'){

				//mute player
				_player.mute();

				//Set icon to muted icon
				$(this).attr('src', 'images/icons/volume-icon-mute.svg');

			}else{

				//unmute player
				_player.unMute();

				//Set icon back to non muted icon
				$(this).attr('src', 'images/icons/volume-icon.svg');
			}


		});







		//Pause video when user clicks watch on youtube link in video cntrls
		$(document).on('click', '#watchOnYoutube', function(){
			pause();
		});








		//Socketio listeners
		// //=============================//
		// //Listen for socket ON
		// //=============================//
		_socketConnect.on('playOn', function (response) {

			console.log("socket play return event received thisDev/response", _thisDevice, response);


			//Sets the controlling device to MUTE.
			//Most efficient way of setting up controller/slave
			if(response.controllerDevice === _thisDevice){
				_player.mute();
			}else{

				//Reloads device list on slave machine
				// Content.getDevices();
			}


			//Check to see if this client matches the playOn command
			// if(response.device === _thisDevice || response.controllerDevice === _thisDevice){


				//Check to see if this is a new video
				if(response.newVideo === "false"){

					_player.playVideo();
					// var id = _player.getVideoData().video_id;

					//Updates button ui
					$('#play-btn').attr('src', 'images/icons/pause.png');

					_playerPlaying= !_playerPlaying;

				}else{

					_player.loadVideoById(response.youtubeId);
				}//else
			// }//if device
		});//_socketConnect.on





























	};//constructor
	//=========================//

	//methods and properties.
	player.prototype 	= {
		constructor  	: player,
		play 		 	: play,
		pause 		 	: pause,
		seekTo 	 		: seekTo,
		dragging 		: dragging
	};

	//return constructor
	return player;









//================================//
//Class methods===================//
//================================//









	function dragging(drag, scrubPos){
		_dragging = drag;

		//Seek bar dragging
		if(drag === true){
			//clear update interval to release control to seekTo function
			clearInterval(_updateInterval);
		}else if(drag === false){

			//Set video position based on scrubPos(x pos)
			seekTo(scrubPos);

			if(_playerPlaying){
				//Calls updateTime() on regular intervals
				_updateInterval = setInterval(updateTime, 100);
			}
		}
	}









	function seekTo(scrubberOffset){

		//Set video time: ((scrubber x - bar left) / bar width) * duration
		var s = ((scrubberOffset - $('#seek-bar').offset().left) / $('#seek-bar').width()) *_seek.duration;

		_player.seekTo(s, true);
	}











	//Updates the time in the transport view
	function updateTime(){

		if(_dragging === false){

			_seek.duration 	= _player.getDuration();

			var time 		= _player.getCurrentTime();
			var h 			= 0;
			var m 			= Math.floor(time / 60);
			var secd 		= (time % 60) - 1;
			var s 			= Math.ceil(secd);

			// var seek_time = ((300 / duration) * s) + _seek.stepper + $('.seek-line').offset().left;

			//Adds digit if under 10s
			if(s <= 0){
				s = '00';
			}else if(s < 10){
				s = '0' + s;
			}


			//Hour handler for time display
			if(m >= 60){
				m = m - 60;
				h = 1;
			}else if(m >= 120){
				m = m - 120;
				h = 2;
			}else if(m >= 180){
				m = m - 180;
				h = 3;
			}else if(m >= 240){
				m = m - 240;
				h = 4;
			}else if(m >= 300){
				m = m - 300;
				h = 5;
			}else if(m >= 360){
				m = m - 360;
				h = 5;
			}else if(m >= 420){
				m = m - 420;
				h = 7;
			}else if(m >= 480){
				m = m - 480;
				h = 8;
			};


			//Set Hours in time display
			if(h === 0){
				$('#current-time').html(m + ':' + s);
			}else{

				//Adds digit if under 10m
				if(m <= 0){
					m = '00';
				}else if(m < 10){
					m = '0' + m;
				}

				$('#current-time').html(h + ':' + m + ':' + s);
			}



			//(bar width / video duration) * time = xPos of scrubber + seekbar left
			_seek.seekPos = (($('#seek-bar').width() / _seek.duration) * time)  + $('#seek-bar').offset().left;


			//Update scrubber position
			$('#seek-dot').offset({left: _seek.seekPos});


			//Sets seek bar colored backfill bar width
			$('.seek-fill').width($('#seek-dot').offset().left - $('#seek-bar').offset().left);


			//Set Buffered stream indicator in seek bar
			var buffered = _player.getVideoLoadedFraction();
			$('.seek-buffered').width(($('#seek-dot').offset().left - $('#seek-bar').offset().left) + (buffered * 100));

			//DOn't allow buffered indicator to exceed seek bar width
			if($('.seek-buffered').width() >= $('#seek-bar').width()){
				$('.seek-buffered').width($('#seek-bar').width());
			}
		}//if draggin false
	}















	function play(youtubeId){


		//Get device id of current play on device selection
		_playOnDevice =  $('#play-on option:selected').attr('data-id');

		console.log(_thisDevice, _playOnDevice, "this/playon devices");

			//Connection to node socket server opened if playOn is enabled
			if(_thisDevice !== _playOnDevice){

				_socket = 'open';

				// window.open('http://yooss.pw:3000');


			}else{

				_socket = null;

				//unmute the controller
				_player.unMute();

			}


		//No need for sockets if this is the device we're playing on
		if(_socket === null){

			//Signifies we're in play/pause loop
			if(youtubeId === ""){

				_player.playVideo();

				//Updates button ui
				$('#play-btn').attr('src', 'images/icons/pause.png');

				_playerPlaying= !_playerPlaying;

			}else{//New Video

				//reset seek stepper for each new video
				//to conrol seek bar fill
				_seek.stepper = 0;

				_player.loadVideoById(youtubeId);

			}//else youtubeId



		//==========================//
		}else{//PlayOn
		//==========================//



			//Build obj for socket transmission
			_data = {
				'userId'			: _userId,
				'device' 			: _playOnDevice,
				'youtubeId' 		: youtubeId,
				'newVideo'  		: 'false',
				'controllerDevice' 	: _thisDevice
			}



				//=============================//
				//Socket EMIT
				//=============================//
				if(youtubeId === ""){//Signifies we're in play/pause loop

					//Change data.newVideo accordingly
					_data.newVideo = 'false';

					//EMIT event back to server
					_socketConnect.emit('play', _data);


				}else{

					//Change data.newVideo accordingly
					_data.newVideo = 'true';

					//EMIT event back to server
					_socketConnect.emit('play', _data);

					console.log("PLAY new video socket.emit");
				}




					// //=============================//
					// //Listen for socket ON
					// //=============================//
					// _socketConnect.on('playOn', function (response) {

					// 	console.log("socket play return event received", response);

					// 	//Check to see if this client matches the playOn command
					// 	if(data.device === _thisDevice || data.controllerDevice === _thisDevice){


					// 		//Sets the controlling device to MUTE.
					// 		//Most efficient way of setting up controller/slave
					// 		if(data.controllerDevice === _thisDevice){
					// 			_player.mute();
					// 		}


					// 		//Check to see if this is a new video
					// 		if(response.newVideo === "false"){

					// 			_player.playVideo();
					// 			// var id = _player.getVideoData().video_id;

					// 			//Updates button ui
					// 			$('#play-btn').attr('src', 'images/icons/pause.png');

					// 			_playerPlaying= !_playerPlaying;

					// 		}else{

					// 			_player.loadVideoById(response.youtubeId);
					// 		}//else
					// 	}//if device
					// });//_socketConnect.on
		}//else playOn
	}//play









	function playAll(){
		var firstVideo = $('.resultItems[data-index="0"]').attr('data-videoId');

		//set current index
		_currentIndex = 0;


		play(firstVideo);
	};














	function pause(){


		//No need for sockets if this is the device we're playing on
		if(_socket === null){

			_player.stopVideo();

			//Updates button ui
			$('#play-btn').attr('src', 'images/icons/play-wht.png');

			_playerPlaying = !_playerPlaying;




		//==========================//
		}else{//PlayOn
		//==========================//




			//Build obj for socket transmission
			var data = {
				'device' 			: _playOnDevice,
				'controllerDevice' 	: _thisDevice
			}


			//=============================//
			//Socket EMIT pause
			//=============================//
			_socketConnect.emit('pause', data);



				//=============================//
				//Listen for socket ON
				//=============================//
				_socketConnect.on('pauseOn', function(response){

					//Check to see if this client matches the pauseOn command
					if(data.device === _thisDevice || data.controllerDevice === _thisDevice){

						//Sets the controlling device to MUTE.
						//Most efficient way of setting up controller/slave
						if(data.controllerDevice === _thisDevice){
							_player.mute();
						}



						_player.stopVideo();

						//Updates button ui
						$('#play-btn').attr('src', 'images/icons/play-wht.png');

						_playerPlaying = !_playerPlaying;
					}//if
				});//_socketConnect.on
		}//else
	}//pause()














	function playRandom(){

		//get list items length
		var resultLength = $('li.resultItems:eq(' + 0 + ')').attr('data-resultLength');

		//random index for shuffle mode.
		var randomIndex = Math.floor(Math.random() * resultLength);

		var getVideo = $('.resultItems[data-index="' + randomIndex + '"]').attr('data-videoId');


		// $('.resultItems').each(function(){
		// 	var vid = $(this).attr('data-videoId');
		// 	_shuffleList.push(vid);
		// });


		// var getVideo = Math.floor(Math.random() * _shuffleList.length);

		//Start playing next video in shuffle
		// _player.loadVideoById(getVideo);
		play(getVideo);


		//Set the previous index for use in the previous button functionality
		//Only push when the song being pushed is a new shuffle song
		_shuffleIndexes.push(_currentIndex);
	}











// })(window, document,jQuery);
});//define()
})();//function
