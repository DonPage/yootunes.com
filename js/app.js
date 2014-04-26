require.config({
	baseUrl : "./js",
	optimize: "none",
	paths 	: {
		jquery 		: 'libs/jquery',
		modernizr 	: 'libs/modernizr',
		Handlebars 	: 'libs/handlebars',
		socketio 	: 'http://yooss.pw:3998/socket.io/socket.io',
		Init 		: 'controllers/init',
		Auth 		: 'controllers/auth',
		Content 	: 'controllers/content',
		Ui 			: 'controllers/ui',
		Library 	: 'controllers/library',
		Player 		: 'controllers/player',
		User 		: 'controllers/user',
		getCookies 	: 'services/getCookiesService'
	}
});

// packages 		: [
// 		{
// 			name : 'jquery',
// 			location : 'libs/',
// 			main : 'jquery'
// 		}
// 	]


// //Instantiate Controllers
require(['Init', 'Auth', 'Content', 'Ui', 'Library', 'Player', 'User'],
	function(Init, Auth, Content, Ui, Library, Player, User){

		var init 	= new Init();
		var auth 	= new Auth();
		// var content = new Content();
		var ui 		= new Ui();
		var library = new Library();
		var player 	= new Player();
		var user 	= new User();
});


// // 'Ui', 'Library', 'Player', 'User'
// //  Ui, Library, Player, User

