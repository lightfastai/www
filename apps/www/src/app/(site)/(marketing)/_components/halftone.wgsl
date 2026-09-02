struct Frame { resolution: vec2f }
struct Art {
  uReveal: f32,
  uPixelSize: f32,
  uGooeyness: f32,
  uContrast: f32,
  uBias: f32,
  uInvert: f32,
  uBg: vec3f,
  uFg: vec3f,
  uWaveTime: f32,
  uWaveFrequency: f32,
  uWaveAmplitude: f32,
}
@group(0) @binding(0) var fieldTexture: texture_2d<f32>;
@group(0) @binding(1) var fieldSampler: sampler;
@group(0) @binding(2) var<uniform> frame: Frame;
@group(0) @binding(3) var<uniform> art: Art;

fn radius(luma: f32, bias: f32) -> f32 {
  var value = clamp((luma - 0.5 + art.uBias + bias) * art.uContrast + 0.5, 0, 1);
  value = mix(value, 1.0 - value, art.uInvert);
  return value * art.uPixelSize * 0.6 + art.uPixelSize * 0.05;
}

fn smoothMin(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0) / max(k, 0.001);
  return min(a, b) - h * h * k * 0.25;
}

@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pixel = uv * frame.resolution;
  let base = floor(pixel / art.uPixelSize);
  let fieldSize = vec2f(textureDimensions(fieldTexture));
  var minimum = 1e5;
  for (var dx = -1; dx <= 1; dx += 1) {
    for (var dy = -1; dy <= 1; dy += 1) {
      let cell = base + vec2f(f32(dx), f32(dy));
      if ((cell.x + cell.y) % 2.0 < 0.5) {
        let center = (cell + 0.5) * art.uPixelSize;
        let luma = textureSampleLevel(fieldTexture, fieldSampler, (cell + 0.5) / fieldSize, 0).r;
        let phase = center.y / frame.resolution.y * art.uWaveFrequency * 6.2831853 - art.uWaveTime;
        let distanceField = distance(pixel, center) - radius(luma, sin(phase) * art.uWaveAmplitude);
        minimum = smoothMin(minimum, distanceField, art.uGooeyness * 1.5 * art.uPixelSize);
      }
    }
  }
  let aa = max(abs(dpdx(minimum)) + abs(dpdy(minimum)), 0.0001);
  let shape = 1.0 - smoothstep(-aa, aa, minimum);
  return vec4f(mix(art.uBg, art.uFg, shape) * art.uReveal, 1);
}
