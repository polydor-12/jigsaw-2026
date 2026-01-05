import * as PIXI from "pixi.js";

// class pTile {
//   cb: PIXI.Container; // 그림자 효과를 포함한 컨테이너
//   cp: PIXI.Container; // 실제 이미지 조각을 담는 컨테이너
//   nx: number; // 퍼즐판에서의 x 좌표 (인덱스)
//   ny: number; // 퍼즐판에서의 y 좌표 (인덱스)
//   ox: number; // 퍼즐판 위 완성 위치의 x 픽셀 좌표
//   oy: number; // 퍼즐판 위 완성 위치의 y 픽셀 좌표
//   s: PIXI.Sprite; // 최종적으로 화면에 표시될 스프라이트 (이미지 + 그림자)
//   sb: PIXI.Sprite; // 그림자 스프라이트
//   sp: PIXI.Sprite; // 이미지 스프라이트
//   done: boolean; // 완성되었는지 여부
//   zIndex: number; // 화면에 표시될 순서
//   constructor() {
//     this.cb = new PIXI.Container();
//     this.cp = new PIXI.Container();
//     this.nx = 0;
//     this.ny = 0;
//     this.ox = 0;
//     this.oy = 0;
//     this.s = new PIXI.Sprite();
//     this.sb = new PIXI.Sprite();
//     this.sp = new PIXI.Sprite();
//     this.done = false;
//     this.zIndex = 0;
//   }
// }
