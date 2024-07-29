#include <common>
 
uniform vec3 iResolution;
uniform float time;
uniform sampler2D iChannel0;
 
// By iq: https://www.shadertoy.com/user/iq
// license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     // Normalized pixel coordinates (from 0 to 1)
//     vec2 uv = fragCoord / iResolution.xy;
 
//     // Time varying pixel color
//     vec3 col = 0.2 + 0.5 * cos(time + uv.xyx + vec3(0,1,1));
 
//     // Output to screen
//     fragColor = vec4(col, 1.0);
// }

// #define TIMESCALE 0.25
// #define TILES 0.02
// #define COLOR 4.0, 0.2, 3.8

// void mainImage(out vec4 fragColor, in vec2 fragCoord) {
// 	vec2 uv = fragCoord.xy / iResolution.xy;
//     uv.x *= iResolution.x / iResolution.y;
 
//     vec4 noise = texture2D(iChannel0, uv);
//     float p = 1.0 - mod(noise.r + noise.g + noise.b + time * float(TIMESCALE), 1.0);
//     p = min(max(p * 3.0 - 1.8, 0.1), 2.0);
 
//     vec2 r = mod(uv * float(TILES), 1.0);
//     r = vec2(pow(r.x - 0.5, 2.0), pow(r.y - 0.5, 2.0));
//     p *= 1.0 - pow(min(1.0, 12.0 * dot(r, r)), 2.0);
 
//     fragColor = vec4(COLOR, 1.0) * p;
// }

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

//https://www.shadertoy.com/view/mtyGWy
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + time*.4);

        d = sin(d*8. + time)/8.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }
        
    fragColor = vec4(finalColor, 1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}