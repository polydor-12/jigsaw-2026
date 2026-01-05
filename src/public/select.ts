import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  containerToSprite,
  cookieWrite,
  degreesToRadians,
  LEFT,
  myReturn,
  RIGHT,
  textPrepare,
} from "./myClasses";
import { jigsawRestart, myJigsawFloor } from "./jigsaw";

export interface positionData {
  // 캐러셀 아이템의 위치, 크기, 각도 데이터 인터페이스
  x: number;
  y: number;
  size: number;
  angle: number;
}

export const selectStart = (r: myReturn) => {
  // 이미지 선택 화면을 시작하는 함수
  const f = myJigsawFloor[0];
  f.selectMode = true;
  f.borderSprite.off("pointerdown");
  f.borderSprite.on("pointerdown", f.selectEnd);
  let selectTileNumberMode = false;
  let sFileNames: string[] = [];
  for (let folder = 0; folder < 5; folder++) {
    for (let file = 0; file < 9; file++) {
      sFileNames.push(
        "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg"
      );
    }
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
  f.bg3.sortableChildren = true;
  selectC2.zIndex = 0;
  selectC1.zIndex = 1;
  f.bg3.addChild(selectC2, selectC1);
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
    const r = getPositionAndSize(-90, f.fSize);
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
    let baseVector = f.mobileNow ? 7 : 15;
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
      const JigSaw = textPrepare(
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
      const JigSawB = textPrepare(
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
      const prev = textPrepare("prev", 0xffffff, fSize / 17, 0, 0, true);
      prev.width = fSize / 4;
      prev.height = fSize / 9;
      const prevB = textPrepare("prev", 0x000000, fSize / 17, 0, 0, true);
      prevB.width = prev.width;
      prevB.height = prev.height;
      const next = textPrepare("next", 0xffffff, fSize / 17, 0, 0, true);
      next.width = prev.width;
      next.height = prev.height;
      const nextB = textPrepare("next", 0x000000, fSize / 17, 0, 0, true);
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
          f.folder = strings[0];
          f.file = strings[1];
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
      // const bb = boxButtonDraw(f.selectEnd, 0x000000, (fb.width - fb.width * 2 / 3) / 2, (fb.width - fb.width * 1.2 / 2.2) / 2, fb.width * 2 / 3, fb.width * 2 / 3)

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
      for (let i = 0; i < f.tNum - 7; i++) {
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
    f.bg3.addChild(selectC2);
    selectC2.zIndex = 0;
    selectC2.sortableChildren = true;
    firstDrawTiles(); // 조각 수 캐러셀 그리기
  };
  firstDrawTiles(); // 초기 캐러셀 그리기
  mainTitle(); // 메인 타이틀 및 버튼 그리기
};
