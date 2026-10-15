// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  getShaderColorFromString,
  heatmapFragmentShader,
  heatmapMeta,
} from '@paper-design/shaders';
import { useFrame } from '@react-three/fiber';
import { KawaseBlurPass, KernelSize, Pass, ShaderPass } from 'postprocessing';
import {
  GLSL3,
  NoBlending,
  RawShaderMaterial,
  Uniform,
  Vector4,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';

// Cold to hot: theme background, faint lavender, then saturated purple.
// The first lavender stop's hex alpha (1f) keeps the disappearing edges subtle.
const darkColors = [
  coreaiDarkTheme.colorNeutralBackground6,
  coreaiDarkTheme.colorNeutralBackground6,
  `${coreaiBrandVariants[140]}1f`,
  coreaiBrandVariants[140],
  coreaiBrandVariants[130],
  coreaiBrandVariants[110],
  coreaiBrandVariants[100],
  coreaiBrandVariants[80],
  coreaiBrandVariants[80],
  coreaiBrandVariants[80],
];
const lightColors = [
  coreaiLightTheme.colorNeutralBackground1,
  coreaiLightTheme.colorNeutralBackground1,
  `${coreaiBrandVariants[140]}1f`,
  coreaiBrandVariants[140],
  coreaiBrandVariants[130],
  coreaiBrandVariants[110],
  coreaiBrandVariants[100],
  coreaiBrandVariants[80],
  coreaiBrandVariants[80],
  coreaiBrandVariants[80],
];
const vertexShader = `
  precision highp float;
  in vec3 position;
  out vec2 vUv;
  out mediump vec2 v_imageUV;
  out mediump vec2 v_objectUV;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    v_objectUV = vUv - 0.5;
    // Undo Paper's padded-upload crop; our input already covers the live scene.
    v_imageUV = (vUv - 0.5) * 1.75 + 0.5;
    gl_Position = vec4(position, 1.0);
  }
`;

function imagePass(body: string, uniforms: RawShaderMaterial['uniforms'] = {}) {
  return new ShaderPass(
    new RawShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: `
      precision highp float;
      in vec2 vUv;
      uniform sampler2D u_image;
      out vec4 fragColor;
      ${body}
    `,
      uniforms: { u_image: new Uniform(null), ...uniforms },
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    }),
    'u_image',
  );
}

function target() {
  return new WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
}

export class PaperHeatmapPass extends Pass {
  readonly time = new Uniform(0);
  private readonly palette = darkColors.map(
    (color) => new Vector4(...getShaderColorFromString(color)),
  );
  private readonly source = target();
  private readonly contour = target();
  private readonly outer = target();
  private readonly inner = target();
  private readonly packed = target();
  private readonly heat = target();
  private readonly surface = new Uniform<Texture | null>(null);
  private readonly contourBlur = new KawaseBlurPass({
    resolutionScale: 1,
    kernelSize: KernelSize.SMALL,
  });
  private readonly outerBlur = new KawaseBlurPass({
    resolutionScale: 0.125,
    kernelSize: KernelSize.LARGE,
  });
  private readonly innerBlur = new KawaseBlurPass({
    resolutionScale: 0.5,
    kernelSize: KernelSize.MEDIUM,
  });
  private readonly grayscale = imagePass(`
    void main() {
      vec4 surface = texture(u_image, vUv);
      float brightness = clamp(dot(surface.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
      float mask = 1.0 - brightness * surface.a;
      fragColor = vec4(vec3(mask), 1.0);
    }
  `);
  private readonly pack = imagePass(
    `
    uniform sampler2D u_outer;
    uniform sampler2D u_inner;
    void main() {
      fragColor = vec4(
        texture(u_image, vUv).r,
        texture(u_outer, vUv).r,
        texture(u_inner, vUv).r,
        1.0
      );
    }
  `,
    {
      u_outer: new Uniform(this.outer.texture),
      u_inner: new Uniform(this.inner.texture),
    },
  );
  private readonly composite = imagePass(
    `
    uniform sampler2D u_surface;
    uniform vec4 u_base;
    void main() {
      vec4 surface = texture(u_surface, vUv);
      vec3 heat = texture(u_image, vUv).rgb;
      // Paper adds +/-0.01 grain even at noise=0; include 8-bit rounding in the cleanup.
      if (all(lessThanEqual(abs(heat - u_base.rgb), vec3(0.012)))) {
        heat = u_base.rgb;
      }
      fragColor = vec4(heat * surface.a, surface.a);
    }
  `,
    { u_surface: this.surface, u_base: new Uniform(this.palette[0]) },
  );
  private readonly heatmap: ShaderPass;

  constructor() {
    super('PaperHeatmap');
    if (
      !heatmapFragmentShader.startsWith('#version 300 es') ||
      !heatmapFragmentShader.includes('imgUV *= 0.5714285714285714;')
    ) {
      throw new Error('Paper heatmap shader changed. Review the live-image adapter.');
    }
    const palette = this.palette;
    this.heatmap = new ShaderPass(
      new RawShaderMaterial({
        name: 'PaperHeatmap',
        glslVersion: GLSL3,
        vertexShader,
        fragmentShader: heatmapFragmentShader.replace('#version 300 es', ''),
        uniforms: {
          u_image: new Uniform(null),
          u_time: this.time,
          u_colorBack: new Uniform(palette[0]),
          u_colors: new Uniform(
            Array.from(
              { length: heatmapMeta.maxColorCount },
              (_, i) => palette[Math.min(i, palette.length - 1)],
            ),
          ),
          u_colorsCount: new Uniform(palette.length),
          u_contour: new Uniform(1),
          u_angle: new Uniform(0),
          u_noise: new Uniform(0.025),
          u_innerGlow: new Uniform(0.5),
          u_outerGlow: new Uniform(0.5),
        },
        depthTest: false,
        depthWrite: false,
        blending: NoBlending,
      }),
      'u_image',
    );
  }

  setLightMode(lightMode: boolean) {
    const colors = lightMode ? lightColors : darkColors;
    this.palette.forEach((color, index) => color.set(...getShaderColorFromString(colors[index])));
  }

  setSize(width: number, height: number) {
    // Heat fields are smooth; cap their resolution without reducing the final scene or dither grid.
    const scale = Math.min(1, 512 / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    for (const buffer of [
      this.source,
      this.contour,
      this.outer,
      this.inner,
      this.packed,
      this.heat,
    ]) {
      buffer.setSize(w, h);
    }
    for (const blur of [this.contourBlur, this.outerBlur, this.innerBlur]) blur.setSize(w, h);
  }

  render(
    renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
    outputBuffer: WebGLRenderTarget,
    deltaTime?: number,
  ) {
    this.grayscale.render(renderer, inputBuffer, this.source);
    this.contourBlur.render(renderer, this.source, this.contour);
    this.outerBlur.render(renderer, this.source, this.outer);
    this.innerBlur.render(renderer, this.source, this.inner);
    this.pack.render(renderer, this.contour, this.packed);
    this.heatmap.render(renderer, this.packed, this.heat);
    this.surface.value = inputBuffer.texture;
    this.composite.renderToScreen = this.renderToScreen;
    this.composite.render(renderer, this.heat, outputBuffer, deltaTime);
  }

  dispose() {
    for (const stage of [
      this.grayscale,
      this.contourBlur,
      this.outerBlur,
      this.innerBlur,
      this.pack,
      this.heatmap,
      this.composite,
    ]) {
      stage.dispose();
    }
    for (const buffer of [
      this.source,
      this.contour,
      this.outer,
      this.inner,
      this.packed,
      this.heat,
    ]) {
      buffer.dispose();
    }
  }
}

export function PaperHeatmap({
  reduceMotion,
  lightMode,
}: {
  reduceMotion: boolean;
  lightMode: boolean;
}) {
  const pass = React.useMemo(() => new PaperHeatmapPass(), []);
  React.useLayoutEffect(() => pass.setLightMode(lightMode), [pass, lightMode]);
  useFrame((_, delta) => {
    if (!reduceMotion) pass.time.value += Math.min(delta, 0.1) * 0.67;
  });
  React.useEffect(() => () => pass.dispose(), [pass]);
  return <primitive object={pass} />;
}
