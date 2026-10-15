// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { DitheringTypes, imageDitheringFragmentShader } from '@paper-design/shaders';
import { useThree } from '@react-three/fiber';
import { ShaderPass } from 'postprocessing';
import { GLSL3, NoBlending, RawShaderMaterial, Uniform, Vector2, Vector4 } from 'three';

// Paper expects an uploaded image; a render-target texture already has WebGL's Y orientation.
const imageFlip = 'imageUV.y = 1. - imageUV.y;';
const imageSample = 'vec4 image = texture(u_image, imageUV);';
const imageOutput = 'fragColor = vec4(color, opacity);';
if (
  !imageDitheringFragmentShader.startsWith('#version 300 es') ||
  !imageDitheringFragmentShader.includes(imageFlip) ||
  !imageDitheringFragmentShader.includes(imageSample) ||
  !imageDitheringFragmentShader.includes(imageOutput)
) {
  throw new Error('Paper image-dithering shader changed. Review the render-target adapter.');
}
const fragmentShader = imageDitheringFragmentShader
  .replace('#version 300 es', '')
  .replace(imageFlip, '')
  // Dither straight color, not surface coverage. Restore premultiplied alpha afterward.
  .replace(
    imageSample,
    `${imageSample}
    float surfaceAlpha = image.a;
    image.rgb /= max(surfaceAlpha, 0.00001);
    image.a = 1.0;
  `,
  )
  .replace(imageOutput, 'fragColor = vec4(clamp(color, 0.0, 1.0) * surfaceAlpha, surfaceAlpha);');

export class PaperDitheringPass extends ShaderPass {
  readonly resolution: Vector2;
  readonly pixelRatio: Uniform<number>;
  readonly imageAspectRatio: Uniform<number>;

  constructor() {
    const resolution = new Vector2(1, 1);
    const pixelRatio = new Uniform(1);
    const imageAspectRatio = new Uniform(1);
    const foreground = new Vector4(1, 1, 1, 1);
    super(
      new RawShaderMaterial({
        name: 'PaperImageDithering',
        glslVersion: GLSL3,
        vertexShader: `
        precision highp float;
        in vec3 position;
        void main() { gl_Position = vec4(position, 1.0); }
      `,
        fragmentShader,
        uniforms: {
          u_image: new Uniform(null),
          u_resolution: new Uniform(resolution),
          u_pixelRatio: pixelRatio,
          u_imageAspectRatio: imageAspectRatio,
          u_originX: new Uniform(0.5),
          u_originY: new Uniform(0.5),
          u_fit: new Uniform(1),
          u_scale: new Uniform(1),
          u_rotation: new Uniform(0),
          u_offsetX: new Uniform(0),
          u_offsetY: new Uniform(0),
          u_colorFront: new Uniform(foreground),
          u_colorHighlight: new Uniform(foreground),
          u_colorBack: new Uniform(new Vector4(0, 0, 0, 0)),
          u_type: new Uniform(DitheringTypes['8x8']),
          u_pxSize: new Uniform(2),
          u_colorSteps: new Uniform(4),
          u_originalColors: new Uniform(true),
          u_inverted: new Uniform(false),
        },
        depthTest: false,
        depthWrite: false,
        blending: NoBlending,
      }),
      'u_image',
    );
    this.resolution = resolution;
    this.pixelRatio = pixelRatio;
    this.imageAspectRatio = imageAspectRatio;
  }

  setSize(width: number, height: number) {
    this.resolution.set(width, height);
    this.imageAspectRatio.value = width / height;
  }
}

export function PaperDithering() {
  const pass = React.useMemo(() => new PaperDitheringPass(), []);
  const pixelRatio = useThree((state) => state.viewport.dpr);

  React.useLayoutEffect(() => {
    pass.pixelRatio.value = pixelRatio;
  }, [pass, pixelRatio]);

  React.useEffect(() => () => pass.dispose(), [pass]);
  return <primitive object={pass} />;
}
