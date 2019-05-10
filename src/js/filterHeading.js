soc = (function(soc) {
  soc.filterHeading = function(headingElement) {
    var headingText = headingElement.innerText.toLowerCase();
    var filteredHeadingText = "";
    var markHeading;

    var isCurrentHost = function(hostToCheck) {
      return location.host.indexOf(hostToCheck) != -1;
    };

    if (headingText === "") {
      markHeading = false;
    } else if (isCurrentHost("wikipedia.org")) {
      /*------------------------------------------------
              Remove "[Edit]" and its equivalent 
              in other languages
            ------------------------------------------------*/
      filteredHeadingText = headingText.replace(/\[\w*\]/, "");

      markHeading = true;
    } else if (isCurrentHost("wikia.com")) {
      /*------------------------------------------------
              Remove "Edit"
            ------------------------------------------------*/
      filteredHeadingText = headingText.replace(/edit/i, "");

      markHeading = true;
    } else {
      filteredHeadingText = headingText;
      markHeading = true;
    }

    return {
      markHeading: markHeading,
      filteredHeadingText: filteredHeadingText
    };
  };

  return soc;
})(soc);
