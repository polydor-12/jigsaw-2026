import * as PIXI from "pixi.js";
import { myJigsawFloor } from "./jigsaw";

/* =======================
   Key Codes
======================= */
/** @constant {number} UP - 위쪽 화살표 키 코드 (38) */
export const UP = 38;
/** @constant {number} DOWN - 아래쪽 화살표 키 코드 (40) */
export const DOWN = 40;
/** @constant {number} LEFT - 왼쪽 화살표 키 코드 (37) */
export const LEFT = 37;
/** @constant {number} RIGHT - 오른쪽 화살표 키 코드 (39) */
export const RIGHT = 39;
/** @constant {number} ENTER - Enter 키 코드 (13) */
export const ENTER = 13;

/* =======================
   Interfaces
======================= */
/**
 * @interface myReturn
 * @description makeFloor 함수가 반환하는 값의 구조를 정의하는 인터페이스입니다.
 */
export interface myReturn {
  /** @member {PIXI.Application} app - 생성된 PIXI 애플리케이션 인스턴스. */
  app: PIXI.Application;
  /** @member {PIXI.Container} mc - 메인 PIXI 컨테이너. 모든 게임 객체가 추가됩니다. */
  mc: PIXI.Container;
  /** @member {number} fSize - 퍼즐판의 가로 크기 (픽셀). */
  fSize: number;
  /** @member {number} fSize_h - 퍼즐판의 세로 크기 (픽셀). (fSize + 하단 여백) */
  fSize_h: number;
}

/* =======================
   Utils
======================= */

/**
 * @function mobileNow
 * @description 현재 실행 중인 기기가 모바일 장치인지 여부를 확인하는 함수입니다.
 * User Agent 문자열과 플랫폼 정보를 기반으로 판단합니다.
 * @returns {boolean} 모바일 기기일 경우 true, 데스크톱일 경우 false를 반환합니다.
 */
export const mobileNow = (): boolean => {
  // 1. User Agent 문자열 확인 (가장 일반적인 방법)
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    /iphone/i, // iPhone
    /ipad/i, // iPad
    /ipod/i, // iPod Touch
    /android/i, // Android 폰 및 태블릿
    /blackberry/i, // BlackBerry
    /windows phone/i, // Windows Phone
  ];

  // mobileKeywords 배열의 정규식 중 하나라도 userAgent에 매치되면 isMobileUA는 true가 됩니다.
  const isMobileUA = mobileKeywords.some((keyword) => userAgent.match(keyword));

  // 2. Platform 정보 확인 (기존 로직 보완)
  // 'linux'를 필터에 추가하여 리눅스 데스크톱이 모바일로 잘못 분류되는 것을 방지합니다.
  const platformFilter = "win16|win32|win64|mac|macintel|linux";
  const platform = (navigator.platform || "").toLowerCase();

  let isDesktopPlatform = false;
  if (platform) {
    // navigator.platform이 존재하고, platformFilter에 포함되어 있다면 데스크톱 플랫폼으로 간주합니다.
    isDesktopPlatform = platformFilter.indexOf(platform) !== -1;
  }

  // 3. 최종 판별
  // User Agent가 모바일 키워드를 포함하고 있으면서, 데스크톱 플랫폼으로 분류되지 않을 경우 true를 반환합니다.
  // 이 로직은 리눅스 민트와 같은 데스크톱 리눅스 환경에서 userAgent에 'linux'가 포함되더라도
  // isDesktopPlatform이 true가 되어 최종적으로 false(데스크톱)를 반환하도록 합니다.
  if (isMobileUA && !isDesktopPlatform) {
    return true;
  }
  // 그 외의 경우는 모바일이 아닌 것으로 판단합니다.
  return false;
};

/* =======================
   makeFloor (function)
======================= */
/**
 * @function makeFloor
 * @description PIXI.Application을 초기화하고, 캔버스 크기를 설정하며,
 * 주요 컨테이너를 생성하여 게임 환경을 준비하는 비동기 함수입니다.
 * 화면 크기에 따라 퍼즐판의 크기를 반응형으로 조정합니다.
 * @returns {Promise<myReturn>} 생성된 PIXI 애플리케이션, 메인 컨테이너, 계산된 가로/세로 크기를 포함하는 Promise.
 */
export const makeFloor = async (): Promise<myReturn> => {
  // 새로운 PIXI.Application 인스턴스를 생성합니다.
  const app = new PIXI.Application();
  // 애플리케이션 초기화 설정: 안티앨리어싱 활성화, 흰색 배경, 자동 해상도 조정.
  await app.init({
    antialias: true,
    backgroundColor: 0xffffff,
    autoDensity: true,
  });

  // 생성된 캔버스의 스타일을 설정하여 페이지에 절대 위치로 블록 요소로 표시합니다.
  app.canvas.style.position = "absolute";
  app.canvas.style.display = "block";
  // HTML body에 캔버스를 추가하는 코드는 주석 처리되어 있습니다.
  // document.body.appendChild(app.canvas);

  let fSize = 0; // 퍼즐판의 기본 크기 (정사각형의 한 변 길이)

  // 뷰포트의 가로/세로 비율에 따라 fSize를 계산하여 반응형 크기를 결정합니다.
  // 가로가 세로보다 훨씬 좁은 경우 (모바일 세로 모드 등)
  if (window.innerWidth + window.innerWidth / 4 < window.innerHeight) {
    fSize = window.innerWidth - 15; // 가로 너비에 맞춰 설정
  } else {
    // 그 외의 경우 (가로 모드, 데스크톱 등)
    fSize = window.innerHeight - window.innerHeight / 4 - 30; // 세로 높이에 맞춰 설정
  }

  const h_margin = fSize / 3; // 퍼즐판 하단에 추가할 여백 (예: 조각 놓을 공간)
  const fSize_h = fSize + h_margin; // 퍼즐판의 총 세로 길이

  // 렌더러의 크기를 계산된 fSize와 fSize_h로 조정합니다.
  app.renderer.resize(fSize, fSize_h);

  // 모든 게임 오브젝트를 담을 메인 PIXI 컨테이너를 생성합니다.
  const mc = new PIXI.Container();
  // 메인 컨테이너를 PIXI 스테이지에 추가합니다.
  app.stage.addChild(mc);

  // myReturn 인터페이스에 맞춰 필요한 값들을 반환합니다.
  return {
    app,
    mc,
    fSize,
    fSize_h,
  } as myReturn;
};

/* =======================
   SVG → Sprite/Texture 변환
======================= */

/**
 * @function svgToSprite
 * @description SVG 문자열을 PIXI.Sprite 객체로 변환하는 비동기 함수입니다.
 * 선택적으로 스프라이트의 너비와 높이를 지정할 수 있습니다.
 * @param {string} svg - 변환할 SVG XML 문자열.
 * @param {number} [width=-1] - 스프라이트의 원하는 너비 (픽셀). -1이면 원본 비율 유지.
 * @param {number} [height=width] - 스프라이트의 원하는 높이 (픽셀). 너비와 동일하게 설정되지 않으면 width와 동일.
 * @returns {Promise<PIXI.Sprite>} 생성된 PIXI.Sprite 객체를 포함하는 Promise.
 */
export const svgToSprite = async (
  svg: string,
  width: number = -1,
  height: number = width
): Promise<PIXI.Sprite> => {
  // SVG 문자열을 Data URL 형식으로 인코딩합니다.
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  // PIXI.Assets.load를 사용하여 인코딩된 SVG를 텍스처로 로드합니다.
  const texture = await PIXI.Assets.load<PIXI.Texture>(encoded);
  // 로드된 텍스처로 PIXI.Sprite를 생성합니다.
  const sprite = new PIXI.Sprite(texture);

  // 너비가 지정되었다면 스프라이트의 크기를 조정합니다.
  if (width !== -1) {
    sprite.width = width;
    sprite.height = height;
  }
  // 스프라이트의 앵커 포인트를 중앙으로 설정합니다. (회전 및 위치 기준)
  sprite.anchor.set(0.5);
  return sprite;
};

/**
 * @function svgToTexture
 * @description SVG 문자열을 PIXI.Texture 객체로 변환하는 비동기 함수입니다.
 * @param {string} svg - 변환할 SVG XML 문자열.
 * @returns {Promise<PIXI.Texture>} 생성된 PIXI.Texture 객체를 포함하는 Promise.
 */
export const svgToTexture = async (svg: string): Promise<PIXI.Texture> => {
  // SVG 문자열을 Data URL 형식으로 인코딩합니다.
  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  // PIXI.Assets.load를 사용하여 인코딩된 SVG를 텍스처로 로드합니다.
  const texture = await PIXI.Assets.load<PIXI.Texture>(encoded);
  return texture;
};

/**
 * @function textureToSprite
 * @description 기존 PIXI.Texture를 PIXI.Sprite 객체로 변환하는 함수입니다.
 * 선택적으로 스프라이트의 너비와 높이를 지정할 수 있습니다.
 * @param {PIXI.Texture} texture - PIXI.Sprite로 변환할 텍스처.
 * @param {number} width - 스프라이트의 원하는 너비 (픽셀).
 * @param {number} [height=width] - 스프라이트의 원하는 높이 (픽셀). 너비와 동일하게 설정되지 않으면 width와 동일.
 * @returns {PIXI.Sprite} 생성된 PIXI.Sprite 객체.
 */
export const textureToSprite = (
  texture: PIXI.Texture,
  width: number,
  height = width
) => {
  const sprite = new PIXI.Sprite(texture);
  // 너비가 지정되었다면 스프라이트의 크기를 조정합니다.
  if (width !== -1) {
    sprite.width = width;
    sprite.height = height;
  }
  // 스프라이트의 앵커 포인트를 중앙으로 설정합니다.
  sprite.anchor.set(0.5);
  return sprite;
};

/* =======================
   Graphics
======================= */
/**
 * @function boxDraw
 * @description 지정된 색상과 크기로 사각형 PIXI.Graphics 객체를 생성하는 함수입니다.
 * @param {number} color - 사각형의 색상 (예: 0xFFFFFF).
 * @param {number} x - 사각형의 시작 x 좌표.
 * @param {number} y - 사각형의 시작 y 좌표.
 * @param {number} w - 사각형의 너비.
 * @param {number} [h=w] - 사각형의 높이. 너비와 동일하게 설정되지 않으면 width와 동일.
 * @returns {PIXI.Graphics} 생성된 PIXI.Graphics 객체.
 */
export const boxDraw = (
  color: number,
  x: number,
  y: number,
  w: number,
  h: number = w
) => {
  const g = new PIXI.Graphics();
  g.rect(x, y, w, h); // 사각형 그리기
  g.fill(color); // 사각형 내부 채우기
  g.stroke({ width: 4, color }); // 사각형 테두리 그리기 (너비 4, 지정된 색상)
  return g;
};

/**
 * @function boxButtonDraw
 * @description 지정된 색상과 크기의 사각형 버튼을 PIXI.Graphics 객체로 생성하는 함수입니다.
 * 클릭 이벤트를 처리할 콜백 함수를 연결할 수 있습니다.
 * @param {Function} f - 버튼 클릭 시 실행될 콜백 함수.
 * @param {number} color - 버튼의 색상.
 * @param {number} x - 버튼의 시작 x 좌표.
 * @param {number} y - 버튼의 시작 y 좌표.
 * @param {number} width - 버튼의 너비.
 * @param {number} [height=width] - 버튼의 높이. 너비와 동일하게 설정되지 않으면 width와 동일.
 * @param {number} [alpha=1] - 버튼의 투명도 (0.0 ~ 1.0).
 * @returns {PIXI.Graphics} 생성된 PIXI.Graphics 객체 (버튼).
 */
export const boxButtonDraw = (
  f: Function,
  color: number,
  x: number,
  y: number,
  width: number,
  height: number = width,
  alpha: number = 1
) => {
  const b = boxDraw(color, x, y, width, height); // 기본 사각형 생성
  b.interactive = true; // 상호작용 가능하도록 설정
  b.cursor = "pointer"; // 마우스 오버 시 커서 모양 변경
  b.on("pointerdown", () => f()); // 클릭(pointerdown) 이벤트 리스너 추가
  b.alpha = alpha; // 투명도 설정
  return b;
};

/**
 * @function getSpriteWithShadow
 * @description 주어진 텍스처를 사용하여 그림자 효과가 적용된 PIXI.Sprite를 생성하는 함수입니다.
 * @param {PIXI.Texture} t - 그림자 효과를 적용할 텍스처.
 * @returns {PIXI.Sprite} 그림자 효과가 적용된 새로운 PIXI.Sprite 객체.
 */
export const getSpriteWithShadow = (t: PIXI.Texture): PIXI.Sprite => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스
  const s = new PIXI.Sprite(t); // 원본 텍스처로 스프라이트 생성
  // 그림자의 배경이 될 더 큰 사각형을 그립니다.
  const bG = boxDraw(0xffffff, 0, 0, s.width + s.width / 20 + f.shadowMargin);
  const bB = boxDraw(0x000000, 0, 0, s.width - 4); // 그림자 본체가 될 검은색 사각형
  // 생성된 Graphics 객체들을 스프라이트로 변환합니다.
  const background = containerToSprite(bG, true);
  const spriteB = containerToSprite(bB, true);
  background.alpha = 0; // 배경은 투명하게 설정
  spriteB.alpha = 0.7; // 그림자 본체는 반투명하게 설정
  tileShadow(spriteB); // 그림자 본체에 블러 필터 적용
  spriteB.position.set(s.width / 20); // 그림자 위치 조정
  // download_sprite_as_png(f.renderer, spriteB, "b0.png"); // 디버깅용으로 주석 처리됨
  const tf = new PIXI.Container(); // 임시 컨테이너
  tf.addChild(background, spriteB, s); // 배경, 그림자, 원본 스프라이트를 컨테이너에 추가
  const spriteWithShadow = containerToSprite(tf, true); // 컨테이너를 하나의 스프라이트로 변환
  s.destroy({ children: true }); // 원본 스프라이트와 그 자식들을 파괴하여 메모리 해제
  return spriteWithShadow;
};

/* =======================
   Download Sprite/Images
======================= */
/**
 * @function download_sprite_as_png
 * @description PIXI.Sprite를 렌더링하여 PNG 이미지로 다운로드하는 비동기 함수입니다.
 * @param {PIXI.Renderer} renderer - PIXI 렌더러 인스턴스.
 * @param {PIXI.Sprite} s - PNG로 다운로드할 PIXI.Sprite 객체.
 * @param {string} fileName - 다운로드될 파일의 이름.
 * @returns {Promise<void>} 다운로드 완료를 나타내는 Promise.
 */
export const download_sprite_as_png = async (
  renderer: PIXI.Renderer,
  s: PIXI.Sprite,
  fileName: string
): Promise<void> => {
  // 렌더러의 extract.image 메서드를 사용하여 스프라이트에서 이미지를 추출합니다.
  const image = await renderer.extract.image(s);
  const a = document.createElement("a"); // <a> 태그 생성
  a.download = fileName; // 다운로드 파일 이름 설정
  a.href = image.src; // 이미지의 Data URL을 href로 설정
  a.click(); // 클릭 이벤트를 발생시켜 다운로드 실행
};

/**
 * @function downloadImages
 * @description 여러 PIXI.Sprite 객체들을 반복적으로 PNG 이미지로 다운로드하는 함수를 반환합니다.
 * 한 번에 10개씩 다운로드하도록 제한하여 브라우저 부하를 줄입니다.
 * @param {PIXI.Renderer} renderer - PIXI 렌더러 인스턴스.
 * @param {PIXI.Sprite[]} ss - 다운로드할 PIXI.Sprite 객체들의 배열.
 * @returns {() => Promise<void>} 다음 10개의 이미지를 다운로드하는 함수를 반환합니다.
 */
export const downloadImages = (renderer: PIXI.Renderer, ss: PIXI.Sprite[]) => {
  let count = 0; // 현재까지 다운로드한 이미지 개수
  const total = ss.length; // 총 이미지 개수

  // 클로저를 사용하여 다음 10개의 이미지를 다운로드하는 함수를 반환합니다.
  return async () => {
    if (count < total) {
      // 다음 다운로드할 이미지들의 인덱스 범위를 계산합니다. (최대 10개)
      const end = Math.min(count + 10, total);
      for (let i = count; i < end; i++) {
        await download_sprite_as_png(renderer, ss[i], `${i}.png`); // 각 스프라이트 다운로드
      }
      count += 10; // 다운로드 개수 업데이트
    }
  };
};

/* =======================
   Math
======================= */
/**
 * @function degreesToRadians
 * @description 각도(degrees)를 라디안(radians)으로 변환하는 함수입니다.
 * @param {number} degrees - 변환할 각도 값.
 * @returns {number} 라디안으로 변환된 값.
 */
export const degreesToRadians = (degrees: number): number =>
  degrees * (Math.PI / 180);

/* =======================
   Cookie
======================= */
/**
 * @function cookieWrite
 * @description 주어진 데이터를 키-값 쌍으로 브라우저 쿠키에 저장하는 함수입니다.
 * 모든 쿠키는 2700일 (약 7.4년) 후 만료되도록 설정됩니다.
 * @param {{ [key: string]: string }} data - 쿠키에 저장할 키-값 쌍을 포함하는 객체.
 */
export const cookieWrite = (data: { [key: string]: string }): void => {
  const date = new Date();
  date.setDate(date.getDate() + 2700); // 현재 날짜로부터 2700일 후로 만료일 설정
  for (const key in data) {
    // 객체의 각 키-값 쌍에 대해 쿠키를 설정합니다.
    document.cookie = `${key}=${data[key]};expires=${date.toUTCString()}`;
  }
};

/**
 * @function cookieRead
 * @description 브라우저 쿠키에 저장된 모든 데이터를 읽어와 객체 형태로 반환하는 함수입니다.
 * @returns {{ [key: string]: string }} 쿠키에서 읽어온 키-값 쌍을 포함하는 객체.
 */
export const cookieRead = (): { [key: string]: string } => {
  const cookies = document.cookie.split(";"); // 모든 쿠키 문자열을 세미콜론으로 분리
  const data: { [key: string]: string } = {}; // 결과를 저장할 객체 초기화
  cookies.forEach((cookie) => {
    const [k, v] = cookie.trim().split("="); // 각 쿠키를 트림하고 '='로 키와 값 분리
    data[k] = v; // 결과 객체에 저장
  });
  return data;
};

/**
 * @function containerToSprite
 * @description PIXI.Container 또는 PIXI.Graphics 객체를 PIXI.Sprite로 변환하는 함수입니다.
 * 이는 컨테이너의 내용을 단일 텍스처로 렌더링하여 효율적인 처리를 가능하게 합니다.
 * @param {PIXI.Container | PIXI.Graphics} c - PIXI.Sprite로 변환할 컨테이너 또는 그래픽스 객체.
 * @param {boolean} [remove=false] - true일 경우, 변환 후 원본 컨테이너와 그 자식들을 파괴합니다.
 * @returns {PIXI.Sprite} 생성된 PIXI.Sprite 객체.
 */
export const containerToSprite = (
  c: PIXI.Container | PIXI.Graphics,
  remove: boolean = false
): PIXI.Sprite => {
  // myJigsawFloor의 렌더러를 사용하여 컨테이너의 내용을 텍스처로 생성합니다.
  const tex = myJigsawFloor[0]?.renderer.generateTexture({
    target: c, // 렌더링할 대상 객체
    resolution: 1, // 렌더링 해상도 (기존 PIXI v4/v5의 scaleFactor와 유사)
    antialias: true, // 안티앨리어싱 적용 여부
  });
  // 생성된 텍스처로 새로운 PIXI.Sprite를 만듭니다.
  const combinedSprite = new PIXI.Sprite(tex);
  // remove 플래그가 true이면 원본 컨테이너와 그 자식들을 파괴하여 메모리를 해제합니다.
  if (remove) c.destroy({ children: true });
  return combinedSprite;
};

/**
 * @function containerToSpriteAdd
 * @description PIXI.Container를 PIXI.Sprite로 변환한 후, 부모 컨테이너에 추가하고
 * 원본 컨테이너를 제거하는 헬퍼 함수입니다. zIndex를 보존합니다.
 * @param {PIXI.Container} c - 변환할 원본 PIXI.Container.
 * @param {PIXI.Container} [cp=c.parent as PIXI.Container] - 변환된 스프라이트를 추가할 부모 컨테이너.
 *                                                                기본값은 원본 컨테이너의 부모입니다.
 * @returns {PIXI.Sprite} 변환되어 부모 컨테이너에 추가된 새로운 PIXI.Sprite 객체.
 */
export const containerToSpriteAdd = (
  c: PIXI.Container,
  cp: PIXI.Container = c.parent as PIXI.Container
): PIXI.Sprite => {
  const s = containerToSprite(c, true); // 컨테이너를 스프라이트로 변환하고 원본 파괴
  s.zIndex = c.zIndex; // 원본 컨테이너의 zIndex를 새 스프라이트에 적용
  cp.addChild(s); // 새 스프라이트를 부모 컨테이너에 추가
  // cp.removeChild(c); // 이 코드는 c.destroy({ children: true })에 의해 c가 이미 파괴되었으므로 제거할 필요가 없습니다.
  return s;
};

/**
 * @function spriteCombine
 * @description 두 개의 스프라이트(sb, s)를 하나의 새로운 텍스처로 합치는 함수입니다.
 * 주로 성능 최적화를 위해 여러 레이어를 하나의 텍스처로 미리 구울 때 사용됩니다.
 * @param {PIXI.Sprite} sb - 배경이 될 스프라이트.
 * @param {PIXI.Sprite} s - sb 위에 합쳐질 스프라이트.
 * @param {number} [mx=0] - s 스프라이트의 x 위치 오프셋.
 * @param {number} [my=0] - s 스프라이트의 y 위치 오프셋.
 * @returns {PIXI.Texture} 두 스프라이트가 합쳐진 새로운 PIXI.Texture.
 */
export const spriteCombine = (
  sb: PIXI.Sprite,
  s: PIXI.Sprite,
  mx: number = 0,
  my: number = 0
): PIXI.Texture => {
  const nc = new PIXI.Container(); // 임시 컨테이너 생성
  const sb_c = new PIXI.Sprite(); // 배경 스프라이트의 내용을 복사할 새 스프라이트

  sb_c.texture = sb.texture; // 배경 스프라이트의 텍스처를 복사

  nc.addChild(sb_c, s); // 임시 컨테이너에 배경과 전경 스프라이트 추가
  s.position.set(s.x + mx, s.y + my); // 전경 스프라이트의 위치를 오프셋 적용하여 설정

  // 임시 컨테이너를 하나의 텍스처로 변환하고, 컨테이너를 파괴하여 메모리 해제합니다.
  const t = containerToSprite(nc, true).texture;
  return t;
};

/**
 * @function textureSize
 * @description 주어진 텍스처를 원하는 크기로 리사이즈하여 새로운 텍스처로 반환하는 함수입니다.
 * @param {PIXI.Texture} bgt - 리사이즈할 원본 PIXI.Texture.
 * @param {number} size - 원하는 텍스처의 가로/세로 크기 (정사각형으로 가정).
 * @returns {PIXI.Texture} 리사이즈된 새로운 PIXI.Texture.
 */
export const textureSize = (bgt: PIXI.Texture, size: number): PIXI.Texture => {
  const c = new PIXI.Container(); // 임시 컨테이너
  const s = new PIXI.Sprite(bgt); // 원본 텍스처로 스프라이트 생성
  s.width = size; // 스프라이트의 너비 설정
  s.height = size; // 스프라이트의 높이 설정
  c.addChild(s); // 스프라이트를 컨테이너에 추가
  const ns = containerToSprite(c, true); // 컨테이너를 새로운 스프라이트로 변환하고 원본 파괴
  return ns.texture; // 새로운 스프라이트의 텍스처 반환
};

/**
 * @function tileShadow
 * @description 주어진 스프라이트에 블러 필터를 적용하여 그림자 효과를 주는 함수입니다.
 * @param {PIXI.Sprite} sprite - 그림자 효과를 적용할 PIXI.Sprite 객체.
 * @returns {PIXI.Sprite} 블러 필터가 적용된 동일한 PIXI.Sprite 객체.
 */
export const tileShadow = (sprite: PIXI.Sprite): PIXI.Sprite => {
  // 스프라이트의 필터 목록에 PIXI.BlurFilter를 추가합니다.
  sprite.filters = [
    new PIXI.BlurFilter({
      strength: 7, // 블러 강도 설정 (값이 클수록 더 흐려짐)
    }),
  ];
  return sprite;
};

/**
 * @function delay
 * @description 지정된 밀리초(ms)만큼 실행을 지연시키는 비동기 함수입니다.
 * @param {number} ms - 지연시킬 시간 (밀리초).
 * @returns {Promise<void>} 지정된 시간 후에 resolve되는 Promise.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @function textPrepare
 * @description PIXI.Text 객체를 생성하고 스타일 및 위치를 설정하는 유틸리티 함수입니다.
 * @param {string} text - 표시할 텍스트 문자열.
 * @param {number} color - 텍스트의 색상 (예: 0xFFFFFF).
 * @param {number} font_size - 텍스트의 폰트 크기 (퍼즐판 크기에 대한 백분율로 계산됨).
 * @param {number} x - 텍스트의 x 위치 (퍼즐판 너비에 대한 백분율로 계산됨).
 * @param {number} y - 텍스트의 y 위치 (퍼즐판 높이에 대한 백분율로 계산됨).
 * @param {boolean} [b=true] - true일 경우 텍스트의 앵커를 중앙으로 설정합니다.
 * @param {string} [font="Times New Roman"] - 텍스트의 폰트 패밀리.
 * @returns {PIXI.Text} 스타일 및 위치가 설정된 PIXI.Text 객체.
 */
export const textPrepare = (
  text: string,
  color: number,
  font_size: number,
  x: number,
  y: number,
  b: boolean = true,
  font: string = "Times New Roman"
): PIXI.Text => {
  const f = myJigsawFloor[0]; // 현재 게임 플로어 인스턴스
  // 텍스트 스타일의 기본 설정을 정의합니다.
  const b_style: Partial<PIXI.TextStyleOptions> = {
    fontFamily: font,
    fontWeight: "bold", // 텍스트를 굵게 표시
    stroke: {
      width: font_size / 50, // 폰트 크기에 비례하여 외곽선 두께 설정
      color: "#000000", // 외곽선 색상을 검은색으로 설정
      join: "round", // 텍스트 외곽선을 둥글게 처리하여 부드럽게 보이도록 함
    },
  };

  // 텍스트와 스타일을 사용하여 PIXI.Text 객체를 생성합니다.
  const t = new PIXI.Text({
    text,
    style: b_style,
  });

  t.style.fill = color; // 텍스트 채우기 색상 설정
  t.style.stroke = color; // 텍스트 외곽선 색상 설정
  if (b) t.anchor.set(0.5, 0.5); // b가 true이면 앵커 포인트를 텍스트 중앙으로 설정
  // 텍스트 위치를 퍼즐판 크기에 비례하여 설정합니다.
  t.position.set((f.fSize * x) / 100, (f.fSize_h * y) / 100);
  // 텍스트 폰트 크기를 퍼즐판 크기에 비례하여 설정합니다.
  t.style.fontSize = (f.fSize * font_size) / 100;
  return t;
};
