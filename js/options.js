(function () {
    var display = document.getElementById( "display" );
    var textLength = document.getElementById( "textLength" );
    var level = document.getElementById( "level" );
    var overlap = document.getElementById( "overlap" );
    var reset = document.getElementById( "reset" );

    var displayValue;
    var textLengthValue;
    var levelValue;
    var overlapValue;
    
    var initOptionsPage = function () {
        restoreOptions();
        drawInfoArrow();

        var levelInfoIcon = document.getElementById( "info_level_icon" );
        levelInfoIcon.addEventListener( "mouseover", onLevelInfoIconOver );
        levelInfoIcon.addEventListener( "mouseout", onLevelInfoIconOut );
        
        display.addEventListener( "change", saveOptions, false );
        textLength.addEventListener( "change", saveOptions, false );
        level.addEventListener( "change", saveOptions, false );
        overlap.addEventListener( "change", saveOptions, false );
        reset.addEventListener( "click", resetOptions, false );
    }

    var saveOptions = function () {
        displayValue = display.children[ display.selectedIndex ].value;
        textLengthValue = textLength.children[ textLength.selectedIndex ].value;
        levelValue = level.children[ level.selectedIndex ].value;
        overlapValue = overlap.checked;
        
        chrome.storage.sync.set({
            displayOption: displayValue,
            textLengthOption: textLengthValue,
            levelOption: levelValue,
            overlapOption: overlapValue
        });
    }

    var restoreOptions = function () {
        chrome.storage.sync.get({
            // Get stored values and set default values 
            displayOption: "hidden",
            textLengthOption: "entireText",
            levelOption: 3,
            overlapOption: "true"
        }, function ( options ) {
            displayValue = options.displayOption;
            textLengthValue = options.textLengthOption;
            levelValue = options.levelOption;
            overlapValue = options.overlapOption;
            
            document.getElementById( "display-" + displayValue ).selected = true;
            document.getElementById( "textLength-" + textLengthValue ).selected = true;
            document.getElementById( "level-" + levelValue ).selected = true;

            if (overlapValue === "false") {
                overlap.checked = false;
            } else {
                overlap.checked = true;
            }
        });
    }

    function resetOptions() {
        chrome.storage.sync.set({
            displayOption: "hidden",
            textLengthOption: "entireText",
            levelOption: 3,
            overlapOption: true
        });
    }

    function drawInfoArrow() {
        var arrowCanvas = document.getElementById( "info_arrow" );
        var arrowContext = arrowCanvas.getContext( "2d" );

        arrowContext.beginPath();
        arrowContext.moveTo( 1, 6 );
        arrowContext.lineTo( 8, 0 );
        arrowContext.lineTo( 8, 13 );
        arrowContext.lineTo( 1, 8 );
        arrowContext.quadraticCurveTo( 0, 7, 1, 6 );
        arrowContext.fillStyle = "rgba( 48, 48, 48, 0.8 )";
        arrowContext.fill();
    }

    function onLevelInfoIconOver() {
        infoContainer = document.getElementById( "info_container" );
        infoContainer.style.display = "block";
        infoContainer.style.opacity = 1;
    }

    function onLevelInfoIconOut() {
        document.getElementById( "info_container" ).style.opacity = 0;
    }
    
    window.addEventListener( "load", initOptionsPage, false );
})();