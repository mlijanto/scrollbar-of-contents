import { MDCCheckbox } from "@material/checkbox";
import { MDCFormField } from "@material/form-field";
import { MDCRipple } from "@material/ripple";
import { MDCSlider } from "@material/slider";
import { IConfig, DefaultConfig, Display, TextLength, Visibility } from "./soc";

class Options {
  private readonly advancedOptionsSectionHeight: number = 264;

  private config: IConfig;
  private displayOption: HTMLSelectElement;
  private textLengthOption: HTMLSelectElement;
  private levelOption: HTMLSelectElement;
  private resetOption: HTMLElement;
  private advancedButtonArrow: HTMLCanvasElement;
  private levelInfoTooltip: HTMLElement;
  private opacityOption: MDCSlider;
  private overlapOption: MDCCheckbox;
  private isAdvancedOptionsExpanded: boolean = false;

  constructor() {
    this.config = Object.assign({}, DefaultConfig);
    this.displayOption = document.getElementById("form_display")! as HTMLSelectElement;
    this.textLengthOption = document.getElementById("form_text-length")! as HTMLSelectElement;
    this.levelOption = document.getElementById("form_advanced_level")! as HTMLSelectElement;
    this.resetOption = document.getElementById("form_reset")!;
    this.advancedButtonArrow = document.getElementById("form_advanced-button_arrow")! as HTMLCanvasElement;
    this.levelInfoTooltip = document.getElementById("level-info_tooltip")!;

    this.opacityOption = new MDCSlider(document.querySelector(".form_advanced_opacity_input")!);
    this.opacityOption.listen("MDCSlider:change", this.handleOptionsChange);

    this.overlapOption = new MDCCheckbox(document.querySelector(".form_advanced_overlap_checkbox")!);
    this.overlapOption.listen("change", this.handleOptionsChange);

    const overlapFormField: MDCFormField = new MDCFormField(document.querySelector(".form_advanced_overlap")!);
    overlapFormField.input = this.overlapOption;

    const advancedButton: HTMLCanvasElement = document.getElementById("form_advanced-button")! as HTMLCanvasElement;
    advancedButton.addEventListener("click", this.handleAdvancedButtonClick);

    this.displayOption.addEventListener("change", this.handleOptionsChange);
    this.textLengthOption.addEventListener("change", this.handleOptionsChange);
    this.levelOption.addEventListener("change", this.handleOptionsChange);
    this.resetOption.addEventListener("click", this.resetOptions);

    const levelInfo: HTMLElement = document.getElementById("form_advanced_level-info")!;
    levelInfo.addEventListener("mouseover", this.handleLevelInfoMouseOver);
    levelInfo.addEventListener("mouseout", this.handleLevelInfoMouseOut);

    MDCRipple.attachTo(document.getElementById("form_reset")!);

    this.drawAdvancedButtonArrow();
    this.restoreOptions();
  }

  private restoreOptions = (): void => {
    chrome.storage.sync.get(Object.keys(this.config), storedOptions => {
      if (Object.keys(storedOptions).length > 0) {
        this.config.visibility = storedOptions.visibility;
        this.config.display = storedOptions.display;
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
    console.log("storeOptions", this.config);
    chrome.storage.sync.set({
      visibility: this.config.visibility,
      display: this.config.display,
      textLength: this.config.textLength,
      opacity: this.config.opacity.toString(),
      maxLevel: this.config.maxLevel.toString(),
      preventOverlap: `${this.config.preventOverlap}`
    });
  };

  private setOptionsInputValues = (): void => {
    (document.getElementById(`display--${this.config.display}`)! as HTMLOptionElement).selected = true;
    (document.getElementById(`textLength--${this.config.textLength}`) as HTMLOptionElement).selected = true;
    (document.getElementById(`level--${this.config.maxLevel}`) as HTMLOptionElement).selected = true;

    this.opacityOption.value = this.config.opacity * 100;

    if (this.config.preventOverlap) {
      this.overlapOption.checked = true;
    } else {
      this.overlapOption.checked = false;
    }
  };

  private handleOptionsChange = (): void => {
    this.config.textLength = this.getTextLengthOptionValue();
    this.config.opacity = this.opacityOption.value / 100;
    this.config.maxLevel = parseInt(
      (this.levelOption.children[this.levelOption.selectedIndex] as HTMLOptionElement).value,
      10
    );
    this.config.preventOverlap = this.overlapOption.checked;

    this.setDisplayAndVisibilityOptionsValues();
    this.storeOptions();
  };

  private setDisplayAndVisibilityOptionsValues = (): void => {
    const value: string = (this.displayOption.children[this.displayOption.selectedIndex] as HTMLOptionElement).value;
    // const value: string = "hidden";

    console.log(value);

    switch (value) {
      case "maximized":
        this.config.display = Display.Maximized;
        this.config.visibility = Visibility.Visible;
        break;

      case "minimized":
        this.config.display = Display.Minimized;
        this.config.visibility = Visibility.Visible;
        break;

      case "hidden":
      default:
        this.config.display = Display.Hidden;
        this.config.visibility = Visibility.Hidden;
        break;
    }
  };

  private getTextLengthOptionValue = (): TextLength => {
    const value: string = (this.textLengthOption.children[this.textLengthOption.selectedIndex] as HTMLOptionElement)
      .value;

    switch (value) {
      case "entireText":
        return TextLength.EntireText;

      case "firstTenCharacters":
        return TextLength.FirstTenCharacters;

      case "firstThreeWords":
      default:
        return TextLength.FirstThreeWords;
    }
  };

  private drawAdvancedButtonArrow = (): void => {
    const arrowContext: CanvasRenderingContext2D | null = this.advancedButtonArrow.getContext("2d");

    if (!arrowContext) {
      return;
    }

    arrowContext.beginPath();
    arrowContext.moveTo(0, 1);
    arrowContext.quadraticCurveTo(0, 0, 1, 0);
    arrowContext.lineTo(8, 4);
    arrowContext.quadraticCurveTo(9, 5, 8, 6);
    arrowContext.lineTo(1, 9);
    arrowContext.quadraticCurveTo(0, 10, 0, 9);
    arrowContext.lineTo(0, 1);
    arrowContext.fillStyle = "#c8c8c8";
    arrowContext.fill();
  };

  private handleAdvancedButtonClick = (): void => {
    const advancedOptions: HTMLElement = document.getElementById("form_advanced")!;

    if (this.isAdvancedOptionsExpanded) {
      advancedOptions.style.height = "0";
      this.advancedButtonArrow.style.transform = "rotate(0deg)";
    } else {
      advancedOptions.style.height = `${this.advancedOptionsSectionHeight}px`;
      this.advancedButtonArrow.style.transform = "rotate(90deg)";
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
