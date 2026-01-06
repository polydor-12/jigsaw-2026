import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  containerToSpriteAdd,
  cookieWrite,
  mobileNow,
  myReturn,
  textureSize,
} from "./myClasses";
import { makeBackground } from "./makeBackground";
import { mTile } from "./mTile";
import { makePTiles, pTile } from "./pTile";
import { selectStart } from "./select";
import { tileScatter } from "./pTileMove";

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
  textureResizeForDisplay = () => {
    console.log("displayTextureResize");
    this.bgt =
      this.bgtOriginal.width > this.fSize
        ? textureSize(this.bgtOriginal, this.fSize)
        : this.bgtOriginal; // 원본 이미지가 퍼즐판보다 크면 리사이즈
    this.fullPicture = this.bgt;
    this.bSize = (this.bgt.width / (this.tNum * 5 + 2)) * 7; // 원본 이미지에서 잘라낼 크기
  };
  borderPrepare = () => {
    // 퍼즐판(border)과 배경(background)을 상호작용 가능한 스프라이트로 준비하는 함수
    this.backgroundSprite = containerToSpriteAdd(this.bg1, this.bg0);
    this.borderSprite = containerToSpriteAdd(this.border);
    this.borderSprite.interactive = true;
    this.borderSprite.eventMode = "static";
    this.borderSprite.cursor = "pointer";
    this.borderSprite.on("pointerdown", this.backgroundPrepare); // 클릭 시 원본 이미지 보기
  };
  // getTile = async (t: mTile, pTiles: pTile[] = this.pTiles) => {
  //   // 하나의 퍼즐 조각 스프라이트를 생성하는 함수
  //   const c = new PIXI.Container();
  //   // 맞춰진 그림을 보여줌.
  //   this.bg2.addChild(c);
  //   // 원본 이미지에서 잘라낼 위치 계산
  //   const t_x = this.bSize / 2 + ((this.bSize * 5) / 7) * t.x;
  //   const t_y = this.bSize / 2 + ((this.bSize * 5) / 7) * t.y;
  //   const m = await getMaskTile(t, 1, this.tSize); // 조각 모양 마스크 생성

  //   // console.log('this.bSize :', this.bSize);
  //   // console.log('this.fSize :', this.fSize);
  //   let x = t_x - this.bSize / 2;
  //   let y = t_y - this.bSize / 2;
  //   // 이미지 경계를 벗어나지 않도록 조정
  //   if (x + this.bSize > this.bgt.width) {
  //     x = this.bgt.width - this.bSize;
  //   }
  //   if (y + this.bSize > this.bgt.width) {
  //     y = this.bgt.width - this.bSize;
  //   }
  //   const r = new PIXI.Rectangle(x, y, this.bSize, this.bSize);
  //   // const b = this.bgt.clone();

  //   const b = new PIXI.Texture({
  //     // 텍스처에서 해당 부분만 잘라내기
  //     source: this.bgt.source,
  //     frame: r,
  //   });

  //   const s = new PIXI.Sprite(b); // 스프라이트 생성 및 마스크 적용
  //   s.width = this.tSize;
  //   s.height = this.tSize;
  //   m.anchor.set(0, 0);
  //   s.mask = m;
  //   // 조각 테두리 생성
  //   const rectangle = boxDraw(0x000000, 0, 0, this.tSize, this.tSize);
  //   const mmm = await getMaskTile(t, 2, this.tSize);
  //   rectangle.mask = mmm;
  //   mmm.anchor.set(0, 0);
  //   // 그림자(cb)와 이미지(cp) 컨테이너 분리
  //   const cb = new PIXI.Container();
  //   c.addChild(cb);
  //   cb.addChild(mmm, rectangle);
  //   const cp = new PIXI.Container();
  //   c.addChild(cp);
  //   cp.addChild(m, s);
  //   c.pivot.set(this.tSize / 2, this.tSize / 2);
  //   c.position.set(t.x_p, t.y_p);
  //   // pTile 객체 생성 및 배열에 추가
  //   const p: pTile = {
  //     cb: cb,
  //     cp: cp,
  //     nx: t.x,
  //     ny: t.y,
  //     ox: t.x_p,
  //     oy: t.y_p,
  //     s: s,
  //     sb: s,
  //     sp: s,
  //     done: t.done,
  //     zIndex: 0,
  //   };
  //   pTiles.push(p);
  // };

  gameStart = async () => {
    // 게임 시작을 위한 전체 프로세스

    console.log("start : ");
    // 1. 배경 생성
    this.mTileData = await makeBackground();
    // 2. 모든 조각 생성 (아직 화면에 흩뿌리지는 않음)

    await makePTiles(this.mTileData);
    // 3. 약간의 딜레이 후, 조각들을 스프라이트화하고 흩뿌림
    this.mTileData = [];
    this.borderPrepare(); // 4. 퍼즐판 상호작용 준비
    selectStart(this.r); // 5. 이미지 선택 화면 시작
  };

  gameEndingCheck = () => {
    // 모든 조각이 맞춰졌는지 확인하는 함수
    let count = 0;
    this.pTiles.forEach((pt) => {
      count += pt.done == false ? 1 : 0;
    });
    if (count == 0) {
      // 남은 조각이 없으면
      console.log("남은 타일 갯수 :", count);
      cookieWrite({ jigsawFolder: "", jigsawFile: "", jigsawPosition: "" }); // 쿠키 초기화
      this.gameEnding(); // 엔딩 애니메이션 실행
    }
  };
  gameEnding = () => {
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
        selectStart(this.r); // 이미지 선택 화면으로 전환
      } else {
        requestAnimationFrame(resizeP);
      }
    };
    resizeP();
  };

  backgroundPrepare = () => {
    // 퍼즐판을 클릭했을 때 원본 이미지를 보여주는 함수
    const fullP = new PIXI.Sprite();
    const fullPicture = new PIXI.Container();
    this.bg2.addChild(fullPicture);
    fullPicture.addChild(fullP);
    fullP.texture = this.fullPicture;

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
      console.log("this.selectMode : ", this.selectMode);
      if (!this.selectMode) selectStart(this.r);
    };
    const shufflePTiles = () => {
      // 섞기 버튼 액션
      console.log("shuffle pTiles");
      this.pTiles.forEach((p) => tileScatter(p, true));
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
    this.borderSprite.on("pointerdown", this.backgroundPrepare);
  };
}
