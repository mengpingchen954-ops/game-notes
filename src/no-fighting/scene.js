import Phaser from 'phaser';
import {ADVANCED_LEVEL, sameCell, isExit, isScreen} from './model.js';

export const VIEW = {width: 840, height: 650, left: 140, top: 40, cell: 80};
export const center = ({x, y}) => ({x: VIEW.left + (x + .5) * VIEW.cell, y: VIEW.top + (y + .5) * VIEW.cell});
const assets = {
  champion: new URL('./assets/champion.svg', import.meta.url).href,
  flag: new URL('./assets/flag.svg', import.meta.url).href,
  screen: new URL('./assets/screen.svg', import.meta.url).href,
  spectator: new URL('./assets/spectator.svg', import.meta.url).href
};

export function createArena(parent, onReady, onError, level = ADVANCED_LEVEL) {
  class ArenaScene extends Phaser.Scene {
    constructor() { super('arena'); this.level = level; this.flags = []; this.motionResolve = null; this.assetError = false; }
    preload() {
      this.load.on('loaderror', () => {this.assetError = true; onError('场景素材未能加载，请刷新页面重试。');});
      for (const [key, url] of Object.entries(assets)) this.load.svg(key, url);
    }
    create() {
      if (this.assetError) return;
      this.drawCourtyard();
      this.routeLayer = this.add.graphics().setDepth(3);
      this.hoverLayer = this.add.graphics().setDepth(4);
      this.flagLayer = this.add.container(0, 0).setDepth(6);
      const start = center(this.level.start);
      this.shadow = this.add.ellipse(start.x, start.y + 19, 61, 20, 0x292e2b, .14).setDepth(8);
      this.champion = this.add.image(start.x, start.y + 19, 'champion').setDisplaySize(81, 103).setOrigin(.5, .82).setDepth(10);
      this.drawName();
      onReady(this);
    }
    drawCourtyard() {
      const g = this.add.graphics();
      g.fillStyle(0xe5dfcd).fillRoundedRect(31, 29, 778, 584, 25);
      g.lineStyle(1, 0xcfc5ad, .7).strokeRoundedRect(39, 37, 762, 568, 20);
      // Authored ink landscape, deliberately vector-rendered for this prototype.
      for (let i = 0; i < 10; i++) {
        g.lineStyle(1, 0xb4ac96, .13).lineBetween(48, 90 + i * 49, 792, 90 + i * 49);
      }
      g.fillStyle(0xaaa68d, .14).fillEllipse(421, 558, 537, 52);
      g.fillStyle(0x9c8b6d).fillRoundedRect(205, 108, 430, 432, 6);
      g.fillStyle(0xc7b798).fillRoundedRect(207, 103, 426, 429, 6);
      g.fillStyle(0xece3cb).fillRect(220, 120, 400, 400);
      for (let y = 1; y <= 5; y++) for (let x = 1; x <= 5; x++) {
        const p = center({x, y});
        g.fillStyle((x + y) % 2 ? 0xeee6d4 : 0xe7ddc7).fillRect(p.x - 39, p.y - 39, 78, 78);
        g.lineStyle(1, 0xc5b797, .5).strokeRect(p.x - 39, p.y - 39, 78, 78);
        if (!isScreen({x, y}, this.level) && !sameCell(this.level.start, {x, y})) {
          g.fillStyle(0xa79a79, .55).fillCircle(p.x, p.y + 10, 3);
        }
      }
      // A broken vermilion perimeter marks the exits on the right.
      g.lineStyle(4, 0xa94f3a, .78);
      g.lineBetween(220, 120, 620, 120).lineBetween(220, 120, 220, 520).lineBetween(220, 520, 620, 520);
      for (let y = 1; y <= 5; y++) if (!isExit({x: 6, y}, this.level)) {
        g.lineBetween(620, 120 + (y - 1) * 80, 620, 120 + y * 80);
      }
      for (const exit of this.level.exits) {
        const p = center(exit);
        g.fillStyle(0xc29f59, .25).fillRoundedRect(p.x - 35, p.y - 37, 70, 75, 4);
        g.lineStyle(1, 0xa7894f, .7).strokeRoundedRect(p.x - 35, p.y - 37, 70, 75, 4);
        g.lineStyle(3, 0xac8a46, .6).beginPath().moveTo(p.x - 11, p.y - 8).lineTo(p.x + 2, p.y).lineTo(p.x - 11, p.y + 8).strokePath();
        this.add.text(p.x, p.y + 22, '退场口', {fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '12px', color: '#866d3d'}).setOrigin(.5);
      }
      for (const screen of this.level.screens) {
        const p = center(screen);
        this.add.image(p.x, p.y, 'screen').setDisplaySize(75, 78).setDepth(5);
      }
      // Quiet spectators and hanging couplets frame the board without becoming obstacles.
      for (const [x, y, tint] of [[275, 68, 0xffffff], [344, 59, 0xe5d0b8], [488, 58, 0xffffff], [558, 70, 0xc8ccc0], [273, 576, 0xd3be9f], [345, 587, 0xffffff], [486, 586, 0xe6cfb6], [558, 576, 0xffffff]]) {
        this.add.image(x, y, 'spectator').setDisplaySize(41, 52).setTint(tint).setAlpha(.83);
      }
      this.banner(89, 138, '以\n智\n会\n友');
      this.banner(780, 309, '不\n得\n动\n武');
      this.add.text(77, 473, '观\n战\n席', {fontFamily: 'KaiTi, STKaiti, serif', fontSize: '18px', color: '#8f8b73', lineSpacing: 7}).setOrigin(.5);
      if (this.level.key === 'tutorial') {
        const target = center(this.level.tutorialTarget);
        g.lineStyle(3, 0xc29f59, .8).strokeCircle(target.x, target.y, 32);
        this.add.text(target.x - 11, target.y - 47, '先点这里', {fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '14px', color: '#9b6b2a', backgroundColor: '#f8efd6', padding: {x: 5, y: 3}}).setOrigin(.5);
        this.add.text(428, 636, '一面旗，先学会借势出圈。', {fontFamily: 'KaiTi, STKaiti, serif', fontSize: '16px', color: '#8c806a'}).setOrigin(.5);
      } else {
        this.add.text(428, 636, '两面旗，一场不用拳脚的较量。', {fontFamily: 'KaiTi, STKaiti, serif', fontSize: '16px', color: '#8c806a'}).setOrigin(.5);
      }
    }
    banner(x, y, text) {
      const g = this.add.graphics();
      g.lineStyle(3, 0x5f5847).lineBetween(x - 28, y - 3, x + 28, y - 3);
      g.fillStyle(0x8d3f33).fillPoints([{x: x - 23, y}, {x: x + 23, y}, {x: x + 23, y: y + 147}, {x, y: y + 134}, {x: x - 23, y: y + 147}], true);
      this.add.text(x, y + 13, text, {fontFamily: 'KaiTi, STKaiti, serif', fontSize: '21px', color: '#f0d7a5', lineSpacing: 4}).setOrigin(.5, 0);
    }
    drawName() {
      const p = center(this.level.start);
      this.nameLabel = this.add.text(p.x, p.y + 46, '岳不挪', {fontFamily: 'Microsoft YaHei, sans-serif', fontSize: '12px', color: '#34413a', backgroundColor: '#e9dfc8', padding: {x: 5, y: 2}}).setOrigin(.5).setDepth(11);
    }
    setHover(cell) {
      this.hoverLayer.clear();
      if (!cell) return;
      const p = center(cell);
      this.hoverLayer.fillStyle(0xa64232, .10).fillRoundedRect(p.x - 35, p.y - 35, 70, 70, 3);
      this.hoverLayer.lineStyle(2, 0xa64232, .65).strokeRoundedRect(p.x - 35, p.y - 35, 70, 70, 3);
    }
    setFlags(flags, collected = []) {
      this.flagLayer.removeAll(true);
      flags.forEach((flag, index) => {
        if (collected.includes(index)) return;
        const p = center(flag);
        const sprite = this.add.image(p.x + 5, p.y + 14, 'flag').setDisplaySize(53, 75).setOrigin(.5, .85);
        const number = this.add.text(p.x - 14, p.y + 21, `${index + 1}`, {fontFamily: 'Georgia, serif', fontSize: '13px', color: '#fff4db', backgroundColor: '#9b3e31', padding: {x: 5, y: 2}}).setOrigin(.5);
        this.flagLayer.add([sprite, number]);
      });
    }
    setRoute(result) {
      this.routeLayer.clear();
      if (!result) return;
      const route = [this.level.start, ...result.steps];
      const color = result.won ? 0x4c7565 : 0x9c7850;
      for (let i = 1; i < route.length; i++) {
        const a = center(route[i - 1]), b = center(route[i]);
        this.routeLayer.lineStyle(4, color, .75).lineBetween(a.x, a.y + 9, b.x, b.y + 9);
        this.routeLayer.fillStyle(color, .9).fillCircle(b.x, b.y + 9, 5);
      }
      if (!result.steps.length) {
        const p = center(this.level.start);
        this.routeLayer.lineStyle(3, color, .8).strokeCircle(p.x, p.y + 9, 31);
      }
    }
    reset() {
      this.cancelMotion();
      const p = center(this.level.start);
      this.champion.setPosition(p.x, p.y + 19).setAngle(0);
      this.shadow.setPosition(p.x, p.y + 19);
      this.nameLabel.setPosition(p.x, p.y + 46);
      this.setRoute(null);
      this.setHover(null);
    }
    cancelMotion() {
      this.tweens.killAll();
      if (this.motionResolve) {this.motionResolve(); this.motionResolve = null;}
    }
    walkTo(cell, reducedMotion) {
      const p = center(cell);
      return new Promise(resolve => {
        this.motionResolve = resolve;
        this.tweens.add({targets: [this.champion, this.shadow], x: p.x, y: p.y + 19, duration: reducedMotion ? 45 : 280, ease: 'Sine.easeInOut', onComplete: () => {
          this.nameLabel.setPosition(p.x, p.y + 46);
          this.motionResolve = null;
          resolve();
        }});
        this.nameLabel.setPosition(p.x, p.y + 46);
      });
    }
  }
  return new Phaser.Game({
    type: Phaser.CANVAS, parent, width: VIEW.width, height: VIEW.height, transparent: true,
    render: {antialias: true, roundPixels: false},
    scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
    scene: ArenaScene, banner: false, audio: {noAudio: true},
    fps: {target: 30, forceSetTimeOut: true}
  });
}
