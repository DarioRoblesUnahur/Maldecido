function _extraerFrames(tex, fila, numFrames) {
  const fw = 64, fh = 64;
  const frames = [];
  for (let i = 0; i < numFrames; i++) {
    frames.push(new PIXI.Texture({
      source: tex.source,
      frame: new PIXI.Rectangle(i * fw, fila * fh, fw, fh),
    }));
  }
  return frames;
}

function _animSpr(tex, fila, numFrames, escala, speed) {
  const spr = new PIXI.AnimatedSprite(_extraerFrames(tex, fila, numFrames));
  spr.anchor.set(0.5);
  spr.scale.set(escala);
  spr.animationSpeed = speed;
  spr.play();
  return spr;
}

const _Vistas = {
  guerrero()  { return _animSpr(window._TEX.esqueleto, 1, 8, 1.30, 0.15); },
  bestia()    { return _animSpr(window._TEX.bestia,    1, 8, 1.30, 0.22); },
  sombra()    { return _animSpr(window._TEX.reptil,    1, 8, 1.30, 0.20); },
  hechicero(fila = 0) { return _animSpr(window._TEX.hechicero,    fila, 13, 1.30, 0.08); },
  golem()     { return _animSpr(window._TEX.golem,     1, 8, 1.80, 0.10); },
  chaman()    { return _animSpr(window._TEX.jefe,      1, 8, 2.60, 0.12); },
};
