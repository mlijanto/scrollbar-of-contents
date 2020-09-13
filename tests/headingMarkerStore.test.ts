import { HeadingMarkerStore, IHeadingMarkerStore } from "../src/ts/headingMarkerStore";

test("Create new Heading Marker store", () => {
  const store: IHeadingMarkerStore = new HeadingMarkerStore();

  expect(store.headingMarkers).toEqual([]);
  expect(store.reservedYPositions).toEqual([]);
  expect(store.isHeadingMarkersCreated).toBeFalsy();
});
