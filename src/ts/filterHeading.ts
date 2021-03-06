export interface IFilteredHeading {
  shouldMarkHeading: boolean;
  filteredHeadingText: string;
}

export const filterHeading = (heading: HTMLElement): IFilteredHeading => {
  // Trim whitespace, remove newline characters, replace multiple whitespaces with a single whitespace, and convert to lower case.
  const headingText: string = heading.innerText
    .trim()
    .replace(/\r?\n|\r/g, "")
    .replace(/ +/gm, " ")
    .toLowerCase();

  let filteredHeadingText: string = "";

  if (checkHost("wikipedia.org")) {
    // Remove "[Edit]" and its equivalent in other languages
    filteredHeadingText = headingText.replace(/\[\w*\]/, "");
  } else if (checkHost("wikia.com")) {
    // Remove "Edit"
    filteredHeadingText = headingText.replace(/edit/i, "");
  } else {
    filteredHeadingText = headingText;
  }

  return {
    shouldMarkHeading: headingText === "" ? false : true,
    filteredHeadingText: filteredHeadingText
  };
};

const checkHost = (host: string): boolean => location.host.indexOf(host) != -1;
