import * as PIXI from "pixi.js";
import { myJigsawFloor } from "./jigsaw";

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
  app: PIXI.Application;
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
  // document.body.appendChild(app.canvas);

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
    app,
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

export const svgToTexture = async (svg: string): Promise<PIXI.Texture> => {
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const texture = await PIXI.Assets.load<PIXI.Texture>(encoded);
  return texture;
};

export const textureToSprite = (
  texture: PIXI.Texture,
  width: number,
  height = width
) => {
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
  width: number,
  height: number = width,
  alpha: number = 1
) => {
  const b = boxDraw(color, x, y, width, height);
  b.interactive = true;
  b.cursor = "pointer";
  b.on("pointerdown", () => f());
  b.alpha = alpha;
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

export const containerToSprite = (
  c: PIXI.Container,
  remove: boolean = false
) => {
  // PIXI.Container를 PIXI.Sprite로 변환하는 함수 (렌더 텍스처 사용)
  const tex = myJigsawFloor[0]?.renderer.generateTexture({
    target: c, // 렌더링할 대상 (Container, Sprite 등)
    resolution: 1, // 해상도 (기존 인자의 1에 해당)
    antialias: true, // 안티앨리어싱 (선택 사항, 결과물이 더 깔끔해짐)
  });
  // const tex = r.generateTexture(c, 1, 1)
  const combinedSprite = new PIXI.Sprite(tex);
  if (remove) c.destroy({ children: true });
  return combinedSprite;
};

export const containerToSpriteAdd = (
  // 컨테이너를 스프라이트로 변환하고 기존 컨테이너를 제거하는 헬퍼 함수
  c: PIXI.Container,
  cp: PIXI.Container = c.parent as PIXI.Container
) => {
  const s = containerToSprite(c, true);
  s.zIndex = c.zIndex;
  cp.addChild(s);
  cp.removeChild(c);
  return s;
};

export const spriteCombine = (
  // 두 스프라이트를 하나의 텍스처로 합치는 함수 (성능 최적화)
  sb: PIXI.Sprite,
  s: PIXI.Sprite,
  mx: number = 0,
  my: number = 0
) => {
  const nc = new PIXI.Container();
  const sb_c = new PIXI.Sprite();

  sb_c.texture = sb.texture;

  nc.addChild(sb_c, s);
  s.position.set(s.x + mx, s.y + my);

  const t = containerToSprite(nc, true).texture; // 컨테이너를 텍스처로 변환
  return t;
};

export const textureSize = (bgt: PIXI.Texture, size: number) => {
  // 텍스처를 원하는 크기로 리사이즈하는 함수
  const c = new PIXI.Container();
  // this.main.addChild(c);
  const s = new PIXI.Sprite(bgt);
  s.width = size;
  s.height = size;
  c.addChild(s);
  const ns = containerToSprite(c, true);
  // this.main.removeChild(c);
  return ns.texture;
};

export const tileShadow = (sprite: PIXI.Sprite): PIXI.Sprite => {
  // 스프라이트에 블러 필터를 적용하여 그림자 효과를 주는 함수
  sprite.filters = [
    new PIXI.BlurFilter({
      strength: 7,
    }),
  ];
  return sprite;
};

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
