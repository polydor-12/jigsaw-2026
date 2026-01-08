import * as PIXI from "pixi.js";
import { svgToTexture, textureToSprite } from "./utils";
import { myJigsawFloor } from "./jigsaw";
import { getTile } from "./pTile";

/**
 * @interface mTile
 * @description 퍼즐 조각의 모양(mask)과 상태 정보를 담는 인터페이스입니다.
 * 각 퍼즐 조각은 이 구조체에 따라 SVG 기반의 텍스처를 생성하게 됩니다.
 */
export interface mTile {
  /** @member {PIXI.Texture | null} blank - 퍼즐판의 빈 공간을 채우는 텍스처입니다. 조각이 맞춰지기 전의 배경 모양입니다. */
  blank: PIXI.Texture | null;
  /** @member {PIXI.Texture | null} image - 실제 이미지에 적용될 마스크 텍스처입니다. 이 모양대로 이미지가 잘리게 됩니다. */
  image: PIXI.Texture | null;
  /** @member {PIXI.Texture | null} border - 퍼즐 조각의 테두리를 그리는 텍스처입니다. */
  border: PIXI.Texture | null;
  /** @member {number} x - 퍼즐판 내에서의 가로(x) 인덱스 좌표입니다. (0부터 시작) */
  x: number;
  /** @member {number} y - 퍼즐판 내에서의 세로(y) 인덱스 좌표입니다. (0부터 시작) */
  y: number;
  /** @member {number} up - 위쪽 면의 돌기 모양을 나타내는 ID입니다. 0은 평평한 면을 의미합니다. */
  up: number;
  /** @member {number} down - 아래쪽 면의 돌기 모양을 나타내는 ID입니다. 0은 평평한 면을 의미합니다. */
  down: number;
  /** @member {number} left - 왼쪽 면의 돌기 모양을 나타내는 ID입니다. 0은 평평한 면을 의미합니다. */
  left: number;
  /** @member {number} right - 오른쪽 면의 돌기 모양을 나타내는 ID입니다. 0은 평평한 면을 의미합니다. */
  right: number;
  /** @member {number} x_p - 퍼즐판 위에서 조각이 완성될 때의 실제 x 픽셀 좌표입니다. */
  x_p: number;
  /** @member {number} y_p - 퍼즐판 위에서 조각이 완성될 때의 실제 y 픽셀 좌표입니다. */
  y_p: number;
  /** @member {boolean} done - 해당 조각이 이미 완성되었는지 여부를 나타냅니다. (예: 쿠키 정보로 복원될 때 사용) */
  done: boolean;
}

/**
 * @function makeMaskTilesData
 * @description 전체 퍼즐 조각들의 모양(돌기)과 초기 상태 데이터를 생성합니다.
 * @param {number} tNum - 가로/세로에 들어갈 퍼즐 조각의 개수입니다.
 * @param {number} rNum - 사용 가능한 돌기 모양의 총 개수입니다.
 * @param {number[][]} p - 이전에 완성된 퍼즐 조각들의 좌표 배열입니다. (쿠키 등에서 불러옴)
 * @returns {Promise<mTile[][]>} - 생성된 mTile 2차원 배열을 Promise로 반환합니다.
 */
export const makeMaskTilesData = async (
  tNum: number,
  rNum: number,
  p: number[][]
): Promise<mTile[][]> => {
  // 최종적으로 반환될 2차원 mTile 배열을 초기화합니다.
  const tiles: mTile[][] = [];

  // 1. 빈 타일 데이터 구조 생성: 모든 조각을 기본값으로 초기화합니다.
  for (let y = 0; y < tNum; y++) {
    const xt: mTile[] = [];
    for (let x = 0; x < tNum; x++) {
      const mT: mTile = {
        blank: null,
        image: null,
        border: null,
        x: x,
        y: y,
        up: 0,
        down: 0,
        left: 0,
        right: 0,
        x_p: 0,
        y_p: 0,
        done: false,
      };
      xt.push(mT);
    }
    tiles.push(xt);
  }

  // 2. 각 타일의 상하좌우 돌기 모양 랜덤하게 지정
  // 퍼즐 조각들이 서로 맞물리도록 인접한 조각의 모양을 이어받습니다.
  for (let y = 0; y < tNum; y++) {
    for (let x = 0; x < tNum; x++) {
      // 위쪽(up): 맨 윗줄이 아니면, 바로 위 타일의 아래쪽(down) 모양을 그대로 이어받습니다.
      const u = y == 0 ? 0 : tiles[x][y - 1].down;
      // 아래쪽(down): 맨 아랫줄이면 0(평평함), 아니면 랜덤한 돌기 모양을 생성합니다.
      const d = y == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1;
      // 왼쪽(left): 맨 왼쪽 줄이 아니면, 바로 왼쪽 타일의 오른쪽(right) 모양을 그대로 이어받습니다.
      const l = x == 0 ? 0 : tiles[x - 1][y].right;
      // 오른쪽(right): 맨 오른쪽 줄이면 0(평평함), 아니면 랜덤한 돌기 모양을 생성합니다.
      const r = x == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1;
      tiles[x][y] = {
        blank: null,
        image: null,
        border: null,
        x: x,
        y: y,
        up: u,
        down: d,
        left: l,
        right: r,
        x_p: 0,
        y_p: 0,
        done: false,
      };
    }
  }

  // 3. 쿠키에 저장된 완성된 타일 정보 반영
  // 이전에 사용자가 맞춘 조각들의 `done` 상태를 true로 설정합니다.
  p.forEach((xy: number[]) => {
    tiles[xy[0]][xy[1]].done = true;
  });

  // 모든 타일 데이터에 대해 SVG 텍스처를 비동기적으로 생성합니다.
  await getSvgTileAllTexture(tiles);
  return tiles;
};

/**
 * @function getSvgTileAllTexture
 * @description mTile 데이터 배열을 받아 모든 타일의 SVG 텍스처를 비동기적으로 생성하고 적용합니다.
 * @param {mTile[][]} mTileData - 텍스처를 생성할 mTile 2차원 배열입니다.
 */
export const getSvgTileAllTexture = async (mTileData: mTile[][]) => {
  // 모든 타일에 대한 텍스처 생성 Promise 배열을 만듭니다.
  const allPromises = mTileData.flatMap((data) =>
    data.map(async (tileData) => {
      await getSvgTileTexture(tileData);
    })
  );
  // 모든 Promise가 완료될 때까지 기다립니다.
  await Promise.all(allPromises);
  console.log("promise all : All tile textures are generated.");
};

/**
 * @interface SvgData
 * @description SVG 문자열을 생성하는 데 필요한 스타일과 데이터를 정의하는 인터페이스입니다.
 */
interface SvgData {
  fill_color: string; // SVG path의 채우기 색상
  stroke_width: string; // SVG path의 테두리 두께
  stroke_color: string; // SVG path의 테두리 색상
  block_color: string; // SVG에서 마스킹될(잘려나갈) 부분의 색상
  svgContent_front: string; // 돌기 모양(path)들이 추가될 SVG 앞부분 문자열
  svgContent_end: string; // 직선 라인(rect)들이 추가될 SVG 뒷부분 문자열
  prop: PIXI.Texture<PIXI.TextureSource<any>> | null; // 현재 생성 중인 텍스처 종류 (blank, image, border)
}

/**
 * @function getSvgTileTexture
 * @description 단일 mTile 데이터로부터 3가지 종류(blank, image, border)의 SVG 마스크 텍스처를 생성합니다.
 * @param {mTile} tile - 텍스처를 생성할 대상 mTile 객체입니다.
 */
const svgData: SvgData = {
  fill_color: "",
  stroke_width: "",
  stroke_color: "",
  block_color: "",
  svgContent_front: "",
  svgContent_end: "",
  prop: null,
};

const svgDataToInputFunction: Function[] = [
  // Case 0: 퍼즐판의 빈 공간(blank) 모양
  (tile: mTile) => {
    svgData.fill_color = "#d9e6f2";
    svgData.stroke_width = 'stroke-width="5"';
    svgData.stroke_color = "#d9e6f2";
    svgData.block_color = "#000000"; // 검은색 영역이 마스킹됩니다.
    svgData.prop = tile.blank;
  },
  // Case 1: 퍼즐 조각 이미지(image)의 마스크
  (tile: mTile) => {
    svgData.fill_color = "#ffffff";
    svgData.stroke_width = 'stroke-width="8"';
    svgData.stroke_color = "#ffffff";
    svgData.block_color = "#000000";
    svgData.prop = tile.image;
  },
  // Case 2: 퍼즐 조각 테두리(border)의 마스크
  (tile: mTile) => {
    svgData.fill_color = "#ffffff";
    svgData.stroke_width = 'stroke-width="1"';
    svgData.stroke_color = "#ffffff";
    svgData.block_color = "#000000";
    svgData.prop = tile.border;
  },
];

const props = [
  (tile: mTile, texture: PIXI.Texture) => {
    tile.blank = texture;
  },
  (tile: mTile, texture: PIXI.Texture) => {
    tile.image = texture;
  },
  (tile: mTile, texture: PIXI.Texture) => {
    tile.border = texture;
  },
];
export const getSvgTileTexture = async (tile: mTile) => {
  // 3가지 종류의 텍스처(blank, image, border)를 생성하기 위해 3번 반복합니다.

  for (let sw = 0; sw < 3; sw++) {
    svgData.svgContent_front = "";
    svgData.svgContent_end = "";
    svgDataToInputFunction[sw](tile);

    // sw 값에 따라 생성할 텍스처의 스타일(색상, 두께 등)을 결정합니다.

    // tile 데이터의 up, down, left, right 값(돌기 ID)에 따라 SVG path를 조합합니다.
    const direction = [tile.up, tile.down, tile.left, tile.right];
    for (let i = 0; i < direction.length; i++) {
      if (direction[i] != 0) {
        // 돌기가 있는 경우(ID가 0이 아님), 해당 방향과 ID에 맞는 SVG path 데이터를 추가합니다.
        svgData.svgContent_front +=
          svgPathFront(svgData) + svgLineData(svgData)[i][direction[i]] + `/>`;
      } else {
        // 돌기가 없는 경우(직선), 해당 방향에 맞는 rect(사각형) 데이터를 추가하여 테두리를 막습니다.
        svgData.svgContent_end += svgLineData(svgData)[i][direction[i]];
      }
    }
    // 최종적으로 조합된 SVG 문자열을 PIXI.Texture로 변환합니다.
    const texture = await svgToTexture(svg(svgData));
    // 생성된 텍스처를 mTile 객체의 적절한 속성에 할당합니다.

    props[sw](tile, texture);
  }
  const f = myJigsawFloor[0];
  const s = textureToSprite(tile.blank as PIXI.Texture, f.tSize);
  // 타일의 최종 완성 위치 (픽셀 좌표)를 계산합니다.
  tile.x_p = f.tSize / 2 + ((f.tSize * 5) / 7) * tile.x;
  tile.y_p = f.tSize / 2 + ((f.tSize * 5) / 7) * tile.y;
  s.position.set(tile.x_p, tile.y_p); // 스프라이트 위치 설정
  f.bg1.addChild(s); // bg1 컨테이너에 빈 조각 스프라이트 추가

  getTile(tile);
};

/**
 * @function svgPathFront
 * @description SVG의 <path> 태그 시작 부분을 생성하는 헬퍼 함수입니다.
 * @param {SvgData} svgData - SVG 스타일 데이터.
 * @returns {string} - SVG <path> 태그의 앞부분 문자열.
 */
const svgPathFront = (svgData: SvgData) =>
  `<path fill="${svgData.fill_color}" stroke="#000000" ${svgData.stroke_width} stroke-miterlimit="10" d=`;

/**
 * @function svg
 * @description 최종 SVG 문자열을 완성하는 헬퍼 함수입니다.
 * @param {SvgData} svgData - SVG path와 스타일 데이터가 포함된 객체.
 * @returns {string} - 완전한 SVG 마스크 문자열.
 */
const svg = (
  svgData: SvgData
) => `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="504px" height="504px" viewBox="0 0 504 504" enable-background="new 0 0 504 504" xml:space="preserve">       
                ${svgData.svgContent_front} <polygon fill="${svgData.fill_color}" stroke="${svgData.stroke_color}" stroke-miterlimit="10" points="71.25,72.5 134.5,144 134.5,360 72,432.25 144,369.5 
                360,369.5 431.75,432 368.5,360 368.5,144 432,72.25 360,135.5 144,135.5 "/>  ${svgData.svgContent_end} </svg>`;

/**
 * @function svgLineData
 * @description 각 방향(상, 하, 좌, 우)과 돌기 ID에 따른 SVG path 데이터 또는 rect 데이터를 반환하는 헬퍼 함수입니다.
 * @param {SvgData} svgData - SVG 스타일 데이터 (주로 block_color 사용).
 * @returns {string[][]} - [방향][돌기ID]에 해당하는 SVG 문자열을 담은 2차원 배열.
 */
const svgLineData = (svgData: SvgData): string[][] => [
  // 0: up (위쪽)
  [
    // 0: 평평한 면 (돌기 없음) - 위쪽 영역을 사각형으로 막습니다.
    `<rect x="0" fill="${svgData.block_color}" stroke="${svgData.block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
    // 1~5: 다양한 모양의 위쪽 돌기 SVG path 데이터
    `"M432,72.371c0,9.121-72,35.754-108,35.754
                    s9-90.063-81-90.063c-99.001,0-18,107.969-63,107.969S72,72.596,72,72.596L144,144.5h216L432,72.371z"`,
    `"M432,71.92c0,0-63-53.795-108-53.795
                    s36,107.938-63,107.938c-90,0-45-90.031-81-90.031S72,63.023,72,72.145l72,72.355h216L432,71.92z"`,
    `"M432,72.371c0,9.121-63,44.754-90,35.754
                    c-34.152-11.384,45-90.063-45-90.063c-225,0-59.806,107.969-126,107.969c-45,0-99-53.436-99-53.436l72,71.904h216L432,72.371z"`,
    `"M432,71.92c0,0-54-53.795-99-53.795
                    c-66.194,0,99,107.938-126,107.938c-90,0-10.848-78.646-45-90.031c-27-9-90,26.992-90,36.113l72,72.355h216L432,71.92z"`,
    `"M432,72.371c-45-18.121-81,8.754-117,35.754
                    c-28.8,21.6,90-90.063-54-90.063c-117,0-36,107.969-81,107.969S72,72.596,72,72.596l72,71.904h216L432,72.371z"`,
  ],
  // 1: down (아래쪽)
  [
    // 0: 평평한 면 - 아래쪽 영역을 사각형으로 막습니다.
    `<rect y="360" fill="${svgData.block_color}" stroke="${svgData.block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
    // 1~5: 다양한 모양의 아래쪽 돌기 SVG path 데이터
    `"M432,432.371c0,9.121-72,35.754-108,35.754
                    s9-90.063-81-90.063c-99.001,0-18,107.969-63,107.969S72,432.596,72,432.596L144,360.5h216L432,432.371z"`,
    `"M432,431.92c0,0-63-53.795-108-53.795
                    s36,107.938-63,107.938c-90,0-45-90.031-81-90.031S72,423.023,72,432.145l72-71.645h216L432,431.92z"`,
    `"M432,432.371c0,9.121-63,44.754-90,35.754
                    c-34.152-11.385,45-90.063-45-90.063c-225,0-59.806,107.969-126,107.969c-45,0-99-53.436-99-53.436l72-72.096h216L432,432.371z"`,
    `"M432,431.92c0,0-54-53.795-99-53.795
                    c-66.194,0,99,107.938-126,107.938c-90,0-10.848-78.646-45-90.031c-27-9-90,26.992-90,36.113l72-71.645h216L432,431.92z"`,
    `"M432,432.371c-45-18.121-81,8.754-117,35.754
                    c-28.8,21.6,90-90.063-54-90.063c-117,0-36,107.969-81,107.969S72,432.596,72,432.596l72-72.096h216L432,432.371z"`,
  ],
  // 2: left (왼쪽)
  [
    // 0: 평평한 면 - 왼쪽 영역을 사각형으로 막습니다.
    `<rect x="0" fill="${svgData.block_color}" stroke="${svgData.block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
    // 1~5: 다양한 모양의 왼쪽 돌기 SVG path 데이터
    `"M72.08,432c0,0,53.795-63,53.795-108
                    S17.938,360,17.938,261c0-90,90.031-45,90.031-81S80.977,72,71.856,72l71.644,72v216L72.08,432z"`,
    `"M71.629,432c-9.121,0-35.754-72-35.754-108
                    s90.063,9,90.063-81c0-99-107.969-18-107.969-63S71.405,72,71.405,72l72.095,72v216L71.629,432z"`,
    `"M72.08,432c0,0,53.795-54,53.795-99
                    c0-66.194-107.938,99-107.938-126c0-90,78.646-10.848,90.031-45c9-27-26.992-90-36.113-90l71.644,72v216L72.08,432z"`,
    `"M71.629,432c-9.121,0-44.754-63-35.754-90
                    c11.385-34.152,90.063,45,90.063-45c0-225-107.969-59.806-107.969-126c0-45,53.436-99,53.436-99l72.095,72v216L71.629,432z"`,
    `"M72.08,432c0,0,53.795-63,53.795-108
                    S17.938,360,17.938,243c0-144,111.631-25.2,90.031-54c-27-36-54.234-72-36.113-117l71.644,72v216L72.08,432z"`,
  ],
  // 3: right (오른쪽)
  [
    // 0: 평평한 면 - 오른쪽 영역을 사각형으로 막습니다.
    `<rect x="360" fill="${svgData.block_color}" stroke="${svgData.block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
    // 1~5: 다양한 모양의 오른쪽 돌기 SVG path 데이터
    `"M432.08,432c0,0,53.795-63,53.795-108
                    s-107.938,36-107.938-63c0-90,90.031-45,90.031-81S440.977,72,431.855,72L359.5,144v216L432.08,432z"`,
    `"M431.629,432c-9.121,0-35.754-72-35.754-108
                    s90.063,9,90.063-81c0-99-107.969-18-107.969-63s53.436-108,53.436-108L359.5,144v216L431.629,432z"`,
    `"M432.08,432c0,0,53.795-54,53.795-99
                    c0-66.194-107.938,99-107.938-126c0-90,78.646-10.848,90.031-45c9-27-26.992-90-36.113-90L359.5,144v216L432.08,432z"`,
    `"M431.629,432c-9.121,0-44.754-63-35.754-90
                    c11.385-34.152,90.063,45,90.063-45c0-225-107.969-59.806-107.969-126c0-45,53.436-99,53.436-99L359.5,144v216L431.629,432z"`,
    `"M432.08,432c0,0,53.795-63,53.795-108
                    s-107.938,36-107.938-81c0-144,111.631-25.2,90.031-54c-27-36-54.234-72-36.113-117L359.5,144v216L432.08,432z"`,
  ],
];
