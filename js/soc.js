$(document).ready(function() {
	
	const FILTER_HEADINGS = true;
	const WINDOW_SCROLL_DURATION = 800;
	const MARKER_TRANSFORM_DURATION = 280;
	const MIN_MARKER_Z_INDEX = 100001;
	
	var docHeight = $(document).height();
	
	var resevervedYPositionLength = 28;
	var reservedYPosition;
	
	var markerColor = "#f1f1f1";
	var markerOverColor = "#282828";
	var markerBackgroundColor = "rgba( 28, 28, 28, 0.88 )";
	var markerOverBackgroundColor = "-webkit-linear-gradient( top, #fafafa, #d1d1d1 )";
	
	var newPageLoad = true;
	
	// user customizable variables
	var defaultDisplay, socMarkerVisibility, socMarkerDisplay, textLength, maxHeadingHierarchy, preventOverlap;
	
	/*------------------------------------------------
	  Listen if tab is updated or if tab selection is 
	  changed to keep tab data up to date and to make
	  options page changes take effect immediately.
	------------------------------------------------*/
	
	chrome.extension.onRequest.addListener( function( request, sender, sendResponse )
	{
		if( request.tabEvent == "selectionChanged" )
		{
			newPageLoad = false;
			
			retrieveOptions();
			
			sendResponse({});
		}
		else if( request.tabEvent == "updated" )
		{
			newPageLoad = false;
			
			init();
			
			sendResponse({});
		}
		else
			// close request
			sendResponse({});
	});
	
	/*------------------------------------------------
	  Retrieve user preferences from local storage
	  then initialize heading markers
	------------------------------------------------*/
	
	retrieveOptions();
	
	function retrieveOptions()
	{
		chrome.extension.sendRequest( { displayValue: "displayOption", textLengthValue: "textLengthOption", levelValue: "levelOption", overlapValue: "overlapOption" },
			function( response )
			{
				defaultDisplay = response.displayOption;
				textLength = response.textLengthOption;
				maxHeadingHierarchy = response.levelOption;
				
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
				
				switch( defaultDisplay )
				{
					case "maximized":
						socMarkerVisibility = "visible";
						socMarkerDisplay = "maximized";
						break;
					
					case "minimized":
						socMarkerVisibility = "visible";
						socMarkerDisplay = "minimized";
						break;
					
					case "hidden":
						socMarkerVisibility = "hidden";
						socMarkerDisplay = "maximized";
						break;
				}
				
				init();
			}
		);
	}
	
	function init()
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
		  Create keyboard shortcuts.
		------------------------------------------------*/
		
		if( newPageLoad )
			document.addEventListener( "keydown", headingMarkers.keyDownHandler, false );
		
		
		/*------------------------------------------------
		  Set initial markers position and reposition 
		  them if window is resized or document 
		  height changes.
		------------------------------------------------*/
		
		headingMarkers.setPosition();
		if( newPageLoad )
		{
			window.onresize = function() { headingMarkers.setPosition() };
			window.setInterval( checkDocumentHeight, 100 );
		}
		
		
		/*------------------------------------------------
		  Display heading markers
		------------------------------------------------*/
		
		if( socMarkerVisibility == "visible" )
		{
			if( newPageLoad )
			{
				$(".soc_marker").css( { "display": "block", "opacity": "0" } );
				$(".soc_marker").animate( { "opacity": "1" }, MARKER_TRANSFORM_DURATION );
			}
			else
				$(".soc_marker").css( { "display": "block", "opacity": "1" } );
		}
	}
	
	function checkDocumentHeight()
	{		
		var currentDocHeight = $(document).height();
		
		if( docHeight != currentDocHeight )
		{
			docHeight = currentDocHeight;
			headingMarkers.setPosition()
		}
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
		
		this.keyDownHandler = function ( e )
		{
			// shift-alt-m
			if( e.keyCode == 77 )
			{
				if( e.shiftKey && e.altKey )
				{
					e.preventDefault();
					
					headingMarkers.toggleDisplay();
				}
			}
			// shift-alt-n
			else if( e.keyCode == 78 )
			{
				if( e.shiftKey && e.altKey )
				{
					e.preventDefault();
					
					headingMarkers.toggleVisibility();
				}
			}
		}
		
		this.toggleVisibility = function()
		{
			if( socMarkerVisibility == "hidden" )
			{
				$(".soc_marker").css( { "display": "block", "opacity": "0" } );
				$(".soc_marker").animate( { "opacity": "1" }, MARKER_TRANSFORM_DURATION );
				
				socMarkerVisibility = "visible";
			}
			else if( socMarkerVisibility == "visible" )
			{
				$(".soc_marker").animate( { "opacity": "0" }, MARKER_TRANSFORM_DURATION, function()
				{
					$(".soc_marker").css( { "display": "none" } );
					
					socMarkerVisibility = "hidden";
				});
			}
		}
		
		this.toggleDisplay = function()
		{
			if( socMarkerDisplay == "maximized" )
			{
				$(".soc_marker_span").css( { "display": "none" } );
				
				socMarkerDisplay = "minimized";
			}
			else if( socMarkerDisplay == "minimized" )
			{	
				$(".soc_marker_span").css( { "display": "inline" } );
				
				socMarkerDisplay = "maximized";
			}
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
});