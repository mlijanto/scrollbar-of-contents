import { IHeadingMarker } from "./headingMarker";

export interface IHeadingMarkerStore {
  headingMarkers: IHeadingMarker[];
  reservedYPositions: number[];
  isHeadingMarkersCreated: boolean;
}

export class HeadingMarkerStore implements IHeadingMarkerStore {
  private _isHeadingMarkersCreated: boolean = false;

  public headingMarkers: IHeadingMarker[] = [];
  public reservedYPositions: number[] = [];

  public get isHeadingMarkersCreated(): boolean {
    return this._isHeadingMarkersCreated;
  }

  public set isHeadingMarkersCreated(newValue: boolean) {
    this._isHeadingMarkersCreated = newValue;
  }
}
