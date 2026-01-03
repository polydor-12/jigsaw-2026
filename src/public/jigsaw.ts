import * as PIXI from "pixi.js";
import {
  boxButtonDraw,
  boxDraw,
  cookieRead,
  cookieWrite,
  degreesToRadians,
  LEFT,
  makeFloor,
  mobileNow,
  myReturn,
  RIGHT,
  svgToSprite,
} from "./myClasses";
import { initFirebase } from "./firebase";

interface pTile {
  cb: PIXI.Container;
  cp: PIXI.Container;
  nx: number;
  ny: number;
  ox: number;
  oy: number;
  s: PIXI.Sprite;
  sb: PIXI.Sprite;
  sp: PIXI.Sprite;
  done: boolean;
  zIndex: number;
}
interface mTile {
  x: number;
  y: number;
  up: number;
  down: number;
  left: number;
  right: number;
  x_p: number;
  y_p: number;
  done: boolean;
}

class JigsawFloor {
  main = new PIXI.Container();
  bg0 = new PIXI.Container();
  bg1 = new PIXI.Container();
  bg2 = new PIXI.Container();
  bg3 = new PIXI.Container();
  border = new PIXI.Container();
  borderSprite = new PIXI.Sprite();
  backgroundSprite = new PIXI.Sprite();
  fullPicture: PIXI.Texture;
  selectMode = false;
  bgt: PIXI.Texture;
  fSize: number;
  fSize_h: number;
  tSize: number;
  shadowMargin: number;
  bSize: number;
  tNum: number;
  folder: string;
  file: string;
  renderer: PIXI.Renderer;
  zIndex: number = 1000;
  r: myReturn;
  p: number[][] = [];
  cookie: string = "";
  mTileData: mTile[][] = [];
  pTiles: pTile[] = [];
  mobileNow: boolean = mobileNow();
  start: Function;
  constructor(
    r: myReturn,
    bgt: PIXI.Texture,
    cookieP: string,
    t_num: number,
    folder: string,
    file: string
  ) {
    this.r = r;
    this.renderer = r.renderer;
    r.mc.addChild(this.main);
    this.fSize = r.fSize - ((r.fSize / (t_num * 5 + 2)) * 7) / 10;
    this.tNum = t_num;
    console.log("this.tNum :", this.tNum);
    this.bgt = bgt.width > this.fSize ? this.textureSize(bgt, this.fSize) : bgt;
    this.fullPicture = new PIXI.Texture({
      source: this.bgt.source,
    });

    console.log("fullPicture :", this.fullPicture);

    this.fSize_h = r.fSize_h;
    this.tSize = (this.fSize / (t_num * 5 + 2)) * 7;
    this.shadowMargin = this.tSize / 30;
    this.bSize = (this.bgt.width / (t_num * 5 + 2)) * 7;
    this.folder = folder;
    this.file = file;
    this.main.addChild(this.bg0, this.bg1, this.bg2, this.bg3);
    this.bg2.sortableChildren = true;
    console.log("p :", cookieP);
    if (cookieP != undefined && cookieP != "") {
      this.cookie += cookieP;
      let positions = cookieP.split("$");
      positions.forEach((position) => {
        let xy = position.split("#");
        this.p.push([Number(xy[0]), Number(xy[1])]);
      });
    }
    const makeBackground = async (bgt: PIXI.Texture) => {
      this.bg2.addChild(this.border);
      let bgd = new PIXI.Sprite();
      bgd.texture = bgt;

      // bgd.texture = new PIXI.Texture({
      //   source: this.bgt.source,
      // });

      console.log("bgd.texture :", bgd.texture);
      bgd.anchor.set(0.5, 0.5);
      bgd.width = this.fSize;
      bgd.height = this.fSize;
      bgd.position.set(this.fSize / 2, this.fSize / 2);
      let margin = (this.tSize * 2) / 7;
      let svgContent = `<rect x="0" y="0" fill="#ffffff" stroke="#000000" stroke-miterlimit="10" 
                width="${this.fSize}" height="${this.fSize}"/>
                <rect x="${margin}" y="${margin}" fill="#000000" stroke="#000000" stroke-miterlimit="10" 
                width="${this.fSize - margin * 2}" height="${
        this.fSize - margin * 2
      }"/>`;
      let svg = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="${this.fSize}px" height="${this.fSize}px" viewBox="0 0 ${this.fSize} ${this.fSize}" 
                enable-background="new 0 0 ${this.fSize} ${this.fSize}" 
                xml:space="preserve">${svgContent}</svg>`;
      let s = await svgToSprite(svg, this.fSize);
      s.position.set(this.fSize / 2, this.fSize / 2);
      bgd.mask = s;
      this.border.addChild(s, bgd);
      this.mTileData = makeMaskTilesData(this.tNum, 6);
      this.mTileData.forEach((data) =>
        data.forEach((tileData) => getMaskTile(tileData, 0))
      );
      this.border.zIndex = 3;
      let c2 = new PIXI.Container();
      let b_v1 = boxDraw(
        0x000000,
        0,
        0,
        (this.tSize * 2) / 7 - this.shadowMargin,
        this.fSize - this.shadowMargin
      );
      let b_v2 = boxDraw(
        0x000000,
        this.fSize - (this.tSize * 2) / 7 + this.shadowMargin,
        this.shadowMargin,
        (this.tSize * 2) / 7 - this.shadowMargin,
        this.fSize - this.shadowMargin * 2
      );
      let b_h1 = boxDraw(
        0x000000,
        0,
        0,
        this.fSize - this.shadowMargin,
        (this.tSize * 2) / 7 - this.shadowMargin
      );
      let b_h2 = boxDraw(
        0x000000,
        0,
        this.fSize - (this.tSize * 2) / 7 + this.shadowMargin,
        this.fSize - this.shadowMargin,
        (this.tSize * 2) / 7 - this.shadowMargin
      );
      c2.addChild(b_v1, b_v2, b_h1, b_h2);
      this.bg2.addChild(c2);
      c2.zIndex = 0;
      let b_s = this.containerToSprite(c2);
      b_s = this.tileShadow(b_s);
      // download_sprite_as_png(this.renderer, b_s, String(this.tNum) + "b.png")
      b_s.position.set(this.shadowMargin, this.shadowMargin);
      b_s.zIndex = 0;
      let fontsize = this.mobileNow ? this.fSize / 80 : this.fSize / 40;
      let loading = this.textPrepare("Loading", 0x000000, fontsize, 0, 0, true);
      loading.position.set(this.fSize / 2, this.fSize / 2);
      loading.zIndex = -1;
      this.bg0.addChild(loading);
      this.bg2.addChild(b_s);
      this.bg2.removeChild(c2);
    };
    const makeMaskTilesData = (tNum: number, rNum: number) => {
      let tiles: mTile[][] = []; // 타일 초기화
      for (let y = 0; y < tNum; y++) {
        let xt: mTile[] = [];
        for (let x = 0; x < tNum; x++) {
          let mT: mTile = {
            x: x,
            y: y,
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            x_p: 0,
            y_p: 0,
            done: false,
          };
          xt.push(mT);
        }
        tiles.push(xt);
      }
      for (let y = 0; y < tNum; y++) {
        for (let x = 0; x < tNum; x++) {
          let u = y == 0 ? 0 : tiles[x][y - 1].down;
          let d =
            y == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1;
          let l = x == 0 ? 0 : tiles[x - 1][y].right;
          let r =
            x == tNum - 1 ? 0 : Math.floor(Math.random() * (rNum - 2)) + 1;
          tiles[x][y] = {
            x: x,
            y: y,
            up: u,
            down: d,
            left: l,
            right: r,
            x_p: 0,
            y_p: 0,
            done: false,
          };
        }
      }
      this.p.forEach((xy) => {
        console.log("xy :", xy);
        console.log("this.tNum :", this.tNum);
        tiles[xy[0]][xy[1]].done = true;
      });
      return tiles;
    };
    const getTile = async (t: mTile) => {
      let c = new PIXI.Container();
      this.bg2.addChild(c);
      let t_x = this.bSize / 2 + ((this.bSize * 5) / 7) * t.x;
      let t_y = this.bSize / 2 + ((this.bSize * 5) / 7) * t.y;
      let m = await getMaskTile(t, 1);

      // console.log('this.bSize :', this.bSize);
      // console.log('this.fSize :', this.fSize);
      let x = t_x - this.bSize / 2;
      let y = t_y - this.bSize / 2;
      if (x + this.bSize > this.bgt.width) {
        x = this.bgt.width - this.bSize;
      }
      if (y + this.bSize > this.bgt.width) {
        y = this.bgt.width - this.bSize;
      }
      let r = new PIXI.Rectangle(x, y, this.bSize, this.bSize);
      // let b = this.bgt.clone();

      let b = new PIXI.Texture({
        source: this.bgt.source,
        frame: r,
      });

      let s = new PIXI.Sprite(b);
      s.width = this.tSize;
      s.height = this.tSize;
      m.anchor.set(0, 0);
      s.mask = m;
      let rectangle = boxDraw(0x000000, 0, 0, this.tSize, this.tSize);
      let mmm = await getMaskTile(t, 2);
      rectangle.mask = mmm;
      mmm.anchor.set(0, 0);
      let cb = new PIXI.Container();
      c.addChild(cb);
      cb.addChild(mmm, rectangle);
      let cp = new PIXI.Container();
      c.addChild(cp);
      cp.addChild(m, s);
      c.pivot.set(this.tSize / 2, this.tSize / 2);
      c.position.set(t.x_p, t.y_p);
      let p: pTile = {
        cb: cb,
        cp: cp,
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
      this.pTiles.push(p);
    };
    const getMaskTile = async (tile: mTile, sw: number) => {
      let fill_color, stroke_width, stroke_color, block_color;
      switch (sw) {
        case 0:
          fill_color = "#d9e6f2";
          stroke_width = 'stroke-width="5"';
          stroke_color = "#d9e6f2";
          block_color = "#000000";
          break;
        case 1:
          fill_color = "#ffffff";
          stroke_width = 'stroke-width="8"';
          stroke_color = "#ffffff";
          block_color = "#000000";
          break;
        case 2:
          fill_color = "#ffffff";
          stroke_width = 'stroke-width="1"';
          stroke_color = "#ffffff";
          block_color = "#000000";
          break;
      }
      const mask_data = [
        // up
        [
          `<rect x="0" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
          `"M432,72.371c0,9.121-72,35.754-108,35.754
                    s9-90.063-81-90.063c-99.001,0-18,107.969-63,107.969S72,72.596,72,72.596L144,144.5h216L432,72.371z"`,
          `"M432,71.92c0,0-63-53.795-108-53.795
                    s36,107.938-63,107.938c-90,0-45-90.031-81-90.031S72,63.023,72,72.145l72,72.355h216L432,71.92z"`,
          `"M432,72.371c0,9.121-63,44.754-90,35.754
                    c-34.152-11.384,45-90.063-45-90.063c-225,0-59.806,107.969-126,107.969c-45,0-99-53.436-99-53.436l72,71.904h216L432,72.371z"`,
          `"M432,71.92c0,0-54-53.795-99-53.795
                    c-66.194,0,99,107.938-126,107.938c-90,0-10.848-78.646-45-90.031c-27-9-90,26.992-90,36.113l72,72.355h216L432,71.92z"`,
          `"M432,72.371c-45-18.121-81,8.754-117,35.754
                    c-28.8,21.6,90-90.063-54-90.063c-117,0-36,107.969-81,107.969S72,72.596,72,72.596l72,71.904h216L432,72.371z"`,
        ],
        //down
        [
          `<rect y="360" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="504" height="144"/>`,
          `"M432,432.371c0,9.121-72,35.754-108,35.754
                    s9-90.063-81-90.063c-99.001,0-18,107.969-63,107.969S72,432.596,72,432.596L144,360.5h216L432,432.371z"`,
          `"M432,431.92c0,0-63-53.795-108-53.795
                    s36,107.938-63,107.938c-90,0-45-90.031-81-90.031S72,423.023,72,432.145l72-71.645h216L432,431.92z"`,
          `"M432,432.371c0,9.121-63,44.754-90,35.754
                    c-34.152-11.385,45-90.063-45-90.063c-225,0-59.806,107.969-126,107.969c-45,0-99-53.436-99-53.436l72-72.096h216L432,432.371z"`,
          `"M432,431.92c0,0-54-53.795-99-53.795
                    c-66.194,0,99,107.938-126,107.938c-90,0-10.848-78.646-45-90.031c-27-9-90,26.992-90,36.113l72-71.645h216L432,431.92z"`,
          `"M432,432.371c-45-18.121-81,8.754-117,35.754
                    c-28.8,21.6,90-90.063-54-90.063c-117,0-36,107.969-81,107.969S72,432.596,72,432.596l72-72.096h216L432,432.371z"`,
        ],
        // left
        [
          `<rect x="0" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
          `"M72.08,432c0,0,53.795-63,53.795-108
                    S17.938,360,17.938,261c0-90,90.031-45,90.031-81S80.977,72,71.856,72l71.644,72v216L72.08,432z"`,
          `"M71.629,432c-9.121,0-35.754-72-35.754-108
                    s90.063,9,90.063-81c0-99-107.969-18-107.969-63S71.405,72,71.405,72l72.095,72v216L71.629,432z"`,
          `"M72.08,432c0,0,53.795-54,53.795-99
                    c0-66.194-107.938,99-107.938-126c0-90,78.646-10.848,90.031-45c9-27-26.992-90-36.113-90l71.644,72v216L72.08,432z"`,
          `"M71.629,432c-9.121,0-44.754-63-35.754-90
                    c11.385-34.152,90.063,45,90.063-45c0-225-107.969-59.806-107.969-126c0-45,53.436-99,53.436-99l72.095,72v216L71.629,432z"`,
          `"M72.08,432c0,0,53.795-63,53.795-108
                    S17.938,360,17.938,243c0-144,111.631-25.2,90.031-54c-27-36-54.234-72-36.113-117l71.644,72v216L72.08,432z"`,
        ],
        //right
        [
          `<rect x="360" fill="${block_color}" stroke="${block_color}" stroke-miterlimit="10" width="144" height="504"/>`,
          `"M432.08,432c0,0,53.795-63,53.795-108
                    s-107.938,36-107.938-63c0-90,90.031-45,90.031-81S440.977,72,431.855,72L359.5,144v216L432.08,432z"`,
          `"M431.629,432c-9.121,0-35.754-72-35.754-108
                    s90.063,9,90.063-81c0-99-107.969-18-107.969-63s53.436-108,53.436-108L359.5,144v216L431.629,432z"`,
          `"M432.08,432c0,0,53.795-54,53.795-99
                    c0-66.194-107.938,99-107.938-126c0-90,78.646-10.848,90.031-45c9-27-26.992-90-36.113-90L359.5,144v216L432.08,432z"`,
          `"M431.629,432c-9.121,0-44.754-63-35.754-90
                    c11.385-34.152,90.063,45,90.063-45c0-225-107.969-59.806-107.969-126c0-45,53.436-99,53.436-99L359.5,144v216L431.629,432z"`,
          `"M432.08,432c0,0,53.795-63,53.795-108
                    s-107.938,36-107.938-81c0-144,111.631-25.2,90.031-54c-27-36-54.234-72-36.113-117L359.5,144v216L432.08,432z"`,
        ],
      ];

      let direction = [tile.up, tile.down, tile.left, tile.right];
      let path_f = `<path fill="${fill_color}" stroke="#000000" ${stroke_width} stroke-miterlimit="10" d=`;
      let path_e = `/>`;
      let svgContent_front = "";
      let svgContent_end = "";
      for (let i = 0; i < direction.length; i++) {
        if (direction[i] != 0) {
          svgContent_front += path_f + mask_data[i][direction[i]] + path_e;
        } else {
          svgContent_end += mask_data[i][direction[i]];
        }
      }
      let svg = `<svg version="1.1" id="레이어_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
                y="0px" width="504px" height="504px" viewBox="0 0 504 504" enable-background="new 0 0 504 504" xml:space="preserve">       
                ${svgContent_front} <polygon fill="${fill_color}" stroke="${stroke_color}" stroke-miterlimit="10" points="71.25,72.5 134.5,144 134.5,360 72,432.25 144,369.5 
                360,369.5 431.75,432 368.5,360 368.5,144 432,72.25 360,135.5 144,135.5 "/>  ${svgContent_end} </svg>`;

      let s = await svgToSprite(svg, this.tSize);

      tile.x_p = this.tSize / 2 + ((this.tSize * 5) / 7) * tile.x;
      tile.y_p = this.tSize / 2 + ((this.tSize * 5) / 7) * tile.y;
      if (sw == 0) {
        s.position.set(tile.x_p, tile.y_p);
        this.bg1.addChild(s);
      }
      return s;
    };
    const borderPrepare = () => {
      this.backgroundSprite = this.containerToSpriteAdd(this.bg1, this.bg0);
      this.borderSprite = this.containerToSpriteAdd(this.border);
      this.borderSprite.interactive = true;
      this.borderSprite.eventMode = "static";
      this.borderSprite.cursor = "pointer";
      this.borderSprite.on("pointerdown", this.bgPrepare);
    };
    const start = async () => {
      console.log("start : ");
      await makeBackground(this.bgt);
      this.mTileData.forEach((ts) => {
        ts.forEach((t) => getTile(t));
      });
      setTimeout(() => {
        this.pTiles.forEach((p) => this.makeSprite(p));
        // bgPrepare()
        borderPrepare();
        // setTimeout(() => {
        //     download_sprite_as_png(f.renderer, this.backgroundSprite, String(this.tNum) + "c.png")
        //     download_sprite_as_png(f.renderer, this.borderSprite, String(this.tNum) + "a.png")
        // }, 4000)
        this.selectStart(this.r);
      }, 4000);
    };
    this.start = start;
    this.start();
  }
  makeSprite = (p: pTile) => {
    const xyCookieWrite = (x: number, y: number) => {
      let xy = String(x) + "#" + String(y);
      this.cookie += this.cookie == "" ? xy : "$" + xy;
      cookieWrite({ jigsawPosition: this.cookie });
    };
    const tileFix = (p: pTile) => {
      const tileFixAction = (p: pTile) => {
        let oSize = p.sp.width;
        let maxSize = (p.sp.width * 12) / 10;
        let sVector = this.mobileNow
          ? (maxSize - oSize) / 15
          : (maxSize - oSize) / 30;
        let rVector = this.mobileNow ? 360 / (15 * 2) : 360 / (30 * 2);
        p.s.parent?.addChild(p.sb, p.sp);
        p.s.parent?.removeChild(p.s);
        p.sb.anchor.set(0.5, 0.5);
        p.sp.anchor.set(0.5, 0.5);
        p.sp.position.set(p.ox, p.oy);
        p.sb.position.set(p.ox + this.shadowMargin, p.oy + this.shadowMargin);
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
            p.sb.angle = 0;
            p.sp.angle = 0;
            p.sb.position.set(
              p.ox + this.shadowMargin,
              p.oy + this.shadowMargin
            );
            p.sp.position.set(p.ox, p.oy);
            combineAfterAction();
          } else {
            requestAnimationFrame(sizeAction);
          }
        };
        sizeAction();
      };
      const combineAfterAction = () => {
        this.borderSprite.texture = spriteCombine(this.borderSprite, p.sp);
        this.backgroundSprite.texture = spriteCombine(
          this.backgroundSprite,
          p.sb,
          this.shadowMargin,
          this.shadowMargin
        );
        p.done = true;
        this.endingCheck();
      };
      const spriteCombine = (
        sb: PIXI.Sprite,
        s: PIXI.Sprite,
        mx: number = 0,
        my: number = 0
      ) => {
        let nc = new PIXI.Container();
        let sb_c = new PIXI.Sprite();
        // sb_c.texture = sb.texture.clone();
        // sb_c.texture = sb.texture;
        sb_c.texture = new PIXI.Texture({
          source: this.bgt.source,
        });
        this.bg2.addChild(nc);
        nc.addChild(sb_c, s);
        s.position.set(s.x + mx, s.y + my);
        // let t = this.containerToSprite(nc).texture.clone();
        let t = this.containerToSprite(nc).texture;
        // let t = new PIXI.Texture({
        //   source: this.containerToSprite(nc).texture.source,
        // });

        this.bg2.removeChild(nc);
        nc.destroy({ children: true, texture: true });
        return t;
      };
      tileFixAction(p);
    };
    const moveByMouse = (p: pTile) => {
      let c = p.s;
      let parentWidth = this.fSize;
      let parentHeight = this.fSize_h;
      c.interactive = true;
      c.eventMode = "static";
      c.cursor = "pointer";
      let pickUp = false;
      const onDragStart = () => {
        if (!pickUp) {
          pickUp = true;
          this.zIndex++;
          c.zIndex = this.zIndex;
          c.on("pointermove", onDragMove);
        } else {
          pickUp = false;
          c.off("pointermove", onDragMove);
          onDragEnd();
        }
      };
      const onDragEnd = () => {
        if (
          Math.abs(c.x - p.ox) < this.tSize / 5 &&
          Math.abs(c.y - p.oy) < this.tSize / 5
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
      p.s.interactive = true;
      p.s.eventMode = "static";
      p.s.cursor = "pointer";
      let pickUp = false;
      const onDragStart = () => {
        console.log("onDragStart");
        pickUp = true;
        this.zIndex++;
        p.s.zIndex = this.zIndex;
        p.s.on("touchmove", onDragMove);
      };
      const onDragEnd = () => {
        console.log("onDragEnd");

        if (
          Math.abs(p.s.x - p.ox) < this.tSize / 5 &&
          Math.abs(p.s.y - p.oy) < this.tSize / 5
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
            newPosition.x <= this.fSize && newPosition.x >= 0
              ? newPosition.x
              : p.s.x;
          p.s.y =
            newPosition.y <= this.fSize_h && newPosition.y >= 0
              ? newPosition.y
              : p.s.y;
        }
      };
      p.s.on("touchstart", onDragStart).on("touchend", onDragEnd);
    };
    p.sb = this.containerToSprite(p.cb);
    p.sp = this.containerToSprite(p.cp);
    let tS = this.tileShadow(p.sb);
    tS.position.set(this.shadowMargin, this.shadowMargin);
    let c = new PIXI.Container();
    this.bg2.addChild(c);
    c.addChild(tS, p.sb, p.sp);
    p.sb = tS;
    p.s = this.containerToSprite(c);
    p.s.anchor.set(0.5, 0.5);
    p.s.position.set(p.ox, p.oy);
    p.s.zIndex = 10 + Math.floor(Math.random() * 10);
    c.parent?.removeChild(c);
    p.cb.parent?.removeChild(p.cb, p.cp);
    p.zIndex = p.nx + p.ny * this.tNum;
    this.bg2.addChild(p.s);
    if (!p.done) {
      if (this.mobileNow) {
        m_moveByMouse(p);
      } else {
        moveByMouse(p);
      }
      this.tileScatter(p, true);
    } else {
      // border와 바탕화면에 그리기
      this.bg2.removeChild(p.s);
      this.border.addChild(p.sp);
      this.bg1.addChild(p.sb);
      p.sp.anchor.set(0.5, 0.5);
      p.sp.position.set(p.ox, p.oy);
      p.sb.anchor.set(0.5, 0.5);
      p.sb.position.set(p.ox + this.shadowMargin, p.oy + this.shadowMargin);
    }
  };
  // tileShadow = (s: PIXI.Sprite) => {
  //   let mt = s;
  //   const blurFilter = new PIXI.BlurFilter();
  //   mt.filters = [blurFilter];
  //   blurFilter.blur = 7;
  //   return mt;
  // };
  tileShadow = (sprite: PIXI.Sprite): PIXI.Sprite => {
    sprite.filters = [new PIXI.BlurFilter(7)];
    return sprite;
  };
  // SpriteAddShadow = (s: PIXI.Sprite) => {
  //     let sd = this.tileShadow(s)
  //     let c = new PIXI.Container()
  //     c.addChild(sd, s)
  //     s.parent.addChild(c)
  //     sd.position.set(this.shadowMargin, this.shadowMargin)
  //     return this.containerToSpriteAdd(c)
  // }
  containerToSpriteAdd = (
    c: PIXI.Container,
    cp: PIXI.Container = c.parent as PIXI.Container
  ) => {
    let s = this.containerToSprite(c);
    s.zIndex = c.zIndex;
    cp.addChild(s);
    cp.removeChild(c);
    c.destroy({ children: true, texture: true });
    // c.destroy({ children: true });
    return s;
  };
  containerToSprite = (c: PIXI.Container) => {
    // let r = new PIXI.Renderer()
    const tex = this.renderer.generateTexture({
      target: c, // 렌더링할 대상 (Container, Sprite 등)
      resolution: 1, // 해상도 (기존 인자의 1에 해당)
      antialias: true, // 안티앨리어싱 (선택 사항, 결과물이 더 깔끔해짐)
    });
    // const tex = r.generateTexture(c, 1, 1)
    const combinedSprite = new PIXI.Sprite(tex);
    return combinedSprite;
  };
  textureSize = (bgt: PIXI.Texture, size: number) => {
    let c = new PIXI.Container();
    this.main.addChild(c);
    let s = new PIXI.Sprite(bgt);
    s.width = size;
    s.height = size;
    c.addChild(s);
    let ns = this.containerToSprite(c);
    this.main.removeChild(c);
    return ns.texture;
  };
  endingCheck = () => {
    let count = 0;
    this.pTiles.forEach((pt) => {
      count += pt.done == false ? 1 : 0;
    });
    if (count == 0) {
      console.log("남은 타일 갯수 :", count);
      cookieWrite({ jigsawFolder: "", jigsawFile: "", jigsawPosition: "" });
      this.ending();
    }
  };
  ending = () => {
    // let s = this.containerToSpriteAdd(this.main)
    let s = this.borderSprite;
    let p = this.fSize / 2;
    s.anchor.set(0.5, 0.5);
    s.position.set(this.fSize / 2, this.fSize / 2);
    const resizeP = () => {
      s.width = p;
      s.height = p;
      p += this.fSize / 50;
      if (p > this.fSize) {
        console.log("축하합니다 :");
        s.width = this.fSize + this.shadowMargin;
        s.height = this.fSize + this.shadowMargin;
        this.selectStart(this.r);
      } else {
        requestAnimationFrame(resizeP);
      }
    };
    resizeP();
  };
  tileScatter = (p: pTile, s: boolean = false) => {
    let x: number, y: number;
    if (s) {
      x = Math.floor(Math.random() * this.fSize);
      y = Math.floor(Math.random() * (this.fSize_h - this.fSize) + this.fSize);
    } else {
      x = p.ox;
      y = p.ox;
    }
    let v = this.mobileNow ? 25 : 60;
    let xVector = (p.s.x - x) / v;
    let yVector = (p.s.y - y) / v;
    const tMove = () => {
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
  bgPrepare = () => {
    let fullP = new PIXI.Sprite();
    let fullPicture = new PIXI.Container();
    this.bg2.addChild(fullPicture);
    fullPicture.addChild(fullP);
    fullP.texture = this.fullPicture;
    fullPicture.zIndex = 1000000;
    fullP.interactive = true;
    fullP.eventMode = "static";
    fullP.cursor = "pointer";
    fullP.on("pointerdown", () => {
      console.log('fullP.on "pointerdown"');
      fullPicture.parent?.removeChild(fullPicture);
    });
    const l = () => {
      fullPicture?.parent?.removeChild(fullPicture);
      if (!this.selectMode) this.selectStart(this.r);
    };
    const m = () => {
      this.pTiles.forEach((p) => this.tileScatter(p, true));
    };
    let bxu = boxButtonDraw(l, 0x000000, 0, 0, this.fSize, this.fSize / 10);
    let byf = boxButtonDraw(m, 0x000000, 0, 0, this.fSize / 10, this.fSize);
    let bye = boxButtonDraw(
      l,
      0x000000,
      this.fSize - this.fSize / 10,
      0,
      this.fSize / 10,
      this.fSize
    );
    bxu.alpha = 0;
    byf.alpha = 0;
    bye.alpha = 0;
    fullPicture.addChild(bxu, byf, bye);
  };
  selectEnd = () => {
    this.selectMode = false;
    this.bg3.parent?.removeChild(this.bg3);
    this.bg3 = new PIXI.Container();
    this.main.addChild(this.bg3);
    this.borderSprite.off("pointerdown");
    this.borderSprite.on("pointerdown", this.bgPrepare);
  };
  selectStart = (f: myReturn) => {
    this.selectMode = true;
    this.borderSprite.off("pointerdown");
    this.borderSprite.on("pointerdown", this.selectEnd);
    let selectTileNumberMode = false;
    let sFileNames: string[] = [];
    for (let folder = 0; folder < 5; folder++) {
      for (let file = 0; file < 9; file++) {
        sFileNames.push(
          "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg"
        );
      }
    }
    interface positionData {
      x: number;
      y: number;
      size: number;
      angle: number;
    }
    let selectC1 = new PIXI.Container();
    let sevenTiles: PIXI.Sprite[] = [];
    // let sevenShadows: PIXI.Graphics[] = []
    // let myFilter = new PIXI.BlurFilter();
    // myFilter.blur = 7;
    let myFilter = new PIXI.BlurFilter(7);
    let fSize = f.fSize;
    let fSize_h = f.fSize_h;
    let KEY = 0;
    let movingON = false;
    let moveAccel = 0;
    let selectC2 = new PIXI.Container();
    let degrees = [-122, -114, -104, -90, -76, -66, -58];
    this.bg3.sortableChildren = true;
    selectC2.zIndex = 0;
    selectC1.zIndex = 1;
    this.bg3.addChild(selectC2, selectC1);
    selectC2.sortableChildren = true;
    let startNum = Math.floor(Math.random() * sFileNames.length);
    let endNum: number;
    const plus = (n: number) => (n == sFileNames.length - 1 ? 0 : n + 1);
    const minus = (n: number) => (n == 0 ? sFileNames.length - 1 : n - 1);
    const getPositionAndSize = (degree: number, floorSize: number = 100) => {
      let radius = (floorSize * 4) / 5;
      let tSize = floorSize / 2;
      let x = floorSize / 2 + Math.cos(degreesToRadians(degree)) * radius;
      let y = floorSize / 2 + Math.sin(degreesToRadians(degree)) * radius;
      let size = tSize - Math.abs(x - floorSize / 2) * 0.73;
      let angle = degree + 90;
      let r: positionData = { x: x, y: y, size: size, angle: angle };
      return r;
    };
    const setPositions = (
      s: PIXI.Sprite | PIXI.Graphics,
      r: positionData,
      b: boolean = false
    ) => {
      s.width = r.size;
      s.height = r.size;
      s.angle = r.angle;
      let m = b ? r.size / 20 : 0;
      s.x = r.x + m;
      s.y = r.y + m;
      s.zIndex = r.size - m;
    };
    const _makeSelectSprite = (
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      let r = getPositionAndSize(degree, floorSize);
      let s = new PIXI.Sprite(t);
      s.anchor.set(0.5, 0.5);
      setPositions(s, r);
      s.zIndex = r.size;
      c.addChild(s);
      return s;
    };
    const makeSelectSprite = (
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      let s = new PIXI.Sprite(t);
      let td = new PIXI.Container();
      let b = boxDraw(0x000000, 0, 0, s.width);
      td.addChild(b);
      b.position.set(s.width / 20, s.width / 20);
      c.addChild(td);
      let sb = this.containerToSprite(td);
      c.removeChild(td);
      let tf = new PIXI.Container();
      sb.alpha = 0.7;
      sb.filters = [myFilter];
      sb.position.set(s.width / 20, s.width / 20);
      tf.addChild(sb, s);
      let r = getPositionAndSize(degree, floorSize);
      // console.log('b.x, b.y :', b.x, b.y);
      let ns = this.containerToSprite(tf);
      // let ns = sb
      ns.anchor.set(0.5, 0.5);
      setPositions(ns, r);
      c.addChild(ns);
      // c.removeChild(tf)
      return ns;
    };
    const drawSpriteAndShadow = (
      degree: number,
      s: PIXI.Sprite | PIXI.Graphics,
      floorSize: number = 100,
      b: boolean = false
    ) => {
      let r = getPositionAndSize(degree, floorSize);
      setPositions(s, r, b);
    };
    const makeSelectSpriteShadow = (
      degree: number,
      t: PIXI.Texture,
      c: PIXI.Container,
      floorSize: number = 100
    ) => {
      let r = getPositionAndSize(degree, floorSize);
      let s = boxDraw(0x000000, 0, 0, r.size);
      setPositions(s, r, true);
      s.pivot.set(r.size / 2, r.size / 2);
      s.zIndex = r.size - 1;
      s.filters = [myFilter];
      c.addChild(s);
      return s;
    };
    const firstDrawTiles = () => {
      let num = startNum;
      for (let i = 0; i < 7; i++) {
        let t = PIXI.Assets.get(sFileNames[num]);
        let s = makeSelectSprite(degrees[i], t, selectC2, fSize);
        // let b = makeSelectSpriteShadow(degrees[i], t, selectC2, fSize)
        sevenTiles.push(s);
        // sevenShadows.push(b)
        num = plus(num);
      }
      endNum = minus(num);
      let r = getPositionAndSize(-90, this.fSize);
      let box = boxDraw(
        0xffffff,
        r.x - r.size,
        r.y - (r.size * 6) / 5,
        r.size * 2
      );
      box.alpha = 0.5;
      selectC2.addChild(box);
      // console.log('box.x, box.y :', box.x, box.y);
      selectC2.x = 0;
      selectC2.y = fSize - fSize / 8;
    };
    const swiftTiles = (direction: number) => {
      movingON = true;
      let baseVector = this.mobileNow ? 7 : 15;
      baseVector -=
        moveAccel < baseVector / 2 ? moveAccel : Math.floor(baseVector / 2);
      let t = sevenTiles;
      // let bs = sevenShadows
      const tileM = (i: number, oDegree: number, nDegree: number) => {
        let s = t[i];
        // let b = bs[i]
        let thisDegree = oDegree;
        let vector = (nDegree - oDegree) / baseVector;
        let index = 0;
        const moveLoop = () => {
          thisDegree += vector;
          if (index < baseVector / 3 || index > (baseVector * 2) / 3) {
            s.alpha = 1;
          } else {
            s.alpha = 0.85;
          }
          // if (i == 0) console.log('index :', index);
          drawSpriteAndShadow(thisDegree, s, fSize);
          // drawSpriteAndShadow(thisDegree, b, fSize, true)
          if (Math.abs(nDegree - thisDegree) > 0.01) {
            index++;
            requestAnimationFrame(moveLoop);
          } else {
            drawSpriteAndShadow(nDegree, s, fSize);
            // drawSpriteAndShadow(nDegree, b, fSize, true)
          }
        };
        moveLoop();
      };
      const tileV = (i: number) => {
        let s = t[i];
        // let b = bs[i]
        const disappearLoop = () => {
          // b.alpha -= 1 / baseVector
          s.alpha -= 1 / baseVector;
          if (s.alpha > 0) {
            requestAnimationFrame(disappearLoop);
          } else {
            s.parent?.removeChild(s);
            // b.parent.removeChild(b)
          }
        };
        disappearLoop();
      };
      const tileA = (directions: number) => {
        let d: number;
        let t: PIXI.Texture;
        let s: PIXI.Sprite;
        // let b: PIXI.Graphics
        switch (directions) {
          case LEFT:
            startNum = plus(startNum);
            endNum = plus(endNum);
            d = degrees[6];
            t = PIXI.Assets.get(sFileNames[endNum]);
            s = makeSelectSprite(d, t, selectC2, fSize);
            // b = makeSelectSpriteShadow(d, t, selectC2, fSize)
            sevenTiles.push(s);
            // sevenShadows.push(b)
            s.alpha = 0;
            // b.alpha = 0
            break;
          case RIGHT:
            startNum = minus(startNum);
            endNum = minus(endNum);
            d = degrees[0];
            t = PIXI.Assets.get(sFileNames[startNum]);
            s = makeSelectSprite(d, t, selectC2, fSize);
            // b = makeSelectSpriteShadow(d, t, selectC2, fSize)
            sevenTiles.unshift(s);
            // sevenShadows.unshift(b)
            s.alpha = 0;
            // b.alpha = 0
            break;
        }
        const appearLoop = () => {
          // b.alpha += 1 / baseVector
          s.alpha += 1 / baseVector;
          if (s.alpha < 1) {
            requestAnimationFrame(appearLoop);
          } else {
            // console.log('KEY :', KEY)
            if (KEY == LEFT || KEY == RIGHT) {
              swiftTiles(KEY);
              moveAccel++;
            } else {
              movingON = false;
            }
          }
        };
        appearLoop();
      };
      switch (direction) {
        case LEFT:
          for (let i = 1; i < t.length; i++) {
            tileM(i, degrees[i], degrees[i - 1]);
          }
          tileV(0);
          t.shift();
          // bs.shift()
          tileA(LEFT);
          break;
        case RIGHT:
          for (let i = 0; i < t.length - 1; i++) {
            tileM(i, degrees[i], degrees[i + 1]);
          }
          tileV(t.length - 1);
          t.pop();
          // bs.pop()
          tileA(RIGHT);
          break;
      }
    };
    const mainTitle = () => {
      let fb = new PIXI.Container();
      let fc = new PIXI.Container();
      let fd = new PIXI.Container();
      let myf = new PIXI.BlurFilter(7);

      selectC1.addChild(fb, fc, fd);
      const textDraw = () => {
        let b = new PIXI.Sprite(
          PIXI.Assets.get("assets/jigsaw/background.jpg")
        );
        let JigSaw = this.textPrepare(
          "JigSaw",
          0xffffff,
          fSize / 10,
          0,
          0,
          true
        );
        JigSaw.width = fSize / 2;
        JigSaw.height = fSize / 7;
        let JigSawB = this.textPrepare(
          "JigSaw",
          0x000000,
          fSize / 10,
          0,
          0,
          true
        );
        JigSawB.width = JigSaw.width;
        JigSawB.height = JigSaw.height;
        let prev = this.textPrepare("prev", 0xffffff, fSize / 17, 0, 0, true);
        prev.width = fSize / 4;
        prev.height = fSize / 9;
        let prevB = this.textPrepare("prev", 0x000000, fSize / 17, 0, 0, true);
        prevB.width = prev.width;
        prevB.height = prev.height;
        let next = this.textPrepare("next", 0xffffff, fSize / 17, 0, 0, true);
        next.width = prev.width;
        next.height = prev.height;
        let nextB = this.textPrepare("next", 0x000000, fSize / 17, 0, 0, true);
        nextB.width = prev.width;
        nextB.height = prev.height;
        b.anchor.set(0.5, 0.5);
        b.position.set(fSize / 2, fSize / 2);
        JigSaw.position.set(fSize / 2, fSize / 2 - fSize / 3);
        // fd.filters = [myf]
        JigSawB.position.set(JigSaw.x, JigSaw.y);
        // fc.addChild(prevB, prev, nextB, next)
        next.position.set(fSize / 2 + fSize / 4, fSize / 2 + fSize / 3);
        nextB.position.set(fSize / 2 + fSize / 4, fSize / 2 + fSize / 3);
        prev.position.set(fSize / 2 - fSize / 4, fSize / 2 + fSize / 3);
        prevB.position.set(fSize / 2 - fSize / 4, fSize / 2 + fSize / 3);
        fc.addChild(JigSaw, prev, next);
        fd.addChild(JigSawB, prevB, nextB);
        let mask = this.containerToSprite(fc);
        let shadow = this.containerToSprite(fd);
        shadow.filters = [myf];
        b.mask = mask;
        shadow.position.set(fSize / 80, fSize / 80);
        fb.addChild(shadow, mask, b);
        fb.position.set((fSize - fb.width) / 2, (fSize - fb.width) / 2);
        fc.parent?.removeChild(fc, fd);
        // console.log('prev.x, prev.y, prev.width, prev.height :', prev.x, prev.y, prev.width, prev.height);
        const bpF = () => {
          if (!movingON) swiftTiles(LEFT);
          KEY = LEFT;
          moveAccel = 0;
        };
        const bnF = () => {
          if (!movingON) swiftTiles(RIGHT);
          KEY = RIGHT;
          moveAccel = 0;
        };
        const bbF = () => {
          if (!selectTileNumberMode) {
            console.log("selectTileNumber :", selectTileNumber);
            for (let i = 0; i < 3; i++) {
              startNum = plus(startNum);
              endNum = plus(endNum);
            }
            let string = sFileNames[startNum];
            string = string
              .replace("assets/jigsaw/", "")
              .replace(".jpg", "")
              .replace("/s0", "$");
            let strings = string.split("$");
            this.folder = strings[0];
            this.file = strings[1];
            console.log("strings :", strings);
            selectTileNumber();
            selectTileNumberMode = true;
          } else {
            for (let i = 0; i < 3; i++) {
              startNum = plus(startNum);
            }
            let s = sFileNames[startNum];
            s = s.replace("assets/jigsaw/b/", "").replace(".jpg", "");
            console.log("s :", s);
            if (Number(s) != this.tNum) {
              cookieWrite({ jigsawPosition: "" });
            }
            this.tNum = Number(s);
            jigsawRestart(this.folder, this.file, this.tNum);
          }
        };
        let bp = boxButtonDraw(
          bpF,
          0x000000,
          0,
          fb.height - prev.width / 2,
          prev.width,
          prev.height
        );
        let bn = boxButtonDraw(
          bnF,
          0x000000,
          fb.width - prev.width,
          fb.height - prev.width / 2,
          prev.width,
          prev.height
        );
        let bb = boxButtonDraw(
          bbF,
          0x000000,
          (fb.width - (fb.width * 2) / 3) / 2,
          (fb.width - (fb.width * 1.2) / 2.2) / 2,
          (fb.width * 2) / 3,
          (fb.width * 2) / 3
        );
        // let bb = boxButtonDraw(this.selectEnd, 0x000000, (fb.width - fb.width * 2 / 3) / 2, (fb.width - fb.width * 1.2 / 2.2) / 2, fb.width * 2 / 3, fb.width * 2 / 3)

        bp.alpha = 0;
        bn.alpha = 0;
        bb.alpha = 0;

        bp.on("pointerup", () => (KEY = 0));
        bn.on("pointerup", () => (KEY = 0));
        fb.addChild(bp, bn, bb);
        // moveB(b)
      };

      textDraw();
    };
    const selectTileNumber = () => {
      sFileNames = [];
      sevenTiles = [];
      const startNumSet = () => {
        for (let i = 0; i < this.tNum - 7; i++) {
          startNum = plus(startNum);
          endNum = plus(endNum);
        }
      };
      for (let i = 0; i < 12; i++) {
        let s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4);
        sFileNames.push("assets/jigsaw/b/" + s + ".jpg");
      }
      startNum = 0;
      endNum = 11;
      startNumSet();
      selectC2.parent?.removeChild(selectC2);
      selectC2 = new PIXI.Container();
      this.bg3.addChild(selectC2);
      selectC2.zIndex = 0;
      selectC2.sortableChildren = true;
      firstDrawTiles();
    };
    firstDrawTiles();
    mainTitle();
  };
  textPrepare = (
    text: string,
    color: number,
    font_size: number,
    x: number,
    y: number,
    b: boolean = true,
    font: string = "Times New Roman"
  ) => {
    const b_style: Partial<PIXI.TextStyleOptions> = {
      fontFamily: font,
      fontWeight: "bold", // 혹은 '700'
      stroke: {
        width: font_size / 50,
        color: "#000000", // v8은 stroke 설정 시 색상을 명시하는 것이 좋습니다.
        join: "round", // 텍스트 외곽선을 부드럽게 처리 (추천 옵션)
      },
    };
    let ty = new PIXI.TextStyle(b_style);
    let t = new PIXI.Text(text, ty);
    t.style.fill = color;
    t.style.stroke = color;
    if (b) t.anchor.set(0.5, 0.5);
    t.position.set((this.fSize * x) / 100, (this.fSize_h * y) / 100);
    t.style.fontSize = (this.fSize * font_size) / 100;
    return t;
  };
}

let r: myReturn;
let f: JigsawFloor;
let t_num: number;
const jigsawFirstStart = async () => {
  let cookie = cookieRead();
  let filename: string, folder: string, file: string;
  if (cookie.jigsawFolder == undefined || cookie.jigsawFolder == "") {
    folder = String(Math.floor(Math.random() * 5));
    file = String(Math.floor(Math.random() * 9));
    t_num = 7;
    cookieWrite({ jigsawFolder: folder, jigsawFile: file, jigsawNumber: "7" });
  } else {
    folder = cookie.jigsawFolder;
    file = cookie.jigsawFile;
    t_num = cookie.jigsawNumber == undefined ? 10 : Number(cookie.jigsawNumber);
  }
  console.log("cookie.jigsawNumber :", cookie.jigsawNumber);
  // folder = "1"
  // file = "1"
  // t_num = 15
  filename = "assets/jigsaw/" + folder + "/0" + file + ".jpg";
  // console.log('filename :', filename);
  // cookie.jigsawPosition = ""
  let sFileNames: string[] = [];
  for (let folder = 0; folder < 5; folder++) {
    for (let file = 0; file < 9; file++) {
      let s = "assets/jigsaw/" + String(folder) + "/s0" + String(file) + ".jpg";
      // console.log('s :', s);
      sFileNames.push(s);
    }
  }
  let sFileNames2: string[] = [];
  for (let i = 0; i < 12; i++) {
    let s = i + 4 > 9 ? String(i + 4) : "0" + String(i + 4);
    // console.log("assets/jigsaw/b/" + s + ".jpg");
    sFileNames2.push("assets/jigsaw/b/" + s + ".jpg");
  }
  const assetsToLoad = [
    filename,
    ...sFileNames,
    ...sFileNames2,
    "assets/jigsaw/background.jpg",
  ];

  // 2. Assets.load를 사용하여 비동기로 로딩합니다.
  // (이 코드는 async 함수 내부에 있어야 합니다.)
  try {
    await PIXI.Assets.load(assetsToLoad);

    console.log("t_num :", t_num);

    // 3. PIXI.Assets.get()을 사용하여 텍스처를 즉시 가져옵니다.
    console.log("filename :", filename);

    const mainTexture = PIXI.Assets.get(filename);
    console.log("mainTexture :", mainTexture);

    f = new JigsawFloor(
      r,
      mainTexture, // Loader.shared...texture 대신 Assets.get 사용
      cookie.jigsawPosition,
      t_num,
      folder,
      file
    );
  } catch (error) {
    console.error("자산 로드 중 에러 발생:", error);
  }
};
const jigsawRestart = (folder: string, file: string, t_num: number = 7) => {
  console.log("folder, file :", folder, file);
  cookieWrite({
    jigsawFolder: folder,
    jigsawFile: file,
    jigsawNumber: String(t_num),
  });
  location.href = "/";
};

async function main() {
  initFirebase();
  r = await makeFloor();
  await jigsawFirstStart();
}

main();
