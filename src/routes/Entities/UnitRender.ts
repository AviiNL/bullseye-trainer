import { Geometry, Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Collection, Feature, Map as olMap } from "ol";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import Unit from "./Unit";
import { icon as get_icon } from "../icon";
import type { StyleLike } from "ol/style/Style";
import { toRadians } from "ol/math";
import { Modify, Select } from "ol/interaction";
import type { FeatureLike } from "ol/Feature";

const icon = (feature: Feature, color: string | { r: number; g: number; b: number; } | null) => {
  const unit = feature.get("self");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const size = 32;

  const icon_canvas = get_icon(unit, color);

  canvas.width = size;
  canvas.height = size;

  if (!icon_canvas) {
    // ctx.fillStyle = color;
    // ctx.strokeStyle = "#fff";
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.stroke();

    return canvas;
  }

  // apply rotation based on unit.heading in rads
  ctx.translate(size / 2, size / 2);
  if (!unit.is_player) {
    ctx.rotate(toRadians(unit.heading));
  }
  ctx.translate(-size / 2, -size / 2);

  // apply icon to canvas, where icon is another canvas
  ctx.drawImage(icon_canvas, 0, 0, size, size);

  return canvas;
};

export default class extends Map<string, Unit> {
  public readonly layer: VectorLayer<VectorSource<Feature<Point>>>;

  private selected: string | null = null;

  private readonly style = (feature: Feature) => {
    let unit = feature.get("self");

    let color = "#ffffff";

    switch (unit.coalition_id) {
      case 0:
        // neutral? white!
        color = "#ffffff";
        break;
      case 1:
        color = "#ff8080";
        break;
      case 2:
        color = "#7fdfff";
        break;
      default:
        color = "#df7fff";
    }

    if (this.selected === unit.name) {
      color = "#ffff00";
    }

    const canvas = icon(feature, color);

    return new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        scale: 1,
        img: canvas,
        // imgSize: [canvas.width, canvas.height], // this inferred from canvas now?
      }),
    });
  };

  constructor() {
    super();
    this.layer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
      style: this.style as StyleLike,
      declutter: false,
      className: "unit-layer",
    });
  }

  public addTo(map: olMap) {

    let collection = new Collection<Feature<Geometry>>();
    let selected: any = null;
    map.on("moveend", () => {
      collection.clear();
      selected = null;
    });

    map.on('pointermove', (e) => {
      map.forEachFeatureAtPixel(e.pixel, (f: FeatureLike) => {
        if (collection.getLength() == 0) {
          collection.push(f as Feature<Geometry>);
          selected = f;
        }
        return true;
      }, {
        layerFilter: (layer) => {
          return layer === this.layer;
        }
      });
    });

    var modify = new Modify({
      features: collection,
    });

    map.addInteraction(modify);

    map.addLayer(this.layer);
  }

  public setZIndex(zIndex: number) {
    this.layer.setZIndex(zIndex);
  }

  public clear() {
    this.layer.getSource()?.clear();
    super.clear();
  }

  public delete(key: string) {
    const unit = super.get(key);
    if (unit) {
      this.layer.getSource()?.removeFeature(unit.feature);
    }
    return super.delete(key);
  }

  public add(unit: Unit) {
    this.layer.getSource()?.addFeature(unit.feature);

    // return super.set(unit, unit);
  }

  public select(key: string) {
    this.selected = key;
    // update the style
    this.layer.setStyle(this.style as StyleLike);
    this.layer.getSource()?.changed();
  }

  public deselect() {
    this.selected = null;
    // update the style
    this.layer.setStyle(this.style as StyleLike);
    this.layer.getSource()?.changed();
  }

  public get_selected() {
    return this.selected;
  }
}
