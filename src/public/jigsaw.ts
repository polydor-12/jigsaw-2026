import * as PIXI from "pixi.js";
import { cookieRead, cookieWrite, makeFloor, myReturn } from "./utils";
import { initFirebase } from "./firebase";
import { JigsawFloor } from "./jigsawFloor";

// 직소 퍼즐 게임의 메인 클래스

let t_num: number;

const jigsawFirstStart = async (r: myReturn) => {
  // 게임을 처음 시작할 때 실행되는 함수
  const cookie = cookieRead(); // 쿠키 읽기
  let filename: string, folder: string, file: string;
  if (cookie.jigsawFolder == undefined || cookie.jigsawFolder == "") {
    // 저장된 게임이 없으면 랜덤 이미지/조각 수로 시작
    folder = String(Math.floor(Math.random() * 5));
    file = String(Math.floor(Math.random() * 9));
    t_num = 7;
    cookieWrite({ jigsawFolder: folder, jigsawFile: file, jigsawNumber: "7" });
  } else {
    // 저장된 게임 정보 로드
    folder = cookie.jigsawFolder;
    file = cookie.jigsawFile;
    t_num = cookie.jigsawNumber == undefined ? 10 : Number(cookie.jigsawNumber);
  }
  if (!t_num) t_num = 7;
  console.log("cookie.jigsawNumber :", cookie.jigsawNumber);
  filename = "assets/jigsaw/" + folder + "/0" + file + ".jpg";
  const sFileNames: string[] = []; // 선택 화면용 썸네일 이미지 목록
  for (let folder = 0; folder < 5; folder++) {
    for (let file = 0; file < 9; file++) {
      let s = "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg";
      sFileNames.push(s);
    }
  }
  const sFileNames2: string[] = []; // 조각 수 선택 화면용 이미지 목록
  for (let i = 0; i < 12; i++) {
    let s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4);
    sFileNames2.push("assets/jigsaw/b/" + s + ".jpg");
  }
  const assetsToLoad = [
    // 필요한 모든 이미지 에셋 미리 로드
    filename,
    ...sFileNames,
    ...sFileNames2,
    "assets/jigsaw/background.jpg",
  ];

  // 2. Assets.load를 사용하여 비동기로 로딩합니다.
  // (이 코드는 async 함수 내부에 있어야 합니다.)
  try {
    await PIXI.Assets.load(assetsToLoad); // 비동기로 에셋 로드
  } catch (error) {
    console.error("자산 로드 중 에러 발생:", error);
  }
  console.log("t_num :", t_num);

  // 3. PIXI.Assets.get()을 사용하여 텍스처를 즉시 가져옵니다.
  console.log("filename :", filename);

  const mainTexture = PIXI.Assets.get(filename); // 로드된 텍스처 가져오기
  const jigsawFloor = new JigsawFloor( // JigsawFloor 인스턴스 생성하여 게임 시작
    r,
    mainTexture, // Loader.shared...texture 대신 Assets.get 사용
    cookie.jigsawPosition,
    t_num,
    folder,
    file
  );
  return jigsawFloor;
};
export const jigsawRestart = (
  folder: string,
  file: string,
  t_num: number = 7
) => {
  // 새로운 퍼즐 설정으로 게임을 재시작하는 함수
  console.log("folder, file :", folder, file);
  cookieWrite({
    // 선택한 설정을 쿠키에 저장
    jigsawFolder: folder,
    jigsawFile: file,
    jigsawNumber: String(t_num),
  });
  location.href = "/"; // 페이지 새로고침하여 재시작
};

// export const jigsawRestart = async (
//   folder: string,
//   file: string,
//   t_num: number = 7,
//   old_tNum: number,
//   old_filename: string
// ) => {
//   // 새로운 퍼즐 설정으로 게임을 재시작하는 함수
//   const cookie = cookieRead(); // 쿠키 읽기
//   console.log("restart t_num: ", t_num);
//   console.log("restart folder, file :", folder, file);
//   cookieWrite({
//     // 선택한 설정을 쿠키에 저장
//     jigsawFolder: folder,
//     jigsawFile: file,
//     jigsawNumber: String(t_num),
//   });
//   const filename = "assets/jigsaw/" + folder + "/0" + file + ".jpg";
//   const assetsToLoad = [
//     // 필요한 모든 이미지 에셋 미리 로드
//     filename,
//   ];
//   console.log("restart t_num :", t_num);
//   await PIXI.Assets.load(assetsToLoad);
//   const mainTexture = PIXI.Assets.get(filename); // 로드된 텍스처 가져오기
//   const r = myJigsawFloor[0].r;
//   r.mc.removeChildren();
//   myJigsawFloor.pop();
//   await deleteTextures(old_tNum, old_filename);
//   const f = new JigsawFloor( // JigsawFloor 인스턴스 생성하여 게임 시작
//     r,
//     mainTexture, // Loader.shared...texture 대신 Assets.get 사용
//     cookie.jigsawPosition,
//     t_num,
//     folder,
//     file
//   );
//   myJigsawFloor.push(f);
//   f.textureResizeForDisplay();
//   console.log("f 새로 만듬");
//   f.gameStart();
//   document.body.appendChild(f.r.app.canvas);
// };

export const myJigsawFloor: JigsawFloor[] = [];

async function main() {
  // 어플리케이션의 메인 진입점
  initFirebase(); // 파이어베이스 초기화
  const r = await makeFloor(); // 기본 PIXI 환경 설정 (myClasses.ts)
  const f = await jigsawFirstStart(r); // 직소 퍼즐 시작
  myJigsawFloor.push(f);
  f.textureResizeForDisplay();
  console.log("f 만듬");
  f.gameStart();
  document.body.appendChild(f.r.app.canvas);
  // await deleteTextures(f.tNum);
}

main();
