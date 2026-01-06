import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  containerToSprite,
  cookieWrite,
  degreesToRadians,
  download_sprite_as_png,
  getSpriteWithShadow,
  LEFT,
  myReturn,
  RIGHT,
  textPrepare,
  tileShadow,
} from "./myClasses";
import { jigsawRestart, myJigsawFloor } from "./jigsaw";

export interface positionData {
  // 캐러셀 아이템의 위치, 크기, 각도 데이터 인터페이스
  x: number;
  y: number;
  size: number;
  angle: number;
}

export const myFilter = new PIXI.BlurFilter({
  strength: 10,
});

export const select = {
  selectC1: new PIXI.Container(),
  selectC2: new PIXI.Container(),
  sevenTiles: [] as PIXI.Sprite[],
  fSize: 0,
  fSize_h: 0,
  KEY: 0,
  movingON: false,
  moveAccel: 0,
  fMode: true,
  fEnd: true,
  tileNumberMode: false,
  sFileNames: [] as string[],
  degrees: [-122, -114, -104, -90, -76, -66, -58], // 캐러셀 아이템들의 각도
  startNum: 0,
  endNum: 0,
};

export const selectStart = (r: myReturn) => {
  // 이미지 선택 화면을 시작하는 함수
  console.log("selectStart 실행");
  const f = myJigsawFloor[0];
  f.selectMode = true;
  f.borderSprite.off("pointerdown");
  f.borderSprite.on("pointerdown", f.selectEnd);
  // select 재시작 대비 초기화
  select.sFileNames = [];
  select.sevenTiles = [];
  select.selectC1.parent?.removeChild(select.selectC1);
  select.selectC2.parent?.removeChild(select.selectC2);
  select.selectC1 = new PIXI.Container();
  select.selectC2 = new PIXI.Container();
  select.fSize = f.fSize;
  select.fSize_h = f.fSize_h;
  select.KEY = 0;
  select.movingON = false;
  select.moveAccel = 0;
  select.selectC2.zIndex = 0;
  select.selectC1.zIndex = 1;
  select.selectC2.sortableChildren = true;
  select.startNum = Math.floor(Math.random() * select.sFileNames.length); // 시작 이미지 인덱스

  for (let folder = 0; folder < 5; folder++) {
    for (let file = 0; file < 9; file++) {
      select.sFileNames.push(
        "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg"
      );
    }
  }

  f.bg3.sortableChildren = true;
  f.bg3.addChild(select.selectC2, select.selectC1);

  // const makeSelectSpriteShadow = (
  //   // 선택 스프라이트의 그림자를 만드는 함수 (사용되지 않음)
  //   degree: number,
  //   t: PIXI.Texture,
  //   c: PIXI.Container,
  //   floorSize: number = 100
  // ) => {
  //   const r = getPositionAndSize(degree, floorSize);
  //   const s = boxDraw(0x000000, 0, 0, r.size);
  //   setPositions(s, r, true);
  //   s.pivot.set(r.size / 2, r.size / 2);
  //   s.zIndex = r.size - 1;
  //   s.filters = [myFilter];
  //   c.addChild(s);
  //   return s;
  // };

  firstDrawTiles(); // 초기 캐러셀 그리기
  mainTitle(); // 메인 타이틀 및 버튼 그리기
};
const swiftTiles = (direction: number) => {
  // 캐러셀을 좌/우로 움직이는 애니메이션 함수
  const f = myJigsawFloor[0];
  select.movingON = true;
  let baseVector = f.mobileNow ? 7 : 15;
  baseVector -=
    select.moveAccel < baseVector / 2
      ? select.moveAccel
      : Math.floor(baseVector / 2);
  const t = select.sevenTiles;
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
      drawSelectTileWithShadow(thisDegree, s, select.fSize);

      if (Math.abs(nDegree - thisDegree) > 0.01) {
        index++;
        requestAnimationFrame(moveLoop);
      } else {
        drawSelectTileWithShadow(nDegree, s, select.fSize);
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
        select.startNum = plus(select.startNum);
        select.endNum = plus(select.endNum);
        d = select.degrees[6];
        t = PIXI.Assets.get(select.sFileNames[select.endNum]);
        s = makeSelectSprite(d, t, select.selectC2, select.fSize);
        // b = makeSelectSpriteShadow(d, t, select.selectC2, select.fSize)
        select.sevenTiles.push(s);
        // sevenShadows.push(b)
        s.alpha = 0;
        // b.alpha = 0
        break;
      case RIGHT:
        select.startNum = minus(select.startNum);
        select.endNum = minus(select.endNum);
        d = select.degrees[0];
        t = PIXI.Assets.get(select.sFileNames[select.startNum]);
        s = makeSelectSprite(d, t, select.selectC2, select.fSize);
        // b = makeSelectSpriteShadow(d, t, select.selectC2, select.fSize)
        select.sevenTiles.unshift(s);
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
        // console.log('select.KEY :', select.KEY)
        if (select.KEY == LEFT || select.KEY == RIGHT) {
          swiftTiles(select.KEY);
          select.moveAccel++;
        } else {
          select.movingON = false;
        }
      }
    };
    appearLoop();
  };
  switch (direction) {
    case LEFT:
      for (let i = 1; i < t.length; i++) {
        tileM(i, select.degrees[i], select.degrees[i - 1]);
      }
      tileV(0);
      t.shift();
      // bs.shift()
      tileA(LEFT);
      break;
    case RIGHT:
      for (let i = 0; i < t.length - 1; i++) {
        tileM(i, select.degrees[i], select.degrees[i + 1]);
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
  const f = myJigsawFloor[0];
  const fb = new PIXI.Container();
  const maskContainer = new PIXI.Container();
  const shadowContainer = new PIXI.Container();
  const myf = new PIXI.BlurFilter({
    strength: 7,
  });

  select.selectC1.addChild(fb, maskContainer, shadowContainer);

  const textBackground = new PIXI.Sprite(
    PIXI.Assets.get("assets/jigsaw/background.jpg")
  );

  /// 이전, 다음 버튼 텍스트
  const selectPrevNextTextPrepare = (
    s: string,
    width = select.fSize / 4,
    height = select.fSize / 9,
    textSize = select.fSize / 17
  ) => {
    const text = textPrepare(s, 0xffffff, textSize, 0, 0, true);
    const shadow = textPrepare(s, 0x000000, textSize, 0, 0, true);
    text.width = width;
    text.height = height;
    shadow.width = text.width;
    shadow.height = text.height;
    return [text, shadow];
  };
  const [jigSaw, jigSawB] = selectPrevNextTextPrepare(
    "JigSaw",
    select.fSize / 2,
    select.fSize / 7,
    select.fSize / 10
  );
  const [prev, prevB] = selectPrevNextTextPrepare("prev");
  const [next, nextB] = selectPrevNextTextPrepare("next");

  textBackground.anchor.set(0.5, 0.5);
  textBackground.position.set(select.fSize / 2, select.fSize / 2);
  jigSaw.position.set(select.fSize / 2, select.fSize / 2 - select.fSize / 3);
  // fd.filters = [myf]
  jigSawB.position.set(jigSaw.x, jigSaw.y);
  // fc.addChild(prevB, prev, nextB, next)
  prev.position.set(
    select.fSize / 2 - select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  prevB.position.set(
    select.fSize / 2 - select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  next.position.set(
    select.fSize / 2 + select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  nextB.position.set(
    select.fSize / 2 + select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );

  maskContainer.addChild(jigSaw, prev, next);
  shadowContainer.addChild(jigSawB, prevB, nextB);
  const mask = containerToSprite(maskContainer);
  const shadow = containerToSprite(shadowContainer);
  shadow.filters = [myf];
  textBackground.mask = mask;
  shadow.position.set(select.fSize / 80, select.fSize / 80);

  fb.addChild(shadow, mask, textBackground);
  fb.position.set((select.fSize - fb.width) / 2, (select.fSize - fb.width) / 2);
  maskContainer.parent?.removeChild(maskContainer, shadowContainer);

  // console.log('prev.x, prev.y, prev.width, prev.height :', prev.x, prev.y, prev.width, prev.height);
  const nextPhotoButtonFunction = () => {
    // 이전 이미지 버튼 액션
    if (!select.movingON) swiftTiles(LEFT);
    select.KEY = LEFT;
    select.moveAccel = 0;
  };
  const prevPhotoButtonFunction = () => {
    // 다음 이미지 버튼 액션
    if (!select.movingON) swiftTiles(RIGHT);
    select.KEY = RIGHT;
    select.moveAccel = 0;
  };
  const centerPhotoButtonFunction = () => {
    // 중앙 이미지를 클릭했을 때
    if (!select.tileNumberMode) {
      // 퍼즐 조각 수 선택 모드로 전환
      for (let i = 0; i < 3; i++) {
        // 이미지 3개 앞당기기
        select.startNum = plus(select.startNum);
        select.endNum = plus(select.endNum);
      }
      let string = select.sFileNames[select.startNum];
      string = string
        .replace("assets/jigsaw/", "")
        .replace(".jpg", "")
        .replace("/s0", "$");
      let strings = string.split("$");
      f.folder = strings[0];
      f.file = strings[1];
      console.log("strings :", strings);
      selectTileNumber(); // 조각 수 선택 화면으로 전환
      select.tileNumberMode = true;
    } else {
      // 최종 선택 완료
      for (let i = 0; i < 3; i++) {
        // 이미지 3개 앞당기기
        select.startNum = plus(select.startNum);
      }
      let s = select.sFileNames[select.startNum];
      s = s.replace("assets/jigsaw/b/", "").replace(".jpg", "");
      console.log("s :", s);
      if (Number(s) != f.tNum) {
        cookieWrite({ jigsawPosition: "" }); // 조각 수가 변경되면 쿠키 초기화
      }
      f.tNum = Number(s);
      jigsawRestart(f.folder, f.file, f.tNum); // 선택한 정보로 게임 재시작
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
  // const bb = boxButtonDraw(fEnd, 0x000000, (fb.width - fb.width * 2 / 3) / 2, (fb.width - fb.width * 1.2 / 2.2) / 2, fb.width * 2 / 3, fb.width * 2 / 3)

  prevPhotoButton.on("pointerup", () => (select.KEY = 0)); // 마우스 떼면 select.KEY 초기화
  nextPhotoButton.on("pointerup", () => (select.KEY = 0));
  fb.addChild(prevPhotoButton, nextPhotoButton, centerPhotoButton);
  // moveB(b)
};
const selectTileNumber = () => {
  // 퍼즐 조각 수를 선택하는 화면으로 전환하는 함수
  const f = myJigsawFloor[0];
  select.sFileNames = [];
  select.sevenTiles = [];
  const startNumSet = () => {
    for (let i = 0; i < f.tNum - 7; i++) {
      select.startNum = plus(select.startNum);
      select.endNum = plus(select.endNum);
    }
  };
  for (let i = 0; i < 12; i++) {
    // 조각 수 이미지 파일명 목록 04~15.jpg 퍼즐 가로 숫자에 따른 파일명
    const s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4);
    select.sFileNames.push("assets/jigsaw/b/" + s + ".jpg");
  }
  select.startNum = 0;
  select.endNum = 11;
  startNumSet();
  select.selectC2.parent?.removeChild(select.selectC2);
  select.selectC2 = new PIXI.Container();
  f.bg3.addChild(select.selectC2);
  select.selectC2.zIndex = 0;
  select.selectC2.sortableChildren = true;
  firstDrawTiles(); // 조각 수 캐러셀 그리기
};
const firstDrawTiles = () => {
  // 캐러셀의 초기 타일들을 그리는 함수
  let num = select.startNum;
  for (let i = 0; i < 7; i++) {
    const t = PIXI.Assets.get(select.sFileNames[num]);
    const s = makeSelectSprite(
      select.degrees[i],
      t,
      select.selectC2,
      select.fSize
    );
    // let b = makeSelectSpriteShadow(select.degrees[i], t, select.selectC2, select.fSize)
    select.sevenTiles.push(s);
    // sevenShadows.push(b)
    num = plus(num);
  }
  select.endNum = minus(num);
  const r = getPositionAndSize(-90, select.fSize);
  // const r = getPositionAndSize(-90, f.fSize);
  const box = boxDraw(
    0xffffff,
    r.x - r.size,
    r.y - (r.size * 6) / 5,
    r.size * 2
  );
  box.alpha = 0.5;
  select.selectC2.addChild(box);
  // console.log('box.x, box.y :', box.x, box.y);
  select.selectC2.x = 0;
  select.selectC2.y = select.fSize - select.fSize / 8;
};

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

const drawSelectTileWithShadow = (
  // 스프라이트와 그림자를 그리는 함수
  degree: number,
  s: PIXI.Sprite | PIXI.Graphics,
  floorSize: number = 100,
  b: boolean = false
) => {
  const r = getPositionAndSize(degree, floorSize);
  setPositions(s, r, b);
};

const makeSelectSprite = (
  // 캐러셀에 표시될 이미지 스프라이트를 생성하는 함수 (그림자 포함)
  degree: number,
  t: PIXI.Texture,
  selectC2: PIXI.Container,
  fSize: number = 100
) => {
  const selectTileWithShadow = getSpriteWithShadow(t);
  const r = getPositionAndSize(degree, fSize);
  selectTileWithShadow.anchor.set(0.5, 0.5);
  setPositions(selectTileWithShadow, r);
  selectC2.addChild(selectTileWithShadow);
  return selectTileWithShadow;
};

const plus = (n: number) => (n == select.sFileNames.length - 1 ? 0 : n + 1); // 다음 인덱스 계산
const minus = (n: number) => (n == 0 ? select.sFileNames.length - 1 : n - 1); // 이전 인덱스 계산
