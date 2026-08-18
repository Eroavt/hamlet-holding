/**
 * three.js does NOT declare a fragment output for `glslVersion: GLSL3`
 * ShaderMaterials — `gl_FragColor` simply does not exist there, and every
 * fragment shader that assumes it silently fails to compile. Each of our
 * GLSL3 fragment shaders declares its own output via this chunk.
 */
export const FRAG_OUT = /* glsl */ `
layout(location = 0) out vec4 fragColor;
`;

export const COMMON = /* glsl */ `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

float easeInOutQuint(float t) {
  return t < 0.5
    ? 16.0 * t * t * t * t * t
    : 1.0 - pow(-2.0 * t + 2.0, 5.0) * 0.5;
}

float easeOutCubic(float t) {
  return 1.0 - pow(1.0 - t, 3.0);
}

vec3 rotateY(vec3 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}
`;

/** One trilinear fetch into the baked curl volume — see gl/data/curlField.ts. */
export const CURL = /* glsl */ `
uniform sampler3D uCurl;

vec3 curl(vec3 p) {
  return texture(uCurl, p).xyz * 2.0 - 1.0;
}
`;
