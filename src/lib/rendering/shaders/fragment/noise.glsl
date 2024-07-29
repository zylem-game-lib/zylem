#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
varying vec2 vUv;

float hash( in vec2 p ) {
    return fract(sin(p.x*15.32+p.y*5.78) * 43758.236237153);
}

vec2 hash2(vec2 p) {
	return vec2(hash(p*.754),hash(1.5743*p.yx+4.5891))-.5;
}

float gavoronoi3(in vec2 p) {    
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float f = 8.*PI;
    float v = .8;
    float dv = .4;
    vec2 dir = vec2(.7,.8);
    float va = 0.0;
   	float wt = 0.0;
    for (int i=-1; i<=1; i++) 
	for (int j=-1; j<=1; j++) 
	{		
        vec2 o = vec2(i, j)-.5;
        vec2 h = hash2(ip - o);
        vec2 pp = fp +o  -h;
        float d = dot(pp, pp);
        float w = exp(-d*4.);
        wt +=w;
        h = dv*h+dir;//h=normalize(h+dir);
        va += cos(dot(pp,h)*f/v)*w;
	}    
    return va/wt;
}


void main() {
	gl_FragColor = vec4(vec3(gavoronoi3(vUv)), 1);
}