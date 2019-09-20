import { HeadingMarker, IHeadingMarker } from "./headingMarker";
import { HeadingMarkerStore, IHeadingMarkerStore } from "./headingMarkerStore";
import { filterHeading, IFilteredHeading } from "./filterHeading";

export enum Visibility {
  Visible = "visible",
  Hidden = "hidden"
}

export enum State {
  Maximized = "maximized",
  Minimized = "minimized"
}

export enum TextLength {
  FirstThreeWords = "firstThreeWords",
  FirstTenCharacters = "firstTenCharacters",
  EntireText = "entireText"
}

export interface IConfig {
  visibility: Visibility;
  state: State;
  textLength: TextLength;
  opacity: number;
  maxLevel: number;
  preventOverlap: boolean;
}

export const DefaultConfig: IConfig = {
  visibility: Visibility.Hidden,
  state: State.Maximized,
  textLength: TextLength.FirstThreeWords,
  opacity: 0.91,
  maxLevel: 3,
  preventOverlap: true
};

class Soc {
  private store: IHeadingMarkerStore;
  private hostName: string;
  private headings: HTMLElement[] = [];
  private config: IConfig;
  private visibility: Visibility = Visibility.Hidden;
  private state: State = State.Maximized;
  private hostVisibilityOverride: Visibility | undefined;
  private hostStateOverride: State | undefined;
  private docHeight: number;
  private hostVisibilityOverrideStorageKey: string;
  private hostStateOverrideStorageKey: string;

  constructor() {
    this.store = new HeadingMarkerStore();
    this.hostName = location.hostname;
    this.config = Object.assign({}, DefaultConfig);
    this.docHeight = document.body.clientHeight;
    this.hostVisibilityOverrideStorageKey = `visibilityOverride:${this.hostName}`;
    this.hostStateOverrideStorageKey = `stateOverride:${this.hostName}`;

    this.retrieveOptions();

    /**
     * Listen for tab updates and tab selection changes to keep tab data up to date
     * and to make options page changes take effect immediately.
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.tabEvent) {
        case "activated":
          this.retrieveOptions();
          break;

        case "updated":
          // Update markers if they have been created
          if (this.store.isHeadingMarkersCreated) {
            this.createHeadingMarkers();
          }
          break;

        case "browserActionClicked":
          this.toggleVisibility();
          break;
      }

      // Close the request
      sendResponse({});
    });

    document.addEventListener("keydown", this.handleKeyDown, false);
  }

  private retrieveOptions = () => {
    const storageKeys: string[] = Object.keys(this.config);

    storageKeys.push(this.hostVisibilityOverrideStorageKey);
    storageKeys.push(this.hostStateOverrideStorageKey);

    chrome.storage.sync.get(
      storageKeys,
      (storedItems: { [key: string]: any }): void => {
        this.config.visibility = storedItems.visibility || this.config.visibility;
        this.config.state = storedItems.state || this.config.state;
        this.config.textLength = storedItems.textLength || this.config.textLength;
        this.config.opacity = storedItems.opacity ? parseFloat(storedItems.opacity) : this.config.opacity;
        this.config.maxLevel = storedItems.maxLevel ? parseInt(storedItems.maxLevel, 10) : this.config.maxLevel;
        this.config.preventOverlap = storedItems.preventOverlap
          ? storedItems.preventOverlap === "true"
            ? true
            : false
          : this.config.preventOverlap;

        this.hostVisibilityOverride = storedItems[this.hostVisibilityOverrideStorageKey];
        this.hostStateOverride = storedItems[this.hostStateOverrideStorageKey];

        // Set initial visibility and state
        this.visibility = this.hostVisibilityOverride || this.config.visibility;
        this.state = this.hostStateOverride || this.config.state;

        // After the options are updated, always recreate the markers if they have been created.
        if (
          this.store.isHeadingMarkersCreated ||
          this.hostVisibilityOverride === Visibility.Visible ||
          (this.config.visibility === Visibility.Visible && this.hostVisibilityOverride !== Visibility.Hidden)
        ) {
          this.createHeadingMarkers();
        }
      }
    );
  };

  private createHeadingMarkers = (): void => {
    const bodyElements: HTMLCollectionOf<HTMLBodyElement> = document.getElementsByTagName("body");
    const body: HTMLBodyElement = bodyElements[0];

    if (!body) {
      return;
    }

    if (this.store.headingMarkers.length > 0) {
      this.clearHeadingMarkers();
    }

    if (this.config.preventOverlap) {
      this.store.reservedYPositions.length = 0;
    }

    this.headings = this.getHeadingsOnPage();

    for (let i: number = 0; i < this.headings.length; i++) {
      const filteredHeading: IFilteredHeading = filterHeading(this.headings[i]);

      if (filteredHeading.shouldMarkHeading) {
        const marker: IHeadingMarker = new HeadingMarker(
          this.headings[i],
          `soc-${i + 1}`,
          filteredHeading.filteredHeadingText,
          this.config,
          this.store,
          this.hostStateOverride
        );

        this.store.headingMarkers.push(marker);

        body.appendChild(marker.domElement);
      }
    }

    // If markers have not been created previously, attach listener
    if (!this.store.isHeadingMarkersCreated) {
      window.addEventListener("resize", this.handleWindowResize);
      window.setInterval(this.handleWindowIntervalTick, 100);
    }

    // Display heading markers
    if (this.visibility === Visibility.Visible) {
      for (let marker of this.store.headingMarkers) {
        marker.domElement.style.display = "block";
        if (this.store.isHeadingMarkersCreated) {
          marker.domElement.style.opacity = this.config.opacity.toString();
        } else {
          marker.domElement.style.opacity = "0";
        }
      }
    }

    this.store.isHeadingMarkersCreated = true;
  };

  private handleWindowResize = (): void => {
    this.updateMarkerPositions();
  };

  private handleWindowIntervalTick = (): void => {
    const currentDocHeight: number = document.body.clientHeight;

    if (this.docHeight !== currentDocHeight) {
      this.docHeight = currentDocHeight;
      this.updateMarkerPositions();
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // shift-alt-v
    if (e.keyCode == 86) {
      if (e.shiftKey && e.altKey) {
        e.preventDefault();
        this.toggleVisibility();
      }
    }
    // shift-alt-b
    else if (e.keyCode == 66) {
      if (e.shiftKey && e.altKey) {
        e.preventDefault();
        this.toggleState();
      }
    }
  };

  private clearHeadingMarkers = (): void => {
    for (let marker of this.store.headingMarkers) {
      marker.domElement.remove();
    }

    this.headings.length = 0;
    this.store.headingMarkers.length = 0;
  };

  private getHeadingsOnPage = () => {
    let headings: HTMLElement[] = [];

    for (let i: number = 0; i < this.config.maxLevel; i++) {
      const headingsInCurrentLevel: HTMLCollectionOf<Element> = document.getElementsByTagName(`h${i + 1}`);

      if (headingsInCurrentLevel.length > 0) {
        for (let j: number = 0; j < headingsInCurrentLevel.length; j++) {
          headings.push(headingsInCurrentLevel[j] as HTMLElement);
        }
      }
    }

    return headings;
  };

  private updateMarkerPositions = (): void => {
    if (this.config.preventOverlap) {
      this.store.reservedYPositions.length = 0;
    }

    for (let marker of this.store.headingMarkers) {
      marker.setPosition();
    }
  };

  private toggleVisibility = (): void => {
    if (!this.store.isHeadingMarkersCreated) {
      this.createHeadingMarkers();
    }

    if (this.visibility === Visibility.Hidden) {
      this.showMarkers(true);
    } else {
      this.hideMarkers(true);
    }
  };

  private showMarkers = (shouldSetOverride: boolean = false): void => {
    for (let marker of this.store.headingMarkers) {
      marker.show();
    }

    this.visibility = Visibility.Visible;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateVisibilityOverride();
    }
  };

  private hideMarkers = (shouldSetOverride: boolean = false): void => {
    for (let marker of this.store.headingMarkers) {
      marker.hide();
    }

    this.visibility = Visibility.Hidden;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateVisibilityOverride();
    }
  };

  private toggleState = (): void => {
    if (!this.store.isHeadingMarkersCreated) {
      this.createHeadingMarkers();
    }

    if (this.state === State.Maximized) {
      this.minimizeMarkers(true);
    } else if (this.state === State.Minimized) {
      this.maximizeMarkers(true);
    }
  };

  private maximizeMarkers = (shouldSetOverride: boolean): void => {
    for (let marker of this.store.headingMarkers) {
      marker.maximize();
    }

    this.state = State.Maximized;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateStateOverride();
    }
  };

  private minimizeMarkers = (shouldSetOverride: boolean): void => {
    for (let marker of this.store.headingMarkers) {
      marker.minimize();
    }

    this.state = State.Minimized;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateStateOverride();
    }
  };

  /**
   * Saves or removes visibility override for current hostname
   */
  private updateVisibilityOverride = (): void => {
    if (this.visibility !== this.config.visibility) {
      const storageItems: any = {};
      storageItems[this.hostVisibilityOverrideStorageKey] = this.visibility;
      chrome.storage.sync.set(storageItems);
    } else {
      chrome.storage.sync.remove(this.hostVisibilityOverrideStorageKey);
    }
  };

  /**
   * Saves or removes state override for current hostname
   */
  private updateStateOverride = (): void => {
    if (this.state !== this.config.state) {
      const storageItems: any = {};
      storageItems[this.hostStateOverrideStorageKey] = this.state;
      chrome.storage.sync.set(storageItems);
    } else {
      chrome.storage.sync.remove(this.hostStateOverrideStorageKey);
    }
  };
}

new Soc();
