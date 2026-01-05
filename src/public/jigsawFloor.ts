import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  containerToSprite,
  containerToSpriteAdd,
  cookieWrite,
  degreesToRadians,
  LEFT,
  mobileNow,
  myReturn,
  RIGHT,
  textureSize,
} from "./myClasses";
import { jigsawRestart } from "./jigsaw";
import { makeBackground } from "./makeBackground";
import { mTile } from "./mTile";
import { makePTiles, pTile } from "./pTile";

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
  displayTextureResize = () => {
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
    this.borderSprite.on("pointerdown", this.bgPrepare); // 클릭 시 원본 이미지 보기
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

  start = async () => {
    // 게임 시작을 위한 전체 프로세스

    console.log("start : ");
    // 1. 배경 생성
    this.mTileData = await makeBackground();
    // 2. 모든 조각 생성 (아직 화면에 흩뿌리지는 않음)

    await makePTiles(this.mTileData);
    // 3. 약간의 딜레이 후, 조각들을 스프라이트화하고 흩뿌림
    this.mTileData = [];
    this.borderPrepare(); // 4. 퍼즐판 상호작용 준비
    this.selectStart(this.r); // 5. 이미지 선택 화면 시작
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
      const sb = containerToSprite(td);
      // c.removeChild(td);
      const tf = new PIXI.Container();
      sb.alpha = 0.5;
      sb.filters = [myFilter];
      sb.position.set(s.width / 20, s.width / 20);
      tf.addChild(sb, s);
      const r = getPositionAndSize(degree, floorSize);
      // console.log('b.x, b.y :', b.x, b.y);
      const ns = containerToSprite(tf);
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
        const mask = containerToSprite(maskContainer);
        const shadow = containerToSprite(shadowContainer);
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
