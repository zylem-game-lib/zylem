import{T,R as b,M as U,a as I,b as D,S as A,V as F,c as j,B,F as p}from"./vendor-three-CRJRX-3r.js";import{s as O,a as P}from"./zylem-foundation-DJZmtUpf.js";var V=`#include <common>

uniform vec3 iResolution;
uniform float iTime;
varying vec2 vUv;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);

        d = sin(d*5. + iTime)/5.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }
        
    fragColor = vec4(finalColor, 1.0);
}
 
void main() {
  mainImage(gl_FragColor, vUv);
}`,X=`#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 iOffset;
varying vec2 vUv;

float snoise(vec3 uv, float res)
{
	const vec3 s = vec3(1e0, 1e2, 1e3);
	
	uv *= res;
	
	vec3 uv0 = floor(mod(uv, res))*s;
	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
	
	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

	vec4 r = fract(sin(v*1e-1)*1e3);
	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	return mix(r0, r1, f.z)*2.-1.;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 p = -.5 + fragCoord.xy / iResolution.xy;
	p.x *= iResolution.x/iResolution.y;
	
	float color = 3.0 - (3.*length(2.*p));
	
	vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);
	
	for(int i = 1; i <= 7; i++)
	{
		float power = pow(2.0, float(i));
		color += (1.5 / power) * snoise(coord + vec3(0.,-iTime*.05, iTime*.01), power*16.);
	}
	fragColor = vec4( color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , 1.0);
}

void main() {
  mainImage(gl_FragColor, vUv);
}`,G=`uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
	vec4 texel = texture2D( tDiffuse, vUv );

	gl_FragColor = texel;
}`,x=`uniform vec2 uvScale;
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
}`;const N={fragment:V,vertex:x},Y={fragment:X,vertex:x},H={fragment:G,vertex:x},v=new Map;v.set("standard",H);v.set("fire",Y);v.set("star",N);class g{static batchMaterialMap=new Map;materials=[];batchMaterial(e,t){const r=O(P(e)),n=g.batchMaterialMap.get(r);if(n){const o=n.geometryMap.get(t);o?n.geometryMap.set(t,o+1):n.geometryMap.set(t,1)}else g.batchMaterialMap.set(r,{geometryMap:new Map([[t,1]]),material:this.materials[0]})}async build(e,t){const{path:r,repeat:n,color:o,shader:s}=e;s&&this.withShader(s),o&&this.withColor(o),await this.setTexture(r??null,n),this.batchMaterial(e,t)}withColor(e){return this.setColor(e),this}withShader(e){return this.setShader(e),this}async setTexture(e=null,t=new I(1,1)){if(!e)return;const n=await new T().loadAsync(e);n.repeat=t,n.wrapS=b,n.wrapT=b;const o=new U({map:n});this.materials.push(o)}setColor(e){const t=new D({color:e,emissiveIntensity:.5,lightMapIntensity:.5,fog:!0});this.materials.push(t)}setShader(e){const{fragment:t,vertex:r}=v.get(e)??v.get("standard"),n=new A({uniforms:{iResolution:{value:new F(1,1,1)},iTime:{value:0},tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null}},vertexShader:r,fragmentShader:t});this.materials.push(n)}}class W{build(e,t,r){const{batched:n,material:o}=e;n&&console.warn("warning: mesh batching is not implemented");const s=new j(t,r.at(-1));return s.position.set(0,0,0),s.castShadow=!0,s.receiveShadow=!0,s}postBuild(){}}class C extends B{constructor(e=1,t=1,r=1,n=1){super(),this.type="XZPlaneGeometry",this.parameters={width:e,height:t,widthSegments:r,heightSegments:n};const o=e/2,s=t/2,u=Math.floor(r),f=Math.floor(n),l=u+1,S=f+1,z=e/u,R=t/f,h=[],w=[],y=[],d=[];for(let a=0;a<S;a++){const i=a*R-s;for(let c=0;c<l;c++){const m=c*z-o;w.push(m,0,i),y.push(0,1,0),d.push(c/u),d.push(1-a/f)}}for(let a=0;a<f;a++)for(let i=0;i<u;i++){const c=i+l*a,m=i+l*(a+1),_=i+1+l*(a+1),M=i+1+l*a;h.push(c,m,M),h.push(m,_,M)}this.setIndex(h),this.setAttribute("position",new p(w,3)),this.setAttribute("normal",new p(y,3)),this.setAttribute("uv",new p(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new C(e.width,e.height,e.widthSegments,e.heightSegments)}}export{W as M,C as X,g as a,G as s};
