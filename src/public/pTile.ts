import * as PIXI from "pixi.js";
import { mTile } from "./mTile";
import { myJigsawFloor } from "./jigsaw";
import {
  boxDraw,
  containerToSprite,
  delay,
  textureToSprite,
  tileShadow,
} from "./utils";
import { makeSpriteMove } from "./pTileMove";

/**
 * @interface pTile
 * @description 개별 퍼즐 조각의 시각적 표현 및 상태 정보를 담는 인터페이스입니다.
 * 이 객체는 화면에 렌더링되는 실제 퍼즐 조각 하나하나에 해당합니다.
 */
export interface pTile {
  /** @member {number} nx - 퍼즐판 내에서의 정규화된 x 좌표 (인덱스). */
  nx: number;
  /** @member {number} ny - 퍼즐판 내에서의 정규화된 y 좌표 (인덱스). */
  ny: number;
  /** @member {number} ox - 퍼즐판 위 완성 위치의 실제 x 픽셀 좌표. (초기 생성 시 고정) */
  ox: number;
  /** @member {number} oy - 퍼즐판 위 완성 위치의 실제 y 픽셀 좌표. (초기 생성 시 고정) */
  oy: number;
  /** @member {PIXI.Sprite} s - 최종적으로 화면에 표시될 퍼즐 조각의 메인 스프라이트 (이미지 + 그림자 포함). */
  s: PIXI.Sprite;
  /** @member {PIXI.Sprite} sb - 그림자 효과가 적용된 그림자 스프라이트. */
  sb: PIXI.Sprite;
  /** @member {PIXI.Sprite} sp - 실제 퍼즐 이미지 부분이 담긴 스프라이트. */
  sp: PIXI.Sprite;
  /** @member {boolean} done - 이 퍼즐 조각이 이미 올바른 위치에 맞춰졌는지 여부. */
  done: boolean;
  /** @member {number} zIndex - 화면에 표시될 순서 (겹쳤을 때 어느 것이 위에 보일지). */
  zIndex: number;
}

/**
 * @function makePTiles
 * @description 모든 퍼즐 조각(pTile)들을 생성하고 초기 위치를 설정하는 비동기 함수입니다.
 * myJigsawFloor의 전역 상태를 활용하여 퍼즐판에 조각들을 배치합니다.
 * @param {mTile[][]} mTileData - 퍼즐 조각의 마스크 모양 데이터를 담고 있는 2차원 mTile 배열입니다.
 */
export const makePTiles = async (mTileData: mTile[][]) => {
  console.log("makePTiles 시작");
  // 전역으로 관리되는 jigsawFloor 인스턴스를 가져옵니다. (첫 번째 인스턴스 사용)
  const f = myJigsawFloor[0];

  // // 첫 번째 단계: 각 mTile 데이터로부터 개별 퍼즐 조각 스프라이트를 비동기적으로 생성합니다.
  // const allPromises1 = mTileData.flatMap((data) =>
  //   data.map(async (mTile) => {
  //     await getTile(mTile);
  //   })
  // );
  // // 모든 조각 생성이 완료될 때까지 기다립니다.
  // await Promise.all(allPromises1);

  // 딜레이를 주어 시각적인 효과를 줍니다.
  await delay(1000);

  // 두 번째 단계: 생성된 모든 퍼즐 조각들에 이동 애니메이션을 적용합니다.
  const allPromises2 = f.pTiles.flatMap(async (pTile, index) => {
    await makeSpriteMove(pTile);
  });
  // 모든 이동 애니메이션 설정이 완료될 때까지 기다립니다.
  await Promise.all(allPromises2);
};

/**
 * @function getTile
 * @description 단일 mTile 데이터로부터 하나의 완성된 퍼즐 조각 스프라이트(pTile)를 생성합니다.
 * 이 함수는 조각의 이미지, 마스크, 테두리, 그림자 등을 결합하여 최종 스프라이트를 만듭니다.
 * @param {mTile} t - 개별 퍼즐 조각의 마스크 및 위치 정보를 담고 있는 mTile 객체입니다.
 * @param {PIXI.Texture} image - 개별 퍼즐 조각의 image texture.
 * @param {PIXI.Texture} border - 개별 퍼즐 조각의 border texture.
 */
// export const getTile = (t: mTile) => {
export const getTile = (
  t: mTile,
  image: PIXI.Texture,
  border: PIXI.Texture
) => {
  const f = myJigsawFloor[0]; // 전역 jigsawFloor 인스턴스
  const c = new PIXI.Container(); // 임시 컨테이너
  const pTiles: pTile[] = f.pTiles; // 현재 퍼즐 조각 배열

  // 원본 이미지에서 잘라낼 영역의 기준점 (중앙 기준) 픽셀 좌표를 계산합니다.
  const t_x = f.bSize / 2 + ((f.bSize * 5) / 7) * t.x;
  const t_y = f.bSize / 2 + ((f.bSize * 5) / 7) * t.y;

  // mTile에서 생성된 이미지 마스크 텍스처를 사용하여 스프라이트를 생성합니다.
  // const m = textureToSprite(t.image as PIXI.Texture, f.tSize);
  const m = textureToSprite(image as PIXI.Texture, f.tSize);

  let x = t_x - f.bSize / 2;
  let y = t_y - f.bSize / 2;

  // 원본 이미지에서 잘라낼 영역이 이미지 경계를 벗어나지 않도록 조정합니다.
  if (x + f.bSize > f.bgt.width) {
    x = f.bgt.width - f.bSize;
  }
  if (y + f.bSize > f.bgt.width) {
    y = f.bgt.width - f.bSize;
  }
  // 원본 배경 텍스처에서 해당 퍼즐 조각이 차지할 사각형 영역을 정의합니다.
  const r = new PIXI.Rectangle(x, y, f.bSize, f.bSize);

  // 정의된 사각형 영역을 사용하여 원본 배경 텍스처에서 조각 이미지를 잘라내 새로운 텍스처를 생성합니다.
  const b = new PIXI.Texture({
    source: f.bgt.source,
    frame: r,
  });

  // 잘라낸 이미지 텍스처로 스프라이트를 생성하고, 마스크를 적용하여 퍼즐 조각 모양을 만듭니다.
  const s = new PIXI.Sprite(b);
  s.width = f.tSize;
  s.height = f.tSize;
  m.anchor.set(0, 0); // 마스크의 앵커 포인트를 좌상단으로 설정
  s.mask = m; // 이미지 스프라이트에 모양 마스크 적용

  // 조각의 테두리 역할을 할 사각형을 그립니다. (초기에는 투명)
  const rectangle = boxDraw(0x000000, 0, 0, f.tSize, f.tSize);

  // mTile에서 생성된 테두리 마스크 텍스처를 사용하여 스프라이트를 생성합니다.
  // const mmm = textureToSprite(t.border as PIXI.Texture, f.tSize);
  const mmm = textureToSprite(border as PIXI.Texture, f.tSize);
  rectangle.mask = mmm; // 테두리 사각형에 테두리 마스크 적용
  mmm.anchor.set(0, 0); // 테두리 마스크의 앵커 포인트를 좌상단으로 설정

  // 그림자(cb)와 실제 이미지(cp)를 별도의 컨테이너로 분리하여 구성합니다.
  const cb = new PIXI.Container(); // 그림자 컨테이너
  c.addChild(cb);
  cb.addChild(mmm, rectangle); // 그림자 컨테이너에 테두리 마스크와 사각형 추가

  const cp = new PIXI.Container(); // 이미지 컨테이너
  c.addChild(cp);
  cp.addChild(m, s); // 이미지 컨테이너에 모양 마스크와 이미지 스프라이트 추가

  c.pivot.set(f.tSize / 2, f.tSize / 2); // 컨테이너의 피벗(회전 및 스케일 기준점)을 중앙으로 설정
  c.position.set(t.x_p, t.y_p); // 컨테이너의 초기 위치를 완성 위치로 설정

  // pTile 객체를 생성하고 배열에 추가합니다.
  const p: pTile = {
    nx: t.x,
    ny: t.y,
    ox: t.x_p,
    oy: t.y_p,
    s: s, // 초기값, 이후에 조합된 스프라이트로 덮어씌워짐
    sb: s, // 초기값, 이후에 그림자 스프라이트로 덮어씌워짐
    sp: s, // 초기값, 이후에 이미지 스프라이트로 덮어씌워짐
    done: t.done,
    zIndex: 0, // 초기값, 이후에 실제 zIndex가 설정됨
  };

  // 1. 이미지와 테두리(그림자용) 컨테이너를 각각 스프라이트로 변환합니다.
  // 이 과정에서 컨테이너의 내용을 단일 텍스처로 렌더링하여 스프라이트를 만듭니다.
  p.sb = containerToSprite(cb, true); // 그림자용 (테두리 포함)
  p.sp = containerToSprite(cp, true); // 실제 이미지

  // 2. 그림자 스프라이트(p.sb)에 그림자 효과(블러)를 적용합니다.
  const tS = tileShadow(p.sb);
  tS.position.set(f.shadowMargin, f.shadowMargin); // 그림자 위치 조정
  p.sb = tS; // 그림자 효과가 적용된 스프라이트로 교체

  // 3. 그림자와 이미지를 하나의 컨테이너에 합친 후, 다시 하나의 스프라이트로 변환합니다.
  // 이 최종 스프라이트가 화면에 렌더링될 실제 퍼즐 조각입니다.
  const cc = new PIXI.Container();
  cc.addChild(tS, p.sp); // 그림자 스프라이트와 실제 이미지 스프라이트를 컨테이너에 추가

  p.s = containerToSprite(cc); // 최종 조각 스프라이트 생성
  p.s.anchor.set(0.5, 0.5); // 최종 스프라이트의 앵커 포인트를 중앙으로 설정
  p.s.position.set(p.ox, p.oy); // 최종 스프라이트의 위치를 완성 위치로 설정
  p.s.zIndex = 10 + Math.floor(Math.random() * 10); // zIndex를 랜덤하게 설정하여 겹침 순서에 변화를 줍니다.

  p.zIndex = p.nx + p.ny * f.tNum; // 조각의 고유 zIndex를 계산 (퍼즐판 위치 기반)
  pTiles.push(p); // 생성된 pTile을 퍼즐 조각 배열에 추가
  f.bg2.addChild(p.s); // 최종 스프라이트를 배경 레이어에 추가하여 화면에 표시합니다.
};
