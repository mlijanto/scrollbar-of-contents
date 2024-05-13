import { IConfig, DefaultConfig, Visibility, State, TextLength } from "./soc";

class Options {
  private readonly advancedOptionsSectionHeight: number = 264;

  private config: IConfig;
  private displayOption: HTMLSelectElement;
  private textLengthOption: HTMLSelectElement;
  private levelOption: HTMLSelectElement;
  private resetOption: HTMLButtonElement;
  private advancedButtonArrow: HTMLDivElement;
  private levelInfoTooltip: HTMLElement;
  private opacityOption: HTMLInputElement;
  private overlapOption: HTMLInputElement;
  private isAdvancedOptionsExpanded: boolean = false;

  constructor() {
    this.config = Object.assign({}, DefaultConfig);
    this.displayOption = document.getElementById("form_display")! as HTMLSelectElement;
    this.textLengthOption = document.getElementById("form_text-length")! as HTMLSelectElement;
    this.levelOption = document.getElementById("form_advanced_level")! as HTMLSelectElement;
    this.resetOption = document.getElementById("form_reset")! as HTMLButtonElement;
    this.advancedButtonArrow = document.getElementById("form_advanced-button_arrow-container")! as HTMLDivElement;
    this.levelInfoTooltip = document.getElementById("level-info_tooltip")!;

    this.opacityOption = document.querySelector(".form_advanced_opacity_input")!;
    this.opacityOption.addEventListener("input", this.handleOptionsChange);

    this.overlapOption = document.querySelector("#form_advanced_overlap_checkbox")!;
    this.overlapOption.addEventListener("change", this.handleOptionsChange);

    const advancedButton: HTMLButtonElement = document.getElementById("form_advanced-button")! as HTMLButtonElement;
    advancedButton.addEventListener("click", this.handleAdvancedButtonClick);

    this.displayOption.addEventListener("change", this.handleOptionsChange);
    this.textLengthOption.addEventListener("change", this.handleOptionsChange);
    this.levelOption.addEventListener("change", this.handleOptionsChange);
    this.resetOption.addEventListener("click", this.resetOptions);

    const levelInfo: HTMLElement = document.getElementById("form_advanced_level-info")!;
    levelInfo.addEventListener("mouseover", this.handleLevelInfoMouseOver);
    levelInfo.addEventListener("mouseout", this.handleLevelInfoMouseOut);

    this.restoreOptions();
  }

  private restoreOptions = (): void => {
    chrome.storage.sync.get(Object.keys(this.config), storedOptions => {
      if (Object.keys(storedOptions).length > 0) {
        this.config.visibility = storedOptions.visibility;
        this.config.state = storedOptions.state;
        this.config.textLength = storedOptions.textLength;
        this.config.opacity = parseFloat(storedOptions.opacity);
        this.config.maxLevel = parseInt(storedOptions.maxLevel, 10);
        this.config.preventOverlap = storedOptions.preventOverlap === "true" ? true : false;
      }

      this.setOptionsInputValues();
    });
  };

  private resetOptions = (e: MouseEvent): void => {
    e.preventDefault();

    this.config = Object.assign({}, DefaultConfig);

    this.storeOptions();
    this.setOptionsInputValues();
  };

  private storeOptions = (): void => {
    chrome.storage.sync.set({
      visibility: this.config.visibility,
      state: this.config.state,
      textLength: this.config.textLength,
      opacity: this.config.opacity.toString(),
      maxLevel: this.config.maxLevel.toString(),
      preventOverlap: `${this.config.preventOverlap}`
    });
  };

  private setOptionsInputValues = (): void => {
    if (this.config.visibility === Visibility.Visible) {
      (document.getElementById(`display--${this.config.state}`)! as HTMLOptionElement).selected = true;
    } else {
      (document.getElementById("display--hidden")! as HTMLOptionElement).selected = true;
    }

    (document.getElementById(`textLength--${this.config.textLength}`) as HTMLOptionElement).selected = true;
    (document.getElementById(`level--${this.config.maxLevel}`) as HTMLOptionElement).selected = true;

    this.opacityOption.value = `${this.config.opacity * 100}`;

    if (this.config.preventOverlap) {
      this.overlapOption.checked = true;
    } else {
      this.overlapOption.checked = false;
    }
  };

  private handleOptionsChange = (): void => {
    this.config.textLength = this.getTextLengthOptionValue();
    this.config.opacity = parseInt(this.opacityOption.value) / 100;
    this.config.maxLevel = parseInt(
      (this.levelOption.children[this.levelOption.selectedIndex] as HTMLOptionElement).value,
      10
    );
    this.config.preventOverlap = this.overlapOption.checked;

    this.setVisibilityAndStateConfigValues();
    this.storeOptions();
  };

  private setVisibilityAndStateConfigValues = (): void => {
    const value: string = (this.displayOption.children[this.displayOption.selectedIndex] as HTMLOptionElement).value;

    switch (value) {
      case "maximized":
        this.config.visibility = Visibility.Visible;
        this.config.state = State.Maximized;
        break;

      case "minimized":
        this.config.visibility = Visibility.Visible;
        this.config.state = State.Minimized;
        break;

      case "hidden":
      default:
        this.config.visibility = Visibility.Hidden;
        break;
    }
  };

  private getTextLengthOptionValue = (): TextLength => {
    return (this.textLengthOption.children[this.textLengthOption.selectedIndex] as HTMLOptionElement).value as TextLength;
  };

  private handleAdvancedButtonClick = (e: Event): void => {
    e.preventDefault();

    const advancedOptions: HTMLElement = document.getElementById("form_advanced")!;

    if (this.isAdvancedOptionsExpanded) {
      advancedOptions.style.height = "0";
      this.advancedButtonArrow.style.transform = "rotate(90deg)";
    } else {
      advancedOptions.style.height = `${this.advancedOptionsSectionHeight}px`;
      this.advancedButtonArrow.style.transform = "rotate(180deg)";
    }

    this.isAdvancedOptionsExpanded = !this.isAdvancedOptionsExpanded;
  };

  private handleLevelInfoMouseOver = (): void => {
    this.levelInfoTooltip.style.display = "block";
    this.levelInfoTooltip.style.opacity = "1";
  };

  private handleLevelInfoMouseOut = () => {
    this.levelInfoTooltip.style.opacity = "0";
  };
}

((): void => {
  window.addEventListener(
    "load",
    (): void => {
      new Options();
    }
  );
})();
