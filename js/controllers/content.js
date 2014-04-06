//Content is essentially a view controller
var Content = (function(window, document, $){

	//Instances
	// var _library 	= new Library();
	// var _user		= new User();


	//private vars
	var _songs 		= [];
	var	_userId		= '';
	var	_userEmail 	= '';
	var _userLibrary;




	//constructor method
	var content = function(){


		//NOTE: add click unbinds
		// $(".bet").unbind().click(function() {
		// //Stuff
		// });


		//Acct Settings page load interaction=========//
		$(document).on('click', '#acctSettings', function(event){

			loadAcctSettings();
		});




		//Device Settings page load interaction=========//
		$(document).on('click', '#deviceSettings', function(event){

			loadDeviceSettings();
		});




		//Songs library page load interaction=========//
		$(document).on('click', '#viewSongs', function(event){

			loadLibrary();
		});




		//Artists library page load interaction=========//
		$(document).on('click', '#viewArtists', function(event){

			loadLibrary();
		});




		//Albums library page load interaction=========//
		$(document).on('click', '#viewAlbums', function(event){

			loadLibrary();
		});




		//Genres library page load interaction=========//
		$(document).on('click', '#viewGenres', function(event){

			loadLibrary();
		});




		//Playlist page load interaction=========//
		$(document).on('click', '.playlistTitle', function(event){

			//Grabs playlist id for specific loading
			var id = $(this).attr('data-id');
			console.log(id, 'this is the clicked playlist id');

			loadLibrary();
		});




		//Note:*** Click registering TWICE - Needs a fixin
		//Search call and result looping=========//
		$(document).on('click', '#searchSubmit', function(event){
			event.preventDefault();
			var query = $('#searchInput').val();
			var API_URL = 'http://localhost:8887/search/' + query;
			var songs = [];

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

					//pass data to private var
					//after loading new results
					_songs = songs;

				}//success
			});//ajax
		});//click




		//Reload previous search into main content view
		$(document).on('click', '#returnToSearch', function(event){

			//Send previous results back to renderer
			loadQueryResults(_songs);

		});




		//Listens for user to log in to load library for user
		$(document).on('userloggedin', function(event){

			_userId 	= event.userId;
			_userEmail 	= event.email;
		});










		//Makes synchronous
		//Listens for loadApp content renderer complete
		$(document).on('rendered', function(event){


			if(event.template === '#app'){

				//Load library items
				loadLibrary();

				//Load playlists
				loadPlaylists();



				// //Listens for library renderer complete
				// $(document).on('rendered', function(event){

			}
				// });//onRendered
			if(event.template === '#libraryItem'){


				//Loop through li items to see if song is in library
				for(var i=0;i<_userLibrary.length;i++){

					//Gets the song_id from the displayed result item
					var itemId = $('li.resultItems:eq(' + i + ')').find('.addToLibrary').attr('data-id');

					//Checks result item against user's library stored locally
					//Sets check/add icon accordingly
					if(_userLibrary[i].song_id === itemId){
						//Swaps out icon
						$('li.resultItems:eq(' + i + ')').find('.addToLibrary').find('.add-icon').attr('src', 'images/icons/check.png');

					}else{

						//Swaps out icon
						$('li.resultItems:eq(' + i + ')').find('.addToLibrary').find('.add-icon').attr('src', 'images/icons/add.png');
					}
				}//for

				//Hide DOM nodes
				hideNodes();


				//data-in-library="false"



			}//#libraryItem event


		});//onRendered










	};//constructor function
	//================================//




	//methods and properties.
	content.prototype = {
		constructor 		: content,
		loadLanding 		: loadLanding,
		loadPlaylists		: loadPlaylists,
		loadLibrary 		: loadLibrary,
		loadApp				: loadApp
	};





	//return constructor
	return content;









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



		render(src, id, appendTo, data);
	}









	//Loads app template
	function loadApp(){
		var src 		= '/js/views/app.html',
			id 			= '#app',
			appendTo 	= '#wrapper';

			data 	 	= {
				test	: ''
			};



		render(src, id, appendTo, data);

		//Loads any scripts needing dynamic insertion
		loadScripts();
	}









	//Loads any scripts needing dynamic insertion
	function loadScripts(){

		//Load YouTube Player API scripts
		var tag = document.createElement('script');
			tag.src = "http://www.youtube.com/player_api";

		var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		//End YouTube Player API scripts
	}









	//Gets data & Loads playlist template
	function loadPlaylists(){
		var src 		= '/js/views/playlist.html',
			id 			= '#playlist',
			appendTo 	= '#playlistWrapper';

			data 	 	= {
				playlist: [{id: '0', title: 'Jazz mix'},
							{id: '01', title: 'Blues'},
							{id: '02', title: 'Aphex twin'},
							{id: '03', title: 'Richard James'},
							{id: '04', title: 'Richard David James'},
							{id: '05', title: 'Analogue Bubblebath'},
							{id: '10', title: 'Jazz mix'},
							{id: '101', title: 'Blues'},
							{id: '102', title: 'Aphex twin'},
							{id: '103', title: 'Richard James'},
							{id: '104', title: 'Richard David James'},
							{id: '105', title: 'Analogue Bubblebath'},
							{id: '20', title: 'Jazz mix'},
							{id: '201', title: 'Blues'},
							{id: '202', title: 'Aphex twin'},
							{id: '203', title: 'Richard James'},
							{id: '204', title: 'Richard David James'},
							{id: '205', title: 'Analogue Bubblebath'},
							{id: '30', title: 'Jazz mix'},
							{id: '301', title: 'Blues'},
							{id: '302', title: 'Aphex twin'},
							{id: '303', title: 'Richard James'},
							{id: '304', title: 'Richard David James'},
							{id: '305', title: 'Analogue Bubblebath'},
							{id: '310', title: 'Jazz mix'},
							{id: '3101', title: 'Blues'},
							{id: '3102', title: 'Aphex twin'},
							{id: '3103', title: 'Richard James'},
							{id: '3104', title: 'Richard David James'},
							{id: '3105', title: 'Analogue Bubblebath'},
							{id: '320', title: 'Jazz mix'},
							{id: '3201', title: 'Blues'},
							{id: '3202', title: 'Aphex twin'},
							{id: '3203', title: 'Richard James'},
							{id: '3204', title: 'Richard David James'},
							{id: '3205', title: 'Analogue Bubblebath'}]
			};

			//Shows column headers
			$('.li-header').show();

			//Render playlist items w/ playlist data
			render(src, id, appendTo, data);
	}









	//Gets data & Loads library template
	function loadLibrary(){
		var src 		= '/js/views/library.html',
			id 			= '#libraryItem',
			appendTo 	= '.scroll-container';

			//Build API request
			var API_URL = 'http://localhost:8887/get-library/' + _userId;




			//Call API for user's library
			$.ajax({
				url 		: API_URL,
				method 		: 'GET',
				dataType 	: 'json',
				success 	: function(response){

					data 	 	= {
						song : response
					};

					//Store the users library for library functions
					_userLibrary = response;

					//Shows column headers
					$('.li-header').show();

					//Render library items with user data
					render(src, id, appendTo, data);
				}//success
			});//ajax


		//Note: This is the data returned from API
		//album, artist, created_at, description, genre, id, img_default, img_high, img_medium
		//length, query, song_title, updated_at, youtube_id, youtube_results_id, youtube_title
	}









	function loadAcctSettings(){
		var src 		= '/js/views/acctSettings.html',
			id 			= '#acctSettings',
			appendTo 	= '.scroll-container';

			data 	 	= {
				test	: ''
			};

			//Hides column headers
			$('.li-header').hide();

		render(src, id, appendTo, data);

	}









	function loadDeviceSettings(){
		var src 		= '/js/views/deviceSettings.html',
			id 			= '#deviceSettings',
			appendTo 	= '.scroll-container';

			data 	 	= {
				test	: ''
			};

			//Hides column headers
			$('.li-header').hide();

		render(src, id, appendTo, data);
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
			$('.li-header').show();


		render(src, id, appendTo, data);
	}













	//Maintains list of DOM nodes to hide on app init
	function hideNodes(){

		var selectors = ['.playlist-dropdown', 'li.main-dropdown',
		'.add-to-playlist-menu', '.improve-meta-sub-menu'];

		for(var i=0; i<selectors.length;i++){
			$(selectors[i]).hide();
		}
	}










	function render(src, id, appendTo, data){

		$.get(src, function(htmlArg){

			//Finds and populates template
			var source 		= $(htmlArg).find(id).html();
			var template 	= Handlebars.compile(source);
			var html 		= template(data);


			//Clear append container
			$(appendTo).empty();

			//Appends template into Wrapper on DOM
			$(appendTo).append(html);


			//Fires a complete event after content has been appended
			$(document).trigger({
				type		: 'rendered',
				template 	: id
			});
		});
	}



















})(window, document,jQuery);
