import { MDCFormField } from "@material/form-field";
import { MDCCheckbox } from "@material/checkbox";
import { MDCSlider } from "@material/slider";
import { IConfig, DefaultConfig, Display, TextLength } from "./soc";

class Options {
  private readonly advancedOptionsSectionHeight: number = 264;

  private config: IConfig;
  private displayOption: HTMLSelectElement;
  private textLengthOption: HTMLSelectElement;
  private levelOption: HTMLSelectElement;
  private resetOption: HTMLElement;
  private advancedButtonArrow: HTMLCanvasElement;
  private levelInfoTooltip: HTMLElement;
  private overlapOption: MDCCheckbox;
  private opacityOption: MDCSlider;
  private isAdvancedOptionsExpanded: boolean = false;

  constructor() {
    this.config = DefaultConfig;
    this.displayOption = document.getElementById("form_display")! as HTMLSelectElement;
    this.textLengthOption = document.getElementById("form_text-length")! as HTMLSelectElement;
    this.levelOption = document.getElementById("form_advanced_level")! as HTMLSelectElement;
    this.resetOption = document.getElementById("form_reset")!;
    this.advancedButtonArrow = document.getElementById("form_advanced-button_arrow")! as HTMLCanvasElement;
    this.levelInfoTooltip = document.getElementById("tooltip-level")!;

    this.overlapOption = new MDCCheckbox(document.querySelector(".form_advanced_overlap_checkbox")!);
    this.overlapOption.listen("MDCCheckbox:change", this.saveOptions);

    const overlapFormField: MDCFormField = new MDCFormField(document.querySelector(".form_advanced_overlap")!);
    overlapFormField.input = this.overlapOption;

    this.opacityOption = new MDCSlider(document.querySelector(".form_advanced_opacity_input")!);
    this.opacityOption.listen("MDCSlider:change", this.saveOptions);

    this.restoreOptions();
    this.drawAdvancedButtonArrow();

    const advancedButton: HTMLCanvasElement = document.getElementById("form_advanced-button")! as HTMLCanvasElement;
    advancedButton.addEventListener("click", this.handleAdvancedButtonClick);

    const levelInfo: HTMLElement = document.getElementById("form_advanced_info-level")!;
    levelInfo.addEventListener("mouseover", this.handleLevelInfoMouseOver);
    levelInfo.addEventListener("mouseout", this.handleLevelInfoMouseOut);

    this.displayOption.addEventListener("change", this.saveOptions);
    this.textLengthOption.addEventListener("change", this.saveOptions);
    this.levelOption.addEventListener("change", this.saveOptions);
    this.resetOption.addEventListener("click", this.resetOptions);
  }

  private saveOptions = (): void => {
    this.config.display = this.getDisplayOptionValue();
    this.config.textLength = this.getTextLengthOptionValue();
    this.config.opacity = this.opacityOption.value / 100;
    this.config.maxLevel = parseInt(
      (this.levelOption.children[this.levelOption.selectedIndex] as HTMLOptionElement).value,
      10
    );
    this.config.preventOverlap = this.overlapOption.checked;

    chrome.storage.sync.set({
      visibility: this.config.visibility,
      display: this.config.display,
      textLength: this.config.textLength,
      opacity: this.config.opacity,
      maxLevel: this.config.maxLevel,
      preventOverlap: this.config.preventOverlap
    });
  };

  private restoreOptions = (): void => {
    chrome.storage.sync.get(this.config, storedItems => {
      this.config.visibility = storedItems.visibility;
      this.config.display = storedItems.display;
      this.config.textLength = storedItems.textLength;
      this.config.opacity = storedItems.opacity;
      this.config.maxLevel = storedItems.maxLevel;
      this.config.preventOverlap = storedItems.preventOverlap;

      (document.getElementById("display--" + this.config.display)! as HTMLOptionElement).selected = true;
      (document.getElementById("textLength--" + this.config.textLength) as HTMLOptionElement).selected = true;
      (document.getElementById("level--" + this.config.maxLevel) as HTMLOptionElement).selected = true;

      this.opacityOption.value = this.config.opacity * 100;

      if (this.config.preventOverlap) {
        this.overlapOption.checked = true;
      } else {
        this.overlapOption.checked = false;
      }
    });
  };

  private resetOptions = (): void => {
    chrome.storage.sync.set({
      visibility: DefaultConfig.visibility,
      display: DefaultConfig.display,
      textLength: DefaultConfig.textLength,
      opacity: DefaultConfig.opacity,
      maxLevel: DefaultConfig.maxLevel,
      preventOverlap: DefaultConfig.preventOverlap
    });
  };

  private getDisplayOptionValue = (): Display => {
    const value: string = (this.displayOption.children[this.displayOption.selectedIndex] as HTMLOptionElement).value;

    switch (value) {
      case "maximized":
        return Display.Maximized;

      case "minimized":
        return Display.Minimized;

      case "hidden":
      default:
        return Display.Hidden;
    }
  };

  private getTextLengthOptionValue = (): TextLength => {
    const value: string = (this.textLengthOption.children[this.textLengthOption.selectedIndex] as HTMLOptionElement)
      .value;

    switch (value) {
      case "entireText":
        return TextLength.Full;

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
    arrowContext.lineTo(10, 5);
    arrowContext.quadraticCurveTo(11, 6, 10, 7);
    arrowContext.lineTo(1, 11);
    arrowContext.quadraticCurveTo(0, 11, 0, 10);
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
