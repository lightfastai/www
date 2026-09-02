struct Params { time: f32, amplitude: f32, reveal: f32 }
@group(0) @binding(0) var<uniform> params: Params;

fn sineWarp(c0: vec2f, amplitude: f32, time: f32) -> vec2f {
  var c = c0;
  c += amplitude * 0.4 * sin(c.yx + vec2f(1.2, 3.4) + time);
  c += amplitude * 0.2 * sin(5.2 * c.yx + vec2f(3.5, 0.4) + time);
  c += amplitude * 0.3 * sin(3.5 * c.yx + vec2f(1.2, 3.1) + time);
  c += amplitude * 1.6 * sin(0.4 * c.yx + vec2f(0.8, 2.4) + time);
  return c;
}

@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let radius = length(sineWarp(2.0 * uv - 1.0, params.amplitude * params.reveal, params.time * 0.08));
  var value = 0.0;
  value = mix(value, 0.0, 1.0);
  value = mix(value, 1.0 / 3.0, cos(radius));
  value = mix(value, 2.0 / 3.0, cos(2.0 * radius));
  value = mix(value, 1.0, cos(3.0 * radius));
  return vec4f(clamp(value, 0, 1), 0, 0, 1);
}
