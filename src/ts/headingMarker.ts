import { IConfig, TextLength } from "./soc";
import { IHeadingMarkerStore } from "./headingMarkerStore";

interface IPosition {
  top: number;
  left: number;
}

export interface IHeadingMarker {
  domElement: HTMLElement;
  setPosition(): void;
  show(): void;
  hide(): void;
  maximize(): void;
  minimize(): void;
}

export class HeadingMarker implements IHeadingMarker {
  private readonly zIndexMin: number = 100001;
  private readonly reservedMarkerHeight: number = 28;
  private readonly scrollDuration: number = 800;
  private readonly transitionDuration: number = 280;

  private store: IHeadingMarkerStore;
  private heading: HTMLElement;
  private marker: HTMLElement = document.createElement("div");
  private markerContent: HTMLElement = document.createElement("span");
  private id: string;
  private config: IConfig;
  private displayText: string = "";
  private fullText: string = "";
  private headingPosition: IPosition;
  private markerPosition: IPosition = { top: 0, left: 0 };
  private zIndex: number;
  private visibilityTimerId: number | null = null;

  constructor(heading: HTMLElement, id: string, config: IConfig, store: IHeadingMarkerStore) {
    this.heading = heading;
    this.id = id;
    this.config = config;
    this.store = store;
    this.fullText = heading.innerText;
    this.headingPosition = this.getPosition(this.heading);
    this.zIndex = this.zIndexMin + (config.maxLevel - parseInt(this.heading.tagName.split("h")[1], 10));

    this.setDisplayText();
    this.createMarker();
  }

  public get domElement(): HTMLElement {
    return this.marker;
  }

  public setPosition = (): void => {
    const winToDocHeightRatio: number = window.innerHeight / document.body.clientHeight;

    // Get latest heading position
    this.headingPosition = this.getPosition(this.heading);

    // Reserve y position then place marker
    this.markerPosition.top = Number((winToDocHeightRatio * this.headingPosition.top).toFixed());

    if (this.config.preventOverlap) {
      for (let i: number = 0; i < this.store.reservedYPositions.length; i++) {
        if (
          this.store.reservedYPositions[i] >= this.markerPosition.top &&
          this.store.reservedYPositions[i] <= this.markerPosition.top + this.reservedMarkerHeight
        ) {
          this.markerPosition.top++;
        }
      }

      // Reserve Y positions needed to show the marker
      for (let i: number = 0; i < this.reservedMarkerHeight; i++) {
        this.store.reservedYPositions.push(this.markerPosition.top + i);
      }
    }

    this.marker.style.top = `${this.markerPosition.top}px`;
  };

  public show = (): void => {
    this.marker.style.display = "block";
    this.marker.style.opacity = this.config.opacity.toString();
  };

  public hide = (): void => {
    this.marker.style.display = "block";
    this.marker.style.opacity = "0";

    if (!this.visibilityTimerId) {
      this.visibilityTimerId = window.setTimeout((): void => {
        this.marker.style.display = "none";
      }, this.transitionDuration);
    }
  };

  public maximize = (): void => {
    this.markerContent.style.display = "inline";
  };

  public minimize = (): void => {
    this.markerContent.style.display = "none";
  };

  private setDisplayText = (): void => {
    switch (this.config.textLength) {
      case TextLength.FirstThreeWords:
        const headingTextWords = this.fullText.split(" ");

        if (headingTextWords.length > 3) {
          this.displayText = headingTextWords.splice(0, 3).join(" ") + "...";
        } else {
          this.displayText = this.fullText;
        }
        break;

      case TextLength.FirstTenCharacters:
        if (this.fullText.length > 10) {
          this.displayText = this.fullText.substr(0, 10) + "...";
        } else {
          this.displayText = this.fullText;
        }
        break;

      case TextLength.Full:
      default:
        this.displayText = this.fullText;
    }
  };

  private createMarker = (): void => {
    this.marker.setAttribute("id", this.id);
    this.marker.setAttribute("class", "soc-marker");

    this.markerContent.setAttribute("class", "soc-marker__text");
    this.markerContent.innerHTML = this.displayText;

    if (this.config.display === "minimized") {
      this.markerContent.style.display = "none";
    }

    this.marker.style.zIndex = (
      this.zIndexMin +
      (this.config.maxLevel - parseInt(this.heading.tagName.toLowerCase().split("h")[1], 10))
    ).toString();
    this.marker.style.display = "none";
    this.marker.appendChild(this.markerContent);
    this.marker.addEventListener("mouseenter", this.handleMouseEnter);
    this.marker.addEventListener("mouseleave", this.handleMouseLeave);
    this.marker.addEventListener("click", this.handleClick);

    this.setPosition();
  };

  private handleMouseEnter = (): void => {
    if (this.config.display === "minimized") {
      this.markerContent.style.display = "inline";
    }

    this.markerContent.innerText = this.fullText;
    this.markerContent.style.zIndex = this.zIndexMin.toString();

    this.marker.style.zIndex = (this.zIndexMin + this.config.maxLevel).toString();
    this.marker.style.opacity = "1";
  };

  private handleMouseLeave = (): void => {
    this.markerContent.innerHTML = this.displayText;

    if (this.config.display === "minimized") {
      this.markerContent.style.display = "none";
    }

    this.marker.style.zIndex = this.zIndex.toString();
    this.marker.style.opacity = this.config.opacity.toString();
  };

  private handleClick = (): void => {
    console.log("clicked: scroll");

    // $.scrollTo(headingMarkers[this.getAttribute("id")].topPos, {
    //   duration: scrollDuration,
    //   easing: "swing"
    // });
  };

  /**
   * Gets an element's position relative to the document
   *
   * @param {HTMLElement} element
   * @returns {IPosition}
   */
  private getPosition = (element: HTMLElement | null): IPosition => {
    let top: number = 0;
    let left: number = 0;

    do {
      top += element!.offsetTop;
      left += element!.offsetLeft;
    } while ((element = element!.offsetParent as HTMLElement | null));

    return { top, left };
  };
}
