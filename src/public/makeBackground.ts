import { myJigsawFloor } from "./jigsaw";
import * as PIXI from "pixi.js";
import {
  boxDraw,
  containerToSprite,
  svgToSprite,
  textPrepare,
  textureToSprite,
  tileShadow,
} from "./myClasses";
import { makeMaskTilesData, mTile } from "./mTile";

export const makeBackground = async (): Promise<mTile[][]> => {
  // 퍼즐판 배경 및 테두리를 생성하는 함수
  console.log("makeBackground 시작");
  const f = myJigsawFloor[0];
  f.bg2.addChild(f.border);
  const bgd = new PIXI.Sprite();
  bgd.texture = f.bgt; // 원본 이미지로 배경 스프라이트 생성
  bgd.anchor.set(0.5, 0.5);
  bgd.width = f.fSize;
  bgd.height = f.fSize;
  bgd.position.set(f.fSize / 2, f.fSize / 2);
  const margin = (f.tSize * 2) / 7;
  // SVG를 사용하여 퍼즐판 모양의 마스크 생성
  const svgContent = `<rect x="0" y="0" fill="#ffffff" stroke="#000000" stroke-miterlimit="10" 
                width="${f.fSize}" height="${f.fSize}"/>
                <rect x="${margin}" y="${margin}" fill="#000000" stroke="#000000" stroke-miterlimit="10" 
                width="${f.fSize - margin * 2}" height="${
    f.fSize - margin * 2
  }"/>`;
  const svg = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="${f.fSize}px" height="${f.fSize}px" viewBox="0 0 ${f.fSize} ${f.fSize}" 
                enable-background="new 0 0 ${f.fSize} ${f.fSize}" 
                xml:space="preserve">${svgContent}</svg>`;
  const s = await svgToSprite(svg, f.fSize);
  s.position.set(f.fSize / 2, f.fSize / 2);
  bgd.mask = s;
  f.border.addChild(s, bgd);

  f.border.zIndex = 3;
  // 퍼즐판 그림자 생성
  const c2 = new PIXI.Container();
  const b_v1 = boxDraw(
    0x000000,
    0,
    0,
    (f.tSize * 2) / 7 - f.shadowMargin,
    f.fSize - f.shadowMargin
  );
  const b_v2 = boxDraw(
    0x000000,
    f.fSize - (f.tSize * 2) / 7 + f.shadowMargin,
    f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin,
    f.fSize - f.shadowMargin * 2
  );
  const b_h1 = boxDraw(
    0x000000,
    0,
    0,
    f.fSize - f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin
  );
  const b_h2 = boxDraw(
    0x000000,
    0,
    f.fSize - (f.tSize * 2) / 7 + f.shadowMargin,
    f.fSize - f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin
  );
  c2.addChild(b_v1, b_v2, b_h1, b_h2);
  // f.bg2.addChild(c2);
  c2.zIndex = 0;
  let b_s = containerToSprite(c2, true);
  b_s = tileShadow(b_s);
  // download_sprite_as_png(f.renderer, b_s, String(f.tNum) + "b.png")
  b_s.position.set(f.shadowMargin, f.shadowMargin);
  b_s.zIndex = 0;
  // 로딩 텍스트 생성
  const fontsize = f.mobileNow ? f.fSize / 80 : f.fSize / 40;
  const loading = textPrepare("Loading", 0x000000, fontsize, 0, 0, true);
  loading.position.set(f.fSize / 2, f.fSize / 2);
  loading.zIndex = -1;
  f.bg0.addChild(loading);
  f.bg2.addChild(b_s);
  // f.bg2.removeChild(c2);
  c2.destroy({ children: true });

  const mTileData = await makeMaskTilesData(f.tNum, 6, f.p); // 퍼즐 조각 모양 데이터 생성

  const allPromises = mTileData.flatMap((data) =>
    data.map(async (tileData) => {
      const s = textureToSprite(tileData.blank as PIXI.Texture, f.tSize);
      tileData.x_p = f.tSize / 2 + ((f.tSize * 5) / 7) * tileData.x; // 타일의 최종 위치 계산
      tileData.y_p = f.tSize / 2 + ((f.tSize * 5) / 7) * tileData.y;
      s.position.set(tileData.x_p, tileData.y_p);
      f.bg1.addChild(s);
    })
  );
  await Promise.all(allPromises);

  return mTileData;
};
