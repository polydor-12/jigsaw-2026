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
} from "./utils";
import { jigsawRestart, myJigsawFloor } from "./jigsaw";

/**
 * @interface positionData
 * @description 캐러셀 아이템의 위치, 크기, 각도 데이터를 담는 인터페이스입니다.
 */
export interface positionData {
  /** @member {number} x - 아이템의 x 좌표. */
  x: number;
  /** @member {number} y - 아이템의 y 좌표. */
  y: number;
  /** @member {number} size - 아이템의 크기 (정사각형 한 변의 길이). */
  size: number;
  /** @member {number} angle - 아이템의 회전 각도. */
  angle: number;
}

/**
 * @constant {PIXI.BlurFilter} myFilter
 * @description 캐러셀 UI에 적용되는 PIXI 블러 필터입니다.
 */
export const myFilter = new PIXI.BlurFilter({
  strength: 10,
});

/**
 * @constant {object} select
 * @description 이미지 선택 화면의 전역 상태 및 유틸리티 함수들을 관리하는 객체입니다.
 */
export const select = {
  /** @member {PIXI.Container} selectC1 - 메인 UI 요소 (텍스트, 버튼)를 담는 컨테이너. */
  selectC1: new PIXI.Container(),
  /** @member {PIXI.Container} selectC2 - 캐러셀의 이미지 타일을 담는 컨테이너. */
  selectC2: new PIXI.Container(),
  /** @member {PIXI.Sprite[]} sevenTiles - 현재 화면에 표시되는 7개의 캐러셀 이미지 스프라이트 배열. */
  sevenTiles: [] as PIXI.Sprite[],
  /** @member {number} fSize - 현재 게임 플로어의 가로 크기. */
  fSize: 0,
  /** @member {number} fSize_h - 현재 게임 플로어의 세로 크기. */
  fSize_h: 0,
  /** @member {number} KEY - 현재 눌린 키 (LEFT, RIGHT). */
  KEY: 0,
  /** @member {boolean} movingON - 캐러셀이 현재 움직이는 중인지 여부. */
  movingON: false,
  /** @member {number} moveAccel - 캐러셀 이동 가속도. */
  moveAccel: 0,
  /** @member {boolean} fMode - 특정 모드 플래그 (현재 사용되지 않음). */
  fMode: true,
  /** @member {boolean} fEnd - 특정 모드 종료 플래그 (현재 사용되지 않음). */
  fEnd: true,
  /** @member {boolean} tileNumberMode - 현재 퍼즐 조각 수 선택 모드인지 여부. */
  tileNumberMode: false,
  /** @member {string[]} sFileNames - 캐러셀에 표시될 이미지 파일 경로 배열. */
  sFileNames: [] as string[],
  /** @member {number[]} degrees - 캐러셀 아이템들이 배치될 각도 값들. */
  degrees: [-122, -114, -104, -90, -76, -66, -58],
  /** @member {number} startNum - 캐러셀 이미지 배열의 시작 인덱스. */
  startNum: 0,
  /** @member {number} endNum - 캐러셀 이미지 배열의 끝 인덱스. */
  endNum: 0,
  /** @member {number} baseVector - 캐러셀 기본 백터 (변화량). */
  baseVector: 0,
  /** @member {number} vector - 캐러셀 기본 백터에 따라 구체적으로 계산된 백터 (변화량). */
  vector: 0,
};

/**
 * @function selectStart
 * @description 이미지 선택 화면을 시작하고 초기화하는 함수입니다.
 * 퍼즐 게임 시작 전 이미지 및 조각 수를 선택하는 인터페이스를 제공합니다.
 * @param {myReturn} r - 게임 플로어 초기화에서 반환된 객체 (현재 사용되지 않음).
 */
export const selectStart = (r: myReturn) => {
  console.log("selectStart 실행");
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스에 접근
  f.selectMode = true; // 선택 모드 활성화
  f.borderSprite.off("pointerdown"); // 기존 borderSprite의 이벤트 리스너 제거
  f.borderSprite.on("pointerdown", f.selectEnd); // borderSprite 클릭 시 selectEnd 호출

  // select 재시작 대비 초기화
  select.sFileNames = [];
  select.sevenTiles = [];
  select.selectC1.parent?.removeChild(select.selectC1); // 기존 컨테이너 제거
  select.selectC2.parent?.removeChild(select.selectC2); // 기존 컨테이너 제거
  select.selectC1 = new PIXI.Container(); // 새 컨테이너 생성
  select.selectC2 = new PIXI.Container(); // 새 컨테이너 생성
  select.fSize = f.fSize; // 플로어 크기 설정
  select.fSize_h = f.fSize_h; // 플로어 높이 설정
  select.KEY = 0; // 키 상태 초기화
  select.movingON = false; // 이동 상태 초기화
  select.moveAccel = 0; // 이동 가속도 초기화
  select.selectC2.zIndex = 0; // 컨테이너 zIndex 설정
  select.selectC1.zIndex = 1; // 컨테이너 zIndex 설정
  select.selectC2.sortableChildren = true; // 자식 요소 zIndex 기반 정렬 활성화
  select.startNum = Math.floor(Math.random() * select.sFileNames.length); // 시작 이미지 인덱스 랜덤 설정
  select.baseVector = 0;
  select.vector = 0;

  // 퍼즐 이미지 파일 경로를 sFileNames 배열에 추가합니다.
  for (let folder = 0; folder < 5; folder++) {
    for (let file = 0; file < 9; file++) {
      select.sFileNames.push(
        "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg"
      );
    }
  }

  f.bg3.sortableChildren = true; // bg3 컨테이너 자식 요소 정렬 활성화
  f.bg3.addChild(select.selectC2, select.selectC1); // select 컨테이너들을 bg3에 추가

  // makeSelectSpriteShadow 함수는 주석 처리되어 사용되지 않습니다.

  firstDrawTiles(); // 초기 캐러셀 타일들을 그립니다.
  mainTitle(); // 메인 타이틀 및 버튼 UI를 그립니다.
};

/**
 * @function swiftTiles
 * @description 캐러셀의 이미지 타일들을 지정된 방향으로 부드럽게 이동시키는 애니메이션 함수입니다.
 * @param {number} direction - 이동 방향 (LEFT 또는 RIGHT).
 */
const swiftTiles = (direction: number) => {
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
      tileDisappear(0); // 가장 왼쪽 타일 사라지게 함
      for (let i = 1; i < select.sevenTiles.length; i++) {
        tileMove(i, select.degrees[i], select.degrees[i - 1]);
      }
      select.sevenTiles.shift(); // 맨 앞 배열에서 제거
      select.sevenTiles.push(tileAppear(LEFT)); // 새 타일 나타나게 함. 맨 뒤에 추가

      break;
    case RIGHT:
      // 오른쪽으로 이동: 왼쪽 타일들은 오른쪽으로 이동, 가장 오른쪽 타일은 사라지고, 새로운 타일이 왼쪽에 나타납니다.
      tileDisappear(select.sevenTiles.length - 1); // 가장 오른쪽 타일 사라지게 함
      for (let i = 0; i < select.sevenTiles.length - 1; i++) {
        tileMove(i, select.degrees[i], select.degrees[i + 1]);
      }
      select.sevenTiles.pop(); // 맨 뒤 배열에서 제거
      select.sevenTiles.unshift(tileAppear(RIGHT)); //새 타일 나타나게 함. 맨 앞에 추가
      break;
  }
};

/**
 * @function tileMove
 * @description 특정 타일을 새 위치로 이동시키는 애니메이션을 수행합니다.
 * @param {number} index - select.sevenTiles 배열 내 타일의 인덱스.
 * @param {number} startDegree - 타일의 시작 각도.
 * @param {number} endDegree - 타일의 목표 각도.
 */
const tileMove = (index: number, startDegree: number, endDegree: number) => {
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
 * @function tileAppear
 * @description 새로 나타나는 타일의 투명도를 조절하여 부드럽게 나타나게 하는 애니메이션.
 * @param {number} directions - 새로운 타일이 추가될 방향 (LEFT 또는 RIGHT).
 */
const tileAppear = (directions: number) => {
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
        swiftTiles(select.KEY); // 다음 이동 실행
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
 * @function tileDisappear
 * @description 사라지는 타일의 투명도를 조절하여 부드럽게 사라지게 하는 애니메이션.
 * @param {number} index - select.sevenTiles 배열 내 타일의 인덱스.
 */
const tileDisappear = (index: number) => {
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
 * @function mainTitle
 * @description 'Jigsaw', 'prev', 'next' 등의 텍스트와 버튼을 포함한 메인 타이틀 UI를 그리는 함수입니다.
 */
const mainTitle = () => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스
  const fb = new PIXI.Container(); // 배경 및 UI 요소들을 담을 컨테이너
  const maskContainer = new PIXI.Container(); // 텍스트 마스크용 컨테이너
  const shadowContainer = new PIXI.Container(); // 텍스트 그림자용 컨테이너
  const myf = new PIXI.BlurFilter({
    strength: 7,
  }); // 그림자용 블러 필터
  select.selectC1.addChild(fb, maskContainer, shadowContainer); // 컨테이너들을 selectC1에 추가
  const textBackground = new PIXI.Sprite(
    PIXI.Assets.get("assets/jigsaw/background.jpg")
  ); // 텍스트 뒤에 깔릴 배경 이미지

  /**
   * @function selectPrevNextTextPrepare
   * @description 'prev', 'next' 등의 텍스트와 그림자 텍스트를 생성하는 헬퍼 함수입니다.
   * @param {string} s - 표시할 텍스트 문자열.
   * @param {number} [width=select.fSize / 4] - 텍스트의 너비.
   * @param {number} [height=select.fSize / 9] - 텍스트의 높이.
   * @param {number} [textSize=select.fSize / 17] - 텍스트의 폰트 크기.
   * @returns {[PIXI.Text, PIXI.Text]} 텍스트 스프라이트와 그림자 텍스트 스프라이트의 배열.
   */
  const selectPrevNextTextPrepare = (
    s: string,
    width = select.fSize / 4,
    height = select.fSize / 9,
    textSize = select.fSize / 17
  ): [PIXI.Text, PIXI.Text] => {
    const text = textPrepare(s, 0xffffff, textSize, 0, 0, true); // 흰색 텍스트
    const shadow = textPrepare(s, 0x000000, textSize, 0, 0, true); // 검은색 그림자 텍스트
    text.width = width;
    text.height = height;
    shadow.width = text.width;
    shadow.height = text.height;
    return [text, shadow];
  };

  // 'Jigsaw', 'prev', 'next' 텍스트 및 그림자 텍스트 생성
  const [jigSaw, jigSawB] = selectPrevNextTextPrepare(
    "JigSaw",
    select.fSize / 2,
    select.fSize / 7,
    select.fSize / 10
  );
  const [prev, prevB] = selectPrevNextTextPrepare("prev");
  const [next, nextB] = selectPrevNextTextPrepare("next");

  // 배경 이미지의 앵커와 위치 설정
  textBackground.anchor.set(0.5, 0.5);
  textBackground.position.set(select.fSize / 2, select.fSize / 2);
  // 'Jigsaw' 텍스트 및 그림자의 위치 설정
  jigSaw.position.set(select.fSize / 2, select.fSize / 2 - select.fSize / 3);
  jigSawB.position.set(jigSaw.x, jigSaw.y);
  // 'prev' 텍스트 및 그림자의 위치 설정
  prev.position.set(
    select.fSize / 2 - select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  prevB.position.set(
    select.fSize / 2 - select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  // 'next' 텍스트 및 그림자의 위치 설정
  next.position.set(
    select.fSize / 2 + select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );
  nextB.position.set(
    select.fSize / 2 + select.fSize / 4,
    select.fSize / 2 + select.fSize / 3
  );

  maskContainer.addChild(jigSaw, prev, next); // 마스크 컨테이너에 텍스트 추가
  shadowContainer.addChild(jigSawB, prevB, nextB); // 그림자 컨테이너에 그림자 텍스트 추가
  const mask = containerToSprite(maskContainer); // 마스크 컨테이너를 스프라이트로 변환
  const shadow = containerToSprite(shadowContainer); // 그림자 컨테이너를 스프라이트로 변환
  shadow.filters = [myf]; // 그림자 스프라이트에 블러 필터 적용
  textBackground.mask = mask; // 배경 이미지에 마스크 적용
  shadow.position.set(select.fSize / 80, select.fSize / 80); // 그림자 위치 오프셋

  fb.addChild(shadow, mask, textBackground); // 최종적으로 fb 컨테이너에 추가
  // fb 컨테이너의 위치를 중앙으로 조정
  fb.position.set((select.fSize - fb.width) / 2, (select.fSize - fb.width) / 2);
  maskContainer.parent?.removeChild(maskContainer, shadowContainer); // 임시 컨테이너들 제거

  /**
   * @function nextPhotoButtonFunction
   * @description '이전' 이미지 버튼 클릭 시 호출되는 함수입니다.
   * 캐러셀을 왼쪽으로 이동시킵니다.
   */
  const nextPhotoButtonFunction = () => {
    if (!select.movingON) swiftTiles(LEFT); // 캐러셀이 움직이는 중이 아니면 이동 시작
    select.KEY = LEFT; // 현재 키 상태 설정
    select.moveAccel = 0; // 이동 가속도 초기화
  };

  /**
   * @function prevPhotoButtonFunction
   * @description '다음' 이미지 버튼 클릭 시 호출되는 함수입니다.
   * 캐러셀을 오른쪽으로 이동시킵니다.
   */
  const prevPhotoButtonFunction = () => {
    if (!select.movingON) swiftTiles(RIGHT); // 캐러셀이 움직이는 중이 아니면 이동 시작
    select.KEY = RIGHT; // 현재 키 상태 설정
    select.moveAccel = 0; // 이동 가속도 초기화
  };

  /**
   * @function centerPhotoButtonFunction
   * @description 중앙 이미지 버튼 클릭 시 호출되는 함수입니다.
   * 이미지 선택 모드와 조각 수 선택 모드 간 전환 또는 게임 시작을 처리합니다.
   */
  const centerPhotoButtonFunction = () => {
    if (!select.tileNumberMode) {
      // 이미지 선택 모드일 때 (조각 수 선택 모드로 전환)
      for (let i = 0; i < 3; i++) {
        // 캐러셀 인덱스를 3칸 앞으로 이동시켜 중앙 이미지를 첫 번째 이미지로 만듭니다.
        select.startNum = plus(select.startNum);
        select.endNum = plus(select.endNum);
      }
      let string = select.sFileNames[select.startNum];
      // 파일 경로에서 폴더와 파일 이름을 추출합니다.
      string = string
        .replace("assets/jigsaw/", "")
        .replace(".jpg", "")
        .replace("/s0", "$");
      let strings = string.split("$"); // "$ "를 기준으로 분리
      f.folder = strings[0]; // 선택된 이미지 폴더 설정
      f.file = strings[1]; // 선택된 이미지 파일 설정
      console.log("strings :", strings);
      selectTileNumber(); // 조각 수 선택 화면으로 전환
      select.tileNumberMode = true; // 조각 수 선택 모드 활성화
    } else {
      // 조각 수 선택 모드일 때 (최종 선택 완료 및 게임 시작)
      for (let i = 0; i < 3; i++) {
        // 캐러셀 인덱스를 3칸 앞으로 이동시켜 중앙 이미지를 첫 번째 이미지로 만듭니다.
        select.startNum = plus(select.startNum);
      }
      let s = select.sFileNames[select.startNum];
      // 파일 경로에서 조각 수를 추출합니다.
      s = s.replace("assets/jigsaw/b/", "").replace(".jpg", "");
      console.log("s :", s);
      // 현재 조각 수와 선택된 조각 수가 다르면 기존 쿠키 초기화
      if (Number(s) != f.tNum) {
        cookieWrite({ jigsawPosition: "" });
      }
      f.tNum = Number(s); // 선택된 조각 수 설정
      jigsawRestart(f.folder, f.file, f.tNum); // 선택한 정보로 게임 재시작
    }
  };

  // '이전' 버튼 생성 및 설정
  const prevPhotoButton = boxButtonDraw(
    prevPhotoButtonFunction,
    0x000000,
    0,
    fb.height - prev.width / 2, // 위치 조정
    prev.width,
    prev.height,
    0
  );
  // '다음' 버튼 생성 및 설정
  const nextPhotoButton = boxButtonDraw(
    nextPhotoButtonFunction,
    0x000000,
    fb.width - prev.width,
    fb.height - prev.width / 2, // 위치 조정
    prev.width,
    prev.height,
    0
  );
  // 중앙 선택 버튼 생성 및 설정
  const centerPhotoButton = boxButtonDraw(
    centerPhotoButtonFunction,
    0x000000,
    (fb.width - (fb.width * 2) / 3) / 2, // 중앙 정렬
    (fb.width - (fb.width * 1.2) / 2.2) / 2, // 중앙 정렬
    (fb.width * 2) / 3, // 버튼 너비
    (fb.width * 2) / 3, // 버튼 높이 (정사각형)
    0
  );
  prevPhotoButton.on("pointerup", () => (select.KEY = 0)); // 마우스 떼면 KEY 초기화 (이동 멈춤)
  nextPhotoButton.on("pointerup", () => (select.KEY = 0)); // 마우스 떼면 KEY 초기화 (이동 멈춤)
  fb.addChild(prevPhotoButton, nextPhotoButton, centerPhotoButton); // 버튼들을 fb 컨테이너에 추가
};

/**
 * @function selectTileNumber
 * @description 퍼즐 조각 수를 선택하는 화면으로 캐러셀을 전환하는 함수입니다.
 * 조각 수 선택에 필요한 이미지 파일 목록을 설정하고 캐러셀을 다시 그립니다.
 */
const selectTileNumber = () => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스
  select.sFileNames = []; // 파일 이름 목록 초기화
  select.sevenTiles = []; // 표시되는 타일 목록 초기화

  /**
   * @function startNumSet
   * @description 현재 퍼즐 조각 수(f.tNum)에 맞춰 startNum과 endNum을 설정하는 헬퍼 함수입니다.
   */
  const startNumSet = () => {
    // f.tNum에 따라 startNum과 endNum을 조정하여 현재 tNum이 중앙에 오도록 합니다.
    for (let i = 0; i < f.tNum - 7; i++) {
      select.startNum = plus(select.startNum);
      select.endNum = plus(select.endNum);
    }
  };

  // 조각 수 선택을 위한 이미지 파일 경로를 sFileNames 배열에 추가합니다.
  // "assets/jigsaw/b/04.jpg" 부터 "assets/jigsaw/b/15.jpg" 까지 (4x4 ~ 15x15)
  for (let i = 0; i < 12; i++) {
    const s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4); // 숫자 포맷 (예: 4 -> 04)
    select.sFileNames.push("assets/jigsaw/b/" + s + ".jpg");
  }
  select.startNum = 0; // 시작 인덱스 초기화
  select.endNum = 11; // 끝 인덱스 초기화
  startNumSet(); // f.tNum에 따라 인덱스 조정
  select.selectC2.parent?.removeChild(select.selectC2); // 기존 selectC2 제거
  select.selectC2 = new PIXI.Container(); // 새 selectC2 생성
  f.bg3.addChild(select.selectC2); // bg3에 추가
  select.selectC2.zIndex = 0; // zIndex 설정
  select.selectC2.sortableChildren = true; // 자식 정렬 활성화
  firstDrawTiles(); // 새로운 조각 수 캐러셀을 그립니다.
};

/**
 * @function firstDrawTiles
 * @description 캐러셀의 초기 타일들을 화면에 그리는 함수입니다.
 * select.sFileNames와 select.degrees를 사용하여 7개의 타일을 배치합니다.
 */
const firstDrawTiles = () => {
  let num = select.startNum; // 시작 이미지 인덱스
  for (let i = 0; i < 7; i++) {
    const t = PIXI.Assets.get(select.sFileNames[num]); // 텍스처 로드
    // makeSelectSprite를 사용하여 스프라이트 생성 및 selectC2에 추가
    const s = makeSelectSprite(
      select.degrees[i],
      t,
      select.selectC2,
      select.fSize
    );
    select.sevenTiles.push(s); // sevenTiles 배열에 추가
    num = plus(num); // 다음 이미지 인덱스 계산
  }
  select.endNum = minus(num); // endNum 계산

  // 중앙에 선택 영역을 나타내는 투명한 박스 그리기
  const r = getPositionAndSize(-90, select.fSize); // 중앙 위치의 데이터
  const box = boxDraw(
    0xffffff,
    r.x - r.size,
    r.y - (r.size * 6) / 5,
    r.size * 2
  );
  box.alpha = 0.5; // 반투명하게 설정
  select.selectC2.addChild(box); // selectC2에 추가
  // selectC2 컨테이너의 위치를 조정하여 캐러셀이 화면 하단에 위치하도록 합니다.
  select.selectC2.x = 0;
  select.selectC2.y = select.fSize - select.fSize / 8;
};

/**
 * @function getPositionAndSize
 * @description 캐러셀 UI 내에서 아이템의 회전 각도에 따라 x, y 위치, 크기, 그리고 회전 각도를 계산하는 함수입니다.
 * @param {number} degree - 아이템의 중심으로부터의 각도 (단위: 도).
 * @param {number} [fSize=100] - 게임 플로어의 기준 크기.
 * @returns {positionData} 계산된 위치, 크기, 각도 정보를 담은 객체.
 */
const getPositionAndSize = (
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
const setPositions = (
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
 * @function drawSelectTileWithShadow
 * @description 특정 각도에 해당하는 위치에 스프라이트와 그림자를 그려 화면에 업데이트하는 함수입니다.
 * @param {number} degree - 타일의 각도 (단위: 도).
 * @param {PIXI.Sprite | PIXI.Graphics} s - 그릴 대상 스프라이트 또는 그래픽스 객체.
 * @param {number} [floorSize=100] - 게임 플로어의 기준 크기.
 * @param {boolean} [b=false] - true일 경우 그림자 효과를 위한 추가 마진을 적용합니다.
 */
const drawSelectTileWithShadow = (
  degree: number,
  s: PIXI.Sprite | PIXI.Graphics,
  floorSize: number = 100,
  b: boolean = false
) => {
  const r = getPositionAndSize(degree, floorSize); // 위치, 크기, 각도 계산
  setPositions(s, r, b); // 계산된 값을 스프라이트에 적용
};

/**
 * @function makeSelectSprite
 * @description 캐러셀에 표시될 단일 이미지 스프라이트를 생성하는 함수입니다.
 * 이 스프라이트에는 그림자 효과가 포함됩니다.
 * @param {number} degree - 스프라이트의 회전 각도.
 * @param {PIXI.Texture} t - 스프라이트에 사용할 이미지 텍스처.
 * @param {PIXI.Container} selectC2 - 스프라이트가 추가될 컨테이너.
 * @param {number} [fSize=100] - 게임 플로어의 기준 크기.
 * @returns {PIXI.Sprite} 생성된 그림자 포함 이미지 스프라이트.
 */
const makeSelectSprite = (
  degree: number,
  t: PIXI.Texture,
  selectC2: PIXI.Container,
  fSize: number = 100
): PIXI.Sprite => {
  const selectTileWithShadow = getSpriteWithShadow(t); // 그림자 포함 스프라이트 생성
  const r = getPositionAndSize(degree, fSize); // 위치, 크기, 각도 계산
  selectTileWithShadow.anchor.set(0.5, 0.5); // 앵커 포인트를 중앙으로 설정
  setPositions(selectTileWithShadow, r); // 계산된 값을 스프라이트에 적용
  selectC2.addChild(selectTileWithShadow); // 컨테이너에 추가
  return selectTileWithShadow;
};

/**
 * @function plus
 * @description 배열 인덱스를 증가시키되, 배열의 끝에 도달하면 처음으로 순환시키는 헬퍼 함수입니다.
 * @param {number} n - 현재 인덱스.
 * @returns {number} 순환된 다음 인덱스.
 */
const plus = (n: number): number =>
  n == select.sFileNames.length - 1 ? 0 : n + 1;

/**
 * @function minus
 * @description 배열 인덱스를 감소시키되, 배열의 시작에 도달하면 끝으로 순환시키는 헬퍼 함수입니다.
 * @param {number} n - 현재 인덱스.
 * @returns {number} 순환된 이전 인덱스.
 */
const minus = (n: number): number =>
  n == 0 ? select.sFileNames.length - 1 : n - 1;
