$(document).ready(function() {
	
	const FILTER_HEADINGS = true;
	const WINDOW_SCROLL_DURATION = 800;
	const MARKER_TRANSFORM_DURATION = 280;
	const MIN_MARKER_Z_INDEX = 100001;
	//const TOGGLE_VISIBILITY_HOVER_DISTANCE_FROM_SCROLLBAR = 280;
	
	var hostName = location.hostname;
	
	var docHeight = $(document).height();
	
	var resevervedYPositionLength = 28;
	var reservedYPosition;
	
	var markerColor = "#f1f1f1";
	var markerOverColor = "#282828";
	var markerBackgroundColor = "rgba( 28, 28, 28, 0.88 )";
	var markerOverBackgroundColor = "-webkit-linear-gradient( top, #fafafa, #d1d1d1 )";
	
	var markersCreated = false;	
	
	// user customizable variables
	var defaultDisplay, socMarkerDefaultVisibility, socMarkerDefaultDisplay, socMarkerVisibility, socMarkerDisplay, hostNameDisplayOverride, hostNameVisibilityOverride, textLength, maxHeadingHierarchy, preventOverlap/*, toggleVisibityOnHover*/;
	
	init();
	
	function init()
	{
		retrieveOptions();
		
		/*------------------------------------------------
		  Listen if tab is updated or if tab selection is 
		  changed to keep tab data up to date and to make
		  options page changes take effect immediately.
		------------------------------------------------*/
		
		chrome.extension.onRequest.addListener( function( request, sender, sendResponse )
		{
			if( request.tabEvent == "selectionChanged" )
			{				
				retrieveOptions();
				
				sendResponse({});
			}
			else if( request.tabEvent == "updated" )
			{				
				// update markers if markers have been created
				if( markersCreated == true )
					createHeadingMarkers();
				
				sendResponse({});
			}
			else if( request.tabEvent == "browserActionClicked" )
			{
				toggleMarkerVisibilityHandler();
				
				sendResponse({});
			}
			else
				// close request
				sendResponse({});
		});
		
		
		/*------------------------------------------------
		  Create keyboard shortcuts.
		------------------------------------------------*/
		
		document.addEventListener( "keydown", keyDownHandler, false );
	}
	
	
	/*------------------------------------------------
	  retrieveOptions()
	  
	  Retrieves user preferences or overrides 
	  from local storage then initializes 
	  heading markers
	------------------------------------------------*/
	
	function retrieveOptions()
	{
		chrome.extension.sendRequest( { query: "getUserOptions", hostName: hostName },
			function( response )
			{
				defaultDisplay = response.displayOption;
				textLength = response.textLengthOption;
				maxHeadingHierarchy = response.levelOption;
				hostNameVisibilityOverride = response.hostNameVisibilityOverride;
				hostNameDisplayOverride = response.hostNameDisplayOverride;
				
				
				if( !defaultDisplay )
					defaultDisplay = "hidden";
				
				if( !textLength )
					textLength = "entireText";
				
				if( !maxHeadingHierarchy )		
					maxHeadingHierarchy = "3";
				
				if( response.overlapOption == "true" )
					preventOverlap = true;
				else if( response.overlapOption == "false" )
					preventOverlap = false;
				else
					preventOverlap = true;
				
				/*if( response.toggleVisibityOnHoverOption == "true" )
					toggleVisibityOnHover = true;
				else if( response.toggleVisibityOnHoverOption == "false" )
					toggleVisibityOnHover = false;
				else
					toggleVisibityOnHover = false;*/
				
				
				/*------------------------------------------------
				  Set default and initial markers visibility 
				  and display.
				------------------------------------------------*/
				
				switch( defaultDisplay )
				{
					case "maximized":
						socMarkerDefaultVisibility = socMarkerVisibility = "visible";
						socMarkerDefaultDisplay = socMarkerDisplay = "maximized";						
						break;
					
					case "minimized":
						socMarkerDefaultVisibility = socMarkerVisibility = "visible";
						socMarkerDefaultDisplay = socMarkerDisplay = "minimized";						
						break;
					
					case "hidden":
						socMarkerDefaultVisibility = socMarkerVisibility = "hidden";
						socMarkerDefaultDisplay = socMarkerDisplay = "maximized";
						break;
				}
					
				
				/*------------------------------------------------
				  If there are overrides for current hostname,
				  set initial visibility and display style, 
				  then create markers.
				------------------------------------------------*/
				
				if( hostNameVisibilityOverride || hostNameDisplayOverride )
				{
					if( hostNameVisibilityOverride )
						socMarkerVisibility = hostNameVisibilityOverride;
					
					if( hostNameDisplayOverride )
						socMarkerDisplay = hostNameDisplayOverride;
					
					createHeadingMarkers();
				}
				else
				{
					/*------------------------------------------------
					  If markers have not been created, create them 
					  except when the default is hidden.
					  
					  If markers have been created, always recreate 
					  them (in case the user changes the default 
					  to hidden from the options page in the middle 
					  of viewing a page).
					------------------------------------------------*/
					
					if( markersCreated == false )
					{
						if( defaultDisplay != "hidden" )					
							createHeadingMarkers();
					}
					else
						createHeadingMarkers();
				}
			}
		);
	}
	
	function keyDownHandler( e )
	{
	
		// shift-alt-m
		if( e.keyCode == 77 )
		{
			if( e.shiftKey && e.altKey )
			{
				e.preventDefault();
				
				toggleMarkerDisplayHandler();
			}
		}
		// shift-alt-n
		else if( e.keyCode == 78 )
		{
			if( e.shiftKey && e.altKey )
			{
				e.preventDefault();
				
				toggleMarkerVisibilityHandler();
			}
		}
	}
	
	
	/*------------------------------------------------
	  toggleMarkerVisibilityHandler()
	  
	  Checks if markers are already created, create 
	  markers if not. Checks whether overrides should 
	  be saved for this hostname.
	------------------------------------------------*/
	
	function toggleMarkerVisibilityHandler( saveOverride )
	{
		// create markes if they are not created yet
		if( markersCreated == false )
			createHeadingMarkers();
		
		// save an override for this hostname?
		if( !saveOverride )
			saveOverride = true;
		
		// check incognito before saving override, otherwise toggle visibility
		if( saveOverride == true )
			checkIncognito( "visibility" );
		else
			toggleMarkerVisibility( saveOverride );
	}
	
	function toggleMarkerVisibility( saveOverride )
	{
		if( socMarkerVisibility == "hidden" )
		{
			$(".soc_marker").css( { "display": "block", "opacity": "0" } );
			$(".soc_marker").animate( { "opacity": "1" }, MARKER_TRANSFORM_DURATION );
			
			socMarkerVisibility = "visible";
			
			if( saveOverride )
				updateVisibilityOverride();
		}
		else if( socMarkerVisibility == "visible" )
		{
			$(".soc_marker").animate( { "opacity": "0" }, MARKER_TRANSFORM_DURATION, function()
			{
				$(".soc_marker").css( { "display": "none" } );
				
				socMarkerVisibility = "hidden";
				
				if( saveOverride )
					updateVisibilityOverride();
			});
		}
	}
	
	
	/*------------------------------------------------
	  toggleMarkerDisplayHandler()
	  
	  Checks if markers are already created, create 
	  markers if not. Checks whether overrides should 
	  be saved for this hostname.
	------------------------------------------------*/
	
	function toggleMarkerDisplayHandler( saveOverride )
	{
		// create markes if they are not created yet
		if( markersCreated == false )
			createHeadingMarkers();
		
		// save an override for this hostname?
		if( !saveOverride )
			saveOverride = true;
		
		// check incognito before saving override, otherwise toggle display
		if( saveOverride == true )
			checkIncognito( "display" );
		else
			toggleMarkerDisplay( saveOverride );
	}
	
	function toggleMarkerDisplay( saveOverride )
	{
		if( socMarkerDisplay == "maximized" )
		{
			$(".soc_marker_span").css( { "display": "none" } );
			
			socMarkerDisplay = "minimized";
			
			if( saveOverride )
				updateDisplayOverride();
		}
		else if( socMarkerDisplay == "minimized" )
		{	
			$(".soc_marker_span").css( { "display": "inline" } );
			
			socMarkerDisplay = "maximized";
			
			if( saveOverride )
				updateDisplayOverride();
		}
	}
	
	
	/*------------------------------------------------
	  checkIncognito()
	  
	  Checks if current tab is in incognito mode to 
	  determine whether overrides are allowed to 
	  be saved.
	  Toggles visibility or display after checking.
	------------------------------------------------*/
	
	function checkIncognito( toggleType )
	{
		var allowOverride;
		
		chrome.extension.sendRequest( { query: "checkIncognito" }, function( response )
		{
			if( response.incognito == true )
				allowOverride = false;
			else
				allowOverride = true;
			
			console.log( allowOverride );			
			
			switch( toggleType )
			{
				case "visibility":
				toggleMarkerVisibility( allowOverride );
				break;
				
				case "display":
				toggleMarkerDisplay( allowOverride );
				break;
			}
		});		
	}
	
	
	/*------------------------------------------------
	  updateVisibilityOverride()
	  
	  Saves or removes visibility override for 
	  current hostname
	------------------------------------------------*/
	
	function updateVisibilityOverride()
	{
		if( socMarkerVisibility != socMarkerDefaultVisibility )
		{
			chrome.extension.sendRequest( { query: "saveVisibilityOverride", visibilityOverride: socMarkerVisibility, hostName: hostName } );
		}
		else
		{
			chrome.extension.sendRequest( { query: "removeVisibilityOverride", hostName: hostName } );
		}
	}
	
	
	/*------------------------------------------------
	  updateDisplayOverride()
	  
	  Saves or removes display override for 
	  current hostname
	------------------------------------------------*/
	
	function updateDisplayOverride()
	{
		if( socMarkerDisplay != socMarkerDefaultDisplay )
		{
			chrome.extension.sendRequest( { query: "saveDisplayOverride", displayOverride: socMarkerDisplay, hostName: hostName } );
		}
		else
		{
			chrome.extension.sendRequest( { query: "removeDisplayOverride", hostName: hostName } );
		}
	}
	
	function createHeadingMarkers()
	{
		
		/*------------------------------------------------
		  Delete existing heading markers if they are
		  already created then instantiate new objects.
		------------------------------------------------*/
		
		if( typeof headingMarkers === "undefined" )
		{
			headingMarkers = new HeadingMarkers();
			headingFilters = new HeadingFilters();
		}
		else
		{
			$(".soc_marker").remove();
		
			delete headingMarkers;
			delete headingFilters;
			
			headingMarkers = new HeadingMarkers();
			headingFilters = new HeadingFilters();
		}
		
		
		/*------------------------------------------------
		  Check if headings exist on the page and 
		  create markers if they do.
		------------------------------------------------*/
		
		for( var i = 0; i < maxHeadingHierarchy; i++ )
		{
			var headingTagName = "h" + ( i + 1 );
			if( document.getElementsByTagName( headingTagName )[ 0 ] != undefined )
				headingMarkers.init( headingTagName );
		}
		
		
		/*------------------------------------------------
		  Set initial markers position and reposition 
		  them if window is resized or document 
		  height changes.
		------------------------------------------------*/
		
		headingMarkers.setPosition();
		if( markersCreated == false )
		{
			window.onresize = function() { headingMarkers.setPosition() };
			window.setInterval( intervalTickHandler, 100 );
		}
		
		
		/*------------------------------------------------
		  Add mousemove event listener if toggle 
		  visibility on hover is activated.
		------------------------------------------------*/
		
		/*if( toggleVisibityOnHover == true )
		{
			// unbind first to prevent multiple bindings
			$(document).unbind( "mousemove", documentMouseMoveHandler );
			$(document).bind( "mousemove", documentMouseMoveHandler );
		}*/
		
		
		/*------------------------------------------------
		  Display heading markers
		------------------------------------------------*/
		
		if( socMarkerVisibility == "visible" )
		{
			if( markersCreated == false )
			{
				$(".soc_marker").css( { "display": "block", "opacity": "0" } );
				$(".soc_marker").animate( { "opacity": "1" }, MARKER_TRANSFORM_DURATION );				
			}
			else
				$(".soc_marker").css( { "display": "block", "opacity": "1" } );
		}
		
		if( markersCreated == false )
			markersCreated = true;
	}
	
	/*function documentMouseMoveHandler( e )
	{*/
		/*------------------------------------------------
		  Show/hide markers when cursor hovers near 
		  scrollbar if user chooses to do so.
		------------------------------------------------*/
		
		/*if( toggleVisibityOnHover == true )
		{
			// get current browser viewport width
			var browserWidth = $(window).width();
			var toggleVisibilityHoverBoundary = browserWidth - TOGGLE_VISIBILITY_HOVER_DISTANCE_FROM_SCROLLBAR;
			var cursorX = e.pageX;
			
			if( cursorX > toggleVisibilityHoverBoundary )
			{
				// show markers when cursor moves close to scrollbar
				if( socMarkerVisibility = "hidden" )
					toggleMarkerVisibilityHandler( false );
			}
			else
			{
				// hide markers when cursor moves away from scrollbar, don't hide if an override exists
				if( socMarkerVisibility = "visible" && !hostNameVisibilityOverride )
					toggleMarkerVisibilityHandler( false );
			}
		}
	}*/
	
	function intervalTickHandler()
	{
		/*------------------------------------------------
		  Check document height and update markers
		  positions if it changes.
		------------------------------------------------*/
		
		// get current html document height
		var currentDocHeight = $(document).height();
		
		if( docHeight != currentDocHeight )
		{
			docHeight = currentDocHeight;
			headingMarkers.setPosition()
		}
	}
	
	
	/*------------------------------------------------
	  createArrow()
	  
	  creates a new canvas element, draws an arrow 
	  pointer, and returns it.
	------------------------------------------------*/
	
	function createArrow()
	{
	    var arrowCanvas = document.createElement( "canvas" );
	    arrowCanvas.setAttribute( "width", "6px" );
	    arrowCanvas.setAttribute( "height", "10px" );
	    arrowCanvas.setAttribute( "class", "soc_marker_arrow" );
	
	    if( typeof( G_vmlCanvasManager ) != "undefined" ) arrowCanvas = G_vmlCanvasManager.initElement( arrowCanvas );
	    var arrowCtx = arrowCanvas.getContext( "2d" );
	
	    arrowCtx.beginPath();
	    arrowCtx.moveTo( 5, 4 );
	    arrowCtx.lineTo( 0, 0 );
	    arrowCtx.lineTo( 0, 10 );
	    arrowCtx.lineTo( 5, 6 );
	    arrowCtx.quadraticCurveTo( 6, 5, 5, 4 );
	    arrowCtx.fillStyle = markerBackgroundColor;
	    arrowCtx.fill();
	
	    return arrowCanvas;
	}
	
	function HeadingMarkers()
	{
		var socMarkerIDArray = new Array();
		
		this.init = function( headingTagName )
		{
			var headings = document.getElementsByTagName( headingTagName );
			
			for( var i = 0; i < headings.length; i++ )
			{
				var headingText = headings[ i ].innerText.toLowerCase();
				var markerText;
							
				
				/*------------------------------------------------
				  Filter heading
				------------------------------------------------*/
				
				if( FILTER_HEADINGS == true )
					var filteredHeading = headingFilters.filterHeading( headings[ i ] );
				else
					var filteredHeading = { markHeading: true, filteredHeadingText: headingText };
				
				switch( textLength )
				{
					case "entireText":
						markerText = filteredHeading.filteredHeadingText;
						break;
					
					case "firstThreeWords":
						filteredHeadingTextArray = filteredHeading.filteredHeadingText.split( " " );
						if( filteredHeadingTextArray.length > 3 )
							markerText = filteredHeadingTextArray[ 0 ] + " " + filteredHeadingTextArray[ 1 ] + " " + filteredHeadingTextArray[ 2 ] + "...";
						else
							markerText = filteredHeading.filteredHeadingText;
						break;
					
					case "firstTenCharacters":
						if( filteredHeading.filteredHeadingText.length > 10 )
							markerText = filteredHeading.filteredHeadingText.substr( 0, 10 ) + "...";
						else
							markerText = filteredHeading.filteredHeadingText;
						break;
					
					default:
						markerText = filteredHeading.filteredHeadingText;
						break;
				}
				
				if( filteredHeading.markHeading == true )
				{
					var markerID = "soc_" + headingTagName + "_" + ( i + 1 );
					var headingY = headingMarkers.findPosition( headings[ i ] ).topPos;
					
					
					/*------------------------------------------------
					  Store each marker's info
					------------------------------------------------*/
					
					socMarkerIDArray.push( markerID );
					
					headingMarkers[ markerID ] = { domObject: headings[ i ],
													markerID: markerID,
													tagName: headingTagName,
													headingText: filteredHeading.filteredHeadingText,
													markerText: markerText,
													targetY: headingY
													};
					
					
					/*------------------------------------------------
					  Create a new marker
					------------------------------------------------*/
					
					var newMarker = headingMarkers.create( markerID );
					var markerArrow = createArrow();
					
					$(newMarker).append( markerArrow );
					
					
					/*------------------------------------------------
					  Add event listeners to the new marker
					------------------------------------------------*/
					
					$(newMarker).mouseenter( headingMarkers.markerOverHandler );
					$(newMarker).mouseleave( headingMarkers.markerOutHandler );
					
					newMarker.addEventListener( "click", headingMarkers.markerClickHandler, false );
					
					
					/*------------------------------------------------
					  Add new marker to document
					------------------------------------------------*/
					
					$("body").append( newMarker );
				}
			}
		}
		
		this.create = function( markerID )
		{
			var newMarker = document.createElement( "div" );
			newMarker.setAttribute( "id", headingMarkers[ markerID ].markerID );
			newMarker.setAttribute( "class", "soc_marker" );
			
			newMarker.innerHTML = "<span class=\"soc_marker_span\">" + headingMarkers[ markerID ].markerText + "</span>";
			
			if( socMarkerDisplay == "minimized" )
				$(newMarker).find(".soc_marker_span").css( { "display": "none" } );
			
			var headingHierarchy = headingMarkers[ markerID ].tagName.split( "h" )[ 1 ];
			var newMarkerZIndex = MIN_MARKER_Z_INDEX + maxHeadingHierarchy - headingHierarchy;
			
			$(newMarker).css( { "z-index": newMarkerZIndex, "display": "none" } );
			
			// Store new marker z-index
			headingMarkers[ markerID ].zIndex = newMarkerZIndex;
			
			return newMarker;
		}
		
		
		/*------------------------------------------------
		  findPosition()
		  
		  Finds an html element's position relative to 
		  the document.
		------------------------------------------------*/
		
		this.findPosition = function( obj )
		{
			leftPos = topPos = 0;
			
			do
			{
				leftPos += obj.offsetLeft;
				topPos += obj.offsetTop;
			}
			while (obj = obj.offsetParent);
			
			return { "leftPos": leftPos, "topPos": topPos };
		}
		
		this.setPosition = function()
		{
			var windowHeight = $(window).height();
			var winToDocHeightRatio = windowHeight / docHeight;					
			var markerNum = socMarkerIDArray.length;
			
			if( preventOverlap )
				reservedYPosition = new Array();
			
			for( var i = 0; i < markerNum; i++ )
			{
				var markerID = socMarkerIDArray[ i ];
				
				
				/*------------------------------------------------
				  Update each marker's targetY
				------------------------------------------------*/
				
				var newTargetY = headingMarkers.findPosition( headingMarkers[ markerID ].domObject ).topPos;
								
				headingMarkers[ markerID ].targetY = newTargetY;
				
				
				/*------------------------------------------------
				  Reserve y positions then place each marker
				------------------------------------------------*/
				
				var markerHashID = "#" + markerID;
				var markerY = Number( ( winToDocHeightRatio * headingMarkers[ markerID ].targetY ).toFixed() );
				
				if( preventOverlap )
				{
					// Check if y position is reserved
					for( var j = 0; j < reservedYPosition.length; j++ )
					{
						if( markerY == reservedYPosition[ j ] )
							markerY = markerY + 1;
					}
					
					headingMarkers[ markerID ].reservedY = new Array();
					
					for( var k = 0; k < resevervedYPositionLength; k++ )
					{
						headingMarkers[ markerID ].reservedY.push( markerY + k );
						
						reservedYPosition.push( markerY + k );
					}					
				}
				
				$(markerHashID).css( { "top": markerY } );
			}
		}
		
		this.markerOverHandler = function()
		{	
			var markerID = this.getAttribute( "id" );
			var newZIndex = MIN_MARKER_Z_INDEX + maxHeadingHierarchy;
			
			$(this).find(".soc_marker_span").text( headingMarkers[ markerID ].headingText );
			
			if( socMarkerDisplay == "minimized" )
				$(this).find(".soc_marker_span").css( { "display": "inline" } );
			
			this.style.zIndex = newZIndex;
			this.style.backgroundImage = markerOverBackgroundColor;
			this.style.color = markerOverColor;
		}
		
		this.markerOutHandler = function()
		{
			var markerID = this.getAttribute( "id" );
			
			$(this).find(".soc_marker_span").text( headingMarkers[ markerID ].markerText );
			
			if( socMarkerDisplay == "minimized" )
				$(".soc_marker_span").css( { "display": "none" } );
			
			this.style.zIndex = headingMarkers[ markerID ].zIndex;
			this.style.backgroundImage = "none";
			this.style.backgroundColor = markerBackgroundColor;
			this.style.color = markerColor;
		}
		
		this.markerClickHandler = function()
		{
			var markerID = this.getAttribute( "id" );
			var targetY = headingMarkers[ markerID ].targetY;
			
			$.scrollTo( targetY,
			{
			   	duration: WINDOW_SCROLL_DURATION,
				top: "0px",
				offset: 0
			});
		}
	}
});