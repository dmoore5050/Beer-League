$(document).ready(function(){

	var league_array = [];
	var results_array = [];
	var sched;
	var win_per;

	$( '.alert' ).hide();		//hide team limit alert upon load

//===========================================================
//                  ** FORM VALIDATION **
//===========================================================

	$( '#mytable' ).tablesorter({
		sortList: [ [ 3,1 ], [ 1,1 ], [ 2,0 ], [ 0,0 ] ],
		sortInitialOrder: "desc",
		theme : "bootstrap", 
	    widthFixed: true,
	    headerTemplate : '{content} {icon}', 
	    widgets : [ "uitheme" ],
	    headers: { 
	    	0:{ sorter:false }, 
	    	1:{ sorter:false }, 
	    	2:{ sorter:false }, 
	    	3:{ sorter:false }  
	    } 
	}); 

//===========================================================
//                  ** FORM VALIDATION **
//===========================================================

	jQuery.validator.addMethod( "noTies", function( value, element, param ) {
			return this.optional( element ) || value != $( param ).val();
	}, "Ties? There are no ties!" );

	var validate = $( '#team_form' ).validate({
		rules: {
		   teamName: {
		      minlength: 2,
		      maxlength: 32,
		      required: true
			},
		   mgr_fname: {
		      minlength: 2,
		      maxlength: 20,
		      required: true
			},
		   mgr_lname: {
		      minlength: 2,
		      maxlength:20,
		      required: true
			},
		   phone: {
		      digits: true,
		      required: true,
		      rangelength: [10, 10]
			},
		   sponsor: {
		      minlength: 2,
		      maxlength: 20,
		      required: true
			},
		   zip: {			 
		      digits: true,
		      required: true,
		      rangelength: [3, 3]
			}
		},
		highlight: function( element ) {
		   $( element ).closest( '.control-group' ).removeClass( 'success' ).addClass( 'error' );
		},
		success: function(element) {
		   element
		   .text( 'OK!' ).addClass( 'valid' )
		   .closest( '.control-group' ).removeClass( 'error' ).addClass( 'success' );
		}
	}); 

    var validate = $( '#score_form' ).validate( {
        rules: {
            team_1_score: {
               digits: true,
               required: true,
               rangelength: [1, 2]
            },
            team_2_score: {
               digits: true,
               required: true,
               rangelength: [1, 2], 
               noTies: '#team_1' 
            },
            team_3_score: {
               digits: true,
               required: true,
               rangelength: [1, 2]
            },
            team_4_score: {
               digits: true,
               required: true,
               rangelength: [1, 2], 
               noTies: '#team_3'
            },
            team_5_score: {
               digits: true,
               required: true,
               rangelength: [1, 2]
            },
            team_6_score: {
               digits: true,
               required: true,
  	           rangelength: [1, 2], 
  	           noTies: '#team_5'
 	        },
 	        team_7_score: {
  	           digits: true,
  	           required: true,
 	           rangelength: [1, 2]
  	        },
  	        team_8_score: {
	           digits: true,
   	           required: true,
 	           rangelength: [1, 2], 
 	           noTies: '#team_7'
  	        }
  	    },
 	    highlight: function( element ) {
   		    $( element ).closest( '.control-group' ).removeClass( 'success' ).addClass( 'error' );
  	    },
 	    success: function( element ) {
 	        element.text( 'OK!' ).addClass( 'valid' ).closest( '.control-group' ).removeClass( 'error' ).addClass( 'success' );
        }
    }); //end validation function

//===========================================================
//             		   ** PAGELOAD CALL **
//===========================================================

	pageLoad(); //Functions to be loaded on page loads.

//===========================================================
//                 ** PAGE LOAD FUNCTIONS **
//===========================================================

	function pageLoad () {  

		var data_retrieved = 0;

		$.ajax({ //grabs results
			type: 'GET',
			url: '/backliftapp/results',
			success: function ( resultsData ) {
				results_array = resultsData;
				data_retrieved++; 			  //following is for functions that need both results and league arrays
				if ( data_retrieved == 2 ) {  //(see above)
					initializePage(); 		  //(see above)
				};							  //(see above)
			}
		});

		$.ajax({ //grabs teams
			type: 'GET', 
			url: '/backliftapp/team', 
			success: function ( teamData ) { 
				league_array = teamData;
				printTeam( teamData ); // populates table on load
				data_retrieved++; 			  //following is for functions that need both results and league arrays
				if ( data_retrieved == 2 ) {  //(see above)
					initializePage(); 		  //(see above)
				}; 							  //(see above)
				enterScoresPop(); //populates enter scores modal
				sortTable(); // loads and triggers tablesorter on an empty table
			}
		});   //end print standings/schedule call  

		function initializePage() { //functions that require both league_array and results_array to be populated
			scheduleWrite(); //populates scoreboard/schedule
			buttonColor(); //changes start season button color based on league size
			weekPop(); //populates weeks menu in enter scores modal
		}
		startCheck();
	};

//===========================================================
//                 ** SEASON START CHECK **
//===========================================================		

	function startCheck(){
		$.ajax({ //checks to see if season has started
			type: 'GET', 
			url: '/backliftapp/start', 
			success: function ( startTrigger ) {
				if ( startTrigger[0].trigger === 'and so it begins' ) {
					$( '#season_live_announcement' ).remove();
					$('<h4 id="season_live_announcement">this season is LIVE!</h4>').appendTo('#bigolhead');
					$('body').addClass('nix_is_hidden');
					$('#create_team_button').hide();
					$('#start_season_button').hide();
					$('#enter_scores_button').show();
					$('#reset_season_button').show();
				}		
			}
		});  //end start season call 
	};

//===========================================================
//                ** CREATE TEAM CLICK EVENT **
//===========================================================

	$( '#createTeam' ).click(function() {	

		if ( !$( '#team_form' ).valid() ) {
        		return;
		};

		var form_inputs; 
	    form_inputs = '.team_inputs';

	//if team deleted from middle of field, id's stop corresponding to league_array.length. fix!
		var team = {
			//id: idWrite(), IGNORE -- NONFUNCTIONAL CODE
			id: league_array.length + 1, 
 			teamName: $( '#teamName' ).val(),
		    firstName: $( '#mgr_fname' ).val(),
		    lastName: $( '#mgr_lname' ).val(),
		    phoneNumber: $( '#phoneNumber' ).val(),
		    sponsor: $( '#sponsor' ).val(),
		    zip: '37' + $( '#zip' ).val(),
		    wins: 0,
		    losses: 0  	  
		};

		lineWrite(); //adds single row on form submit

		$.ajax({
			url: '/backliftapp/team',
			type: 'POST',
			dataType: 'json',
			data: team,
			success: function () {
				league_array.push( team ); //pushes new team to league_array
				scheduleCall(); //dynamically changes schedule on add/rm team
				buttonColor(); //changes start season button color based on league size
			}				 
		});
		$( '#create_team' ).modal( 'hide' ); //hide modal on submit
		clearForm( form_inputs ); //clear form inputs	
		validateClear(); //clears validate status on form submit
		sortTable(); //loads sort table on empty table   				    
	}); //end submit click function	

//===========================================================
//            ** TEAM ENTRY CANCEL CLICK EVENT **
//===========================================================

	$('.createTeam_cancel').click(function() {

		var form_inputs; 
 		form_inputs = '.team_inputs';

		$( '#create_team' ).modal( 'hide' ); //hide modal on submit
		clearForm( form_inputs ); //clear form inputs	
		validateClear(); //clears validate status on form submit
	});
	
//===========================================================
//              ** STANDINGS TABLE FUNCTIONS **
//===========================================================

	function calcPer( data, index ){  //calculates and formats win %
		var raw_per, per_toArray;
		raw_per = 0;
		per_toArray = 0;
		//calculates win percentage to 3 decimal places
		raw_per = ( +data[ index ].wins/( +data[ index ].wins + +data[ index ].losses)).toFixed(3); 
		if ( raw_per < 1 ) { //if number is less than 1, omit the pre-decimal 0 when displayed.
			per_toArray = raw_per.toString().split( '.' );
			win_per = '.' + per_toArray[ 1 ];
		}
		else if ( isNaN( raw_per )) { //if raw_per isn't a number, write .000
			win_per = '.000';
		}
		else { //if number is 1, display full number.
			win_per = '1.000';
		};  		
	}; // end calcPer func

	function printTeam( teamData ){ 	//populates table on page load or refresh. Contains popover. 
		for ( var index = 0; index < teamData.length; index++ ) { 
			calcPer( teamData, index );
			$('<tr class="even"><td><a rel="popover" data-toggle="popover" title="<h4 style=\'text-align: center;\'>' + teamData[ index ].teamName + '</h4>"  data-content="<table id=\'contact_pop\'><tr><td>Manager: </td><td>' + teamData[ index ].firstName + " " + teamData[ index ].lastName + '</td></tr><tr><td>Phone:</td><td>' + teamData[ index ].phoneNumber + '</td></tr><tr><td>Sponsor:</td><td>' + teamData[ index ].sponsor + '</td></tr><tr><td>Zip:</td><td>' + teamData[ index ].zip + '</td></tr></table>">' + teamData[ index ].teamName + '</a><button type="button" class="close nix" style="margin-right: 10px; color: red; opacity: 1;" data-id="' + teamData[ index ].id + '" data-index="' + index + '">&times;</button></td><td>' + teamData[ index ].wins + '</td><td>' + teamData[ index ].losses + '</td><td>' + win_per + '</td></tr>' ).appendTo( '#standings' );
				};
	}; //end printTeam func

	function lineWrite( team ) { 		//writes table row when new team is added. Contains popover.
		var index = league_array.length;
		$( '<tr class="even"><td><a rel="popover" data-toggle="popover" title="<h4 style=\'text-align: center;\'>' + $( '#teamName' ).val() + '</h4>"  data-content="<table id=\'contact_pop\'><tr><td>Manager:</td><td>' + $( '#mgr_fname' ).val() + " " + $( '#mgr_lname' ).val() + '</td></tr><tr><td>Phone:</td><td>' + $( '#phoneNumber' ).val() + '</td></tr><tr><td>Sponsor:</td><td>' + $( '#sponsor' ).val() + '</td></tr><tr><td>Zip:</td><td> 37' + $( '#zip' ).val() +'</td></tr></table>">' + $( '#teamName' ).val() + '</a><button type="button" class="close nix" style="margin-right: 10px; color: red; opacity: 1;" data-id="' + ( index + 1 ) + '" data-index="' + index + '">&times;</button></td><td>0</td><td>0</td><td>.000</td></tr>' ).appendTo( '#standings' );
	}; //end lineWrite func

//===========================================================
//                ** DELETE TEAM CLICK EVENT **
//===========================================================

	$( 'table' ).on( 'click', '.nix', function () {
		$.ajax({
			url: 'backliftapp/team/' + $( this ).attr( 'data-id' ),
			type: 'DELETE',
			dataType: 'json',
			success: function() {
				league_array.splice( $( this ).attr( 'data-index' ), 1); //removes entry from league_array
				scheduleCall(); //dynamically changes schedule on add/rm team
			}	
		});
		buttonColorDelVar(); 
		$( this ).closest( 'tr' ).remove();	
	}); //end delete function

	function buttonColorDelVar() {  //buttonColor func slightly modified to work with delete function 
		if ( league_array.length >= 5 ) {
			$( '#start_season_button' ).removeClass( 'btn-danger' ).addClass( 'btn-success' );
		}
		else {
			$( '#start_season_button' ).removeClass( 'btn-success' ).addClass( 'btn-danger' );
		}
	}; 

//===========================================================
//            ** FORM CLEAR/TABLE SORT FUNCTIONS **
//===========================================================
	
	function clearForm( form_inputs ){  //clears form fields on close
		$( form_inputs ).each(function(){
			$( this ).val( '' );
		});
	}; //end clearForm func
	
	function validateClear() {  //resets form validation 
		$( '.control-group' ).removeClass( 'success error valid' );
		$('.error').remove();
		validate.resetForm();
	}; //end validateClear func

	function sortTable() { //sorts table on new submit
       var resort = true;
      $("table").trigger("update", [resort]);        
	}; //end sortTable func

//===========================================================
//                ** MAX TEAM LIMIT FUNCTION **
//===========================================================

	$( '#create_team' ).on( 'show', function ( e ) { 
		if ( league_array.length === 8 ) {
			$( '.alert' ).show();
			return e.preventDefault();
		};  	
	}); // end max team limit function

//===========================================================
//                ** START SEASON CLICK EVENT **
//===========================================================

	$( '#start_season_button' ).click(function(){
		startSeason();
	}); //start season click event

//===========================================================
//               ** START SEASON FUNCTIONS **
//===========================================================

	function startSeason() { //starts season on click if league conditions are met (min 4 teams)
		if ( league_array.length >= 4 ) {
			var answer = confirm( 'Are you sure you want to start the season? There\'s no turning back!' );
			if ( answer ){ 
				$.ajax({ 
	    			url: '/backliftapp/start',
					type: 'POST',
					dataType: 'json',
					data: { 
						trigger: 'and so it begins'
					}, 
					success: function ( data ) {
						$( '<h4 id="season_live_announcement">This season is LIVE!</h4>' ).appendTo( '#bigolhead' );
						$( 'body').addClass( 'nix_is_hidden' );
						$( '#start_season_button' ).hide();
						$( '#create_team_button' ).hide();
						$( '#enter_scores_button' ).show();
						$( '#reset_season_button' ).show();
						weekPop();
					}				 
				});
			}
		}
		else {
			alert( 'You need at least 4 teams to start the season. Make some friends!' );
		}
	}; 

	function buttonColor() {  //changes start season button color based on league size
		if ( league_array.length >= 4 ) {
			$( '#start_season_button' ).removeClass( 'btn-danger' ).addClass( 'btn-success' );			
		}
		else {
			$( '#start_season_button' ).removeClass( 'btn-success' ).addClass( 'btn-danger' );
		}
	}; 

//===========================================================
//                ** SCHEDULE FUNCTIONS **
//===========================================================

	function scheduleCall() {  				//dynamically refreshes schedule table
		$( '#schedule_table' ).html( '' ) ; 
		$.ajax({
			type: 'GET', 
			url: '/backliftapp/team', 
			success: function () {			
				scheduleWrite();
			}
		});  
	}; //end scheduleCall

	function scheduleWrite() {  			//Decides which function to call to write schedule table (odd or even)

		if ( league_array.length < 4 ) {
			$( '#schedule_table' ).hide();
			return false;
		}
		else if ( league_array.length === 4 ) {
			$( '#schedule_table' ).show();
			sched = sched4;
		}
		else if ( league_array.length === 5 || league_array.length === 6 ) {
			sched = sched6;
		}
		else {
			sched = sched8;
		}; // end set sched variable

		if ( league_array.length % 2 !== 0 ) {
			writeSchedOdd( sched );
		}
		else {
			writeSchedEven( sched );
		}; // end even/odd selector
	}; //end scheduleWrite func
	
	function writeSchedEven( sched ) { 		//writes schedule table head/calls write functions for even-# leagues (4,6,8 teams)

		if (league_array.length >= 4) {
			prepTable();
			$( '#schedule_head' + i ).html( '' );
			$( '#schedule_body' + i ).html( '' );
			for ( var i = 0; i < sched.length; i++ ) { 	 //weeks loop
				$( '<tr ><th class="week_banner" colspan="2"><a>Week ' + (i + 1) + ' Matchups</a></th></tr>').appendTo('#schedule_head' + i);
				for ( var j = 0; j < sched[ i ].length; j++ ) { 	//games loop
					var n = 1;
					prepSched ( i, j, n );
				};				
			};
		};
	}; //end writeSchedEven func
	
	function writeSchedOdd( sched ) { 		//writes schedule table head/calls write functions for odd-# leagues (5,7 teams)

		if ( league_array.length >= 4 ) {
			prepTable();
			$( '#schedule_head' + i ).html( '' );
			$( '#schedule_body' + i ).html( '' );
			for ( var i = 0; i < sched.length; i++ ) { 	 //weeks loop
				$( '<tr><th class="week_banner" colspan="2"><a>Week ' + ( i + 1 ) + ' Matchups<br><span style="font-weight:200; font-size: 0.9em;">(Bye week: ' + league_array[ sched[ i ][ 0 ][ 1 ] - 2 ].teamName + ')</span></a></th></tr>').appendTo( '#schedule_head' + i );
				for ( var j = 1; j < sched[i].length; j++ ) { 	//games loop
					var n = 2;
					prepSched ( i, j, n );
				};
			};	
		};	
	}; //end writeSchedOdd

	function prepTable() { 					//preps empty table for schedWrite function
		for ( var g = 0; g < sched.length; g++ ) {
			$( '<div class="row-fluid"><table class="span12"><thead id="schedule_head' + g + '" class="slide_head"></thead><tbody class="slide_body" id="schedule_body' + g + '" style="display: none;"></tbody></table></div>' ).appendTo('#schedule_table' );
		}; 
	}; //end prepTable func

	function prepSched( i, j, n ) { 			//appends schedule info into prepped table for schedWrite function

		var score_grab1, score_grab2;	
									
		$.each( results_array, function(index){
			if (( league_array[ sched[ i ][ j ][ 0 ] - n ].id + league_array[ sched[ i ][ j ][ 1 ] - n ].id) == results_array[ index ].gameId ) {
				score_grab1 = results_array[ index ].score1;
				score_grab2 = results_array[ index ].score2;
			}
		});

		if (score_grab1 == undefined || score_grab2 == undefined) {
			score_grab1 = 'TBA';
			score_grab2 = 'TBA';
		}

		$( '<tr class="game_banner"><td colspan="2">' + league_array[ sched[ i ][ j ][ 0 ] - n ].teamName + ' vs. ' + league_array[ sched[ i ][ j ][ 1 ] - n ].teamName + '</td></tr>' ).appendTo( '#schedule_body' + i );
		$( '<tr class="game_row"><td>' + league_array[ sched[ i ][ j ][ 0 ] - n ].teamName + '</td><td>' + score_grab1 + '</td></tr>' ).appendTo( '#schedule_body' + i );
		$( '<tr class="game_row"><td>' + league_array[ sched[ i ][ j ][ 1 ] - n ].teamName + '</td><td>' + score_grab2 + '</td></tr>' ).appendTo( '#schedule_body' + i );
	}; 

	//adds slide toggle to schedule table
	$( '#schedule_table' ).on( 'click', '.slide_head', function() {
		$( this ).next( '.slide_body' ).slideToggle();
	});//end slide function

//===========================================================
//                ** SAVE SCORES CLICK EVENT **
//===========================================================

	$( '#save_scores' ).click(function (){

		if ( !$( '#score_form' ).valid() ) {
    		return;
  		};

    var form_inputs; 
    form_inputs = '.score_input';

		//loop over control groups, grab data, push object to results_array 
		var id_count, loop_count, gamesInWeek; 
			id_count = 1; //used to assign unique ids to score entry forms
			loop_count = 0; //used to tell function when all games are printed and it's ok to refresh page

		if ( league_array.length % 2 == 0 ) {
			gamesInWeek = sched[ 0 ].length;
		}
		else {
			gamesInWeek = sched[ 0 ].length - 1;
		}

		$( '.game_wraps' ).each(function(index){ 
			var gameId = $( '#id_' + id_count ).val() + $( '#id_' + ( id_count + 1 )).val();
			var score1 = $( '#team_' + id_count ).val();
			var score2 = $( '#team_' + ( id_count + 1 )).val();
			
			var game = {
				gameId: gameId,
				score1: score1,
				score2: score2 
			};
			id_count += 2;
			$.ajax({
    			url: '/backliftapp/results',
				type: 'POST',
				dataType: 'json',
				data: game,
				success: function( data, game ) {
					loop_count++;
					assignWLs( data, loop_count, gamesInWeek );			
				}			 
			});											 
		});  

		$( '#scores_modal' ).modal( 'hide' ); //hide modal on submit
		clearForm( form_inputs ); //clear form inputs	
		validateClear(); //clears validate status on form submit

		$('.game_wraps').remove();

	});

//===========================================================
//                ** SCORE ENTRY FUNCTIONS **
//===========================================================
	
	function weekPop() {  //populates weeks selector in enter scores modal
		$( '#week_selector' ).html( '' );
		$( '#week_selector' ).prepend( '<option>Select:</option>' );	

		if ( results_array.length === 0 ) { 
			$.each( sched, function( index ){
				var dynIndex = index + 1;
				$( '#week_selector' ).append( $( '<option></option>' ).attr( 'value', index ).text( 'Week ' + dynIndex ));
			});	
		}
		else { //limits weeks selector to weeks that haven't already been entered.
			var index; 
			if ( league_array.length === 4 || league_array.length === 5 ) {
				index = (results_array.length / 2);
			}
			else if ( league_array.length === 6 || league_array.length === 7 ) {
				index = ( results_array.length / 3 );
			}
			else {
				index = ( results_array.length / 4 );
			}

			while ( index < sched.length ) {
				var dynIndex = index + 1;
				$( '#week_selector' ).append( $( '<option></option>' ).attr( 'value', index ).text( 'Week ' + dynIndex ));
				index++;
			};
		}	
	}; //end weekPop func

	function enterScoresPop() { 	//populates enter scores modal
		$( '#week_selector' ).change(function(){

			$( '#game_scores' ).html( '' );
        	var selectedItem, gameList;
            selectedItem = $( this ).val(); //no. 0-6
            gameList = sched[ selectedItem ];
            if ( league_array.length % 2 === 0 ) { //even
            	var count = 1;
            	for ( var index = 0; index < gameList.length; index++ ) {
            		var n = 1;               		
            		prepScores( n, index, gameList, count );
            		count += 2;
            	};
            }
            else { //odd
            	$( '#bye_announce' ).text( '' );
            	$( '<h4 style="font-weight: 200; margin: 3px 0;">Bye week: ' + league_array[ gameList[ 0 ][ 1 ] - 2 ].teamName + '</h4>' ).appendTo( '#bye_announce' );
            	$( '<input id="week_grab" value="' + ( parseInt( selectedItem ) + 1 ) + '" style="display: none;">' ).appendTo( '#bye_announce' );
            	var count = 1;
            	for ( var index = 1; index < gameList.length; index++ ) {
            		var n = 2; 		
            		prepScores( n, index, gameList, count );
            		count += 2;
            	};	
        	}	
        });
	};//end enterScoresPop

	function prepScores ( n, index, gameList, count ) { //appends game lists for enter scores modal based on week selected
		$( '<div id="game_group' + index + '" class="game_wraps"></div>' ).appendTo( '#game_scores' );
  $( '<h4 style="text-align: center;">' + league_array[ gameList[ index ][ 0 ] - n ].teamName + ' vs. ' + league_array[ gameList[ index ][ 1 ] - n ].teamName + '</h4>' ).appendTo( '#game_group' + index );
  $( '<div class="control-group"><label class="control-label score_labels" for="sponsor">' + league_array[ gameList[ index ][ 0 ] - n ].teamName + '</label><div class="controls"><input type="text" class="score_input" id="team_' + count + '" name="team_' + count + '_score" placeholder="Score"><input id="id_' + count + '" class="score_input" value="' + league_array[ gameList[ index ][ 0 ] - n].id + '" style="display: none;"></div></div>' ).appendTo( '#game_group' + index );
		$( '<div class="control-group" style="margin-top: -10px;"><label class="control-label score_labels" for="team_two_score">' + league_array[ gameList[ index ][ 1 ] - n ].teamName + '</label><div class="controls"><input type="text" class="score_input" id="team_' + ( count + 1 ) + '" name="team_' + (count + 1 ) + '_score" placeholder="Score"><input id="id_' + (count + 1 ) + '" class="score_inputs" value="' + league_array[ gameList[ index ][ 1 ] - n ].id + '" style="display: none;"></div></div>' ).appendTo( '#game_group' + index );
	}; //end prepScores func

	var win_per;

	function assignWLs ( data , loop_count, gamesInWeek ) {
		var chop, teams, team1, team2;

		chop = data.gameId;
		teams = chop.toString().split( '' );
		team1 = teams[ 0 ];
		team2 = teams[ 1 ];


		if ( data.score1 > data.score2 ) {
			//get win total, add one, send back
			$.ajax({
    			url: 'backliftapp/team/' + team1,
				type: 'PUT',
				dataType: 'json',
				data: { 
					wins: +league_array[ team1 - 1 ].wins + 1 
				},
				//get loss total, add one, send back
				success: function() {
					$.ajax({  
		    			url: 'backliftapp/team/' + team2,
						type: 'PUT',
						dataType: 'json',
						data: { 
							losses: +league_array[ team2 - 1 ].losses + 1 
						},
						success: function() {
							if ( loop_count == gamesInWeek ) {
								$( '#standings' ).html( '' );
								$( '#schedule_table' ).html( '' );
								pageLoad();
							}
						}
					});	//end PUT
				}
			});	//end PUT			
		} 
		else {
			//get loss total, add one, send back
			$.ajax({
    			url: 'backliftapp/team/' + team1,
				type: 'PUT',
				dataType: 'json',
				data: { 
					losses: +league_array[ team1 - 1 ].losses + 1 
				},	
				success: function() {
					//get win total, add one, send back
					$.ajax({  
		    			url: 'backliftapp/team/' + team2,
						type: 'PUT',
						dataType: 'json',
						data: { 
							wins: +league_array[ team2 - 1 ].wins + 1 
						},
						success: function() {
							if ( loop_count == gamesInWeek ) {
								$( '#standings' ).html( '' );
								$( '#schedule_table' ).html( '' );
								pageLoad();
							}
						}
					}); //end PUT
				}
			}); //end PUT
		}
	}; //end assign WLs func

	//===========================================================
	//            ** SCORE ENTRY CANCEL CLICK EVENT **
	//===========================================================

	$('.score_entry_cancel').click(function(){

		var form_inputs; 
 		form_inputs = '.score_input';

		$( '#scores_modal' ).modal( 'hide' ); //hide modal on submit
		clearForm( form_inputs ); //clear form inputs	
		validateClear(); //clears validate status on form submit
	});

//===========================================================
//                ** RESET SEASON CLICK EVENT **
//===========================================================

	$( '#reset_season_button' ).click(function(){
		var answer = confirm( 'Are you sure you want to reset the season? All game results will be permanently erased!')
			if ( answer ){
				resetSeason();
			}
			else {
			}	
	});

//===========================================================
//                ** RESTART SEASON FUNCTION **
//===========================================================

	function resetSeason () {
		var totalItems = 0;
		var refresh_count = 0;

		$.ajax({ //wipes results from server
			type: 'GET',
			url: '/backliftapp/results',
			success: function ( gamesData ) {
				totalItems += gamesData.length;
				$.each( gamesData, function( index ){
					id = gamesData[ index ].id;
					$.ajax({
						url: 'backliftapp/results/' + id,
						type: 'DELETE',
						dataType: 'json',
						success: function() {
							refresh_count++;	
							if ( refresh_count == totalItems ) {
								$( '#standings' ).html( '' );
								$( '#schedule_table' ).html( '' );
								pageLoad();
							}	
						}
					});
				});			
			}
		});		

		$.ajax({ //wipes start trigger from server
			type: 'GET',
			url: '/backliftapp/start',
			success: function ( startTrigger ) {
				totalItems += startTrigger.length;
				$.each( startTrigger, function( index ){
					id = startTrigger[ index ].id;
					$.ajax({
						url: 'backliftapp/start/' + id,
						type: 'DELETE',
						dataType: 'json',
						success: function() {
							$( '#season_live_announcement' ).remove();
							$( 'body' ).removeClass( 'nix_is_hidden' );
							$( '#create_team_button' ).show();
							$( '#start_season_button' ).show();
							$( '#enter_scores_button' ).hide();
							$( '#reset_season_button' ).hide();	
							refresh_count++;
							if ( refresh_count == totalItems ) {
								$( '#standings' ).html( '' );
								$( '#schedule_table' ).html( '' );
								pageLoad();	
							}							
						}
					});
				});				
			}
		});

		$.ajax({ //replaces wins/losses with 0's
			type: 'GET',
			url: '/backliftapp/team',
			success: function ( teamData ) {

				totalItems += teamData.length;

				$.each( teamData, function( index ){
					id = teamData[ index ].id;
					$.ajax({
						url: 'backliftapp/team/' + id,
						type: 'PUT',
						dataType: 'json',
						data: { 
							wins: 0,
							losses: 0
						},
						success: function () {
							refresh_count++;
							if ( refresh_count == totalItems ) {
								$( '#standings' ).html( '' );
								$( '#schedule_table' ).html( '' );
								pageLoad();
							};
						}
					});
				});
			}
		});
	};

//===========================================================
//              ** END RESTART SEASON FUNCTION **
//===========================================================

	// function idWrite () {
	// 	for (var i = 0; i < league_array[0].length + 1; i++) {
	// 		console.log(league_array[0][i].id);
	// 		console.log(i + 1);
	// 		if (league_array[0].length === 0) { //sets behavior if loop is empty
	// 			return league_array[0].length + 1;
	// 		}
	// 		else if (league_array[0][i].id != i + 1) {
	// 			console.log(league_array[0][i].id);
	// 			console.log(i + 1);
	// 			return i + 1; 
	// 		}
	// 		else if () { //sets behavior if none have been deleted
	// 			console.log('getting here?');
	// 			return league_array[0].length + 1;
	// 		}
	// 	};
	// };

}); //end doc ready



