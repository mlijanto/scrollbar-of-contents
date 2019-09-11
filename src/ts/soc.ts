import { HeadingMarker, IHeadingMarker } from "./headingMarker";
import { HeadingMarkerStore, IHeadingMarkerStore } from "./headingMarkerStore";
import { filterHeading, IFilteredHeading } from "./filterHeading";

export enum Visibility {
  Visible = "visible",
  Hidden = "hidden"
}

export enum Display {
  Maximized = "maximized",
  Minimized = "minimized",
  Hidden = "hidden"
}

export enum TextLength {
  FirstThreeWords = "firstThreeWords",
  FirstTenCharacters = "firstTenCharacters",
  Full = "full"
}

export interface IConfig {
  visibility: Visibility;
  display: Display;
  textLength: TextLength;
  opacity: number;
  maxLevel: number;
  preventOverlap: boolean;
}

export const DefaultConfig: IConfig = {
  visibility: Visibility.Hidden,
  display: Display.Hidden,
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
  private display: Display = Display.Hidden;
  private hostVisibilityOverride: Visibility | undefined;
  private hostDisplayOverride: Display | undefined;
  private docHeight: number;
  private hostVisibilityOverrideStorageKey: string;
  private hostDisplayOverrideStorageKey: string;

  constructor() {
    this.store = new HeadingMarkerStore();
    this.hostName = location.hostname;
    this.docHeight = document.body.clientHeight;
    this.hostVisibilityOverrideStorageKey = "visibilityOverride-" + this.hostName;
    this.hostDisplayOverrideStorageKey = "displayOverride-" + this.hostName;

    this.config = DefaultConfig;

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
    const storageKeys: any = Object.assign({}, this.config);

    storageKeys[this.hostVisibilityOverrideStorageKey] = undefined;
    storageKeys[this.hostDisplayOverrideStorageKey] = undefined;

    chrome.storage.sync.get(
      storageKeys,
      (storedItems: { [key: string]: any }): void => {
        this.config.visibility = storedItems.visibility;
        this.config.display = storedItems.display;
        this.config.textLength = storedItems.textLength;
        this.config.opacity = storedItems.opacity;
        this.config.maxLevel = storedItems.maxLevel;
        this.config.preventOverlap = storedItems.preventOverlap;
        this.hostVisibilityOverride = storedItems[this.hostVisibilityOverrideStorageKey];
        this.hostDisplayOverride = storedItems[this.hostDisplayOverrideStorageKey];

        // If there are overrides for current hostname, set initial visibility and display styles
        if (this.hostVisibilityOverride) {
          this.visibility = this.hostVisibilityOverride;
        }

        if (this.hostDisplayOverride) {
          this.display = this.hostDisplayOverride;
        }

        // After the options are updated, always recreate the markers if they have been created.
        if (
          this.store.isHeadingMarkersCreated ||
          (this.config.display !== Display.Hidden && this.hostDisplayOverride !== Display.Hidden)
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
      const markerId: string = `soc-${i + 1}`;
      const marker: IHeadingMarker = new HeadingMarker(this.headings[i], markerId, this.config, this.store);

      this.store.headingMarkers.push(marker);

      body.appendChild(marker.domElement);
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
    // shift-alt-m
    if (e.keyCode == 77) {
      if (e.shiftKey && e.altKey) {
        e.preventDefault();
        this.toggleDisplay();
      }
    }

    // shift-alt-n
    else if (e.keyCode == 78) {
      if (e.shiftKey && e.altKey) {
        e.preventDefault();
        this.toggleVisibility();
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
          const heading: HTMLElement = headingsInCurrentLevel[j] as HTMLElement;
          const filteredHeading: IFilteredHeading = filterHeading(heading);

          if (filteredHeading.shouldMarkHeading) {
            heading.innerText = filteredHeading.filteredHeadingText;
            headings.push(heading);
          }
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

  private toggleDisplay = (): void => {
    if (!this.store.isHeadingMarkersCreated) {
      this.createHeadingMarkers();
    }

    if (this.display === Display.Maximized) {
      this.minimizeMarkers(true);
    } else if (this.display === Display.Minimized) {
      this.maximizeMarkers(true);
    }
  };

  private maximizeMarkers = (shouldSetOverride: boolean): void => {
    for (let marker of this.store.headingMarkers) {
      marker.maximize();
    }

    this.display = Display.Maximized;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateDisplayOverride();
    }
  };

  private minimizeMarkers = (shouldSetOverride: boolean): void => {
    for (let marker of this.store.headingMarkers) {
      marker.minimize();
    }

    this.display = Display.Minimized;

    if (shouldSetOverride && !chrome.extension.inIncognitoContext) {
      this.updateDisplayOverride();
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
   * Saves or removes display override for current hostname
   */
  private updateDisplayOverride = (): void => {
    if (this.display !== this.config.display) {
      const storageItems: any = {};
      storageItems[this.hostDisplayOverrideStorageKey] = this.display;
      chrome.storage.sync.set(storageItems);
    } else {
      chrome.storage.sync.remove(this.hostDisplayOverrideStorageKey);
    }
  };
}

new Soc();
