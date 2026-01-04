import * as PIXI from "pixi.js";

/* =======================
   Key Codes
======================= */
export const UP = 38;
export const DOWN = 40;
export const LEFT = 37;
export const RIGHT = 39;
export const ENTER = 13;

/* =======================
   Interfaces
======================= */
export interface myReturn {
  renderer: PIXI.Renderer;
  mc: PIXI.Container;
  fSize: number;
  fSize_h: number;
}

/* =======================
   Utils
======================= */

/**
 * 현재 기기가 모바일인지 확인하는 함수
 * @returns {boolean} 모바일 기기일 경우 true, 데스크톱일 경우 false
 */
export const mobileNow = (): boolean => {
  // 1. User Agent 문자열 확인 (가장 일반적인 방법)
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /android/i,
    /blackberry/i,
    /windows phone/i,
  ];

  const isMobileUA = mobileKeywords.some((keyword) => userAgent.match(keyword));

  // 2. Platform 정보 확인 (기존 로직 보완)
  // 'linux'를 필터에 추가하여 리눅스 데스크톱이 모바일로 분류되는 것 방지
  const platformFilter = "win16|win32|win64|mac|macintel|linux";
  const platform = (navigator.platform || "").toLowerCase();

  let isDesktopPlatform = false;
  if (platform) {
    isDesktopPlatform = platformFilter.indexOf(platform) !== -1;
  }

  // 3. 최종 판별
  // UA가 모바일이면서, 데스크톱 플랫폼이 아닐 때 true 반환
  if (isMobileUA) {
    return true;
  } // 리눅스 민트 등 데스크톱 리눅스는 위 필터에서 걸러지므로 false(데스크톱)를 반환하게 됨
  return false;
};

/* =======================
   makeFloor (function)
======================= */
export const makeFloor = async () => {
  const app = new PIXI.Application();
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

  const mc = new PIXI.Container();
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
// export class MakeFloor {
//   floor: PIXI.Application;
//   mainContainer: PIXI.Container;
//   fSize: number;
//   y_margin: number;
//   fSize_h: number;

//   constructor(color: number) {
//     this.floor = new PIXI.Application();
//     this.floor.init({
//       antialias: true,
//       backgroundColor: color,
//       autoDensity: true,
//     });

//     this.floor.canvas.style.position = "absolute";
//     this.floor.canvas.style.display = "block";
//     document.body.appendChild(this.floor.canvas);

//     if (window.innerWidth + window.innerWidth / 4 < window.innerHeight) {
//       this.fSize = window.innerWidth - 15;
//     } else {
//       this.fSize = window.innerHeight - window.innerHeight / 4 - 30;
//     }

//     this.y_margin = this.fSize / 3;
//     this.fSize_h = this.fSize + this.y_margin;

//     this.floor.renderer.resize(this.fSize, this.fSize_h);

//     this.mainContainer = new PIXI.Container();
//     this.mainContainer.sortableChildren = true;
//     this.floor.stage.addChild(this.mainContainer);
//   }

//   textPrepare = (
//     text: string,
//     color: number,
//     font_size: number,
//     x: number,
//     y: number,
//     center: boolean = true
//   ) => {
//     const style = new PIXI.TextStyle({
//       fontFamily: "Arial",
//       fontSize: (this.fSize * font_size) / 100,
//       fill: color,
//       stroke: {
//         width: font_size / 50,
//         color: color,
//       },
//     });

//     const t = new PIXI.Text({ text, style });

//     if (center) t.anchor.set(0.5);
//     t.position.set((this.fSize * x) / 100, (this.fSize_h * y) / 100);

//     return t;
//   };

//   add = (s: any) => {
//     s.width = this.fSize / 2;
//     s.height = s.width;
//     s.x = this.fSize / 2;
//     s.y = this.fSize_h / 2;
//     this.mainContainer.addChild(s);
//   };
// }

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
): Promise<PIXI.Sprite> => {
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const texture = await PIXI.Assets.load<PIXI.Texture>(encoded);

  const sprite = new PIXI.Sprite(texture);

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
  const g = new PIXI.Graphics();
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
  renderer: PIXI.Renderer,
  s: PIXI.Sprite,
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
export const downloadImages = (renderer: PIXI.Renderer, ss: PIXI.Sprite[]) => {
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
// export const moveByMouse = (
//   c: PIXI.Container | PIXI.Sprite | PIXI.Graphics,
//   width: number,
//   height: number = width
// ) => {
//   let dragging = false;
//   let data: PIXI.FederatedPointerEvent | null = null;

//   c.interactive = true;
//   c.cursor = "pointer";

//   c.on("pointerdown", (e) => {
//     data = e;
//     dragging = true;
//     c.alpha = 0.7;
//   });

//   c.on("pointerup", () => {
//     dragging = false;
//     data = null;
//     c.alpha = 1;
//   });

//   c.on("pointerupoutside", () => {
//     dragging = false;
//     data = null;
//     c.alpha = 1;
//   });

//   c.on("pointermove", () => {
//     if (!dragging || !data) return;
//     const pos = data.getLocalPosition(c.parent as PIXI.Container);
//     c.x = Math.max(0, Math.min(width, pos.x));
//     c.y = Math.max(0, Math.min(height, pos.y));
//   });
// };

/* =======================
   Mouse Swipe
======================= */
// export const mouseSwift = (t: any, func: Function) => {
//   let px = 0,
//     py = 0,
//     ux = 0,
//     uy = 0;

//   const direction = () => {
//     if (Math.abs(px - ux) > Math.abs(py - uy)) {
//       return px > ux ? LEFT : RIGHT;
//     } else {
//       return py > uy ? UP : DOWN;
//     }
//   };

//   t.interactive = true;
//   t.cursor = "pointer";

//   t.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
//     px = e.global.x;
//     py = e.global.y;
//   });

//   t.on("pointerup", (e: PIXI.FederatedPointerEvent) => {
//     ux = e.global.x;
//     uy = e.global.y;
//     func(direction());
//   });
// };
