(function(){
define(['jquery', 'Handlebars', 'getCookies', 'Init', 'User', 'Ui', 'Library'], function($, handlebars, getCookies, Init, User, Ui, Library){






	//private vars
	var DOM 			= {};
	var _songs 			= [];
	var	_userId			= window.userId;
	var	_userEmail 		= '';
	var _userSongs 		= [];
	var _sortBy			= 'def';
	var _sortOrder		= 'def';
	var _currentContent = '';
	var _baseUrl 		= 'http://api.yootunes.com';
	var _thisDevice;
	var _playlistShared = 0;

	var _libraryChanged = false;
	var _libraryCount;
	var _loadInterval;
	var _currentSkip 	= 0;
	var _numPages;
	var _onPage 		= 1;
	var _limit 			= 0;//0 === no limit












		//Acct Settings page load interaction=========//
		$(document).on('click', '#acctSettings', function(event){

			//load account settings page
			loadAcctSettings();


			activeLibraryItem('#acctSettings');

			//Set correct container height
			DOM.scrollContainer.css('height', '100vh');

		});//click acctSettings












		//Songs library page load interaction=========//
		$(document).on('click', '.viewSongs', function(event){
			resetPagination();
			loadFilteredLibrary('youtube_title', '.viewSongs');

		});










		//Artists library page load interaction=========//
		$(document).on('click', '.viewArtists', function(event){
			resetPagination();
			loadFilteredLibrary('artist', '.viewArtists');
		});










		//Albums library page load interaction=========//
		$(document).on('click', '.viewAlbums', function(event){
			resetPagination();
			loadFilteredLibrary('album', '.viewAlbums');
		});










		//Genres library page load interaction=========//
		$(document).on('click', '.viewGenres', function(event){
			resetPagination();
			loadFilteredLibrary('genre', '.viewGenres');

		});










		//Playlist page load interaction=========//
		$(document).on('click', '.playlistTitle', function(event){

			//Grabs playlist id for specific loading
			var playlistId = $(this).attr('data-id');

			//Get & load playlist songs
			loadPlaylistSongs(playlistId);

			activeLibraryItem(playlistId);

			//Set correct container height
			DOM.scrollContainer.css('height', '74vh');
		});











		//Search call and result looping=========//
		$(document).on('click', '#searchSubmit', function(event){
			event.preventDefault();
			var query = DOM.searchInput.val();
			var API_URL = _baseUrl + '/search/' + query;
			var songs = [];

			//Empty results list while srarch results load
			DOM.scrollContainer.empty();

			//Show loading icon
			DOM.loading.fadeIn();

			//Search query call
			$.ajax({
				url 		: API_URL,
				method 		: 'GET',
				dataType	: 'json',
				success 	: function(data){

					//Loop through response & push into array
					//for delivery to renderer
					for(var i=0;i<data.length;i++){

						songs.push(data[i]);
					}

					//Send results to renderer
					loadQueryResults(songs);

					//Hide loading icon
					DOM.loading.fadeOut();

					//pass data to private var
					//after loading new results
					_songs = songs;

				}//success
			});//ajax
		});//click










		//Reload previous search into main content view
		$(document).on('click', '#returnToSearch', function(event){

			//If no prev search exists, reload
			//library resetting pagination
			if(_songs.length === 0){

				resetPagination();

				//Load library items
				loadLibrary(_currentSkip);

			}else{
				//Send previous results back to renderer
				loadQueryResults(_songs);
			}
		});







		//Listen for library controller to notify of song added or removed
		$(document).on('libraryChanged', function(event){
			_libraryChanged = true;
		});









		//on reload set shared playlist id for use in app rendered event
		$(document).on('userloggedin', function(event){
			_playlistShared = event.playlistId;

			//window.userId was set in init just before this fired
			_userId = window.userId;

			//Remove share from url
			window.history.pushState({test : ''}, '', "/");


		});









		//Set device on new device creation
		$(document).on('reloadDevices', function(event){

			//Fade out name device modal
			DOM.nameDeviceModal.fadeOut();

			//Set this device once a new one is created
			_thisDevice = event.newDeviceId;

		});//on reloadDevices








		//Reload devices in slave mode to prevent glitched controlling
		$(document).on('slaveMode', function(){

			console.log("slave mode content cont");
			User.getDevices(_userId, function(response){

				renderDevices(response);
			});//getDevices

		});











		//Makes synchronous
		//Listens for loadApp content renderer complete
		$(document).on('rendered', function(event){

			registerDOM(event.template);

			//ON APP RENDER========================//
			if(event.template === '#app'){

				//Show adsense ads on app load
				DOM.adsense.show();
				// DOM.video.show();



				//Ensures userId is always available
				if(_userId === undefined){
					if(window.userId !== undefined){
						_userId = window.userId;
					}else if(getCookies.userId !== undefined){
						_userId = getCookies.userId;
					}
				}


				//Failsafe retrieval of theme
				if(window.theme === undefined){
					window.theme = getCookies.theme;
				}

				//Set the application THEME colors
				if(window.theme === 'light'){

					Ui.themeLight();
				}else{

					Ui.themeDark();
				}

				console.log(window.theme, "theme content app rendered");







				//DEVICE DETECTION
				//Flow: 1. check device cookies against user devices. If match, set this device
				//		2. If no match, prompt user to name this device
				//		3. if no cookies found, prompt user to select this device from their devices or name this new device
				if(getCookies.devices.length !== 0){
					var devices = getCookies.devices;
					var match = false;

					//DETERMINE WHICH DEVICE COOKIE IS THIS USER'S
					User.getDevices(_userId, function(response){

						for(var i=0;i<response.length;i++){
							for(var j=0;j<devices.length;j++){

								if(response[i].id === devices[j]){

									//THIS IS THE USER'S DEVICE
									_thisDevice 		= devices[j];
									window.thisDevice 	= devices[j];
									match 				= true;

									renderDevices(response);

									break;
								}//if
							}//for j
						}//for i


						if(match === false){

							//Fade in modal to instruct user to name this device
							DOM.nameDeviceModal.fadeIn();

						}//if false
					});//getDevices


				}else{//NO DEVICE COOKIES FOUND


					//Fade in modal to instruct user to name this device
					DOM.nameDeviceModal.fadeIn();
					// $('#devicePrompt').fadeIn();

					//Maybe user deleted cookies? GET DEVICES TO ASK USER
					User.getDevices(_userId, function(response){

						renderDevices(response);
					});//getDevices
				}//else





				//if playlistId cookie exists load playlist, else load library
				if(_playlistShared === 0 || _playlistShared === undefined|| _playlistShared === ""){


					//Load library items
					loadLibrary(_currentSkip);


				}else{

					//Adds shared playlist to this user's account
					Library.addSharedPlaylist(_userId, _playlistShared);

					//Load library items
					// loadLibrary(_currentSkip);

					//load the playlist songs if this was a shared playlist
					loadPlaylistSongs(_playlistShared);

					//Expires share cookie once it has been used
					document.cookie = 'share=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
				}


				//Load playlists
				loadPlaylists();
			}//if #app



			//ON LIBRARY RENDER========================//
			if(event.template === '#libraryItem'){

				var resultItems = $('li.resultItems');
				DOM.sourceTitle = $('.sourceTitle');


				//Set the application theme colors
				//again to ensure lib items are styled
				//once they hit the DOM
				if(window.theme === 'light'){
					Ui.themeLight();
				}else{
					Ui.themeDark();
				}







				//Remove search input value
				DOM.searchInput.val('');

				//Set list item length to DOM for shuffle function in player controller
				$('li.resultItems:eq(' + 0 + ')').attr('data-resultLength', _userSongs.length);

				//CHANGE ICON FROM TRASH TO PLUS SIGN============//
				if(DOM.sourceTitle.html() === 'Add'){

					//Swaps out icon for add icon
					resultItems.find('.addToLibrary').find('.add-icon').attr('src', 'images/icons/add.png');
				}else{

					resultItems.find('.addToLibrary').find('.add-icon').attr('src', 'images/icons/trash-icon.svg');
				}


				//Loop through li items to see if song is in library
				for(var i=0;i<_userSongs.length;i++){

					//Sets an index number to each li item
					$('li.resultItems:eq(' + i + ')').attr('data-index', i);

					//Gets the song_id from the displayed result item
					var itemId = $('li.resultItems:eq(' + i + ')').find('.addToLibrary').attr('data-id');

//**NOTE			//Should load the library here w/out a limit to get an array of song ids.
					//if song id matches this song, then add the check mark icon instead

				}//for

				//Hide DOM nodes
				hideNodes();

				//Load sub menu playlists
				loadSubPlaylists();

			}//#libraryItem event



			//ON LANDING PAGE RENDER========================//
			if(event.template === '#landing'){
				//Hide DOM nodes
				hideNodes();
			}//#landing event



			//ON ACCT SETTINGS RENDER========================//
			if(event.template === '#acctSettings'){

				//Hide ads on acct settings page
				DOM.adsense.hide();

				//Check/uncheck theme option based on current setting
				if(window.theme === "dark"){
					DOM.themeDark.prop('checked', true);
				}else{
					DOM.themeDark.prop('checked', false);
				}

				//Set the application theme colors
				//again to ensure settings items are styled
				//once they hit the DOM
				if(window.theme === 'light'){
					Ui.themeLight();
				}else{
					Ui.themeDark();
				}


				//Hide the entire section header (search bar)
				DOM.sectionHeader.hide();


				//Get User
				User.getUser(_userId, function(response){

					DOM.infoName.val(response[0].display_name);
					DOM.infoEmail.val(response[0].email);
					DOM.infoId.html(response[0].id);
					DOM.infoTitleGender.val(response[0].title);

					//Format birthdate for display
					var birthdate = response[0].birthMonth + '/' + response[0].birthDay + '/' + response[0].birthYear;

					if(birthdate === '0/0/0'){
						DOM.infoBirthdate.val('4/24/14');
					}else{
						DOM.infoBirthdate.val(birthdate);
					}



					//Prepend selected TITLE option
					var option1 = '<option >' + response[0].title + '</option>';
					DOM.infoTitleGender.prepend(option1);

						//Handle title options list
						if(response[0].title == "Mr."){
							var option2 = '<option >Mrs.</option>';
							var option3 = '<option >Ms.</option>';
							DOM.infoTitleGender.append(option2);
							DOM.infoTitleGender.append(option3);
						}else if(response[0].title == "Mrs."){
							var option2 = '<option >Mr.</option>';
							var option3 = '<option >Ms.</option>';
							DOM.infoTitleGender.append(option2);
							DOM.infoTitleGender.append(option3);
						}else if(response[0].title == "Ms."){
							var option2 = '<option >Mrs.</option>';
							var option3 = '<option >Mr.</option>';
							DOM.infoTitleGender.append(option2);
							DOM.infoTitleGender.append(option3);
						}
				});//getUser



				//Get Devices
				User.getDevices(_userId, function(response){
					renderDevices(response);
				});

			}//acctSettings
		});//onRendered













		//Reload playlists when new playlist added
		$(document).on('playlistadded', function(){

			//Load playlist items
			loadPlaylists();

			//Load menu playlists
			loadSubPlaylists();
		});










		//Reload playlist after song removal
		$(document).on('playlistsongremoved', function(event){

			//Reload playlist songs after song removed
			loadPlaylistSongs(event.id)
		});











		//Forgot Password view renderer
		$(document).on('click', '#forgotPassword', function(event){
			event.preventDefault();

			loadForgotPass();
		});








		//Reload devices when one was deleted
		$(document).on('reloadDevices', function(){

			//Load devices
			User.getDevices(_userId, function(response){
				renderDevices(response);
			});
		});








//=========================================//
//End event logic
//========================================//






	//public methods & properties.
	var exports = {
		loadLanding 		: loadLanding,
		loadPlaylists		: loadPlaylists,
		loadLibrary 		: loadLibrary,
		loadApp				: loadApp,
		loadReset 			: loadReset,
		loadAcctSettings    : loadAcctSettings,
		loadScripts 		: loadScripts
	};





	//return exports
	return exports;












//================================//
//Class methods===================//
//================================//













	//Loads landing template
	function loadLanding(){
		var src 		= '/js/views/landing.html',
			id 			= '#landing',
			appendTo 	= '#wrapper';

			data 	 	= {
				test	: ''
			};

			//Clear append container
			$(appendTo).empty();

		render(src, id, appendTo, data);

			resetPagination();
	}









	//Loads app template
	function loadApp(){
		var src 		= '/js/views/app.html',
			id 			= '#app',
			appendTo 	= '#wrapper';

			data 	 	= {
				test	: ''
			};

			//Clear append container
			$(appendTo).empty();


		render(src, id, appendTo, data);


		resetPagination();

	}









	//Loads forgot password template
	function loadForgotPass(){
		var src 		= '/js/views/forgotPassword.html',
			id 			= '#forgot',
			appendTo 	= '#wrapper';

			data 	 	= {
				test	: ''
			};

			//Clear append container
			$(appendTo).empty();



		render(src, id, appendTo, data);

			resetPagination();
	}









	//Loads reset password template
	function loadReset(){
		var src 		= '/js/views/resetPassword.html',
			id 			= '#reset',
			appendTo 	= '#wrapper';

			data 	 	= {
				test	: ''
			};

			//Clear append container
			$(appendTo).empty();



		render(src, id, appendTo, data);

			resetPagination();
	}









	//Loads any scripts needing dynamic insertion
	function loadScripts(){


		//Google+ Auth script
		var po = document.createElement('script');
		   po.type = 'text/javascript'; po.async = true;
		   po.src = 'https://apis.google.com/js/client:plusone.js';

	   	var s = document.getElementsByTagName('script')[0];
	   		s.parentNode.insertBefore(po, s);
	   	//End Google+ auth script
	}













	//Gets data & Loads playlist template
	function loadPlaylists(){
		var src 		= '/js/views/playlist.html',
			id 			= '#playlist',
			appendTo 	= '#playlistWrapper';


		//Build API request
		var API_URL = _baseUrl + '/get-playlists/' + _userId;


		//Call API for user's playlist
		$.ajax({
			url 		: API_URL,
			method 		: 'GET',
			dataType 	: 'json',
			success 	: function(response){


				data 	 	= {
					playlist: response
				};



				//Shows column headers
				// DOM.liHeader.show();

				//Clear append container
				$(appendTo).empty();

				//Render playlist items w/ playlist data
				render(src, id, appendTo, data);

			}//success
		});//ajax


	}









	//Gets data & Loads playlist template
	function loadSubPlaylists(){
		var src 		= '/js/views/subPlaylist.html',
			id 			= '#subPlaylist',
			appendTo 	= '.playlistSubScrollContainer';


		//Build API request
		var API_URL = _baseUrl + '/get-playlists/' + _userId;


		//Call API for user's playlist
		$.ajax({
			url 		: API_URL,
			method 		: 'GET',
			dataType 	: 'json',
			success 	: function(response){


				data 	 	= {
					playlist: response
				};


				//Shows column headers
				// DOM.liHeader.show();

				//Clear append container
				$(appendTo).empty();

				//Render playlist items w/ playlist data
				render(src, id, appendTo, data);

			}//success
		});//ajax


	}









	//Gets data & Loads playlist songs
	function loadPlaylistSongs(playlistId){
		var src 		= '/js/views/library.html',
			id 			= '#libraryItem',
			appendTo 	= '.scroll-container';

			//Build API request
			var API_URL = _baseUrl + '/get-playlist-songs/' + playlistId;




			//Call API for user's playlist songs
			$.ajax({
				url 		: API_URL,
				method 		: 'GET',
				dataType 	: 'json',
				success 	: function(response){

					data 	 	= {
						song : response,
						user : {userId : _userId}
					};


					//Reset _userSongs then Store the users songs for list functions
					_userSongs = [];
					for(var i=0;i<response.length; i++){
						_userSongs.push(response[i].song_id);
					}

					//Shows column headers
					DOM.liHeader.show();

					//Clear append container
					$(appendTo).empty();

					//Render library items with user data
					render(src, id, appendTo, data);

					resetPagination();


					//Change last column to remove
					DOM.sourceTitle.html('Remove');

				}//success
			});//ajax
	}












	//Gets data & Loads library template
	function loadLibrary(page){

		//Ensures userId is always available
		if(_userId === undefined){
			if(window.userId !== undefined){
				_userId = window.userId;
			}else if(getCookies.userId !== undefined){
				_userId = getCookies.userId;
			}
		}



		//Ensures search bar is visible & container is
		//emptied quickly before a reload
		if(page === 0){
			DOM.sectionHeader.show();
			DOM.scrollContainer.empty();

			//Shows column headers
			// DOM.liHeader.show();

			//Change last column to remove
			DOM.sourceTitle.html('Remove');
		}




// localStorage.removeItem('library');
		//====================================//
		//Get library from local storage
		//====================================//
		if(JSON.parse(localStorage.getItem('library')) !== null && _libraryChanged === false){
			console.log("pulled lib from local storage");
			var response = JSON.parse(localStorage.getItem('library'));

			setLibrary(response);

			alert('local storage used' + localStorage.getItem('library'));



		//====================================//
		}else{//Make AJAX call to get library
		//====================================//


			//Build API request
			var API_URL = _baseUrl + '/get-library/' + _userId + '/' + _sortBy + '/' + _sortOrder + '/' + page + '/' + _limit;



			//Call API for user's library
			$.ajax({
				url 		: API_URL,
				method 		: 'GET',
				dataType 	: 'json',
				success 	: function(response){

					setLibrary(response);

					//Set library to local storage
					if(localStorage){
						localStorage.setItem('library', JSON.stringify(response));
						console.log("rewrote local storage");
					}

					_libraryChanged = false;
					//compare localStorage to library?


					//Add a loading screen here that's removed once library is rendered



				}//success
			});//ajax
		}//localstorage

		//Note: This is the data returned from API
		//album, artist, created_at, description, genre, id, img_default, img_high, img_medium
		//length, query, song_title, updated_at, youtube_id, youtube_results_id, youtube_title
	}











	//Used by loadLibrary method
	function setLibrary(response){

		var src 		= '/js/views/library.html',
			id 			= '#libraryItem',
			appendTo 	= '.scroll-container';


		data = {
				song : response[0],
				user : {userId : _userId}
			};


			//Only render library if this is not a shared playlist.
			//Loads shared playlist instead
			if(_playlistShared === 0 || _playlistShared === undefined|| _playlistShared === ""){
				//Render library items with user data
				render(src, id, appendTo, data);
			}else{
				//resets shared playlist after library behavior has taken place
				_playlistShared = 0;
			}




			//Pagination vars
			_libraryCount 	= response.count;

			//Set the number of pages available to pagination
			_numPages = Math.ceil(response.count / response.limit);

			//Display total songs in library in interface
			DOM.collectionTotal.html(response.count);




			//Store the users songs for list functions
			//Store youtube img urls for click dependent loading to limit GET requests
			for(var i=0;i<response[0].length; i++){
				_userSongs.push(response[0][i].song_id);
			}
	}









	function loadAcctSettings(){
		var src 		= '/js/views/acctSettings.html',
			id 			= '#acctSettings',
			appendTo 	= '.scroll-container';

			data 	 	= {
				test	: ''
			};

			//Clear append container
			$(appendTo).empty();

		render(src, id, appendTo, data);

			resetPagination();

			//Hides column headers
			DOM.liHeader.hide();

	}













	//Gets data from API & displays in list
	function loadQueryResults(songs){
		var src 		= '/js/views/library.html',
			id 			= '#libraryItem',
			appendTo 	= '.scroll-container';

			data 	 	= {
				song	: songs,
				user 	: {userId : _userId}
			};

			//Shows column headers
			// DOM.liHeader.show();

			//Clear append container
			$(appendTo).empty();


		render(src, id, appendTo, data);


			resetPagination();


		//Change last column to remove
		DOM.sourceTitle.html('Add');
	}













	//Maintains list of DOM nodes to hide on app init
	function hideNodes(){

		var selectors = ['.playlist-dropdown', 'li.main-dropdown',
		 '.improve-meta-sub-menu', '.signin',
		'#restoreAcctModal', '.newPlaylistForm'];

		for(var i=0; i<selectors.length;i++){
			$(selectors[i]).hide();
		}
	}














	function renderDevices(response){
		DOM.playOn.empty();
		DOM.mobilePlayOn.empty();
		DOM.infoDeviceList.empty();


		//Loop through device list
		for(var j=0;j<response.length;j++){

			//If device is this device, set name
			if(response[j].id === _thisDevice){

				//Set the current device if it matches the cookie
				DOM.infoDeviceName.val(response[j].name);
				DOM.infoDeviceName.attr('data-id', response[j].id);

				//set footer list items first result to the current device
				var option = '<option data-id="' + response[j].id + '">' + response[j].name + '</option>';
				DOM.playOn.prepend(option);
				DOM.mobilePlayOn.prepend(option);
			}else{

				//Render MODAL window list
				var option 	= '<option data-id="' + response[j].id + '">' + response[j].name + '</option>';
				DOM.userDevices.append(option);


				//Populate SETTINGS PAGE list
				var li = '<li>' + response[j].name + ' <img id="deleteDevice" data-id="' + response[j].id + '" src="images/icons/trash-icon.svg"/></li>';
				DOM.infoDeviceList.append(li);


				//Populate APP FOOTER list
				var option = '<option data-id="' + response[j].id + '">' + response[j].name + '</option>';
				DOM.playOn.append(option);
				DOM.mobilePlayOn.append(option);

			}//else
		}//for

		//Add a blank device to MODAL list
		var blank	= '<option>Your Devices</option>'
		DOM.userDevices.prepend(blank);
	}













	function render(src, id, appendTo, data){

		$.get(src, function(htmlArg){

			//Finds and populates template
			var source 		= $(htmlArg).find(id).html();
			var template 	= Handlebars.compile(source);
			var html 		= template(data);


			//Clear append container
			// $(appendTo).empty();

			//Appends template into Wrapper on DOM
			$(appendTo).append(html);


			//Fires a complete event after content has been appended
			$(document).trigger({
				type		: 'rendered',
				template 	: id
			});
		});
	}













	function sortList(by){

		this.toggle;

		if(this.toggle){
			//Set the sort order
			_sortBy 	= by;
			_sortOrder 	= "DESC";

			//Load library
			loadLibrary(_currentSkip);
			//paged loading of library items every 1.5s until
			//full library is loaded
			// _loadInterval = setInterval(pageLoader, 1500);

			this.toggle = !this.toggle;

		}else{
			//Set the sort order
			_sortBy 	= by;
			_sortOrder 	= "ASC";

			//Load library
			loadLibrary(_currentSkip);
			//paged loading of library items every 1.5s until
			//full library is loaded
			// _loadInterval = setInterval(pageLoader, 1500);

			this.toggle = !this.toggle;
		}
	}







	// function pageLoader(){

	// 	if((_currentSkip + _limit) <= _libraryCount){
	// 		console.log(_currentSkip, "if");
	// 		_onPage 		+= 1;
	// 		_currentSkip 	+= _limit;

	// 		//Load the next page
	// 		loadLibrary(_currentSkip);

	// 	}else{


	// 		clearInterval(_loadInterval);

	// 	}//if
	// }










	//Resets PAGINATION variables for transitioning
	//back to library fom another screen
	function resetPagination(){
		_currentSkip 	= 0;
		_onPage 		= 1;
		_userSongs 		= [];
	}








	//loads library from LIbrary menu click for sorting
	// -songs,artists,albums,genres
	function loadFilteredLibrary(sortBy, activeItem){

		//Show search bar
		DOM.liHeader.show();
		DOM.sectionHeader.show();

		DOM.scrollContainer.empty();

		DOM.sourceTitle.html("Remove");

		sortList(sortBy);

		activeLibraryItem(activeItem);

		//Set correct container height
		DOM.scrollContainer.css('height', '74vh');

		//Shows ads if coming from acct settings page
		DOM.adsense.show();
	}








	function activeLibraryItem(active){

		var songs 		= '.viewSongs';
		var artists 	= '.viewArtists';
		var albums 		= '.viewAlbums';
		var genres 		= '.viewGenres';
		var settings 	= '#acctSettings';
		var playlists 	= '.playlistTitle';

			if(active === songs){
				$(songs).find('a').addClass('red');
				$(songs).addClass('red');

				$(artists).removeClass('red');
				$(albums).removeClass('red');
				$(genres).removeClass('red');
				$(artists).find('a').removeClass('red');
				$(albums).find('a').removeClass('red');
				$(genres).find('a').removeClass('red');
				$(settings).find('a').removeClass('red');
				$(playlists).removeClass('red');

			}else if(active === artists){
				$(artists).find('a').addClass('red');
				$(artists).addClass('red');

				$(songs).removeClass('red');
				$(albums).removeClass('red');
				$(genres).removeClass('red');
				$(songs).find('a').removeClass('red');
				$(albums).find('a').removeClass('red');
				$(genres).find('a').removeClass('red');
				$(settings).find('a').removeClass('red');
				$(playlists).removeClass('red');

			}else if(active === albums){
				$(albums).find('a').addClass('red');
				$(albums).addClass('red');

				$(artists).removeClass('red');
				$(songs).removeClass('red');
				$(genres).removeClass('red');
				$(songs).find('a').removeClass('red');
				$(artists).find('a').removeClass('red');
				$(genres).find('a').removeClass('red');
				$(settings).find('a').removeClass('red');
				$(playlists).removeClass('red');

			}else if(active === genres){
				$(genres).find('a').addClass('red');
				$(genres).addClass('red');

				$(artists).removeClass('red');
				$(albums).removeClass('red');
				$(songs).removeClass('red');
				$(songs).find('a').removeClass('red');
				$(artists).find('a').removeClass('red');
				$(albums).find('a').removeClass('red');
				$(settings).find('a').removeClass('red');
				$(playlists).removeClass('red');

			}else if(active === settings){
				$(settings).find('a').addClass('red');

				$(artists).removeClass('red');
				$(albums).removeClass('red');
				$(songs).removeClass('red');
				$(genres).removeClass('red');
				$(songs).find('a').removeClass('red');
				$(artists).find('a').removeClass('red');
				$(albums).find('a').removeClass('red');
				$(genres).find('a').removeClass('red');
				$(playlists).removeClass('red');

			}else{//if active is a playlist id
				$(playlists).removeClass('red');
				$(playlists + '[data-id=' + active + ']').addClass('red');

				$(artists).removeClass('red');
				$(albums).removeClass('red');
				$(songs).removeClass('red');
				$(genres).removeClass('red');
				$(songs).find('a').removeClass('red');
				$(artists).find('a').removeClass('red');
				$(albums).find('a').removeClass('red');
				$(genres).find('a').removeClass('red');
				$(settings).find('a').removeClass('red');
			}
	}










	function registerDOM(template){

		if(template === '#app'){
			DOM.scrollContainer = $('div.scroll-container');
			DOM.searchInput 	= $('input#searchInput');
			DOM.loading 		= $('div.loading');
			DOM.nameDeviceModal = $('div#nameDeviceModal');
			// DOM.video 			= $('#video');
			DOM.adsense 		= $('div#adsense');
			DOM.sectionHeader 	= $('.section-header');
			DOM.sourceTitle 	= $('.sourceTitle');
			DOM.resultItems 	= $('li.resultItems');//Why this workey workey?
			DOM.collectionTotal = $('#collectionTotal');
			DOM.playOn 			= $('#play-on');
			DOM.mobilePlayOn 	= $('#mobile-play-on');
			DOM.userDevices 	= $('#userDevices');//modal
			DOM.infoDeviceList 	= $('#infoDeviceList');
			DOM.infoDeviceName 	= $('.infoDeviceName');
			DOM.liHeader 		= $('.li-header');
		}//#app

		if(template === '#landing'){


		}//#landing

		if(template === '#forgot'){

		}//#library

		if(template === '#reset'){

		}//#library

		if(template === '#library'){

		}//#library

		if(template === '#playlist'){

		}//#library

		if(template === '#subPlaylist'){

		}//#library

		if(template === '#acctSettings'){
			DOM.themeDark 		= $('#themeDark');
			DOM.infoName 		= $('#infoName');
			DOM.infoEmail 		= $('#infoEmail');
			DOM.infoId 			= $('#infoId');
			DOM.infoTitleGender = $('#infoTitleGender');
			DOM.infoBirthdate 	= $('#infoBirthdate');
			DOM.infoDeviceName 	= $('.infoDeviceName');
			DOM.infoDeviceList 	= $('#infoDeviceList');
		}//#acctSettings
	}























});//define()
})();//function
