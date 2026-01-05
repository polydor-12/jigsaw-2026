import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  containerToSprite,
  cookieWrite,
  degreesToRadians,
  LEFT,
  mobileNow,
  myReturn,
  RIGHT,
  spriteCombine,
  svgToSprite,
  textureSize,
} from "./myClasses";
import { jigsawRestart } from "./jigsaw";

// 개별 퍼즐 조각의 정보를 담는 인터페이스
export interface pTile {
  cb: PIXI.Container; // 그림자 효과를 포함한 컨테이너
  cp: PIXI.Container; // 실제 이미지 조각을 담는 컨테이너
  nx: number; // 퍼즐판에서의 x 좌표 (인덱스)
  ny: number; // 퍼즐판에서의 y 좌표 (인덱스)
  ox: number; // 퍼즐판 위 완성 위치의 x 픽셀 좌표
  oy: number; // 퍼즐판 위 완성 위치의 y 픽셀 좌표
  s: PIXI.Sprite; // 최종적으로 화면에 표시될 스프라이트 (이미지 + 그림자)
  sb: PIXI.Sprite; // 그림자 스프라이트
  sp: PIXI.Sprite; // 이미지 스프라이트
  done: boolean; // 완성되었는지 여부
  zIndex: number; // 화면에 표시될 순서
}

// 퍼즐 조각의 모양(mask) 정보를 담는 인터페이스
export interface mTile {
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

export class JigsawFloor {
  main = new PIXI.Container(); // 전체 게임 요소를 담는 최상위 컨테이너
  bg0 = new PIXI.Container(); // 배경 레이어 0 (로딩 텍스트, 완성된 그림자 등)
  bg1 = new PIXI.Container(); // 배경 레이어 1 (퍼즐판의 빈 공간 모양)
  bg2 = new PIXI.Container(); // 배경 레이어 2 (움직이는 퍼즐 조각, 퍼즐판 테두리 등)
  bg3 = new PIXI.Container(); // 배경 레이어 3 (이미지 선택 화면)
  border = new PIXI.Container(); // 퍼즐판의 테두리 컨테이너
  borderSprite = new PIXI.Sprite(); // 완성된 조각들이 합쳐진 퍼즐판 스프라이트
  backgroundSprite = new PIXI.Sprite(); // 완성된 조각들의 그림자가 합쳐진 배경 스프라이트
  fullPicture: PIXI.Texture; // 원본 이미지 텍스처
  selectMode = false; // 이미지 선택 모드 활성화 여부
  bgt: PIXI.Texture; // 배경 텍스처 (리사이즈된)
  bgtOriginal: PIXI.Texture; // 배경 텍스처 (리사이즈된)
  fSize: number; // 퍼즐판의 크기
  fSize_h: number; // 전체 캔버스의 높이
  tSize: number; // 퍼즐 조각 하나의 크기
  shadowMargin: number; // 그림자 효과를 위한 여백
  bSize: number; // 원본 이미지에서 조각을 잘라낼 때의 크기
  tNum: number; // 한 변의 퍼즐 조각 갯수 (tNum x tNum)
  folder: string; // 이미지 폴더 경로
  file: string; // 이미지 파일명
  renderer: PIXI.Renderer; // PIXI 렌더러
  zIndex: number = 1000; // z-index 관리를 위한 변수
  r: myReturn; // myClasses에서 반환된 전역 객체
  p: number[][] = []; // 쿠키에서 읽어온 완성된 조각의 위치 정보
  cookie: string = ""; // 쿠키 문자열
  mTileData: mTile[][] = []; // 모든 퍼즐 조각의 모양 데이터
  pTiles: pTile[] = []; // 생성된 모든 퍼즐 조각 객체 배열
  mobileNow: boolean = mobileNow(); // 모바일 환경 여부

  constructor(
    r: myReturn,
    bgtOriginal: PIXI.Texture,
    cookieP: string, // 쿠키에서 읽어온 위치 정보
    t_num: number,
    folder: string,
    file: string
  ) {
    this.r = r;
    this.renderer = r.app.renderer;
    r.mc.addChild(this.main); // 메인 컨테이너를 stage에 추가
    this.fSize = r.fSize - ((r.fSize / (t_num * 5 + 2)) * 7) / 10;
    this.tNum = t_num;
    console.log("this.tNum :", this.tNum);
    this.bgtOriginal = bgtOriginal;

    // this.bgt =
    //   bgtOriginal.width > this.fSize
    //     ? textureSize(bgtOriginal, this.fSize)
    //     : bgtOriginal; // 원본 이미지가 퍼즐판보다 크면 리사이즈
    // this.fullPicture = this.bgt;

    this.bgt = bgtOriginal;
    this.fullPicture = this.bgt;
    this.bSize = (this.bgt.width / (t_num * 5 + 2)) * 7; // 원본 이미지에서 잘라낼 크기

    this.fSize_h = r.fSize_h;
    this.tSize = (this.fSize / (t_num * 5 + 2)) * 7; // 조각 하나의 표시 크기
    this.shadowMargin = this.tSize / 30; // 그림자 여백
    this.bSize = (this.bgt.width / (t_num * 5 + 2)) * 7; // 원본 이미지에서 잘라낼 크기
    this.folder = folder;
    this.file = file;
    this.main.addChild(this.bg0, this.bg1, this.bg2, this.bg3);
    this.bg2.sortableChildren = true; // bg2의 자식 요소들을 zIndex 기준으로 정렬
    // document.body.appendChild(r.app.canvas);
    // 쿠키 정보 파싱하여 p 배열에 저장

    if (cookieP != undefined && cookieP != "") {
      this.cookie += cookieP;
      const positions = cookieP.split("$");
      positions.forEach((position) => {
        const xy = position.split("#");
        this.p.push([Number(xy[0]), Number(xy[1])]);
      });
    }
    console.log("p :", cookieP);
    // this.start();
  }
  displayTextureResize = () => {
    console.log("displayTextureResize");
    this.bgt =
      this.bgtOriginal.width > this.fSize
        ? textureSize(this.bgtOriginal, this.fSize)
        : this.bgtOriginal; // 원본 이미지가 퍼즐판보다 크면 리사이즈
    this.fullPicture = this.bgt;
    this.bSize = (this.bgt.width / (this.tNum * 5 + 2)) * 7; // 원본 이미지에서 잘라낼 크기
  };
  makeMaskTilesData = (tNum: number, rNum: number): mTile[][] => {
    // 퍼즐 조각들의 모양 데이터를 생성하는 함수
    const tiles: mTile[][] = []; // 타일 배열 초기화
    // 1. 빈 타일 데이터 구조 생성
    for (let y = 0; y < tNum; y++) {
      const xt: mTile[] = [];
      for (let x = 0; x < tNum; x++) {
        const mT: mTile = {
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
        const d =
          y == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1; // 아래쪽은 랜덤 생성 (경계선 제외)
        const l = x == 0 ? 0 : tiles[x - 1][y].right; // 왼쪽은 이웃한 타일의 오른쪽 돌기 모양을 이어받음
        const r =
          x == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1; // 오른쪽은 랜덤 생성 (경계선 제외)
        tiles[x][y] = {
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
    this.p.forEach((xy) => {
      console.log("xy :", xy);
      console.log("this.tNum :", this.tNum);
      tiles[xy[0]][xy[1]].done = true;
    });
    return tiles;
  };
  getMaskTile = async (tile: mTile, sw: number): Promise<PIXI.Sprite> => {
    // mTile 데이터로부터 SVG 마스크를 생성하는 함수
    let fill_color, stroke_width, stroke_color, block_color;
    switch (
      sw // sw (switch) 값에 따라 스타일(색상, 테두리 두께) 결정
    ) {
      case 0: // 퍼즐판의 빈 공간 모양
        fill_color = "#d9e6f2";
        stroke_width = 'stroke-width="5"';
        stroke_color = "#d9e6f2";
        block_color = "#000000";
        break;
      case 1: // 퍼즐 조각 이미지의 마스크
        fill_color = "#ffffff";
        stroke_width = 'stroke-width="8"';
        stroke_color = "#ffffff";
        block_color = "#000000";
        break;
      case 2: // 퍼즐 조각 테두리의 마스크
        fill_color = "#ffffff";
        stroke_width = 'stroke-width="1"';
        stroke_color = "#ffffff";
        block_color = "#000000";
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
    const s = await svgToSprite(svg, this.tSize);

    tile.x_p = this.tSize / 2 + ((this.tSize * 5) / 7) * tile.x; // 타일의 최종 위치 계산
    tile.y_p = this.tSize / 2 + ((this.tSize * 5) / 7) * tile.y;
    if (sw == 0) {
      // 퍼즐판의 빈 공간을 그릴 경우
      s.position.set(tile.x_p, tile.y_p);
      this.bg1.addChild(s);
    }
    return s;
  };
  borderPrepare = () => {
    // 퍼즐판(border)과 배경(background)을 상호작용 가능한 스프라이트로 준비하는 함수
    this.backgroundSprite = this.containerToSpriteAdd(this.bg1, this.bg0);
    this.borderSprite = this.containerToSpriteAdd(this.border);
    this.borderSprite.interactive = true;
    this.borderSprite.eventMode = "static";
    this.borderSprite.cursor = "pointer";
    this.borderSprite.on("pointerdown", this.bgPrepare); // 클릭 시 원본 이미지 보기
  };
  getTile = async (t: mTile, pTiles: pTile[] = this.pTiles) => {
    // 하나의 퍼즐 조각 스프라이트를 생성하는 함수
    const c = new PIXI.Container();
    // 맞춰진 그림을 보여줌.
    this.bg2.addChild(c);
    // 원본 이미지에서 잘라낼 위치 계산
    const t_x = this.bSize / 2 + ((this.bSize * 5) / 7) * t.x;
    const t_y = this.bSize / 2 + ((this.bSize * 5) / 7) * t.y;
    const m = await this.getMaskTile(t, 1); // 조각 모양 마스크 생성

    // console.log('this.bSize :', this.bSize);
    // console.log('this.fSize :', this.fSize);
    let x = t_x - this.bSize / 2;
    let y = t_y - this.bSize / 2;
    // 이미지 경계를 벗어나지 않도록 조정
    if (x + this.bSize > this.bgt.width) {
      x = this.bgt.width - this.bSize;
    }
    if (y + this.bSize > this.bgt.width) {
      y = this.bgt.width - this.bSize;
    }
    const r = new PIXI.Rectangle(x, y, this.bSize, this.bSize);
    // const b = this.bgt.clone();

    const b = new PIXI.Texture({
      // 텍스처에서 해당 부분만 잘라내기
      source: this.bgt.source,
      frame: r,
    });

    const s = new PIXI.Sprite(b); // 스프라이트 생성 및 마스크 적용
    s.width = this.tSize;
    s.height = this.tSize;
    m.anchor.set(0, 0);
    s.mask = m;
    // 조각 테두리 생성
    const rectangle = boxDraw(0x000000, 0, 0, this.tSize, this.tSize);
    const mmm = await this.getMaskTile(t, 2);
    rectangle.mask = mmm;
    mmm.anchor.set(0, 0);
    // 그림자(cb)와 이미지(cp) 컨테이너 분리
    const cb = new PIXI.Container();
    c.addChild(cb);
    cb.addChild(mmm, rectangle);
    const cp = new PIXI.Container();
    c.addChild(cp);
    cp.addChild(m, s);
    c.pivot.set(this.tSize / 2, this.tSize / 2);
    c.position.set(t.x_p, t.y_p);
    // pTile 객체 생성 및 배열에 추가
    const p: pTile = {
      cb: cb,
      cp: cp,
      nx: t.x,
      ny: t.y,
      ox: t.x_p,
      oy: t.y_p,
      s: s,
      sb: s,
      sp: s,
      done: t.done,
      zIndex: 0,
    };
    pTiles.push(p);
  };
  makeBackground = async (bgt: PIXI.Texture) => {
    // 퍼즐판 배경 및 테두리를 생성하는 함수
    this.bg2.addChild(this.border);
    const bgd = new PIXI.Sprite();
    bgd.texture = bgt; // 원본 이미지로 배경 스프라이트 생성
    bgd.anchor.set(0.5, 0.5);
    bgd.width = this.fSize;
    bgd.height = this.fSize;
    bgd.position.set(this.fSize / 2, this.fSize / 2);
    const margin = (this.tSize * 2) / 7;
    // SVG를 사용하여 퍼즐판 모양의 마스크 생성
    const svgContent = `<rect x="0" y="0" fill="#ffffff" stroke="#000000" stroke-miterlimit="10" 
                width="${this.fSize}" height="${this.fSize}"/>
                <rect x="${margin}" y="${margin}" fill="#000000" stroke="#000000" stroke-miterlimit="10" 
                width="${this.fSize - margin * 2}" height="${
      this.fSize - margin * 2
    }"/>`;
    const svg = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="${this.fSize}px" height="${this.fSize}px" viewBox="0 0 ${this.fSize} ${this.fSize}" 
                enable-background="new 0 0 ${this.fSize} ${this.fSize}" 
                xml:space="preserve">${svgContent}</svg>`;
    const s = await svgToSprite(svg, this.fSize);
    s.position.set(this.fSize / 2, this.fSize / 2);
    bgd.mask = s;
    this.border.addChild(s, bgd);

    this.mTileData = this.makeMaskTilesData(this.tNum, 6); // 퍼즐 조각 모양 데이터 생성
    this.mTileData.forEach((data) =>
      data.forEach((tileData) => this.getMaskTile(tileData, 0))
    ); // 빈자리 그리기
    this.border.zIndex = 3;
    // 퍼즐판 그림자 생성
    const c2 = new PIXI.Container();
    const b_v1 = boxDraw(
      0x000000,
      0,
      0,
      (this.tSize * 2) / 7 - this.shadowMargin,
      this.fSize - this.shadowMargin
    );
    const b_v2 = boxDraw(
      0x000000,
      this.fSize - (this.tSize * 2) / 7 + this.shadowMargin,
      this.shadowMargin,
      (this.tSize * 2) / 7 - this.shadowMargin,
      this.fSize - this.shadowMargin * 2
    );
    const b_h1 = boxDraw(
      0x000000,
      0,
      0,
      this.fSize - this.shadowMargin,
      (this.tSize * 2) / 7 - this.shadowMargin
    );
    const b_h2 = boxDraw(
      0x000000,
      0,
      this.fSize - (this.tSize * 2) / 7 + this.shadowMargin,
      this.fSize - this.shadowMargin,
      (this.tSize * 2) / 7 - this.shadowMargin
    );
    c2.addChild(b_v1, b_v2, b_h1, b_h2);
    this.bg2.addChild(c2);
    c2.zIndex = 0;
    let b_s = containerToSprite(c2, this.renderer);
    b_s = this.tileShadow(b_s);
    // download_sprite_as_png(this.renderer, b_s, String(this.tNum) + "b.png")
    b_s.position.set(this.shadowMargin, this.shadowMargin);
    b_s.zIndex = 0;
    // 로딩 텍스트 생성
    const fontsize = this.mobileNow ? this.fSize / 80 : this.fSize / 40;
    const loading = this.textPrepare("Loading", 0x000000, fontsize, 0, 0, true);
    loading.position.set(this.fSize / 2, this.fSize / 2);
    loading.zIndex = -1;
    this.bg0.addChild(loading);
    this.bg2.addChild(b_s);
    this.bg2.removeChild(c2);
  };

  start = async () => {
    // 게임 시작을 위한 전체 프로세스
    this.displayTextureResize();
    console.log("start : ");
    await this.makeBackground(this.bgt); // 1. 배경 생성
    this.mTileData.forEach(async (mTile) => {
      // 2. 모든 조각 생성 (아직 화면에 흩뿌리지는 않음)
      mTile.forEach(async (pTile) => await this.getTile(pTile));
    });
    setTimeout(() => {
      // 3. 약간의 딜레이 후, 조각들을 스프라이트화하고 흩뿌림
      this.pTiles.forEach((p) => this.makeSprite(p));
      // bgPrepare()
      this.borderPrepare(); // 4. 퍼즐판 상호작용 준비
      // setTimeout(() => {
      //     download_sprite_as_png(f.renderer, this.backgroundSprite, String(this.tNum) + "c.png")
      //     download_sprite_as_png(f.renderer, this.borderSprite, String(this.tNum) + "a.png")
      // }, 4000)
      this.selectStart(this.r); // 5. 이미지 선택 화면 시작
    }, 4000);
  };
  makeSprite = (p: pTile) => {
    // pTile 객체를 실제 움직일 수 있는 스프라이트로 만드는 함수
    const xyCookieWrite = (x: number, y: number) => {
      // 완성된 조각의 위치를 쿠키에 저장하는 함수
      const xy = String(x) + "#" + String(y);
      this.cookie += this.cookie == "" ? xy : "$" + xy;
      cookieWrite({ jigsawPosition: this.cookie });
    };
    const tileFix = (p: pTile) => {
      // 조각이 제자리에 놓였을 때 처리하는 함수
      const tileFixAction = (p: pTile) => {
        // 조각이 맞춰지는 애니메이션
        const oSize = p.sp.width;
        const maxSize = (p.sp.width * 12) / 10;
        let sVector = this.mobileNow
          ? (maxSize - oSize) / 15
          : (maxSize - oSize) / 30;
        let rVector = this.mobileNow ? 360 / (15 * 2) : 360 / (30 * 2);
        p.s.parent?.addChild(p.sb, p.sp);
        p.s.parent?.removeChild(p.s);
        p.sb.anchor.set(0.5, 0.5);
        p.sp.anchor.set(0.5, 0.5);
        p.sp.position.set(p.ox, p.oy);
        p.sb.position.set(p.ox + this.shadowMargin, p.oy + this.shadowMargin);
        p.sp.zIndex = 100001;
        p.sb.zIndex = 100000;
        const sizeAction = () => {
          p.sb.angle += rVector;
          p.sb.width += sVector;
          p.sb.height += sVector;
          p.sp.angle += rVector;
          p.sp.width += sVector;
          p.sp.height += sVector;
          // console.log('sVector :', sVector);
          if (p.sp.width > maxSize) {
            sVector = -sVector;
            if (Math.abs(360 - p.sp.angle) < rVector) {
              rVector = 0;
            }
          }
          if (p.sp.width < oSize) {
            // 애니메이션 종료 후
            p.sb.angle = 0;
            p.sp.angle = 0;
            p.sb.position.set(
              p.ox + this.shadowMargin,
              p.oy + this.shadowMargin
            );
            p.sp.position.set(p.ox, p.oy);
            combineAfterAction(); // 스프라이트 합치기 실행
          } else {
            requestAnimationFrame(sizeAction);
          }
        };
        sizeAction();
      };
      const combineAfterAction = () => {
        // 조각을 퍼즐판/배경 스프라이트에 합치는 작업
        this.borderSprite.texture = spriteCombine(this.borderSprite, p.sp);
        this.backgroundSprite.texture = spriteCombine(
          this.backgroundSprite,
          p.sb,
          this.shadowMargin,
          this.shadowMargin
        );
        p.done = true;
        this.endingCheck(); // 게임 종료 여부 확인
      };

      tileFixAction(p);
    };
    const moveByMouse = (p: pTile) => {
      // (데스크탑) 마우스로 조각을 움직이는 로직
      const c = p.s;
      const parentWidth = this.fSize;
      const parentHeight = this.fSize_h;
      c.interactive = true;
      c.eventMode = "static";
      c.cursor = "pointer";
      let pickUp = false;
      const onDragStart = () => {
        if (!pickUp) {
          pickUp = true;
          this.zIndex++;
          c.zIndex = this.zIndex;
          c.on("pointermove", onDragMove);
        } else {
          pickUp = false;
          c.off("pointermove", onDragMove);
          onDragEnd();
        }
      };
      const onDragEnd = () => {
        if (
          Math.abs(c.x - p.ox) < this.tSize / 5 &&
          Math.abs(c.y - p.oy) < this.tSize / 5
        ) {
          tileFix(p);
          xyCookieWrite(p.nx, p.ny);
        }
      };
      const onDragMove = (event: any) => {
        if (pickUp) {
          const newPosition = event.data.getLocalPosition(c.parent);
          c.x =
            newPosition.x <= parentWidth && newPosition.x >= 0
              ? newPosition.x
              : c.x;
          c.y =
            newPosition.y <= parentHeight && newPosition.y >= 0
              ? newPosition.y
              : c.y;
        }
      };
      c.on("pointerdown", onDragStart);
    };
    const m_moveByMouse = (p: pTile) => {
      // (모바일) 터치로 조각을 움직이는 로직
      p.s.interactive = true;
      p.s.eventMode = "static";
      p.s.cursor = "pointer";
      let pickUp = false;
      const onDragStart = () => {
        console.log("onDragStart");
        pickUp = true;
        this.zIndex++;
        p.s.zIndex = this.zIndex;
        p.s.on("touchmove", onDragMove);
      };
      const onDragEnd = () => {
        console.log("onDragEnd");

        if (
          Math.abs(p.s.x - p.ox) < this.tSize / 5 &&
          Math.abs(p.s.y - p.oy) < this.tSize / 5
        ) {
          tileFix(p);
          xyCookieWrite(p.nx, p.ny);
        } else {
          p.s.off("touchmove", onDragMove);
          pickUp = false;
        }
      };
      const onDragMove = (event: any) => {
        console.log("onDragMove");
        if (pickUp) {
          const newPosition = event.data.getLocalPosition(p.s.parent);
          p.s.x =
            newPosition.x <= this.fSize && newPosition.x >= 0
              ? newPosition.x
              : p.s.x;
          p.s.y =
            newPosition.y <= this.fSize_h && newPosition.y >= 0
              ? newPosition.y
              : p.s.y;
        }
      };
      p.s.on("touchstart", onDragStart).on("touchend", onDragEnd);
    };
    p.sb = containerToSprite(p.cb, this.renderer); // 1. 이미지와 테두리(그림자용) 컨테이너를 각각 스프라이트로 변환
    p.sp = containerToSprite(p.cp, this.renderer);
    const tS = this.tileShadow(p.sb); // 2. 그림자 스프라이트에 그림자 효과(블러) 적용
    tS.position.set(this.shadowMargin, this.shadowMargin);
    const c = new PIXI.Container(); // 3. 그림자와 이미지를 하나의 컨테이너에 합친 후, 다시 하나의 스프라이트로 변환
    this.bg2.addChild(c);
    c.addChild(tS, p.sb, p.sp);
    p.sb = tS;
    p.s = containerToSprite(c, this.renderer); // 최종 조각 스프라이트
    p.s.anchor.set(0.5, 0.5);
    p.s.position.set(p.ox, p.oy);
    p.s.zIndex = 10 + Math.floor(Math.random() * 10);
    c.parent?.removeChild(c);
    p.cb.parent?.removeChild(p.cb, p.cp);
    p.zIndex = p.nx + p.ny * this.tNum;
    this.bg2.addChild(p.s);
    if (!p.done) {
      // 아직 맞춰지지 않은 조각
      if (this.mobileNow) {
        // 4. 움직임 이벤트 추가 및 흩뿌리기
        m_moveByMouse(p);
      } else {
        moveByMouse(p);
      }
      this.tileScatter(p, true);
    } else {
      // 이미 맞춰진 조각 (쿠키에서 로드)
      // border와 바탕화면에 그리기
      this.bg2.removeChild(p.s);
      this.border.addChild(p.sp);
      this.bg1.addChild(p.sb);
      p.sp.anchor.set(0.5, 0.5);
      p.sp.position.set(p.ox, p.oy);
      p.sb.anchor.set(0.5, 0.5);
      p.sb.position.set(p.ox + this.shadowMargin, p.oy + this.shadowMargin);
    }
  };
  // tileShadow = (s: PIXI.Sprite) => {
  //   let mt = s;
  //   const blurFilter = new PIXI.BlurFilter();
  //   mt.filters = [blurFilter];
  //   blurFilter.blur = 7;
  //   return mt;
  // };
  tileShadow = (sprite: PIXI.Sprite): PIXI.Sprite => {
    // 스프라이트에 블러 필터를 적용하여 그림자 효과를 주는 함수
    sprite.filters = [
      new PIXI.BlurFilter({
        strength: 7,
      }),
    ];
    return sprite;
  };
  // SpriteAddShadow = (s: PIXI.Sprite) => {
  //     let sd = this.tileShadow(s)
  //     let c = new PIXI.Container()
  //     c.addChild(sd, s)
  //     s.parent.addChild(c)
  //     sd.position.set(this.shadowMargin, this.shadowMargin)
  //     return this.containerToSpriteAdd(c)
  // }
  containerToSpriteAdd = (
    // 컨테이너를 스프라이트로 변환하고 기존 컨테이너를 제거하는 헬퍼 함수
    c: PIXI.Container,
    cp: PIXI.Container = c.parent as PIXI.Container
  ) => {
    const s = containerToSprite(c, this.renderer);
    s.zIndex = c.zIndex;
    cp.addChild(s);
    cp.removeChild(c);
    c.destroy({ children: true });
    // c.destroy({ children: true });
    return s;
  };

  endingCheck = () => {
    // 모든 조각이 맞춰졌는지 확인하는 함수
    let count = 0;
    this.pTiles.forEach((pt) => {
      count += pt.done == false ? 1 : 0;
    });
    if (count == 0) {
      // 남은 조각이 없으면
      console.log("남은 타일 갯수 :", count);
      cookieWrite({ jigsawFolder: "", jigsawFile: "", jigsawPosition: "" }); // 쿠키 초기화
      this.ending(); // 엔딩 애니메이션 실행
    }
  };
  ending = () => {
    // 엔딩 애니메이션 함수
    // let s = this.containerToSpriteAdd(this.main)
    const s = this.borderSprite;
    let p = this.fSize / 2;
    s.anchor.set(0.5, 0.5);
    s.position.set(this.fSize / 2, this.fSize / 2);
    const resizeP = () => {
      // 확대 애니메이션
      s.width = p;
      s.height = p;
      p += this.fSize / 50;
      if (p > this.fSize) {
        console.log("축하합니다 :");
        s.width = this.fSize + this.shadowMargin;
        s.height = this.fSize + this.shadowMargin;
        this.selectStart(this.r); // 이미지 선택 화면으로 전환
      } else {
        requestAnimationFrame(resizeP);
      }
    };
    resizeP();
  };
  tileScatter = (p: pTile, s: boolean = false) => {
    // 조각을 특정 위치로 움직이는 애니메이션 (흩뿌리기)
    let x: number, y: number;
    if (s) {
      // 랜덤 위치로 흩뿌리기
      x = Math.floor(Math.random() * this.fSize);
      y = Math.floor(Math.random() * (this.fSize_h - this.fSize) + this.fSize);
    } else {
      // 원래 위치로
      x = p.ox;
      y = p.ox;
    }
    const v = this.mobileNow ? 25 : 60;
    const xVector = (p.s.x - x) / v;
    const yVector = (p.s.y - y) / v;
    const tMove = () => {
      // 부드럽게 이동하는 애니메이션 로직
      if (
        Math.abs(p.s.x - x) > Math.abs(xVector) &&
        Math.abs(p.s.y - y) > Math.abs(xVector)
      ) {
        p.s.x -= xVector;
        p.s.y -= yVector;
        requestAnimationFrame(tMove);
      } else {
        p.s.x = x;
        p.s.y = y;
      }
    };
    tMove();
  };
  bgPrepare = () => {
    // 퍼즐판을 클릭했을 때 원본 이미지를 보여주는 함수
    const fullP = new PIXI.Sprite();
    const fullPicture = new PIXI.Container();
    this.bg2.addChild(fullPicture);
    fullPicture.addChild(fullP);
    fullP.texture = this.fullPicture;

    // fullP.texture = new PIXI.Texture({
    //   source: this.fullPicture.source,
    // });

    fullPicture.zIndex = 1000000;
    fullP.interactive = true;
    fullP.eventMode = "static";
    fullP.cursor = "pointer";
    fullP.on("pointerdown", () => {
      fullPicture.parent?.removeChild(fullPicture);
    });
    const showSelectStart = () => {
      // 닫기 버튼 액션
      console.log("show selectStart");
      fullPicture.parent?.removeChild(fullPicture);
      if (!this.selectMode) this.selectStart(this.r);
    };
    const shufflePTiles = () => {
      // 섞기 버튼 액션
      console.log("shuffle pTiles");
      this.pTiles.forEach((p) => this.tileScatter(p, true));
    };
    const showSelectStartBoxButton1 = boxButtonDraw(
      showSelectStart,
      0x000000,
      0,
      0,
      this.fSize,
      this.fSize / 10,
      0
    );
    const showSelectStartBoxButton2 = boxButtonDraw(
      showSelectStart,
      0x000000,
      this.fSize - this.fSize / 10,
      0,
      this.fSize / 10,
      this.fSize,
      0
    );
    const shufflePTilesBoxButton = boxButtonDraw(
      shufflePTiles,
      0x000000,
      0,
      0,
      this.fSize / 10,
      this.fSize,
      0
    );

    fullPicture.addChild(
      showSelectStartBoxButton1,
      shufflePTilesBoxButton,
      showSelectStartBoxButton2
    );
  };
  selectEnd = () => {
    // 이미지 선택 모드 종료
    this.selectMode = false;
    this.bg3.parent?.removeChild(this.bg3);
    this.bg3 = new PIXI.Container();
    this.main.addChild(this.bg3);
    this.borderSprite.off("pointerdown");
    this.borderSprite.on("pointerdown", this.bgPrepare);
  };
  selectStart = (f: myReturn) => {
    // 이미지 선택 화면을 시작하는 함수
    this.selectMode = true;
    this.borderSprite.off("pointerdown");
    this.borderSprite.on("pointerdown", this.selectEnd);
    let selectTileNumberMode = false;
    let sFileNames: string[] = [];
    for (let folder = 0; folder < 5; folder++) {
      for (let file = 0; file < 9; file++) {
        sFileNames.push(
          "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg"
        );
      }
    }
    interface positionData {
      // 캐러셀 아이템의 위치, 크기, 각도 데이터 인터페이스
      x: number;
      y: number;
      size: number;
      angle: number;
    }
    const selectC1 = new PIXI.Container();
    let sevenTiles: PIXI.Sprite[] = [];
    // const sevenShadows: PIXI.Graphics[] = [];
    // const myFilter = new PIXI.BlurFilter();
    // myFilter.blur = 7;
    const myFilter = new PIXI.BlurFilter({
      strength: 10,
    });
    let fSize = f.fSize;
    let fSize_h = f.fSize_h;
    let KEY = 0;
    let movingON = false;
    let moveAccel = 0;
    let selectC2 = new PIXI.Container();
    const degrees = [-122, -114, -104, -90, -76, -66, -58]; // 캐러셀 아이템들의 각도
    this.bg3.sortableChildren = true;
    selectC2.zIndex = 0;
    selectC1.zIndex = 1;
    this.bg3.addChild(selectC2, selectC1);
    selectC2.sortableChildren = true;
    let startNum = Math.floor(Math.random() * sFileNames.length); // 시작 이미지 인덱스
    let endNum: number;
    const plus = (n: number) => (n == sFileNames.length - 1 ? 0 : n + 1); // 다음 인덱스 계산
    const minus = (n: number) => (n == 0 ? sFileNames.length - 1 : n - 1); // 이전 인덱스 계산
    const getPositionAndSize = (degree: number, floorSize: number = 100) => {
      // 회전하는 캐러셀 UI의 위치/크기/각도를 계산하는 함수
      let radius = (floorSize * 4) / 5;
      let tSize = floorSize / 2;
      let x = floorSize / 2 + Math.cos(degreesToRadians(degree)) * radius;
      let y = floorSize / 2 + Math.sin(degreesToRadians(degree)) * radius;
      let size = tSize - Math.abs(x - floorSize / 2) * 0.73;
      let angle = degree + 90;
      let r: positionData = { x: x, y: y, size: size, angle: angle };
      return r;
    };
    const setPositions = (
      // 계산된 위치/크기/각도를 스프라이트에 적용하는 함수
      s: PIXI.Sprite | PIXI.Graphics,
      r: positionData,
      b: boolean = false
    ) => {
      s.width = r.size;
      s.height = r.size;
      s.angle = r.angle;
      let m = b ? r.size / 20 : 0;
      s.x = r.x + m;
      s.y = r.y + m;
      s.zIndex = r.size - m;
    };
    const _makeSelectSprite = (
      // 캐러셀에 표시될 이미지 스프라이트를 생성하는 내부 함수 (사용되지 않음)
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      const r = getPositionAndSize(degree, floorSize);
      const s = new PIXI.Sprite(t);
      s.anchor.set(0.5, 0.5);
      setPositions(s, r);
      s.zIndex = r.size;
      c.addChild(s);
      return s;
    };
    const makeSelectSprite = (
      // 캐러셀에 표시될 이미지 스프라이트를 생성하는 함수 (그림자 포함)
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      const s = new PIXI.Sprite(t);
      const td = new PIXI.Container();
      const b = boxDraw(0x000000, 0, 0, s.width);

      td.addChild(b);
      // b.position.set(s.width / 20, s.width / 20);
      // c.addChild(td);
      // b.alpha = 0.5;
      // b.filters = [myFilter];
      const sb = containerToSprite(td, this.renderer);
      // c.removeChild(td);
      const tf = new PIXI.Container();
      sb.alpha = 0.5;
      sb.filters = [myFilter];
      sb.position.set(s.width / 20, s.width / 20);
      tf.addChild(sb, s);
      const r = getPositionAndSize(degree, floorSize);
      // console.log('b.x, b.y :', b.x, b.y);
      const ns = containerToSprite(tf, this.renderer);
      // const ns = sb
      ns.anchor.set(0.5, 0.5);
      setPositions(ns, r);
      c.addChild(ns);
      // c.removeChild(tf)
      return ns;
    };
    const drawSpriteAndShadow = (
      // 스프라이트와 그림자를 그리는 함수
      degree: number,
      s: PIXI.Sprite | PIXI.Graphics,
      floorSize: number = 100,
      b: boolean = false
    ) => {
      const r = getPositionAndSize(degree, floorSize);
      setPositions(s, r, b);
    };
    const makeSelectSpriteShadow = (
      // 선택 스프라이트의 그림자를 만드는 함수 (사용되지 않음)
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      const r = getPositionAndSize(degree, floorSize);
      const s = boxDraw(0x000000, 0, 0, r.size);
      setPositions(s, r, true);
      s.pivot.set(r.size / 2, r.size / 2);
      s.zIndex = r.size - 1;
      s.filters = [myFilter];
      c.addChild(s);
      return s;
    };
    const firstDrawTiles = () => {
      // 캐러셀의 초기 타일들을 그리는 함수
      let num = startNum;
      for (let i = 0; i < 7; i++) {
        const t = PIXI.Assets.get(sFileNames[num]);
        const s = makeSelectSprite(degrees[i], t, selectC2, fSize);
        // let b = makeSelectSpriteShadow(degrees[i], t, selectC2, fSize)
        sevenTiles.push(s);
        // sevenShadows.push(b)
        num = plus(num);
      }
      endNum = minus(num);
      const r = getPositionAndSize(-90, this.fSize);
      const box = boxDraw(
        0xffffff,
        r.x - r.size,
        r.y - (r.size * 6) / 5,
        r.size * 2
      );
      box.alpha = 0.5;
      selectC2.addChild(box);
      // console.log('box.x, box.y :', box.x, box.y);
      selectC2.x = 0;
      selectC2.y = fSize - fSize / 8;
    };
    const swiftTiles = (direction: number) => {
      // 캐러셀을 좌/우로 움직이는 애니메이션 함수
      movingON = true;
      let baseVector = this.mobileNow ? 7 : 15;
      baseVector -=
        moveAccel < baseVector / 2 ? moveAccel : Math.floor(baseVector / 2);
      const t = sevenTiles;
      // let bs = sevenShadows
      const tileM = (i: number, oDegree: number, nDegree: number) => {
        const s = t[i];
        // const b = bs[i]
        let thisDegree = oDegree;
        const vector = (nDegree - oDegree) / baseVector;
        let index = 0;
        const moveLoop = () => {
          // requestAnimationFrame을 이용한 부드러운 이동
          thisDegree += vector;
          if (index < baseVector / 3 || index > (baseVector * 2) / 3) {
            s.alpha = 1;
          } else {
            s.alpha = 0.85;
          }
          // if (i == 0) console.log('index :', index);
          drawSpriteAndShadow(thisDegree, s, fSize);
          // drawSpriteAndShadow(thisDegree, b, fSize, true)
          if (Math.abs(nDegree - thisDegree) > 0.01) {
            index++;
            requestAnimationFrame(moveLoop);
          } else {
            drawSpriteAndShadow(nDegree, s, fSize);
            // drawSpriteAndShadow(nDegree, b, fSize, true)
          }
        };
        moveLoop();
      };
      const tileV = (i: number) => {
        // 사라지는 애니메이션
        const s = t[i];
        // let b = bs[i]
        const disappearLoop = () => {
          // b.alpha -= 1 / baseVector
          s.alpha -= 1 / baseVector;
          if (s.alpha > 0) {
            requestAnimationFrame(disappearLoop);
          } else {
            s.parent?.removeChild(s);
            // b.parent.removeChild(b)
          }
        };
        disappearLoop();
      };
      const tileA = (directions: number) => {
        // 나타나는 애니메이션
        let d: number;
        let t: PIXI.Texture;
        let s: PIXI.Sprite;
        // let b: PIXI.Graphics
        switch (directions) {
          case LEFT:
            startNum = plus(startNum);
            endNum = plus(endNum);
            d = degrees[6];
            t = PIXI.Assets.get(sFileNames[endNum]);
            s = makeSelectSprite(d, t, selectC2, fSize);
            // b = makeSelectSpriteShadow(d, t, selectC2, fSize)
            sevenTiles.push(s);
            // sevenShadows.push(b)
            s.alpha = 0;
            // b.alpha = 0
            break;
          case RIGHT:
            startNum = minus(startNum);
            endNum = minus(endNum);
            d = degrees[0];
            t = PIXI.Assets.get(sFileNames[startNum]);
            s = makeSelectSprite(d, t, selectC2, fSize);
            // b = makeSelectSpriteShadow(d, t, selectC2, fSize)
            sevenTiles.unshift(s);
            // sevenShadows.unshift(b)
            s.alpha = 0;
            // b.alpha = 0
            break;
        }
        const appearLoop = () => {
          // b.alpha += 1 / baseVector
          s.alpha += 1 / baseVector;
          if (s.alpha < 1) {
            requestAnimationFrame(appearLoop);
          } else {
            // console.log('KEY :', KEY)
            if (KEY == LEFT || KEY == RIGHT) {
              swiftTiles(KEY);
              moveAccel++;
            } else {
              movingON = false;
            }
          }
        };
        appearLoop();
      };
      switch (direction) {
        case LEFT:
          for (let i = 1; i < t.length; i++) {
            tileM(i, degrees[i], degrees[i - 1]);
          }
          tileV(0);
          t.shift();
          // bs.shift()
          tileA(LEFT);
          break;
        case RIGHT:
          for (let i = 0; i < t.length - 1; i++) {
            tileM(i, degrees[i], degrees[i + 1]);
          }
          tileV(t.length - 1);
          t.pop();
          // bs.pop()
          tileA(RIGHT);
          break;
      }
    };
    const mainTitle = () => {
      // 'Jigsaw', 'prev', 'next' 등의 텍스트와 버튼을 그리는 함수
      const fb = new PIXI.Container();
      const maskContainer = new PIXI.Container();
      const shadowContainer = new PIXI.Container();
      const myf = new PIXI.BlurFilter({
        strength: 7,
      });

      selectC1.addChild(fb, maskContainer, shadowContainer);
      const textDraw = () => {
        const textBackground = new PIXI.Sprite(
          PIXI.Assets.get("assets/jigsaw/background.jpg")
        );
        const JigSaw = this.textPrepare(
          // 흰색
          "JigSaw",
          0xffffff,
          fSize / 10,
          0,
          0,
          true
        );
        JigSaw.width = fSize / 2;
        JigSaw.height = fSize / 7;
        const JigSawB = this.textPrepare(
          // 검은색
          "JigSaw",
          0x000000,
          fSize / 10,
          0,
          0,
          true
        );
        JigSawB.width = JigSaw.width;
        JigSawB.height = JigSaw.height;
        /// 이전, 다음 버튼 텍스트
        const prev = this.textPrepare("prev", 0xffffff, fSize / 17, 0, 0, true);
        prev.width = fSize / 4;
        prev.height = fSize / 9;
        const prevB = this.textPrepare(
          "prev",
          0x000000,
          fSize / 17,
          0,
          0,
          true
        );
        prevB.width = prev.width;
        prevB.height = prev.height;
        const next = this.textPrepare("next", 0xffffff, fSize / 17, 0, 0, true);
        next.width = prev.width;
        next.height = prev.height;
        const nextB = this.textPrepare(
          "next",
          0x000000,
          fSize / 17,
          0,
          0,
          true
        );
        nextB.width = prev.width;
        nextB.height = prev.height;
        textBackground.anchor.set(0.5, 0.5);
        textBackground.position.set(fSize / 2, fSize / 2);
        JigSaw.position.set(fSize / 2, fSize / 2 - fSize / 3);
        // fd.filters = [myf]
        JigSawB.position.set(JigSaw.x, JigSaw.y);
        // fc.addChild(prevB, prev, nextB, next)
        next.position.set(fSize / 2 + fSize / 4, fSize / 2 + fSize / 3);
        nextB.position.set(fSize / 2 + fSize / 4, fSize / 2 + fSize / 3);
        prev.position.set(fSize / 2 - fSize / 4, fSize / 2 + fSize / 3);
        prevB.position.set(fSize / 2 - fSize / 4, fSize / 2 + fSize / 3);

        maskContainer.addChild(JigSaw, prev, next);
        shadowContainer.addChild(JigSawB, prevB, nextB);
        const mask = containerToSprite(maskContainer, this.renderer);
        const shadow = containerToSprite(shadowContainer, this.renderer);
        shadow.filters = [myf];
        textBackground.mask = mask;
        shadow.position.set(fSize / 80, fSize / 80);

        fb.addChild(shadow, mask, textBackground);
        fb.position.set((fSize - fb.width) / 2, (fSize - fb.width) / 2);
        maskContainer.parent?.removeChild(maskContainer, shadowContainer);

        // console.log('prev.x, prev.y, prev.width, prev.height :', prev.x, prev.y, prev.width, prev.height);
        const nextPhotoButtonFunction = () => {
          // 이전 이미지 버튼 액션
          if (!movingON) swiftTiles(LEFT);
          KEY = LEFT;
          moveAccel = 0;
        };
        const prevPhotoButtonFunction = () => {
          // 다음 이미지 버튼 액션
          if (!movingON) swiftTiles(RIGHT);
          KEY = RIGHT;
          moveAccel = 0;
        };
        const centerPhotoButtonFunction = () => {
          // 중앙 이미지를 클릭했을 때
          if (!selectTileNumberMode) {
            // 퍼즐 조각 수 선택 모드로 전환
            for (let i = 0; i < 3; i++) {
              // 이미지 3개 앞당기기
              startNum = plus(startNum);
              endNum = plus(endNum);
            }
            let string = sFileNames[startNum];
            string = string
              .replace("assets/jigsaw/", "")
              .replace(".jpg", "")
              .replace("/s0", "$");
            let strings = string.split("$");
            this.folder = strings[0];
            this.file = strings[1];
            console.log("strings :", strings);
            selectTileNumber(); // 조각 수 선택 화면으로 전환
            selectTileNumberMode = true;
          } else {
            // 최종 선택 완료
            for (let i = 0; i < 3; i++) {
              // 이미지 3개 앞당기기
              startNum = plus(startNum);
            }
            let s = sFileNames[startNum];
            s = s.replace("assets/jigsaw/b/", "").replace(".jpg", "");
            console.log("s :", s);
            if (Number(s) != this.tNum) {
              cookieWrite({ jigsawPosition: "" }); // 조각 수가 변경되면 쿠키 초기화
            }
            this.tNum = Number(s);
            jigsawRestart(this.folder, this.file, this.tNum); // 선택한 정보로 게임 재시작
          }
        };
        const prevPhotoButton = boxButtonDraw(
          // 이전 버튼
          prevPhotoButtonFunction,
          0x000000,
          0,
          fb.height - prev.width / 2,
          prev.width,
          prev.height,
          0
        );
        const nextPhotoButton = boxButtonDraw(
          // 다음 버튼
          nextPhotoButtonFunction,
          0x000000,
          fb.width - prev.width,
          fb.height - prev.width / 2,
          prev.width,
          prev.height,
          0
        );
        const centerPhotoButton = boxButtonDraw(
          // 중앙 선택 버튼
          centerPhotoButtonFunction,
          0x000000,
          (fb.width - (fb.width * 2) / 3) / 2,
          (fb.width - (fb.width * 1.2) / 2.2) / 2,
          (fb.width * 2) / 3,
          (fb.width * 2) / 3,
          0
        );
        // const bb = boxButtonDraw(this.selectEnd, 0x000000, (fb.width - fb.width * 2 / 3) / 2, (fb.width - fb.width * 1.2 / 2.2) / 2, fb.width * 2 / 3, fb.width * 2 / 3)

        prevPhotoButton.on("pointerup", () => (KEY = 0)); // 마우스 떼면 KEY 초기화
        nextPhotoButton.on("pointerup", () => (KEY = 0));
        fb.addChild(prevPhotoButton, nextPhotoButton, centerPhotoButton);
        // moveB(b)
      };
      textDraw();
    };
    const selectTileNumber = () => {
      // 퍼즐 조각 수를 선택하는 화면으로 전환하는 함수
      sFileNames = [];
      sevenTiles = [];
      const startNumSet = () => {
        for (let i = 0; i < this.tNum - 7; i++) {
          startNum = plus(startNum);
          endNum = plus(endNum);
        }
      };
      for (let i = 0; i < 12; i++) {
        // 조각 수 이미지 파일명 목록
        const s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4);
        sFileNames.push("assets/jigsaw/b/" + s + ".jpg");
      }
      startNum = 0;
      endNum = 11;
      startNumSet();
      selectC2.parent?.removeChild(selectC2);
      selectC2 = new PIXI.Container();
      this.bg3.addChild(selectC2);
      selectC2.zIndex = 0;
      selectC2.sortableChildren = true;
      firstDrawTiles(); // 조각 수 캐러셀 그리기
    };
    firstDrawTiles(); // 초기 캐러셀 그리기
    mainTitle(); // 메인 타이틀 및 버튼 그리기
  };
  textPrepare = (
    // 텍스트 객체를 생성하는 유틸리티 함수
    text: string,
    color: number,
    font_size: number,
    x: number,
    y: number,
    b: boolean = true,
    font: string = "Times New Roman"
  ) => {
    const b_style: Partial<PIXI.TextStyleOptions> = {
      fontFamily: font,
      fontWeight: "bold", // 혹은 '700'
      stroke: {
        width: font_size / 50,
        color: "#000000", // v8은 stroke 설정 시 색상을 명시하는 것이 좋습니다.
        join: "round", // 텍스트 외곽선을 부드럽게 처리 (추천 옵션)
      },
    };
    // const ty = new PIXI.TextStyle(b_style);
    // const t = new PIXI.Text(text, ty);
    const t = new PIXI.Text({
      text,
      style: b_style,
    });

    t.style.fill = color;
    t.style.stroke = color;
    if (b) t.anchor.set(0.5, 0.5);
    t.position.set((this.fSize * x) / 100, (this.fSize_h * y) / 100);
    t.style.fontSize = (this.fSize * font_size) / 100;
    return t;
  };
}
