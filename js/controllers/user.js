var User = (function(window, document, $, CryptoJS){



	//instances
	var _content 	= new Content();

	//private vars
	// var _foo = 'bar';











	//constructor function
	var user = function(){




		//User Registration handler
		$(document).on('click', '#signupSubmit', function(event){

			var email 			= $('#signupEmail').val();
			var password 		= CryptoJS.SHA3($('#signupPass').val(), { outputLength: 512 });
			var passwordAgain 	= CryptoJS.SHA3($('#signupPassAgain').val(), { outputLength: 512 });
			var pwString 		= '';



			//Produces 160 char string from pw
			for(var i=0;i<password.words.length;i++){

				//Compare array of sha3 strings
				if(password.words[i] == passwordAgain.words[i]){

					//Concat array parts into pwString
					pwString += password.words[i].toString();

				}else{
					console.log("not same");
				}
			}




			//Build API request
			var API_URL			= 'http://localhost:8887/new-user/' + email + '/' +  pwString + '/' +  "email";

			//Register new user
			$.ajax({
				url: API_URL,
				method : 'GET',
				dataType : 'json',
				success: function(response){

					if(response.response === true){
						console.log("user is registered");

						//load the application
						_content.loadApp();

						//fire event passing user data to listening class
						$.event.trigger({
							type 	: 'userloggedin',
							email 	: response.email,
							userId	: response.userId
						});


					}else{
						console.log(response, "something went wrong");
					}

				}//success
			});//ajax


			event.preventDefault();
		});








		//User authentication
		$(document).on('click', '#popdownSubmit', function(event){
			var email 		= $('#popdownEmail').val();
			var password 	= CryptoJS.SHA3($('#popdownPass').val(), { outputLength: 512 });
			var pwString 	= '';

			console.log("click picked up");
			//Produces 160 char string from pw
			for(var i=0;i<password.words.length;i++){

					//Concat array parts into pwString
					pwString += password.words[i].toString();
			}




			//Build API request
			var API_URL 	= 'http://localhost:8887/get-user/' + email + '/' + pwString;

			//Request auth form server
			$.ajax({
				url : API_URL,
				method : 'GET',
				dataType : 'json',
				success : function(response){

					//If user was authenticated
					if(response.success === true){

						//load the application
						_content.loadApp();

						//fire event passing user data to listening class
						$.event.trigger({
							type 	: 'userloggedin',
							email 	: response.email,
							userId	: response.userId
						});
					}//if
				}//success
			});//ajax

			event.preventDefault();
		});//onclick









	};//constructor
	//=========================//











	//methods and properties.
	user.prototype = {
		constructor : user,
		getUser 	: function(){
			var obj = {
				name: 'adam',
				email : 'adam.gedney@gmail.com',
				tel : '845.216.5030'
			}
			return obj;
		}
	};











	//return constructor
	return user;









//================================//
//Class methods===================//
//================================//











})(window, document, jQuery, CryptoJS);
