import * as PIXI from "pixi.js";
import { svgToTexture } from "./myClasses";

// 퍼즐 조각의 모양(mask) 정보를 담는 인터페이스
export interface mTile {
  blank: PIXI.Texture | null;
  image: PIXI.Texture | null;
  border: PIXI.Texture | null;
  x: number; // 퍼즐판에서의 x 좌표 (인덱스)
  y: number; // 퍼즐판에서의 y 좌표 (인덱스)
  up: number; // 위쪽 돌기 모양 ID
  down: number; // 아래쪽 돌기 모양 ID
  left: number; // 왼쪽 돌기 모양 ID
  right: number; // 오른쪽 돌기 모양 ID
  x_p: number; // 퍼즐판 위 완성 위치의 x 픽셀 좌표
  y_p: number; // 퍼즐판 위 완성 위치의 y 픽셀 좌표
  done: boolean; // 쿠키 정보에 따라 미리 완성되었는지 여부
}

export const makeMaskTilesData = async (
  tNum: number,
  rNum: number,
  p: number[][]
): Promise<mTile[][]> => {
  // 퍼즐 조각들의 모양 데이터를 생성하는 함수
  const tiles: mTile[][] = []; // 타일 배열 초기화
  // 1. 빈 타일 데이터 구조 생성
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
  for (let y = 0; y < tNum; y++) {
    for (let x = 0; x < tNum; x++) {
      const u = y == 0 ? 0 : tiles[x][y - 1].down; // 위쪽은 이웃한 타일의 아래쪽 돌기 모양을 이어받음
      const d = y == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1; // 아래쪽은 랜덤 생성 (경계선 제외)
      const l = x == 0 ? 0 : tiles[x - 1][y].right; // 왼쪽은 이웃한 타일의 오른쪽 돌기 모양을 이어받음
      const r = x == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1; // 오른쪽은 랜덤 생성 (경계선 제외)
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
  p.forEach((xy: number[]) => {
    // console.log(jigsawPosition, xy);
    // console.log("this.tNum :", tNum);
    tiles[xy[0]][xy[1]].done = true;
  });
  await getSvgTileAllTexture(tiles);
  return tiles;
};

export const getSvgTileAllTexture = async (mTileData: mTile[][]) => {
  const allPromises = mTileData.flatMap((data) =>
    data.map(async (tileData) => {
      await getSvgTileTexture(tileData);
    })
  );
  await Promise.all(allPromises);
  console.log("promise all :");
};

export const getSvgTileTexture = async (tile: mTile) => {
  // mTile 데이터로부터 SVG 마스크를 생성하는 함수
  let fill_color, stroke_width, stroke_color, block_color, prop;
  for (let sw = 0; sw < 3; sw++) {
    switch (
      sw // sw (switch) 값에 따라 스타일(색상, 테두리 두께) 결정
    ) {
      case 0: // 퍼즐판의 빈 공간 모양
        fill_color = "#d9e6f2";
        stroke_width = 'stroke-width="5"';
        stroke_color = "#d9e6f2";
        block_color = "#000000";
        prop = tile.blank;
        break;
      case 1: // 퍼즐 조각 이미지의 마스크
        fill_color = "#ffffff";
        stroke_width = 'stroke-width="8"';
        stroke_color = "#ffffff";
        block_color = "#000000";
        prop = tile.image;
        break;
      case 2: // 퍼즐 조각 테두리의 마스크
        fill_color = "#ffffff";
        stroke_width = 'stroke-width="1"';
        stroke_color = "#ffffff";
        block_color = "#000000";
        prop = tile.border;
        break;
    }
    // 방향별(상,하,좌,우) 돌기 모양 SVG path 데이터
    const mask_data = [
      // up
      [
        `<rect x="0" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
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
      //down
      [
        `<rect y="360" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
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
      // left
      [
        `<rect x="0" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
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
      //right
      [
        `<rect x="360" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
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
    // tile 데이터의 up, down, left, right 값에 따라 SVG path 조합
    const direction = [tile.up, tile.down, tile.left, tile.right];
    const path_f = `<path fill="${fill_color}" stroke="#000000" ${stroke_width} stroke-miterlimit="10" d=`;
    const path_e = `/>`;
    let svgContent_front = "";
    let svgContent_end = "";
    for (let i = 0; i < direction.length; i++) {
      if (direction[i] != 0) {
        // 돌기가 있는 경우
        svgContent_front += path_f + mask_data[i][direction[i]] + path_e;
      } else {
        // 돌기가 없는 경우 (직선)
        svgContent_end += mask_data[i][direction[i]];
      }
    }
    // 최종 SVG 문자열 생성
    const svg = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="504px" height="504px" viewBox="0 0 504 504" enable-background="new 0 0 504 504" xml:space="preserve">       
                ${svgContent_front} <polygon fill="${fill_color}" stroke="${stroke_color}" stroke-miterlimit="10" points="71.25,72.5 134.5,144 134.5,360 72,432.25 144,369.5 
                360,369.5 431.75,432 368.5,360 368.5,144 432,72.25 360,135.5 144,135.5 "/>  ${svgContent_end} </svg>`;
    // SVG를 PIXI 스프라이트로 변환
    const texture = await svgToTexture(svg);
    switch (sw) {
      case 0:
        tile.blank = texture;
        break;
      case 1:
        tile.image = texture;
        break;
      case 2:
        tile.border = texture;
        break;
    }
  }
};
