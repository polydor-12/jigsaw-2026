import { myJigsawFloor } from "./jigsaw";
import { makeSelectSprite, positionData, select } from "./select";
import { degreesToRadians, LEFT, RIGHT } from "./utils";
import * as PIXI from "pixi.js";
/**
 * @function swiftSelectTiles
 * @description 캐러셀의 이미지 타일들을 지정된 방향으로 부드럽게 이동시키는 애니메이션 함수입니다.
 * @param {number} direction - 이동 방향 (LEFT 또는 RIGHT).
 */
export const swiftSelectTiles = (direction: number) => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스
  select.movingON = true; // 캐러셀 이동 중 플래그 설정
  const baseVectorOriginal = f.mobileNow ? 7 : 15; // 모바일 여부에 따라 기본 이동 속도 조절
  // 이동 가속도를 적용하여 부드러운 가감속 효과를 줍니다.
  select.baseVector =
    baseVectorOriginal -
    (select.moveAccel < baseVectorOriginal / 2
      ? select.moveAccel
      : Math.floor(baseVectorOriginal / 2));
  // const t = select.sevenTiles; // 현재 표시되는 7개 타일 배열

  // direction에 따라 캐러셀 타일 이동 로직을 수행합니다.
  switch (direction) {
    case LEFT:
      // 왼쪽으로 이동: 오른쪽 타일들은 왼쪽으로 이동, 가장 왼쪽 타일은 사라지고, 새로운 타일이 오른쪽에 나타납니다.
      selectTileDisappear(0); // 가장 왼쪽 타일 사라지게 함
      for (let i = 1; i < select.sevenTiles.length; i++) {
        selectTileMove(i, select.degrees[i], select.degrees[i - 1]);
      }
      select.sevenTiles.shift(); // 맨 앞 배열에서 제거
      select.sevenTiles.push(selectTileAppear(LEFT)); // 새 타일 나타나게 함. 맨 뒤에 추가

      break;
    case RIGHT:
      // 오른쪽으로 이동: 왼쪽 타일들은 오른쪽으로 이동, 가장 오른쪽 타일은 사라지고, 새로운 타일이 왼쪽에 나타납니다.
      selectTileDisappear(select.sevenTiles.length - 1); // 가장 오른쪽 타일 사라지게 함
      for (let i = 0; i < select.sevenTiles.length - 1; i++) {
        selectTileMove(i, select.degrees[i], select.degrees[i + 1]);
      }
      select.sevenTiles.pop(); // 맨 뒤 배열에서 제거
      select.sevenTiles.unshift(selectTileAppear(RIGHT)); //새 타일 나타나게 함. 맨 앞에 추가
      break;
  }
};

/**
 * @function selectTileMove
 * @description 특정 타일을 새 위치로 이동시키는 애니메이션을 수행합니다.
 * @param {number} index - select.sevenTiles 배열 내 타일의 인덱스.
 * @param {number} startDegree - 타일의 시작 각도.
 * @param {number} endDegree - 타일의 목표 각도.
 */
const selectTileMove = (
  index: number,
  startDegree: number,
  endDegree: number
) => {
  const s = select.sevenTiles[index]; // 대상 스프라이트
  let thisDegree = startDegree; // 현재 각도
  const vector = (endDegree - startDegree) / select.baseVector; // 각도 변화량 (이동 속도)
  let frameIndex = 0; // 애니메이션 프레임 카운터

  /**
   * @function moveLoop
   * @description requestAnimationFrame을 사용하여 타일을 부드럽게 이동시키는 재귀 함수.
   */
  const tileMoveLoop = () => {
    thisDegree += vector; // 각도 업데이트
    // 애니메이션 중간에 타일의 투명도를 조절하여 부드러운 전환 효과를 줍니다.
    if (
      frameIndex < select.baseVector / 3 ||
      frameIndex > (select.baseVector * 2) / 3
    ) {
      s.alpha = 1;
    } else {
      s.alpha = 0.85;
    }
    // 업데이트된 각도에 따라 타일의 위치와 그림자를 다시 그립니다.
    drawSelectTileWithShadow(thisDegree, s, select.fSize);

    // 목표 각도에 도달하지 않았으면 다음 프레임에서 moveLoop를 다시 호출합니다.
    if (Math.abs(endDegree - thisDegree) > 0.01) {
      frameIndex++;
      requestAnimationFrame(tileMoveLoop);
    } else {
      // 목표 각도에 도달하면 최종 위치로 설정합니다.
      drawSelectTileWithShadow(endDegree, s, select.fSize);
    }
  };
  tileMoveLoop(); // 애니메이션 시작
};

/**
 * @function selectTileAppear
 * @description 새로 나타나는 타일의 투명도를 조절하여 부드럽게 나타나게 하는 애니메이션.
 * @param {number} directions - 새로운 타일이 추가될 방향 (LEFT 또는 RIGHT).
 */
const selectTileAppear = (directions: number) => {
  const left = directions == LEFT;
  const plusOrMinus = left ? plus : minus;
  select.startNum = plusOrMinus(select.startNum); // 시작 인덱스 업데이트
  select.endNum = plusOrMinus(select.endNum); // 끝 인덱스 업데이트
  const degree = select.degrees[left ? 6 : 0]; // 가장 오른쪽 각도 // 가장 왼쪽 각도
  const texture = PIXI.Assets.get(
    select.sFileNames[left ? select.endNum : select.startNum] // 맨 오른쪽 texture // 맨 왼쪽 texture
  ); // 새 타일의 텍스처 로드
  const newSelectSprite = makeSelectSprite(
    degree,
    texture,
    select.selectC2,
    select.fSize
  ); // 새 스프라이트 생성

  newSelectSprite.alpha = 0; // 초기 투명도 0

  /**
   * @function appearLoop
   * @description 타일의 투명도를 점차 증가시켜 나타나게 하는 재귀 함수.
   */
  const appearLoop = () => {
    newSelectSprite.alpha += 1 / select.baseVector; // 투명도 증가
    if (newSelectSprite.alpha < 1) {
      requestAnimationFrame(appearLoop); // 아직 완전히 나타나지 않았다면 다음 프레임에서 호출
    } else {
      // 완전히 나타나면 다음 이동이 필요한지 확인합니다.
      if (select.KEY == LEFT || select.KEY == RIGHT) {
        swiftSelectTiles(select.KEY); // 다음 이동 실행
        select.moveAccel++; // 가속도 증가
      } else {
        select.movingON = false; // 이동 완료
      }
    }
  };
  appearLoop(); // 애니메이션 시작
  return newSelectSprite;
};

/**
 * @function selectTileDisappear
 * @description 사라지는 타일의 투명도를 조절하여 부드럽게 사라지게 하는 애니메이션.
 * @param {number} index - select.sevenTiles 배열 내 타일의 인덱스.
 */
const selectTileDisappear = (index: number) => {
  const s = select.sevenTiles[index]; // 대상 스프라이트
  /**
   * @function disappearLoop
   * @description 타일의 투명도를 점차 감소시켜 사라지게 하는 재귀 함수.
   */
  const disappearLoop = () => {
    s.alpha -= 1 / select.baseVector; // 투명도 감소
    if (s.alpha > 0) {
      requestAnimationFrame(disappearLoop); // 아직 완전히 사라지지 않았다면 다음 프레임에서 호출
    } else {
      s.parent?.removeChild(s); // 완전히 사라지면 부모 컨테이너에서 제거
    }
  };
  disappearLoop(); // 애니메이션 시작
};

/**
 * @function drawSelectTileWithShadow
 * @description 특정 각도에 해당하는 위치에 스프라이트와 그림자를 그려 화면에 업데이트하는 함수입니다.
 * @param {number} degree - 타일의 각도 (단위: 도).
 * @param {PIXI.Sprite | PIXI.Graphics} s - 그릴 대상 스프라이트 또는 그래픽스 객체.
 * @param {number} [floorSize=100] - 게임 플로어의 기준 크기.
 * @param {boolean} [b=false] - true일 경우 그림자 효과를 위한 추가 마진을 적용합니다.
 */
export const drawSelectTileWithShadow = (
  degree: number,
  s: PIXI.Sprite | PIXI.Graphics,
  floorSize: number = 100,
  b: boolean = false
) => {
  const r = getPositionAndSize(degree, floorSize); // 위치, 크기, 각도 계산
  setPositions(s, r, b); // 계산된 값을 스프라이트에 적용
};

/**
 * @function getPositionAndSize
 * @description 캐러셀 UI 내에서 아이템의 회전 각도에 따라 x, y 위치, 크기, 그리고 회전 각도를 계산하는 함수입니다.
 * @param {number} degree - 아이템의 중심으로부터의 각도 (단위: 도).
 * @param {number} [fSize=100] - 게임 플로어의 기준 크기.
 * @returns {positionData} 계산된 위치, 크기, 각도 정보를 담은 객체.
 */
export const getPositionAndSize = (
  degree: number,
  fSize: number = 100
): positionData => {
  const radius = (fSize * 4) / 5; // 회전 반지름
  const tSize = fSize / 2; // 기본 타일 크기
  // 원형 경로를 따라 x, y 위치 계산
  const x = fSize / 2 + Math.cos(degreesToRadians(degree)) * radius;
  const y = fSize / 2 + Math.sin(degreesToRadians(degree)) * radius;
  // 중앙에 가까울수록 크고, 멀어질수록 작아지도록 크기 계산
  const size = tSize - Math.abs(x - fSize / 2) * 0.73;
  const angle = degree + 90; // 실제 표시될 각도 조정
  const r: positionData = { x: x, y: y, size: size, angle: angle };
  return r;
};

/**
 * @function setPositions
 * @description 계산된 위치, 크기, 각도 정보를 PIXI.Sprite 또는 PIXI.Graphics 객체에 적용하는 함수입니다.
 * @param {PIXI.Sprite | PIXI.Graphics} s - 위치/크기를 설정할 스프라이트 또는 그래픽스 객체.
 * @param {positionData} r - 적용할 위치, 크기, 각도 정보를 담은 객체.
 * @param {boolean} [b=false] - true일 경우 그림자 효과를 위한 추가 마진을 적용합니다.
 */
export const setPositions = (
  s: PIXI.Sprite | PIXI.Graphics,
  r: positionData,
  b: boolean = false
) => {
  s.width = r.size; // 너비 설정
  s.height = r.size; // 높이 설정
  s.angle = r.angle; // 각도 설정
  let m = b ? r.size / 20 : 0; // 그림자 마진 계산
  s.x = r.x + m; // x 좌표 설정
  s.y = r.y + m; // y 좌표 설정
  s.zIndex = r.size - m; // zIndex 설정 (크기에 따라 zIndex 부여)
};

/**
 * @function plus
 * @description 배열 인덱스를 증가시키되, 배열의 끝에 도달하면 처음으로 순환시키는 헬퍼 함수입니다.
 * @param {number} n - 현재 인덱스.
 * @returns {number} 순환된 다음 인덱스.
 */
export const plus = (n: number): number =>
  n == select.sFileNames.length - 1 ? 0 : n + 1;

/**
 * @function minus
 * @description 배열 인덱스를 감소시키되, 배열의 시작에 도달하면 끝으로 순환시키는 헬퍼 함수입니다.
 * @param {number} n - 현재 인덱스.
 * @returns {number} 순환된 이전 인덱스.
 */
export const minus = (n: number): number =>
  n == 0 ? select.sFileNames.length - 1 : n - 1;
