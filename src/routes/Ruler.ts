import { Feature, Map as olMap } from "ol";
import type { Coordinate } from "ol/coordinate";
import { Geometry, LineString, Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import { DEFAULT_RADIUS, getDistance, getLength } from "ol/sphere.js";
import { disableCoordinateWarning, setUserProjection, toLonLat, transform, useGeographic } from "ol/proj";

// enum with Meters, Feet, Nautical Miles
export enum DistanceUnits {
  Kilometers,
  Meters,
  Feet,
  NauticalMiles,
}

export class Ruler extends Feature {
  public readonly layer: VectorLayer<VectorSource<Feature<Geometry>>>;
  private feature: Feature<LineString> | null = null;


  private start: Coordinate | null;
  private end: Coordinate | null;

  private units: DistanceUnits;
  private is_drawing: boolean = false;

  private bullseye: Coordinate | null;

  public addTo(map: olMap) {
    let mouseMove = (e: MouseEvent) => {
      var coords = map.getEventCoordinate(e);
      this.update_draw(coords);
    }

    // add an event handler for middle mouse button
    map.getTargetElement().addEventListener("mousedown", (e) => {
      // the ruler can only be a strait line, it starts drawing with the middle mouse button, and any other mouse click will finish the line
      if (!this.is_drawing && e.button == 1) {
        var coords = map.getEventCoordinate(e);
        this.start_draw(coords);
        this.is_drawing = true;
        map.getTargetElement().addEventListener("mousemove", mouseMove);
        return;
      }
    });

    map.getTargetElement().addEventListener("mouseup", () => {
      if (this.is_drawing) {
        this.is_drawing = false;
        this.end_draw();
        map.getTargetElement().removeEventListener(
          "mousemove",
          mouseMove
        );
      }
    });

    map.addLayer(this.layer);
  }

  public setZIndex(zIndex: number) {
    this.layer.setZIndex(zIndex);
  }

  constructor(bullseye?: Coordinate | null) {
    super();

    this.units = DistanceUnits.NauticalMiles;

    this.layer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
      declutter: false,
      zIndex: 1000,
      className: "ruler",
    });

    this.bullseye = bullseye || null;
    this.start = null;
    this.end = null;
  }

  public remove() {
    if (this.feature !== null) {
      this.layer.getSource()?.removeFeature(this.feature);
      this.start = null;
      this.end = null;
    }
  }

  public start_draw(start: Coordinate) {
    this.remove();

    this.start = this.bullseye || start;

    this.feature = new Feature({
      geometry: new LineString([this.start, this.start]),
    });

    this.layer.getSource()?.addFeature(this.feature);

  }

  public set_units(units: DistanceUnits) {
    this.units = units;

    // if there is a line, update the text
    if (this.feature && this.end) {
      this.update_draw(this.end);
    }
  }

  public update_draw(end: Coordinate) {
    this.end = end;
    if (this.start == null) { return; }

    let distance = this.get_distance();

    let distance_str = "m";
    switch (this.units) {
      case DistanceUnits.Kilometers:
        distance_str = distance.toFixed(2) + "km";
        break;
      case DistanceUnits.Meters:
        distance_str = distance.toFixed(0) + "m";
        break;
      case DistanceUnits.Feet:
        distance_str = distance.toFixed(0) + "ft";
        break;
      case DistanceUnits.NauticalMiles:
        distance_str = distance.toFixed(2) + "nm";
        break;
    }

    distance_str += " " + get_heading(this.start, this.end).toFixed(2) + "°";

    this.feature?.setStyle(
      new Style({
        text: new Text({
          text: distance_str,
          scale: 2,
          placement: "line",
          textAlign: "end",
          fill: new Fill({
            color: "#000",
          }),
          stroke: new Stroke({
            color: "#ffffff",
            width: 2,
          }),
          maxAngle: 0,
        }),
        stroke: new Stroke({
          color: "#ff0000",
          width: 2,
        }),
      }),
    );

    this.feature?.getGeometry()?.setCoordinates([this.start, this.end]);
  }

  public end_draw() {
    // if the start and end are VERY close to each other, remove the feature
    if (this.get_distance(true) < 1) {
      this.remove();
    }
  }

  private get_distance(force_meters = false) {
    if (this.start == null || this.end == null) { return 0; }

    let units = this.units;
    if (force_meters) {
      units = DistanceUnits.Meters;
    }

    return get_distance(this.start, this.end, units);

  }
}

export function get_distance(start: Coordinate, end: Coordinate, units: DistanceUnits) {
  start = transform(start, 'EPSG:3857', 'EPSG:4326')
  end = transform(end, 'EPSG:3857', 'EPSG:4326')

  let distance_in_meters = getDistance(start, end);

  switch (units) {
    case DistanceUnits.Kilometers:
      return distance_in_meters / 1000;
    case DistanceUnits.Meters:
      return distance_in_meters;
    case DistanceUnits.Feet:
      return distance_in_meters * 3.28084;
    case DistanceUnits.NauticalMiles:
      return distance_in_meters / 1852;
  }
}

export function get_heading(p1: Coordinate, p2: Coordinate) {
  let heading = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  heading = (heading * 180) / Math.PI;
  heading = (heading + 360) % 360;
  return heading;
}