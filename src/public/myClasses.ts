import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Renderer,
  Texture,
  Assets,
  FederatedPointerEvent,
} from "pixi.js";

/* =======================
   Key Codes
======================= */
export const UP = 38;
export const DOWN = 40;
export const LEFT = 37;
export const RIGHT = 39;
export const ENTER = 13;

/* =======================
   Simple Class
======================= */
export class MyWin {
  value: string = "ddd";
  con = () => console.log("it my new import exam");
}

/* =======================
   Interfaces
======================= */
export interface myReturn {
  renderer: Renderer;
  mc: Container;
  fSize: number;
  fSize_h: number;
}

/* =======================
   Utils
======================= */
export const mobileNow = () => {
  const filter = "win16|win32|win64|mac|macintel";
  if (navigator.platform) {
    if (filter.indexOf(navigator.platform.toLowerCase()) < 0) {
      return true;
    }
  }
  console.log(document.title);
  return false;
};

/* =======================
   makeFloor (function)
======================= */
export const makeFloor = async () => {
  const app = new Application();
  await app.init({
    antialias: true,
    backgroundColor: 0xffffff,
    autoDensity: true,
  });

  app.canvas.style.position = "absolute";
  app.canvas.style.display = "block";
  document.body.appendChild(app.canvas);

  let fSize = 0;
  if (window.innerWidth + window.innerWidth / 4 < window.innerHeight) {
    fSize = window.innerWidth - 15;
  } else {
    fSize = window.innerHeight - window.innerHeight / 4 - 30;
  }

  const h_margin = fSize / 3;
  const fSize_h = fSize + h_margin;

  app.renderer.resize(fSize, fSize_h);

  const mc = new Container();
  app.stage.addChild(mc);

  return {
    renderer: app.renderer,
    mc,
    fSize,
    fSize_h,
  } as myReturn;
};

/* =======================
   MakeFloor (class)
======================= */
export class MakeFloor {
  floor: Application;
  mainContainer: Container;
  fSize: number;
  y_margin: number;
  fSize_h: number;

  constructor(color: number) {
    this.floor = new Application();
    this.floor.init({
      antialias: true,
      backgroundColor: color,
      autoDensity: true,
    });

    this.floor.canvas.style.position = "absolute";
    this.floor.canvas.style.display = "block";
    document.body.appendChild(this.floor.canvas);

    if (window.innerWidth + window.innerWidth / 4 < window.innerHeight) {
      this.fSize = window.innerWidth - 15;
    } else {
      this.fSize = window.innerHeight - window.innerHeight / 4 - 30;
    }

    this.y_margin = this.fSize / 3;
    this.fSize_h = this.fSize + this.y_margin;

    this.floor.renderer.resize(this.fSize, this.fSize_h);

    this.mainContainer = new Container();
    this.mainContainer.sortableChildren = true;
    this.floor.stage.addChild(this.mainContainer);
  }

  textPrepare = (
    text: string,
    color: number,
    font_size: number,
    x: number,
    y: number,
    center: boolean = true
  ) => {
    const style = new TextStyle({
      fontFamily: "Arial",
      fontSize: (this.fSize * font_size) / 100,
      fill: color,
      stroke: {
        width: font_size / 50,
        color: color,
      },
    });

    const t = new Text({ text, style });

    if (center) t.anchor.set(0.5);
    t.position.set((this.fSize * x) / 100, (this.fSize_h * y) / 100);

    return t;
  };

  add = (s: any) => {
    s.width = this.fSize / 2;
    s.height = s.width;
    s.x = this.fSize / 2;
    s.y = this.fSize_h / 2;
    this.mainContainer.addChild(s);
  };
}

/* =======================
   SVG → Sprite
======================= */
// export const svgToSprite = (
//   svg: string,
//   width: number = -1,
//   height: number = width
// ) => {
//   const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
//   const texture = Texture.from(encoded);
//   const sprite = new Sprite(texture);

//   if (width !== -1) {
//     sprite.width = width;
//     sprite.height = height;
//   }

//   sprite.anchor.set(0.5);
//   return sprite;
// };

// const svgCache = new Map<string, Texture>();

export const svgToSprite = async (
  svg: string,
  width: number = -1,
  height: number = width
): Promise<Sprite> => {
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const texture = await Assets.load<Texture>(encoded);

  const sprite = new Sprite(texture);

  if (width !== -1) {
    sprite.width = width;
    sprite.height = height;
  }

  sprite.anchor.set(0.5);

  return sprite;
};

/* =======================
   Graphics
======================= */
export const boxDraw = (
  color: number,
  x: number,
  y: number,
  w: number,
  h: number = w
) => {
  const g = new Graphics();
  g.rect(x, y, w, h);
  g.fill(color);
  g.stroke({ width: 4, color });
  return g;
};

export const boxButtonDraw = (
  f: Function,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number = w
) => {
  const b = boxDraw(color, x, y, w, h);
  b.interactive = true;
  b.cursor = "pointer";
  b.on("pointerdown", () => f());
  return b;
};

/* =======================
   Download Sprite
======================= */
export const download_sprite_as_png = async (
  renderer: Renderer,
  s: Sprite,
  fileName: string
) => {
  const image = await renderer.extract.image(s);
  const a = document.createElement("a");
  a.download = fileName;
  a.href = image.src;
  a.click();
};

/* =======================
   Download Multiple
======================= */
export const downloadImages = (renderer: Renderer, ss: Sprite[]) => {
  let count = 0;
  const total = ss.length;

  return async () => {
    if (count < total) {
      const end = Math.min(count + 10, total);
      for (let i = count; i < end; i++) {
        await download_sprite_as_png(renderer, ss[i], `${i}.png`);
      }
      count += 10;
    }
  };
};

/* =======================
   Math
======================= */
export const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

/* =======================
   Cookie
======================= */
export const cookieWrite = (data: { [key: string]: string }) => {
  const date = new Date();
  date.setDate(date.getDate() + 2700);
  for (const key in data) {
    document.cookie = `${key}=${data[key]};expires=${date.toUTCString()}`;
  }
};

export const cookieRead = () => {
  const cookies = document.cookie.split(";");
  const data: { [key: string]: string } = {};
  cookies.forEach((cookie) => {
    const [k, v] = cookie.trim().split("=");
    data[k] = v;
  });
  return data;
};

/* =======================
   Drag & Mouse
======================= */
export const moveByMouse = (
  c: Container | Sprite | Graphics,
  width: number,
  height: number = width
) => {
  let dragging = false;
  let data: FederatedPointerEvent | null = null;

  c.interactive = true;
  c.cursor = "pointer";

  c.on("pointerdown", (e) => {
    data = e;
    dragging = true;
    c.alpha = 0.7;
  });

  c.on("pointerup", () => {
    dragging = false;
    data = null;
    c.alpha = 1;
  });

  c.on("pointerupoutside", () => {
    dragging = false;
    data = null;
    c.alpha = 1;
  });

  c.on("pointermove", () => {
    if (!dragging || !data) return;
    const pos = data.getLocalPosition(c.parent as Container);
    c.x = Math.max(0, Math.min(width, pos.x));
    c.y = Math.max(0, Math.min(height, pos.y));
  });
};

/* =======================
   Mouse Swipe
======================= */
export const mouseSwift = (t: any, func: Function) => {
  let px = 0,
    py = 0,
    ux = 0,
    uy = 0;

  const direction = () => {
    if (Math.abs(px - ux) > Math.abs(py - uy)) {
      return px > ux ? LEFT : RIGHT;
    } else {
      return py > uy ? UP : DOWN;
    }
  };

  t.interactive = true;
  t.cursor = "pointer";

  t.on("pointerdown", (e: FederatedPointerEvent) => {
    px = e.global.x;
    py = e.global.y;
  });

  t.on("pointerup", (e: FederatedPointerEvent) => {
    ux = e.global.x;
    uy = e.global.y;
    func(direction());
  });
};
