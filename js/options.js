(function () {
    var display = document.getElementById("form_display");
    var textLength = document.getElementById("form_text-length");
    var opacity = document.getElementById("form_advanced_opacity_input");
    var level = document.getElementById("form_advanced_level");
    var overlap = document.getElementById("form_advanced_overlap_input")
    var reset = document.getElementById("form_reset");
    var advancedOptionsExpanded = false;

    var displayValue;
    var textLengthValue;
    var opacityValue;
    var levelValue;
    var overlapValue;

    var initOptionsPage = function () {
        restoreOptions();
        drawAdvancedButtonArrow();

        var advancedButton = document.getElementById("form_advanced-button");
        advancedButton.addEventListener("click", onAdvancedButtonClick, false);

        var infoLevel = document.getElementById("form_advanced_info-level");
        infoLevel.addEventListener("mouseover", onInfoLevelOver);
        infoLevel.addEventListener("mouseout", onInfoLevelOut);

        display.addEventListener("change", saveOptions, false);
        textLength.addEventListener("change", saveOptions, false);
        opacity.addEventListener("change", saveOptions, false);
        document.getElementById("form_advanced_overlap_input").addEventListener("change", saveOptions, false);
        level.addEventListener("change", saveOptions, false);
        reset.addEventListener("click", resetOptions, false);
    }

    var saveOptions = function () {
        displayValue = display.children[display.selectedIndex].value;
        textLengthValue = textLength.children[textLength.selectedIndex].value;
        opacityValue = opacity.value / 100;
        levelValue = level.children[level.selectedIndex].value;
        overlapValue = overlap.checked;

        chrome.storage.sync.set({
            displayOption: displayValue,
            textLengthOption: textLengthValue,
            opacityOption: opacityValue,
            levelOption: levelValue,
            overlapOption: overlapValue
        });
    }

    var restoreOptions = function () {
        chrome.storage.sync.get({
            // Get stored values and set default values 
            displayOption: "hidden",
            textLengthOption: "firstThreeWords",
            opacityOption: .91,
            levelOption: 3,
            overlapOption: true
        }, function (options) {
            displayValue = options.displayOption;
            textLengthValue = options.textLengthOption;
            opacityValue = options.opacityOption * 100;
            levelValue = options.levelOption;
            overlapValue = options.overlapOption;

            document.getElementById("display--" + displayValue).selected = true;
            document.getElementById("textLength--" + textLengthValue).selected = true;
            document.getElementById("level--" + levelValue).selected = true;

            opacity.MaterialSlider.change(opacityValue);

            if (overlapValue === false) {
                document.querySelector(".form_advanced_overlap").MaterialCheckbox.uncheck();
            } else {
                document.querySelector(".form_advanced_overlap").MaterialCheckbox.check();
            }
        });
    }

    function resetOptions() {
        chrome.storage.sync.set({
            displayOption: "hidden",
            textLengthOption: "firstThreeWords",
            opacityOption: .91,
            levelOption: 3,
            overlapOption: true
        });
    }

    function drawAdvancedButtonArrow() {
        var arrowCanvas = document.getElementById("form_advanced-arrow");
        var arrowContext = arrowCanvas.getContext("2d");

        arrowContext.beginPath();
        arrowContext.moveTo(0, 1);
        arrowContext.quadraticCurveTo(0, 0, 1, 0);
        arrowContext.lineTo(10, 5);
        arrowContext.quadraticCurveTo(11, 6, 10, 7);
        arrowContext.lineTo(1, 11);
        arrowContext.quadraticCurveTo(0, 11, 0, 10);
        arrowContext.lineTo(0, 1);
        arrowContext.fillStyle = "#c8c8c8";
        arrowContext.fill();
    }

    function onAdvancedButtonClick() {
        var advancedOptions = document.getElementById("form_advanced");
        var advancedArrow = document.getElementById("form_advanced-arrow");

        if (advancedOptionsExpanded === true) {
            advancedOptions.style.height = "0";
            advancedArrow.style.transform = "rotate(0deg)";
        } else {
            advancedOptions.style.height = "264px";
            advancedArrow.style.transform = "rotate(90deg)";
        }

        advancedOptionsExpanded = !advancedOptionsExpanded;
    }

    function onInfoLevelOver() {
        infoTooltip = document.getElementById("tooltip-level");
        infoTooltip.style.display = "block";
        infoTooltip.style.opacity = 1;
    }

    function onInfoLevelOut() {
        document.getElementById("tooltip-level").style.opacity = 0;
    }

    window.addEventListener("load", initOptionsPage, false);
})();