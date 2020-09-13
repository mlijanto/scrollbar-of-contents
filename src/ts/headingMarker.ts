import { IConfig, State, TextLength } from "./soc";
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
  private readonly zIndexMax: number = 2147483647;
  private readonly reservedMarkerHeight: number = 28;
  private readonly transitionDuration: number = 200;

  private store: IHeadingMarkerStore;
  private heading: HTMLElement;
  private marker: HTMLElement = document.createElement("button");
  private markerContent: HTMLElement = document.createElement("span");
  private id: string;
  private config: IConfig;
  private state: State;
  private displayText: string = "";
  private fullText: string = "";
  private headingPosition: IPosition;
  private markerPosition: IPosition = { top: 0, left: 0 };
  private zIndex: number;
  private visibilityTimerId: number | null = null;

  constructor(
    heading: HTMLElement,
    id: string,
    text: string,
    config: IConfig,
    store: IHeadingMarkerStore,
    stateOverride: State = config.state
  ) {
    this.heading = heading;
    this.id = id;
    this.fullText = text;
    this.config = config;
    this.store = store;
    this.state = stateOverride;
    this.headingPosition = this.getPosition(this.heading);
    this.zIndex = this.zIndexMax - parseInt(this.heading.tagName.toLowerCase().split("h")[1], 10);

    this.setDisplayText();
    this.createMarker();
  }

  public get domElement(): HTMLElement {
    return this.marker;
  }

  public setPosition = (): void => {
    const winToDocHeightRatio: number = window.innerHeight / document.body.scrollHeight;

    // Get latest heading position
    this.headingPosition = this.getPosition(this.heading);

    // Reserve y position then place marker
    this.markerPosition.top = Number((winToDocHeightRatio * this.headingPosition.top).toFixed());

    if (this.config.preventOverlap) {
      for (let i: number = 0; i < this.store.reservedYPositions.length; i++) {
        if (
          this.store.reservedYPositions[this.markerPosition.top] ||
          this.store.reservedYPositions[this.markerPosition.top + this.reservedMarkerHeight - 1]
        ) {
          this.markerPosition.top++;
        }
      }

      // Reserve Y positions needed to show the marker
      for (let i: number = 0; i < this.reservedMarkerHeight; i++) {
        this.store.reservedYPositions[this.markerPosition.top + i] = 1;
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
        this.visibilityTimerId = null;
      }, this.transitionDuration);
    }
  };

  public maximize = (): void => {
    this.markerContent.style.display = "inline";
    this.state = State.Maximized;
  };

  public minimize = (): void => {
    this.markerContent.style.display = "none";
    this.state = State.Minimized;
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

      case TextLength.EntireText:
      default:
        this.displayText = this.fullText;
    }
  };

  private createMarker = (): void => {
    this.marker.setAttribute("id", this.id);
    this.marker.setAttribute("class", "soc-marker");

    this.markerContent.setAttribute("class", "soc-marker__text");
    this.markerContent.innerHTML = this.displayText;

    if (this.state === State.Minimized) {
      this.markerContent.style.display = "none";
    }

    this.marker.style.zIndex = this.zIndex.toString();
    this.marker.style.display = "none";
    this.marker.appendChild(this.markerContent);
    this.marker.addEventListener("mouseenter", this.handleMouseEnter);
    this.marker.addEventListener("mouseleave", this.handleMouseLeave);
    this.marker.addEventListener("click", this.handleClick);

    this.setPosition();
  };

  private handleMouseEnter = (): void => {
    if (this.state === State.Minimized) {
      this.markerContent.style.display = "inline";
    }

    this.markerContent.innerText = this.fullText;
    this.markerContent.style.zIndex = (this.zIndexMax - this.config.maxLevel).toString();

    this.marker.style.zIndex = this.zIndexMax.toString();
    this.marker.style.opacity = "1";
  };

  private handleMouseLeave = (): void => {
    this.markerContent.innerHTML = this.displayText;

    if (this.state === State.Minimized) {
      this.markerContent.style.display = "none";
    }

    this.marker.style.zIndex = this.zIndex.toString();
    this.marker.style.opacity = this.config.opacity.toString();
  };

  private handleClick = (): void => {
    window.scroll({
      top: this.headingPosition.top,
      behavior: "smooth"
    });
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
