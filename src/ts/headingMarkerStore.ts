import { IHeadingMarker } from "./headingMarker";

export interface IHeadingMarkerStore {
  headingMarkers: IHeadingMarker[];
  reservedYPositions: number[];
  isHeadingMarkersCreated: boolean;
}

export class HeadingMarkerStore implements IHeadingMarkerStore {
  // private _headingMarkers: IHeadingMarker[] = [];
  // private _reservedYPositions: number[] = [];
  private _isHeadingMarkersCreated: boolean = false;

  public headingMarkers: IHeadingMarker[] = [];
  public reservedYPositions: number[] = [];
  // public isHeadingMarkersCreated: boolean = false;

  // public get headingMarkers(): IHeadingMarker[] {
  //   return this._headingMarkers;
  // }

  // public set headingMarkers(headingMarkers: IHeadingMarker[]) {
  //   this._headingMarkers = headingMarkers;
  // }

  // public get reservedYPositions(): number[] {
  //   return this._reservedYPositions;
  // }

  // public set reservedYPositions(reservedYPositions: number[]) {
  //   this._reservedYPositions = reservedYPositions;
  // }

  public get isHeadingMarkersCreated(): boolean {
    return this._isHeadingMarkersCreated;
  }

  public set isHeadingMarkersCreated(newValue: boolean) {
    this._isHeadingMarkersCreated = newValue;
  }
}
