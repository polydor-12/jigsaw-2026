import * as PIXI from "pixi.js";
import { mTile } from "./mTile";
import { myJigsawFloor } from "./jigsaw";
import {
  boxDraw,
  containerToSprite,
  cookieWrite,
  delay,
  spriteCombine,
  textureToSprite,
  tileShadow,
} from "./myClasses";

// 개별 퍼즐 조각의 정보를 담는 인터페이스
export interface pTile {
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

export const makePTiles = async (mTileData: mTile[][]) => {
  console.log("makePTiles 시작");
  const f = myJigsawFloor[0];

  const allPromises1 = mTileData.flatMap((data) =>
    data.map(async (mTile) => {
      await getTile(mTile);
    })
  );
  await Promise.all(allPromises1);
  await delay(1000);
  const allPromises2 = f.pTiles.flatMap(async (pTile, index) => {
    await makeSpriteMove(pTile);
  });
  await Promise.all(allPromises2);
  // pTileContainers.forEach((pTileContainer) => {
  //   pTileContainer.destroy({ children: true });
  // });
};

export const getTile = async (t: mTile) => {
  // 하나의 퍼즐 조각 스프라이트를 생성하는 함수
  const f = myJigsawFloor[0];
  const c = new PIXI.Container();
  const pTiles: pTile[] = f.pTiles;
  // 맞춰진 그림을 보여줌.

  // 원본 이미지에서 잘라낼 위치 계산
  const t_x = f.bSize / 2 + ((f.bSize * 5) / 7) * t.x;
  const t_y = f.bSize / 2 + ((f.bSize * 5) / 7) * t.y;

  // const m = await getMaskTile(t, 1, f.tSize); // 조각 모양 마스크 생성
  const m = textureToSprite(t.image as PIXI.Texture, f.tSize);

  // console.log('f.bSize :', f.bSize);
  // console.log('f.fSize :', f.fSize);
  let x = t_x - f.bSize / 2;
  let y = t_y - f.bSize / 2;
  // 이미지 경계를 벗어나지 않도록 조정
  if (x + f.bSize > f.bgt.width) {
    x = f.bgt.width - f.bSize;
  }
  if (y + f.bSize > f.bgt.width) {
    y = f.bgt.width - f.bSize;
  }
  const r = new PIXI.Rectangle(x, y, f.bSize, f.bSize);
  // const b = f.bgt.clone();

  const b = new PIXI.Texture({
    // 텍스처에서 해당 부분만 잘라내기
    source: f.bgt.source,
    frame: r,
  });

  const s = new PIXI.Sprite(b); // 스프라이트 생성 및 마스크 적용
  s.width = f.tSize;
  s.height = f.tSize;
  m.anchor.set(0, 0);
  s.mask = m;
  // 조각 테두리 생성
  const rectangle = boxDraw(0x000000, 0, 0, f.tSize, f.tSize);

  // const mmm = await getMaskTile(t, 2, f.tSize);

  const mmm = textureToSprite(t.border as PIXI.Texture, f.tSize);

  rectangle.mask = mmm;
  mmm.anchor.set(0, 0);
  // 그림자(cb)와 이미지(cp) 컨테이너 분리
  const cb = new PIXI.Container();
  c.addChild(cb);
  cb.addChild(mmm, rectangle);
  const cp = new PIXI.Container();
  c.addChild(cp);
  cp.addChild(m, s);
  c.pivot.set(f.tSize / 2, f.tSize / 2);
  c.position.set(t.x_p, t.y_p);
  // f.bg2.addChild(c);

  // pTile 객체 생성 및 배열에 추가

  const p: pTile = {
    // cb: cb,
    // cp: cp,
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

  p.sb = containerToSprite(cb, true); // 1. 이미지와 테두리(그림자용) 컨테이너를 각각 스프라이트로 변환
  p.sp = containerToSprite(cp, true);
  const tS = tileShadow(p.sb); // 2. 그림자 스프라이트에 그림자 효과(블러) 적용
  tS.position.set(f.shadowMargin, f.shadowMargin);
  p.sb = tS;

  const cc = new PIXI.Container(); // 3. 그림자와 이미지를 하나의 컨테이너에 합친 후, 다시 하나의 스프라이트로 변환
  // f.bg2.addChild(c);
  cc.addChild(tS, p.sb, p.sp);

  p.s = containerToSprite(cc); // 최종 조각 스프라이트
  p.s.anchor.set(0.5, 0.5);
  p.s.position.set(p.ox, p.oy);
  p.s.zIndex = 10 + Math.floor(Math.random() * 10);

  // c.parent?.removeChild(c);

  // p.cb.parent?.removeChild(p.cb, p.cp);
  p.zIndex = p.nx + p.ny * f.tNum;

  console.log("getTile : ");

  pTiles.push(p);
  f.bg2.addChild(p.s);
};

export const makeSpriteMove = (p: pTile) => {
  // pTile 객체를 실제 움직일 수 있는 스프라이트로 만드는 함수
  const f = myJigsawFloor[0];
  const xyCookieWrite = (x: number, y: number) => {
    // 완성된 조각의 위치를 쿠키에 저장하는 함수
    const xy = String(x) + "#" + String(y);
    f.cookie += f.cookie == "" ? xy : "$" + xy;
    cookieWrite({ jigsawPosition: f.cookie });
  };
  const tileFix = (p: pTile) => {
    // 조각이 제자리에 놓였을 때 처리하는 함수
    const tileFixAction = (p: pTile) => {
      // 조각이 맞춰지는 애니메이션
      const oSize = p.sp.width;
      const maxSize = (p.sp.width * 12) / 10;
      let sVector = f.mobileNow
        ? (maxSize - oSize) / 15
        : (maxSize - oSize) / 30;
      let rVector = f.mobileNow ? 360 / (15 * 2) : 360 / (30 * 2);
      p.s.parent?.addChild(p.sb, p.sp);
      p.s.parent?.removeChild(p.s);
      p.sb.anchor.set(0.5, 0.5);
      p.sp.anchor.set(0.5, 0.5);
      p.sp.position.set(p.ox, p.oy);
      p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);
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
          p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);
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
      f.borderSprite.texture = spriteCombine(f.borderSprite, p.sp);
      f.backgroundSprite.texture = spriteCombine(
        f.backgroundSprite,
        p.sb,
        f.shadowMargin,
        f.shadowMargin
      );
      p.done = true;
      f.endingCheck(); // 게임 종료 여부 확인
    };

    tileFixAction(p);
  };
  const moveByMouse = (p: pTile) => {
    // (데스크탑) 마우스로 조각을 움직이는 로직
    const c = p.s;
    const parentWidth = f.fSize;
    const parentHeight = f.fSize_h;
    c.interactive = true;
    c.eventMode = "static";
    c.cursor = "pointer";
    let pickUp = false;
    const onDragStart = () => {
      if (!pickUp) {
        pickUp = true;
        f.zIndex++;
        c.zIndex = f.zIndex;
        c.on("pointermove", onDragMove);
      } else {
        pickUp = false;
        c.off("pointermove", onDragMove);
        onDragEnd();
      }
    };
    const onDragEnd = () => {
      if (
        Math.abs(c.x - p.ox) < f.tSize / 5 &&
        Math.abs(c.y - p.oy) < f.tSize / 5
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
      f.zIndex++;
      p.s.zIndex = f.zIndex;
      p.s.on("touchmove", onDragMove);
    };
    const onDragEnd = () => {
      console.log("onDragEnd");

      if (
        Math.abs(p.s.x - p.ox) < f.tSize / 5 &&
        Math.abs(p.s.y - p.oy) < f.tSize / 5
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
          newPosition.x <= f.fSize && newPosition.x >= 0
            ? newPosition.x
            : p.s.x;
        p.s.y =
          newPosition.y <= f.fSize_h && newPosition.y >= 0
            ? newPosition.y
            : p.s.y;
      }
    };
    p.s.on("touchstart", onDragStart).on("touchend", onDragEnd);
  };
  console.log("makeSpriteMove : ");
  // p.sb = containerToSprite(p.cb); // 1. 이미지와 테두리(그림자용) 컨테이너를 각각 스프라이트로 변환
  // p.sp = containerToSprite(p.cp);
  // const tS = tileShadow(p.sb); // 2. 그림자 스프라이트에 그림자 효과(블러) 적용
  // tS.position.set(f.shadowMargin, f.shadowMargin);
  // p.sb = tS;

  // const cc = new PIXI.Container(); // 3. 그림자와 이미지를 하나의 컨테이너에 합친 후, 다시 하나의 스프라이트로 변환
  // // f.bg2.addChild(c);
  // cc.addChild(tS, p.sb, p.sp);

  // p.s = containerToSprite(cc); // 최종 조각 스프라이트
  // p.s.anchor.set(0.5, 0.5);
  // p.s.position.set(p.ox, p.oy);
  // p.s.zIndex = 10 + Math.floor(Math.random() * 10);
  // // c.parent?.removeChild(c);
  // p.cb.parent?.removeChild(p.cb, p.cp);
  // p.zIndex = p.nx + p.ny * f.tNum;

  if (!p.done) {
    // 아직 맞춰지지 않은 조각
    if (f.mobileNow) {
      // 4. 움직임 이벤트 추가 및 흩뿌리기
      m_moveByMouse(p);
    } else {
      moveByMouse(p);
    }
    f.tileScatter(p, true);
  } else {
    // 이미 맞춰진 조각 (쿠키에서 로드)
    // border와 바탕화면에 그리기
    f.bg2.removeChild(p.s);
    f.border.addChild(p.sp);
    f.bg1.addChild(p.sb);
    p.sp.anchor.set(0.5, 0.5);
    p.sp.position.set(p.ox, p.oy);
    p.sb.anchor.set(0.5, 0.5);
    p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);
  }
};
