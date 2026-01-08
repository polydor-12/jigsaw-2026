import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  containerToSprite,
  cookieWrite,
  getSpriteWithShadow,
  LEFT,
  myReturn,
  RIGHT,
  textPrepare,
} from "./utils";
import { jigsawRestart, myJigsawFloor } from "./jigsaw";
import {
  getPositionAndSize,
  minus,
  plus,
  setPositions,
  swiftSelectTiles,
} from "./selectTileMove";

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

  firstSelectTilesDraw(); // 초기 캐러셀 타일들을 그립니다.
  mainTitle(); // 메인 타이틀 및 버튼 UI를 그립니다.
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
    if (!select.movingON) swiftSelectTiles(LEFT); // 캐러셀이 움직이는 중이 아니면 이동 시작
    select.KEY = LEFT; // 현재 키 상태 설정
    select.moveAccel = 0; // 이동 가속도 초기화
  };

  /**
   * @function prevPhotoButtonFunction
   * @description '다음' 이미지 버튼 클릭 시 호출되는 함수입니다.
   * 캐러셀을 오른쪽으로 이동시킵니다.
   */
  const prevPhotoButtonFunction = () => {
    if (!select.movingON) swiftSelectTiles(RIGHT); // 캐러셀이 움직이는 중이 아니면 이동 시작
    select.KEY = RIGHT; // 현재 키 상태 설정
    select.moveAccel = 0; // 이동 가속도 초기화
  };

  /**
   * @function centerPhotoButtonFunction
   * @description 중앙 이미지 버튼 클릭 시 호출되는 함수입니다.
   * 이미지 선택 모드와 조각 수 선택 모드 간 전환 또는 게임 시작을 처리합니다.
   */
  const centerPhotoButtonFunction = async () => {
    const old_filename = "assets/jigsaw/" + f.folder + "/0" + f.file + ".jpg";
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
      const old_tNum = f.tNum;
      select.tileNumberMode = false;
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
      await jigsawRestart(f.folder, f.file, f.tNum, old_tNum, old_filename); // 선택한 정보로 게임 재시작
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
  firstSelectTilesDraw(); // 새로운 조각 수 캐러셀을 그립니다.
};

/**
 * @function firstSelectTilesDraw
 * @description 캐러셀의 초기 타일들을 화면에 그리는 함수입니다.
 * select.sFileNames와 select.degrees를 사용하여 7개의 타일을 배치합니다.
 */
const firstSelectTilesDraw = () => {
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
 * @function makeSelectSprite
 * @description 캐러셀에 표시될 단일 이미지 스프라이트를 생성하는 함수입니다.
 * 이 스프라이트에는 그림자 효과가 포함됩니다.
 * @param {number} degree - 스프라이트의 회전 각도.
 * @param {PIXI.Texture} t - 스프라이트에 사용할 이미지 텍스처.
 * @param {PIXI.Container} selectC2 - 스프라이트가 추가될 컨테이너.
 * @param {number} [fSize=100] - 게임 플로어의 기준 크기.
 * @returns {PIXI.Sprite} 생성된 그림자 포함 이미지 스프라이트.
 */
export const makeSelectSprite = (
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
