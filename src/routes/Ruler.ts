import { Feature, Map as olMap } from "ol";
import type { Coordinate } from "ol/coordinate";
import { Geometry, LineString, Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Text } from "ol/style";
import { DEFAULT_RADIUS, getDistance, getLength } from "ol/sphere.js";
import { disableCoordinateWarning, setUserProjection, toLonLat, transform, useGeographic } from "ol/proj";
import Unit from "./Entities/Unit";

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

  private mouse_button: number;
  private color: string;

  private start: Coordinate | null;
  private end: Coordinate | null;

  private units: DistanceUnits;
  private is_drawing: boolean = false;

  private origin: Coordinate | null;

  public addTo(map: olMap) {
    let mouseMove = (e: UIEvent | { clientX: number, clientY: number }) => {
      if (!this.is_drawing) { return; }

      var coords = map.getEventCoordinate(e as MouseEvent);
      this.update_draw(coords);
    }

    let mousedown = (e: MouseEvent | TouchEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) {
        return;
      }
      // the ruler can only be a strait line, it starts drawing with the middle mouse button, and any other mouse click will finish the line
      if (!this.is_drawing && ((e as MouseEvent).button == this.mouse_button || (e as TouchEvent).targetTouches?.length == 1)) {
        var coords = map.getEventCoordinate(e as MouseEvent);
        this.start_draw(coords);
        this.is_drawing = true;
        return;
      }
    };

    let mouseup = () => {
      if (this.is_drawing) {
        this.is_drawing = false;
        this.end_draw();
      }
    };

    // add an event handler for middle mouse button
    map.getTargetElement().addEventListener("mousedown", mousedown);
    map.getTargetElement().addEventListener("touchstart", mousedown);

    map.getTargetElement().addEventListener("mouseup", mouseup);
    map.getTargetElement().addEventListener("touchend", mouseup);

    map.getTargetElement().addEventListener("mousemove", mouseMove);
    map.getTargetElement().addEventListener("touchmove", mouseMove);

    map.addLayer(this.layer);
  }

  public setZIndex(zIndex: number) {
    this.layer.setZIndex(zIndex);
  }

  public set_color(color: string) {
    this.color = color;
  }

  constructor(origin?: Coordinate | Unit | null) {
    super();

    this.units = DistanceUnits.NauticalMiles;
    this.mouse_button = 1;
    this.color = '#ff0000';

    this.layer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
      declutter: true,
      zIndex: 1000,
      className: "ruler",
    });

    if (origin instanceof Unit) {
      this.origin = origin.position;

      origin.feature.on("change", () => {
        this.start = origin.position;
        this.origin = origin.position;
      })

    } else {
      this.origin = origin || null;
    }
    this.start = null;
    this.end = null;
  }

  public set_origin(origin: Coordinate) {
    this.origin = origin;
    this.start = origin;
  }

  public set_mouse_button(button: number) {
    this.mouse_button = button;
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

    this.start = this.origin || start;

    this.feature = new Feature({
      geometry: new LineString([this.start, this.start]),
    });

    this.layer.getSource()?.addFeature(this.feature);
    this.update_draw(start);
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
        distance_str = distance.toFixed(0) + "km";
        break;
      case DistanceUnits.Meters:
        distance_str = distance.toFixed(0) + "m";
        break;
      case DistanceUnits.Feet:
        distance_str = distance.toFixed(0) + "ft";
        break;
      case DistanceUnits.NauticalMiles:
        distance_str = distance.toFixed(0) + "nm";
        break;
    }

    distance_str = get_heading(this.start, this.end).toFixed(0) + "° / " + distance_str;


    var textStyle = new Style({
      text: new Text({
        text: distance_str,
        scale: 1.7,
        placement: "point",
        textAlign: "center",
        fill: new Fill({
          color: "#000",
        }),
        stroke: new Stroke({
          color: "#ffffff",
          width: 2,
        }),
        maxAngle: 0,
      })
    });


    let color = this.color;
    let is_dark = true;

    if (color.startsWith('#')) {
      color = color.substring(1);
      is_dark = parseInt(color, 16) < 8421504;
    }


    var lightStroke = new Style({
      stroke: new Stroke({
        color: !is_dark ? [255, 255, 255, 0.6] : this.color,
        width: 2,
        lineDash: [4, 8],
        lineDashOffset: 6
      })
    });

    var darkStroke = new Style({
      stroke: new Stroke({
        color: is_dark ? [0, 0, 0, 0.6] : this.color,
        width: 2,
        lineDash: [4, 8]
      })
    });

    this.feature?.setStyle([textStyle, lightStroke, darkStroke]);

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