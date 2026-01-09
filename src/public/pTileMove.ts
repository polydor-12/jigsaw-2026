import { myJigsawFloor } from "./jigsaw";
import { cookieWrite, spriteCombine } from "./utils";
import { pTile } from "./pTile";

/**
 * @function makeSpriteMove
 * @description pTile 객체를 실제 움직일 수 있는 상호작용 가능한 스프라이트로 만들고,
 * 퍼즐 조각의 상태(맞춰졌는지 여부)에 따라 다른 동작을 정의합니다.
 * @param {pTile} p - 상호작용을 설정할 pTile 객체.
 */
export const makeSpriteMove = (p: pTile) => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스에 접근

  /**
   * @function xyCookieWrite
   * @description 완성된 조각의 좌표를 쿠키에 저장하는 헬퍼 함수입니다.
   * 이미 저장된 정보가 있다면 이어서 추가합니다.
   * @param {number} x - 맞춰진 조각의 x 인덱스.
   * @param {number} y - 맞춰진 조각의 y 인덱스.
   */
  const xyCookieWrite = (x: number, y: number) => {
    const xy = String(x) + "#" + String(y); // "x#y" 형식으로 좌표 문자열 생성
    // 기존 쿠키 정보가 비어있으면 새로 추가, 아니면 "$"로 구분하여 추가
    f.cookie += f.cookie == "" ? xy : "$" + xy;
    cookieWrite({ jigsawPosition: f.cookie }); // 유틸리티 함수를 통해 쿠키에 저장
  };

  /**
   * @function tileFix
   * @description 퍼즐 조각이 올바른 위치에 놓였을 때 호출되는 함수입니다.
   * 조각의 최종 배치 애니메이션과 게임 상태 업데이트를 처리합니다.
   * @param {pTile} p - 맞춰진 pTile 객체.
   */
  const tileFix = (p: pTile) => {
    /**
     * @function tileFixAction
     * @description 조각이 제자리에 맞춰질 때 시각적 애니메이션을 실행하는 함수입니다.
     * 확대/축소 및 회전 효과를 통해 조각이 맞춰지는 느낌을 줍니다.
     * @param {pTile} p - 애니메이션을 적용할 pTile 객체.
     */
    const tileFixAction = (p: pTile) => {
      // 기존 스프라이트(p.s)를 제거하고, 이미지(p.sp)와 그림자(p.sb)를 개별적으로 부모 컨테이너에 추가하여 애니메이션을 준비합니다.
      p.s.parent?.addChild(p.sb, p.sp);
      p.s.parent?.removeChild(p.s);

      // 스프라이트들의 앵커 포인트를 중앙으로 설정하여 중앙을 기준으로 확대/축소 및 회전하도록 합니다.
      p.sb.anchor.set(0.5, 0.5);
      p.sp.anchor.set(0.5, 0.5);

      // 스프라이트들의 최종 위치를 설정합니다. (그림자는 약간의 오프셋 적용)
      p.sp.position.set(p.ox, p.oy);
      p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);

      // zIndex를 높여서 애니메이션 중 다른 조각들 위에 표시되도록 합니다.
      p.sp.zIndex = 100001;
      p.sb.zIndex = 100000;

      // 애니메이션에 필요한 초기값들을 설정합니다.
      const oSize = p.sp.width; // 원래 크기
      const maxSize = (p.sp.width * 12) / 10; // 최대 확대 크기 (원래 크기의 120%)
      let sVector = f.mobileNow // 모바일 여부에 따라 확대/축소 속도 조절
        ? (maxSize - oSize) / 15
        : (maxSize - oSize) / 30;
      let rVector = f.mobileNow // 모바일 여부에 따라 회전 속도 조절
        ? 360 / (15 * 2)
        : 360 / (30 * 2);

      /**
       * @function sizeAction
       * @description 퍼즐 조각의 크기와 각도를 변경하는 재귀 애니메이션 함수입니다.
       */
      const sizeAction = () => {
        // 그림자와 이미지 스프라이트의 각도와 크기를 동시에 변경합니다.
        p.sb.angle += rVector;
        p.sb.width += sVector;
        p.sb.height += sVector;
        p.sp.angle += rVector;
        p.sp.width += sVector;
        p.sp.height += sVector;

        // 조각이 최대 크기를 초과하면 확대 방향을 반대로 전환합니다.
        if (p.sp.width > maxSize) {
          sVector = -sVector;
          // 각도가 거의 360도에 도달하면 회전 애니메이션을 멈춥니다.
          if (Math.abs(360 - p.sp.angle) < rVector) {
            rVector = 0;
          }
        }
        // 조각이 원래 크기보다 작아지면 애니메이션을 종료하고 후속 작업을 실행합니다.
        if (p.sp.width < oSize) {
          p.sb.angle = 0; // 각도 초기화
          p.sp.angle = 0; // 각도 초기화
          // 최종 위치로 정확히 설정합니다.
          p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);
          p.sp.position.set(p.ox, p.oy);
          combineAfterAction(); // 애니메이션 종료 후 스프라이트 합치기 실행
        } else {
          // 애니메이션이 아직 진행 중이면 다음 프레임에서 sizeAction을 다시 호출합니다.
          requestAnimationFrame(sizeAction);
        }
      };
      sizeAction(); // 애니메이션 시작
    };

    /**
     * @function combineAfterAction
     * @description 조각의 애니메이션이 끝난 후, 해당 조각을 배경 스프라이트와 합치는 함수입니다.
     * 퍼즐 조각이 완전히 맞춰졌을 때의 최종 처리 로직을 담고 있습니다.
     */
    const combineAfterAction = () => {
      // 완성된 조각의 이미지 부분을 퍼즐판의 borderSprite에 합칩니다.
      f.borderSprite.texture = spriteCombine(
        "f_borderSprite",
        f.borderSprite,
        p.sp
      );
      // 완성된 조각의 그림자 부분을 퍼즐판의 backgroundSprite에 합칩니다.
      f.backgroundSprite.texture = spriteCombine(
        "f_backgroundSprite",
        f.backgroundSprite,
        p.sb,
        f.shadowMargin,
        f.shadowMargin
      );
      p.done = true; // 조각이 맞춰졌음을 표시
      xyCookieWrite(p.nx, p.ny); // 맞춰진 조각의 위치를 쿠키에 저장
      f.gameEndingCheck(); // 게임 종료 여부를 확인합니다.
    };

    tileFixAction(p); // 조각 고정 애니메이션 시작
  };

  /**
   * @function moveByMouse
   * @description 데스크탑 환경에서 마우스 드래그를 통해 퍼즐 조각을 움직이는 로직을 처리합니다.
   * @param {pTile} p - 움직일 pTile 객체.
   */
  const moveByMouse = (p: pTile) => {
    const c = p.s; // pTile의 메인 스프라이트
    const parentWidth = f.fSize; // 퍼즐판의 가로 크기
    const parentHeight = f.fSize_h; // 퍼즐판의 세로 크기
    c.interactive = true; // 상호작용 가능하도록 설정
    c.eventMode = "static"; // 이벤트 모드를 static으로 설정하여 항상 이벤트를 받도록 함
    c.cursor = "pointer"; // 마우스 오버 시 커서 모양 변경

    let pickUp = false; // 조각을 집어 들었는지 여부

    /**
     * @function onDragStart
     * @description 마우스 클릭(pointerdown) 시 드래그를 시작하는 이벤트 핸들러입니다.
     */
    const onDragStart = () => {
      if (!pickUp) {
        pickUp = true; // 조각을 집어 듦
        f.zIndex++; // zIndex 증가시켜 조각이 다른 조각들 위에 표시되도록 함
        c.zIndex = f.zIndex;
        c.on("pointermove", onDragMove); // 마우스 이동 이벤트 리스너 추가
      } else {
        pickUp = false; // 드래그 중 다시 클릭하면 드래그 종료
        c.off("pointermove", onDragMove); // 마우스 이동 이벤트 리스너 제거
        onDragEnd(); // 드래그 종료 처리
      }
    };

    /**
     * @function onDragEnd
     * @description 마우스 클릭 해제 시 드래그를 종료하는 이벤트 핸들러입니다.
     * 조각의 위치가 올바르면 `tileFix`를 호출하여 고정시킵니다.
     */
    const onDragEnd = () => {
      // 조각의 현재 위치가 완성 위치(p.ox, p.oy) 근처라면
      if (
        Math.abs(c.x - p.ox) < f.tSize / 5 &&
        Math.abs(c.y - p.oy) < f.tSize / 5
      ) {
        tileFix(p); // 조각 고정 처리
      }
    };

    /**
     * @function onDragMove
     * @description 마우스가 움직일 때 조각의 위치를 업데이트하는 이벤트 핸들러입니다.
     * @param {any} event - PIXI 이벤트 객체.
     */
    const onDragMove = (event: any) => {
      if (pickUp) {
        const newPosition = event.data.getLocalPosition(c.parent); // 새로운 마우스 위치
        // 새로운 위치가 퍼즐판 경계 내에 있는지 확인하고, 그 안에 있으면 조각의 위치를 업데이트합니다.
        if (
          newPosition.x <= parentWidth &&
          newPosition.x >= 0 &&
          newPosition.y <= parentHeight &&
          newPosition.y >= 0
        ) {
          c.x = newPosition.x;
          c.y = newPosition.y;
        } else {
          // 마우스가 퍼즐판 경계를 벗어나면 드래그를 강제로 종료합니다.
          pickUp = false;
          c.off("pointermove", onDragMove);
          onDragEnd();
        }
      }
    };
    c.on("pointerdown", onDragStart); // 마우스 클릭 시작 이벤트 리스너 추가
  };

  /**
   * @function m_moveByMouse
   * @description 모바일 환경에서 터치 드래그를 통해 퍼즐 조각을 움직이는 로직을 처리합니다.
   * `moveByMouse`와 유사하지만 터치 이벤트를 사용합니다.
   * @param {pTile} p - 움직일 pTile 객체.
   */
  const m_moveByMouse = (p: pTile) => {
    p.s.interactive = true; // 상호작용 가능하도록 설정
    p.s.eventMode = "static"; // 이벤트 모드를 static으로 설정
    p.s.cursor = "pointer"; // 모바일에서는 사용되지 않지만 일관성을 위해 설정

    let pickUp = false; // 조각을 집어 들었는지 여부

    /**
     * @function onDragStart
     * @description 터치 시작(touchstart) 시 드래그를 시작하는 이벤트 핸들러입니다.
     */
    const onDragStart = () => {
      console.log("onDragStart");
      pickUp = true; // 조각을 집어 듦
      f.zIndex++; // zIndex 증가
      p.s.zIndex = f.zIndex;
      p.s.on("touchmove", onDragMove); // 터치 이동 이벤트 리스너 추가
    };

    /**
     * @function onDragEnd
     * @description 터치 종료(touchend) 시 드래그를 종료하는 이벤트 핸들러입니다.
     * 조각의 위치가 올바르면 `tileFix`를 호출하여 고정시킵니다.
     */
    const onDragEnd = () => {
      console.log("onDragEnd");
      // 조각의 현재 위치가 완성 위치(p.ox, p.oy) 근처라면
      if (
        Math.abs(p.s.x - p.ox) < f.tSize / 5 &&
        Math.abs(p.s.y - p.oy) < f.tSize / 5
      ) {
        tileFix(p); // 조각 고정 처리
      } else {
        p.s.off("touchmove", onDragMove); // 올바른 위치가 아니면 이동 이벤트 리스너 제거
        pickUp = false; // 드래그 상태 해제
      }
    };

    /**
     * @function onDragMove
     * @description 터치가 움직일 때 조각의 위치를 업데이트하는 이벤트 핸들러입니다.
     * @param {any} event - PIXI 이벤트 객체.
     */
    const onDragMove = (event: any) => {
      console.log("onDragMove");
      if (pickUp) {
        const newPosition = event.data.getLocalPosition(p.s.parent); // 새로운 터치 위치
        // 새로운 위치가 퍼즐판 경계 내에 있는지 확인하고, 그 안에 있으면 조각의 위치를 업데이트합니다.
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
    p.s.on("touchstart", onDragStart).on("touchend", onDragEnd); // 터치 시작/종료 이벤트 리스너 추가
  };

  // p.done 속성을 기반으로 퍼즐 조각의 초기 상태를 설정합니다.
  if (!p.done) {
    // 아직 맞춰지지 않은 조각인 경우
    if (f.mobileNow) {
      m_moveByMouse(p); // 모바일 터치 이동 이벤트 적용
    } else {
      moveByMouse(p); // 데스크탑 마우스 이동 이벤트 적용
    }
    tileScatter(p, true); // 조각을 무작위로 흩뿌립니다.
  } else {
    // 이미 맞춰진 조각인 경우 (쿠키에서 로드된 상태)
    // 조각을 배경과 보더 스프라이트에 직접 배치하고, 상호작용은 비활성화합니다.
    f.bg2.removeChild(p.s); // 기존 메인 스프라이트를 제거
    // 이미지와 그림자 스프라이트를 각각 보더와 배경 컨테이너에 직접 추가합니다.
    f.border.addChild(p.sp);
    f.bg1.addChild(p.sb);
    // 앵커와 위치를 다시 설정합니다.
    p.sp.anchor.set(0.5, 0.5);
    p.sp.position.set(p.ox, p.oy);
    p.sb.anchor.set(0.5, 0.5);
    p.sb.position.set(p.ox + f.shadowMargin, p.oy + f.shadowMargin);
  }
};

/**
 * @function tileScatter
 * @description 퍼즐 조각을 지정된 위치로 부드럽게 이동시키는 애니메이션을 수행합니다.
 * 주로 게임 시작 시 조각들을 흩뿌리거나, 원위치로 되돌릴 때 사용됩니다.
 * @param {pTile} p - 움직일 pTile 객체.
 * @param {boolean} s - true이면 랜덤 위치로, false이면 원래 위치(p.ox, p.oy)로 이동합니다.
 */
export const tileScatter = (p: pTile, s: boolean = false) => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스

  let x: number, y: number;
  if (s) {
    // s가 true이면 조각을 랜덤 위치로 흩뿌립니다.
    // x 좌표는 퍼즐판 전체 가로 범위 내에서, y 좌표는 퍼즐판 하단 영역에서 랜덤하게 설정합니다.
    x = Math.floor(Math.random() * f.fSize);
    y = Math.floor(Math.random() * (f.fSize_h - f.fSize) + f.fSize);
  } else {
    // s가 false이면 조각의 원래 완성 위치(p.ox, p.oy)로 이동시킵니다.
    x = p.ox;
    y = p.oy; // 여기서는 p.ox가 아니라 p.oy가 맞습니다. (기존 코드 오류 가능성)
  }

  const v = f.mobileNow ? 25 : 60; // 모바일 여부에 따라 애니메이션 속도(프레임 수) 조절
  const xVector = (p.s.x - x) / v; // x축 이동량
  const yVector = (p.s.y - y) / v; // y축 이동량

  /**
   * @function tMove
   * @description 조각을 목표 위치까지 부드럽게 이동시키는 재귀 애니메이션 함수입니다.
   */
  const tMove = () => {
    // 목표 위치에 충분히 가까워질 때까지 조각의 위치를 업데이트합니다.
    if (
      Math.abs(p.s.x - x) > Math.abs(xVector) &&
      Math.abs(p.s.y - y) > Math.abs(yVector) // yVector로 수정
    ) {
      p.s.x -= xVector;
      p.s.y -= yVector;
      requestAnimationFrame(tMove); // 다음 프레임에서 다시 호출
    } else {
      // 목표 위치에 도달하면 정확한 위치로 설정하고 애니메이션을 종료합니다.
      p.s.x = x;
      p.s.y = y;
    }
  };
  tMove(); // 애니메이션 시작
};
