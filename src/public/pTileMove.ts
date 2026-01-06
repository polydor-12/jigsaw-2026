import { myJigsawFloor } from "./jigsaw";
import { cookieWrite, spriteCombine } from "./utils";
import { pTile } from "./pTile";

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
      f.gameEndingCheck(); // 게임 종료 여부 확인
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
        // console.log("onDragMove : ", newPosition);
        if (
          newPosition.x <= parentWidth &&
          newPosition.x >= 0 &&
          newPosition.y <= parentHeight &&
          newPosition.y >= 0
        ) {
          c.x = newPosition.x;
          c.y = newPosition.y;
        } else {
          // console.log("onDragMove : 해제 ", newPosition);
          pickUp = false;
          c.off("pointermove", onDragMove);
          onDragEnd();
        }
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

  if (!p.done) {
    // 아직 맞춰지지 않은 조각
    if (f.mobileNow) {
      // 4. 움직임 이벤트 추가 및 흩뿌리기
      m_moveByMouse(p);
    } else {
      moveByMouse(p);
    }
    tileScatter(p, true);
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
export const tileScatter = (p: pTile, s: boolean = false) => {
  // 조각을 특정 위치로 움직이는 애니메이션 (흩뿌리기)
  const f = myJigsawFloor[0];
  let x: number, y: number;
  if (s) {
    // 랜덤 위치로 흩뿌리기
    x = Math.floor(Math.random() * f.fSize);
    y = Math.floor(Math.random() * (f.fSize_h - f.fSize) + f.fSize);
  } else {
    // 원래 위치로
    x = p.ox;
    y = p.ox;
  }
  const v = f.mobileNow ? 25 : 60;
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
