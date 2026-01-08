import { myJigsawFloor } from "./jigsaw";
import * as PIXI from "pixi.js";
import {
  boxDraw,
  containerToSprite,
  svgToSprite,
  textPrepare,
  textureToSprite,
  tileShadow,
} from "./utils";
import { makeMaskTilesData, mTile } from "./mTile";

/**
 * @function makeBackground
 * @description 퍼즐판의 배경 및 테두리, 그림자 등을 생성하고 초기 빈 퍼즐 조각 공간을 설정하는 비동기 함수입니다.
 * @returns {Promise<mTile[][]>} 생성된 mTile 데이터 배열을 Promise로 반환합니다.
 */
export const makeBackground = async (): Promise<mTile[][]> => {
  console.log("makeBackground 시작");
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스에 접근

  // bg2 컨테이너에 border 컨테이너를 추가합니다.
  f.bg2.addChild(f.border);

  // 원본 이미지를 사용하여 배경 스프라이트를 생성하고, 퍼즐판 크기에 맞춰 설정합니다.
  const bgd = new PIXI.Sprite();
  bgd.texture = f.bgt; // 원본 이미지 텍스처를 할당
  bgd.anchor.set(0.5, 0.5); // 앵커 포인트를 중앙으로 설정
  bgd.width = f.fSize; // 너비 설정
  bgd.height = f.fSize; // 높이 설정
  bgd.position.set(f.fSize / 2, f.fSize / 2); // 위치를 중앙으로 설정

  const margin = (f.tSize * 2) / 7; // 퍼즐판 테두리의 마진 계산

  // SVG를 사용하여 퍼즐판 모양의 마스크를 생성합니다.
  // 이 SVG는 흰색 사각형 안에 검은색 사각형을 뚫는 형태로, 퍼즐판의 안쪽 영역을 마스킹합니다.
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
  const s = await svgToSprite(svg, f.fSize); // SVG를 스프라이트로 변환
  s.position.set(f.fSize / 2, f.fSize / 2); // 마스크 스프라이트 위치 설정
  bgd.mask = s; // 배경 이미지에 SVG 마스크 적용
  f.border.addChild(s, bgd); // 마스크와 배경 이미지를 border 컨테이너에 추가

  f.border.zIndex = 3; // border 컨테이너의 zIndex 설정

  // 퍼즐판 그림자 생성
  const c2 = new PIXI.Container(); // 그림자 요소를 담을 임시 컨테이너

  // 퍼즐판 경계선 주위에 그림자 효과를 위한 검은색 박스들을 그립니다.
  // 상, 하, 좌, 우 네 방향에 걸쳐 그림자 역할을 할 박스 스프라이트를 만듭니다.
  const b_v1 = boxDraw(
    0x000000,
    0,
    0,
    (f.tSize * 2) / 7 - f.shadowMargin,
    f.fSize - f.shadowMargin
  ); // 왼쪽 그림자
  const b_v2 = boxDraw(
    0x000000,
    f.fSize - (f.tSize * 2) / 7 + f.shadowMargin,
    f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin,
    f.fSize - f.shadowMargin * 2
  ); // 오른쪽 그림자
  const b_h1 = boxDraw(
    0x000000,
    0,
    0,
    f.fSize - f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin
  ); // 위쪽 그림자
  const b_h2 = boxDraw(
    0x000000,
    0,
    f.fSize - (f.tSize * 2) / 7 + f.shadowMargin,
    f.fSize - f.shadowMargin,
    (f.tSize * 2) / 7 - f.shadowMargin
  ); // 아래쪽 그림자
  c2.addChild(b_v1, b_v2, b_h1, b_h2); // 모든 그림자 박스를 임시 컨테이너에 추가

  c2.zIndex = 0; // 임시 컨테이너의 zIndex 설정
  let b_s = containerToSprite(c2, true); // 임시 컨테이너의 내용을 하나의 스프라이트로 변환하고 원본 파괴
  b_s = tileShadow(b_s); // 그림자 스프라이트에 블러 효과 적용
  // download_sprite_as_png(f.renderer, b_s, String(f.tNum) + "b.png") // 디버깅용으로 주석 처리됨
  b_s.position.set(f.shadowMargin, f.shadowMargin); // 그림자 위치 조정
  b_s.zIndex = 0; // 최종 그림자 스프라이트의 zIndex 설정

  // 로딩 텍스트 생성 및 화면 중앙에 배치
  const fontsize = f.mobileNow ? f.fSize / 80 : f.fSize / 40; // 모바일 여부에 따라 폰트 크기 조절
  const loading = textPrepare("Loading", 0x000000, fontsize, 0, 0, true);
  loading.position.set(f.fSize / 2, f.fSize / 2); // 텍스트 위치 중앙으로 설정
  loading.zIndex = -1; // 로딩 텍스트가 다른 요소들 위에 표시되도록 zIndex 설정 (음수는 뒤에 표시됨)
  f.bg0.addChild(loading); // bg0 컨테이너에 로딩 텍스트 추가
  f.bg2.addChild(b_s); // bg2 컨테이너에 그림자 스프라이트 추가

  c2.destroy({ children: true }); // 임시 컨테이너 파괴 (이미 스프라이트로 변환되었으므로)

  // 퍼즐 조각들의 마스크 데이터를 생성합니다.
  const mTileData = await makeMaskTilesData(f.tNum, 6, f.p);

  return mTileData; // 생성된 mTile 데이터를 반환합니다.
};
