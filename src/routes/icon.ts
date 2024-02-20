import type Unit from "./Entities/Unit";

// pre-load images from /icons/ folder
const static_icons = [
  "P91000024.png",
];

const icons: { [key: string]: string } = {
  "F-16C_50": "P91000024.png",
};

// some icon_cache
const icon_cache = new Map();

const canvas_cache = new Map();

async function preload(): Promise<void> {
  // preload all icons
  await Promise.all(
    static_icons.map((icon) => {
      return new Promise((resolve) => {
        let img = new Image();
        img.src = "/icons/" + icon;
        img.onload = () => {
          icon_cache.set(icon, img);
          resolve(null);
        };
      });
    }),
  );

  console.log("Icons loaded");
}

function hexToRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m: any, r: any, g: any, b: any) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

function imageToCanvas(image: ImageBitmap) {
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  let ctx = c.getContext("2d")!; // attach context to the canvas for eaasy reference
  ctx.drawImage(image, 0, 0);
  return [c, ctx];
}

type c = { r: number; g: number; b: number; };
function set_color([canvas, ctx]: [HTMLCanvasElement, CanvasRenderingContext2D], color: { r: number; g: number; b: number; } | null | string) {
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  const { length } = data;

  if (typeof color == "string" && (color as string).startsWith("#")) {
    color = hexToRgb(color);
  }

  if (color != null) {
    for (let i = 0; i < length; i += 4) { // red, green, blue, and alpha
      const r = data[i + 0];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r === 255 && g === 255 && b === 255 && a === 255) {
        data[i] = (color as c).r;
        data[i + 1] = (color as c).g;
        data[i + 2] = (color as c).b;
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  return [canvas, ctx];
}
// get icon from cache or load it
function icon(unit: Unit, color: string | { r: number; g: number; b: number; } | null) {
  let icon = null;

  if (!(unit.type in icons)) {
    console.error("Unknown icon type: " + unit.type);
    icon = "unknown.png";
  } else {
    icon = icons[unit.type];
  }

  if (canvas_cache.has(`${icon}-${color}`)) {
    return canvas_cache.get(`${icon}-${color}`);
  }

  if (icon_cache.has(icon)) {
    let img = icon_cache.get(icon);

    let [canvas, ctx] = imageToCanvas(img);
    [canvas, ctx] = set_color([canvas, ctx] as [HTMLCanvasElement, CanvasRenderingContext2D], color as string);

    canvas_cache.set(`${icon}-${color}`, canvas);

    return canvas as HTMLCanvasElement;
  }

  return null;
}

export { icon, preload };
