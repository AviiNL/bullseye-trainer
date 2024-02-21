import { Feature } from "ol";
import type { Coordinate } from "ol/coordinate";
import type { Geometry } from "ol/geom";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";

export default class {
  position: Coordinate;
  heading: number;
  coalition_id: number;
  invisible: boolean;
  type: string;
  feature: Feature<Point>;
  is_player: boolean;

  constructor(
    data: { Position: Coordinate; Heading: any; Name: any; Flags: any; CoalitionID: any; is_player?: any; }
  ) {
    this.is_player = data.is_player || false;
    this.position = data.Position;
    this.heading = data.Heading;
    this.type = data.Name;
    this.invisible = data.Flags.Invisible;

    this.coalition_id = data.CoalitionID;

    this.feature = new Feature<Point>(
      new Point(this.position),
    );

    this.feature.on("change", (e) => {
      this.update({
        Position: this.feature.getGeometry()?.getCoordinates()
      });
    })

    this.feature.set("self", this);
    // this.feature.set("name", this.name);
    // this.feature.set("coalition_id", this.coalition_id);
    // this.feature.set("icon", icon(data.Type));
  }

  update(data: { Position?: Coordinate; Heading?: number; }) {
    this.position = data.Position || this.position;
    this.heading = data.Heading || this.heading;
    //this.feature.getGeometry()?.setCoordinates(this.position);
  }
}
