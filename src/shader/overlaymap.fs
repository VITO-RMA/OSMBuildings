#ifdef GL_ES
  precision mediump float;
#endif

uniform sampler2D uTexIndex;
uniform vec3 uFogColor;

varying vec2 vTexCoord;
varying float verticalDistanceToLowerEdge;

uniform float uFogDistance;
uniform float uFogBlurDistance;
uniform float uAlpha;

void main() {
  float fogIntensity = (verticalDistanceToLowerEdge - uFogDistance) / uFogBlurDistance;
  fogIntensity = clamp(fogIntensity, 0.0, 1.0);

  vec4 textCol = texture2D(uTexIndex, vec2(vTexCoord.x, 1.0-vTexCoord.y));
  
  gl_FragColor = vec4(texture2D(uTexIndex, vec2(vTexCoord.x, 1.0-vTexCoord.y)).rgb, 1.0-fogIntensity);
  if(uAlpha > -0.00001) {
    //gl_FragColor.w = clamp(uAlpha, 0.0, 1.0);
    gl_FragColor.r = textCol.r;
    gl_FragColor.g = textCol.g;
    gl_FragColor.b = textCol.b;
    gl_FragColor.a = clamp(uAlpha-fogIntensity, 0.0, 1.0);
    if(textCol.a < 0.0001) {
      gl_FragColor.a = 0.0;
      gl_FragColor.r = 0.0;
      gl_FragColor.g = 0.0;
      gl_FragColor.b = 0.0;
    }
  }
}
