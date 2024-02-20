import { Feature } from "ol";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";

export default class {
  name: string;
  lat: number;
  lon: number;
  alt: number;
  heading: number;
  coalition_id: number;
  invisible: boolean;
  type: string;
  feature: Feature<Point>;
  is_player: boolean;

  constructor(
    data: { UnitName: any; LatLongAlt: any; Heading: any; Name: any; Flags: any; CoalitionID: any; is_player?: any; }
  ) {
    this.is_player = data.is_player || false;
    this.name = data.UnitName;
    this.lat = data.LatLongAlt.Lat;
    this.lon = data.LatLongAlt.Long;
    this.alt = data.LatLongAlt.Alt;
    this.heading = data.Heading;
    this.type = data.Name;
    this.invisible = data.Flags.Invisible;

    this.coalition_id = data.CoalitionID;

    this.feature = new Feature<Point>(
      new Point(fromLonLat([this.lon, this.lat])),
    );

    this.feature.set("self", this);
    // this.feature.set("name", this.name);
    // this.feature.set("coalition_id", this.coalition_id);
    // this.feature.set("icon", icon(data.Type));
  }

  update(data: { LatLongAlt?: { Lat: number; Long: number; }; Heading?: number; }) {
    this.lat = data.LatLongAlt?.Lat || this.lat;
    this.lon = data.LatLongAlt?.Long || this.lon;
    this.heading = data.Heading || this.heading;
    this.feature.getGeometry()?.setCoordinates(fromLonLat([this.lon, this.lat]));
  }
}
