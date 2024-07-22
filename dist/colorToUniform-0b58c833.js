"use strict";const d=require("./main-f2073ded.js"),A=Object.create(null),X=Object.create(null);function $(o,t){let e=X[o];return e===void 0&&(A[t]===void 0&&(A[t]=1),X[o]=e=A[t]++),e}let T;function ft(){if(!T){T="mediump";const o=d.getTestContext();o&&o.getShaderPrecisionFormat&&(T=o.getShaderPrecisionFormat(o.FRAGMENT_SHADER,o.HIGH_FLOAT).precision?"highp":"mediump")}return T}function mt(o,t,e){return t?o:e?(o=o.replace("out vec4 finalColor;",""),`
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in varying
        #define finalColor gl_FragColor
        #define texture texture2D
        #endif
        ${o}
        `):`
        
        #ifdef GL_ES // This checks if it is WebGL1
        #define in attribute
        #define out varying
        #endif
        ${o}
        `}function dt(o,t,e){const r=e?t.maxSupportedFragmentPrecision:t.maxSupportedVertexPrecision;if(o.substring(0,9)!=="precision"){let n=e?t.requestedFragmentPrecision:t.requestedVertexPrecision;return n==="highp"&&r!=="highp"&&(n="mediump"),`precision ${n} float;
${o}`}else if(r!=="highp"&&o.substring(0,15)==="precision highp")return o.replace("precision highp","precision mediump");return o}function ht(o,t){return t?`#version 300 es
${o}`:o}const pt={},gt={};function xt(o,{name:t="pixi-program"},e=!0){t=t.replace(/\s+/g,"-"),t+=e?"-fragment":"-vertex";const r=e?pt:gt;return r[t]?(r[t]++,t+=`-${r[t]}`):r[t]=1,o.indexOf("#define SHADER_NAME")!==-1?o:`${`#define SHADER_NAME ${t}`}
${o}`}function vt(o,t){return t?o.replace("#version 300 es",""):o}const B={stripVersion:vt,ensurePrecision:dt,addProgramDefines:mt,setProgramName:xt,insertVersion:ht},E=Object.create(null),rt=class L{constructor(t){t={...L.defaultOptions,...t};const e=t.fragment.indexOf("#version 300 es")!==-1,r={stripVersion:e,ensurePrecision:{requestedFragmentPrecision:t.preferredFragmentPrecision,requestedVertexPrecision:t.preferredVertexPrecision,maxSupportedVertexPrecision:"highp",maxSupportedFragmentPrecision:ft()},setProgramName:{name:t.name},addProgramDefines:e,insertVersion:e};let n=t.fragment,i=t.vertex;Object.keys(B).forEach(a=>{const s=r[a];n=B[a](n,s,!0),i=B[a](i,s,!1)}),this.fragment=n,this.vertex=i,this._key=$(`${this.vertex}:${this.fragment}`,"gl-program")}destroy(){this.fragment=null,this.vertex=null,this._attributeData=null,this._uniformData=null,this._uniformBlockData=null,this.transformFeedbackVaryings=null}static from(t){const e=`${t.vertex}:${t.fragment}`;return E[e]||(E[e]=new L(t)),E[e]}};rt.defaultOptions={preferredVertexPrecision:"highp",preferredFragmentPrecision:"mediump"};let W=rt;const q={uint8x2:{size:2,stride:2,normalised:!1},uint8x4:{size:4,stride:4,normalised:!1},sint8x2:{size:2,stride:2,normalised:!1},sint8x4:{size:4,stride:4,normalised:!1},unorm8x2:{size:2,stride:2,normalised:!0},unorm8x4:{size:4,stride:4,normalised:!0},snorm8x2:{size:2,stride:2,normalised:!0},snorm8x4:{size:4,stride:4,normalised:!0},uint16x2:{size:2,stride:4,normalised:!1},uint16x4:{size:4,stride:8,normalised:!1},sint16x2:{size:2,stride:4,normalised:!1},sint16x4:{size:4,stride:8,normalised:!1},unorm16x2:{size:2,stride:4,normalised:!0},unorm16x4:{size:4,stride:8,normalised:!0},snorm16x2:{size:2,stride:4,normalised:!0},snorm16x4:{size:4,stride:8,normalised:!0},float16x2:{size:2,stride:4,normalised:!1},float16x4:{size:4,stride:8,normalised:!1},float32:{size:1,stride:4,normalised:!1},float32x2:{size:2,stride:8,normalised:!1},float32x3:{size:3,stride:12,normalised:!1},float32x4:{size:4,stride:16,normalised:!1},uint32:{size:1,stride:4,normalised:!1},uint32x2:{size:2,stride:8,normalised:!1},uint32x3:{size:3,stride:12,normalised:!1},uint32x4:{size:4,stride:16,normalised:!1},sint32:{size:1,stride:4,normalised:!1},sint32x2:{size:2,stride:8,normalised:!1},sint32x3:{size:3,stride:12,normalised:!1},sint32x4:{size:4,stride:16,normalised:!1}};function ot(o){return q[o]??q.float32}const bt={f32:"float32","vec2<f32>":"float32x2","vec3<f32>":"float32x3","vec4<f32>":"float32x4",vec2f:"float32x2",vec3f:"float32x3",vec4f:"float32x4",i32:"sint32","vec2<i32>":"sint32x2","vec3<i32>":"sint32x3","vec4<i32>":"sint32x4",u32:"uint32","vec2<u32>":"uint32x2","vec3<u32>":"uint32x3","vec4<u32>":"uint32x4",bool:"uint32","vec2<bool>":"uint32x2","vec3<bool>":"uint32x3","vec4<bool>":"uint32x4"};function Pt({source:o,entryPoint:t}){const e={},r=o.indexOf(`fn ${t}`);if(r!==-1){const n=o.indexOf("->",r);if(n!==-1){const i=o.substring(r,n),a=/@location\((\d+)\)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_<>]+)(?:,|\s|$)/g;let s;for(;(s=a.exec(i))!==null;){const u=bt[s[3]]??"float32";e[s[2]]={location:parseInt(s[1],10),format:u,stride:ot(u).stride,offset:0,instance:!1,start:0}}}}return e}function F(o){var f,h;const t=/(^|[^/])@(group|binding)\(\d+\)[^;]+;/g,e=/@group\((\d+)\)/,r=/@binding\((\d+)\)/,n=/var(<[^>]+>)? (\w+)/,i=/:\s*(\w+)/,a=/struct\s+(\w+)\s*{([^}]+)}/g,s=/(\w+)\s*:\s*([\w\<\>]+)/g,u=/struct\s+(\w+)/,c=(f=o.match(t))==null?void 0:f.map(m=>({group:parseInt(m.match(e)[1],10),binding:parseInt(m.match(r)[1],10),name:m.match(n)[2],isUniform:m.match(n)[1]==="<uniform>",type:m.match(i)[1]}));if(!c)return{groups:[],structs:[]};const l=((h=o.match(a))==null?void 0:h.map(m=>{const g=m.match(u)[1],v=m.match(s).reduce((b,P)=>{const[y,p]=P.split(":");return b[y.trim()]=p.trim(),b},{});return v?{name:g,members:v}:null}).filter(({name:m})=>c.some(g=>g.type===m)))??[];return{groups:c,structs:l}}var G=(o=>(o[o.VERTEX=1]="VERTEX",o[o.FRAGMENT=2]="FRAGMENT",o[o.COMPUTE=4]="COMPUTE",o))(G||{});function yt({groups:o}){const t=[];for(let e=0;e<o.length;e++){const r=o[e];t[r.group]||(t[r.group]=[]),r.isUniform?t[r.group].push({binding:r.binding,visibility:G.VERTEX|G.FRAGMENT,buffer:{type:"uniform"}}):r.type==="sampler"?t[r.group].push({binding:r.binding,visibility:G.FRAGMENT,sampler:{type:"filtering"}}):r.type==="texture_2d"&&t[r.group].push({binding:r.binding,visibility:G.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d",multisampled:!1}})}return t}function Gt({groups:o}){const t=[];for(let e=0;e<o.length;e++){const r=o[e];t[r.group]||(t[r.group]={}),t[r.group][r.name]=r.binding}return t}function _t(o,t){const e=new Set,r=new Set,n=[...o.structs,...t.structs].filter(a=>e.has(a.name)?!1:(e.add(a.name),!0)),i=[...o.groups,...t.groups].filter(a=>{const s=`${a.name}-${a.binding}`;return r.has(s)?!1:(r.add(s),!0)});return{structs:n,groups:i}}const w=Object.create(null);class _{constructor(t){var s,u;this._layoutKey=0;const{fragment:e,vertex:r,layout:n,gpuLayout:i,name:a}=t;if(this.name=a,this.fragment=e,this.vertex=r,e.source===r.source){const c=F(e.source);this.structsAndGroups=c}else{const c=F(r.source),l=F(e.source);this.structsAndGroups=_t(c,l)}this.layout=n??Gt(this.structsAndGroups),this.gpuLayout=i??yt(this.structsAndGroups),this.autoAssignGlobalUniforms=((s=this.layout[0])==null?void 0:s.globalUniforms)!==void 0,this.autoAssignLocalUniforms=((u=this.layout[1])==null?void 0:u.localUniforms)!==void 0,this._generateProgramKey()}_generateProgramKey(){const{vertex:t,fragment:e}=this,r=t.source+e.source+t.entryPoint+e.entryPoint;this._layoutKey=$(r,"program")}get attributeData(){return this._attributeData??(this._attributeData=Pt(this.vertex)),this._attributeData}destroy(){this.gpuLayout=null,this.layout=null,this.structsAndGroups=null,this.fragment=null,this.vertex=null}static from(t){const e=`${t.vertex.source}:${t.fragment.source}:${t.fragment.entryPoint}:${t.vertex.entryPoint}`;return w[e]||(w[e]=new _(t)),w[e]}}const nt=["f32","i32","vec2<f32>","vec3<f32>","vec4<f32>","mat2x2<f32>","mat3x3<f32>","mat4x4<f32>","mat3x2<f32>","mat4x2<f32>","mat2x3<f32>","mat4x3<f32>","mat2x4<f32>","mat3x4<f32>"],St=nt.reduce((o,t)=>(o[t]=!0,o),{});function Mt(o,t){switch(o){case"f32":return 0;case"vec2<f32>":return new Float32Array(2*t);case"vec3<f32>":return new Float32Array(3*t);case"vec4<f32>":return new Float32Array(4*t);case"mat2x2<f32>":return new Float32Array([1,0,0,1]);case"mat3x3<f32>":return new Float32Array([1,0,0,0,1,0,0,0,1]);case"mat4x4<f32>":return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}return null}const it=class st{constructor(t,e){this._touched=0,this.uid=d.uid("uniform"),this._resourceType="uniformGroup",this._resourceId=d.uid("resource"),this.isUniformGroup=!0,this._dirtyId=0,this.destroyed=!1,e={...st.defaultOptions,...e},this.uniformStructures=t;const r={};for(const n in t){const i=t[n];if(i.name=n,i.size=i.size??1,!St[i.type])throw new Error(`Uniform type ${i.type} is not supported. Supported uniform types are: ${nt.join(", ")}`);i.value??(i.value=Mt(i.type,i.size)),r[n]=i.value}this.uniforms=r,this._dirtyId=1,this.ubo=e.ubo,this.isStatic=e.isStatic,this._signature=$(Object.keys(r).map(n=>`${n}-${t[n].type}`).join("-"),"uniform-group")}update(){this._dirtyId++}};it.defaultOptions={ubo:!1,isStatic:!1};let at=it;var C=(o=>(o[o.WEBGL=1]="WEBGL",o[o.WEBGPU=2]="WEBGPU",o[o.BOTH=3]="BOTH",o))(C||{});class K extends d.EventEmitter{constructor(t){super(),this._uniformBindMap=Object.create(null),this._ownedBindGroups=[];let{gpuProgram:e,glProgram:r,groups:n,resources:i,compatibleRenderers:a,groupMap:s}=t;this.gpuProgram=e,this.glProgram=r,a===void 0&&(a=0,e&&(a|=C.WEBGPU),r&&(a|=C.WEBGL)),this.compatibleRenderers=a;const u={};if(!i&&!n&&(i={}),i&&n)throw new Error("[Shader] Cannot have both resources and groups");if(!e&&n&&!s)throw new Error("[Shader] No group map or WebGPU shader provided - consider using resources instead.");if(!e&&n&&s)for(const c in s)for(const l in s[c]){const f=s[c][l];u[f]={group:c,binding:l,name:f}}else if(e&&n&&!s){const c=e.structsAndGroups.groups;s={},c.forEach(l=>{s[l.group]=s[l.group]||{},s[l.group][l.binding]=l.name,u[l.name]=l})}else if(i){if(e){const c=e.structsAndGroups.groups;s={},c.forEach(l=>{s[l.group]=s[l.group]||{},s[l.group][l.binding]=l.name,u[l.name]=l})}else{s={},n={99:new d.BindGroup},this._ownedBindGroups.push(n[99]);let c=0;for(const l in i)u[l]={group:99,binding:c,name:l},s[99]=s[99]||{},s[99][c]=l,c++}n={};for(const c in i){const l=c;let f=i[c];!f.source&&!f._resourceType&&(f=new at(f));const h=u[l];h&&(n[h.group]||(n[h.group]=new d.BindGroup,this._ownedBindGroups.push(n[h.group])),n[h.group].setResource(f,h.binding))}}this.groups=n,this._uniformBindMap=s,this.resources=this._buildResourceAccessor(n,u)}addResource(t,e,r){var n,i;(n=this._uniformBindMap)[e]||(n[e]={}),(i=this._uniformBindMap[e])[r]||(i[r]=t),this.groups[e]||(this.groups[e]=new d.BindGroup,this._ownedBindGroups.push(this.groups[e]))}_buildResourceAccessor(t,e){const r={};for(const n in e){const i=e[n];Object.defineProperty(r,i.name,{get(){return t[i.group].getResource(i.binding)},set(a){t[i.group].setResource(a,i.binding)}})}return r}destroy(t=!1){var e,r;this.emit("destroy",this),t&&((e=this.gpuProgram)==null||e.destroy(),(r=this.glProgram)==null||r.destroy()),this.gpuProgram=null,this.glProgram=null,this.removeAllListeners(),this._uniformBindMap=null,this._ownedBindGroups.forEach(n=>{n.destroy()}),this._ownedBindGroups=null,this.resources=null,this.groups=null}static from(t){const{gpu:e,gl:r,...n}=t;let i,a;return e&&(i=_.from(e)),r&&(a=W.from(r)),new K({gpuProgram:i,glProgram:a,...n})}}const Tt={normal:0,add:1,multiply:2,screen:3,overlay:4,erase:5,"normal-npm":6,"add-npm":7,"screen-npm":8},z=0,O=1,I=2,R=3,j=4,D=5,V=class ut{constructor(){this.data=0,this.blendMode="normal",this.polygonOffset=0,this.blend=!0,this.depthMask=!0}get blend(){return!!(this.data&1<<z)}set blend(t){!!(this.data&1<<z)!==t&&(this.data^=1<<z)}get offsets(){return!!(this.data&1<<O)}set offsets(t){!!(this.data&1<<O)!==t&&(this.data^=1<<O)}set cullMode(t){if(t==="none"){this.culling=!1;return}this.culling=!0,this.clockwiseFrontFace=t==="front"}get cullMode(){return this.culling?this.clockwiseFrontFace?"front":"back":"none"}get culling(){return!!(this.data&1<<I)}set culling(t){!!(this.data&1<<I)!==t&&(this.data^=1<<I)}get depthTest(){return!!(this.data&1<<R)}set depthTest(t){!!(this.data&1<<R)!==t&&(this.data^=1<<R)}get depthMask(){return!!(this.data&1<<D)}set depthMask(t){!!(this.data&1<<D)!==t&&(this.data^=1<<D)}get clockwiseFrontFace(){return!!(this.data&1<<j)}set clockwiseFrontFace(t){!!(this.data&1<<j)!==t&&(this.data^=1<<j)}get blendMode(){return this._blendMode}set blendMode(t){this.blend=t!=="none",this._blendMode=t,this._blendModeId=Tt[t]||0}get polygonOffset(){return this._polygonOffset}set polygonOffset(t){this.offsets=!!t,this._polygonOffset=t}toString(){return`[pixi.js/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`}static for2d(){const t=new ut;return t.depthTest=!1,t.blend=!0,t}};V.default2d=V.for2d();let Ut=V,Ct=0;class $t{constructor(t){this._poolKeyHash=Object.create(null),this._texturePool={},this.textureOptions=t||{},this.enableFullScreen=!1}createTexture(t,e,r){const n=new d.TextureSource({...this.textureOptions,width:t,height:e,resolution:1,antialias:r,autoGarbageCollect:!0});return new d.Texture({source:n,label:`texturePool_${Ct++}`})}getOptimalTexture(t,e,r=1,n){let i=Math.ceil(t*r-1e-6),a=Math.ceil(e*r-1e-6);i=d.nextPow2(i),a=d.nextPow2(a);const s=(i<<17)+(a<<1)+(n?1:0);this._texturePool[s]||(this._texturePool[s]=[]);let u=this._texturePool[s].pop();return u||(u=this.createTexture(i,a,n)),u.source._resolution=r,u.source.width=i/r,u.source.height=a/r,u.source.pixelWidth=i,u.source.pixelHeight=a,u.frame.x=0,u.frame.y=0,u.frame.width=t,u.frame.height=e,u.updateUvs(),this._poolKeyHash[u.uid]=s,u}getSameSizeTexture(t,e=!1){const r=t.source;return this.getOptimalTexture(t.width,t.height,r._resolution,e)}returnTexture(t){const e=this._poolKeyHash[t.uid];this._texturePool[e].push(t)}clear(t){if(t=t!==!1,t)for(const e in this._texturePool){const r=this._texturePool[e];if(r)for(let n=0;n<r.length;n++)r[n].destroy(!0)}this._texturePool={}}}const At=new $t;function Y(o,t,e){if(o)for(const r in o){const n=r.toLocaleLowerCase(),i=t[n];if(i){let a=o[r];r==="header"&&(a=a.replace(/@in\s+[^;]+;\s*/g,"").replace(/@out\s+[^;]+;\s*/g,"")),e&&i.push(`//----${e}----//`),i.push(a)}else d.warn(`${r} placement hook does not exist in shader`)}}const Bt=/\{\{(.*?)\}\}/g;function Z(o){var r;const t={};return(((r=o.match(Bt))==null?void 0:r.map(n=>n.replace(/[{()}]/g,"")))??[]).forEach(n=>{t[n]=[]}),t}function J(o,t){let e;const r=/@in\s+([^;]+);/g;for(;(e=r.exec(o))!==null;)t.push(e[1])}function Q(o,t,e=!1){const r=[];J(t,r),o.forEach(s=>{s.header&&J(s.header,r)});const n=r;e&&n.sort();const i=n.map((s,u)=>`       @location(${u}) ${s},`).join(`
`);let a=t.replace(/@in\s+[^;]+;\s*/g,"");return a=a.replace("{{in}}",`
${i}
`),a}function tt(o,t){let e;const r=/@out\s+([^;]+);/g;for(;(e=r.exec(o))!==null;)t.push(e[1])}function Et(o){const e=/\b(\w+)\s*:/g.exec(o);return e?e[1]:""}function Ft(o){const t=/@.*?\s+/g;return o.replace(t,"")}function wt(o,t){const e=[];tt(t,e),o.forEach(u=>{u.header&&tt(u.header,e)});let r=0;const n=e.sort().map(u=>u.indexOf("builtin")>-1?u:`@location(${r++}) ${u}`).join(`,
`),i=e.sort().map(u=>`       var ${Ft(u)};`).join(`
`),a=`return VSOutput(
                ${e.sort().map(u=>` ${Et(u)}`).join(`,
`)});`;let s=t.replace(/@out\s+[^;]+;\s*/g,"");return s=s.replace("{{struct}}",`
${n}
`),s=s.replace("{{start}}",`
${i}
`),s=s.replace("{{return}}",`
${a}
`),s}function et(o,t){let e=o;for(const r in t){const n=t[r];n.join(`
`).length?e=e.replace(`{{${r}}}`,`//-----${r} START-----//
${n.join(`
`)}
//----${r} FINISH----//`):e=e.replace(`{{${r}}}`,"")}return e}const x=Object.create(null),k=new Map;let zt=0;function Ot({template:o,bits:t}){const e=lt(o,t);if(x[e])return x[e];const{vertex:r,fragment:n}=Rt(o,t);return x[e]=ct(r,n,t),x[e]}function It({template:o,bits:t}){const e=lt(o,t);return x[e]||(x[e]=ct(o.vertex,o.fragment,t)),x[e]}function Rt(o,t){const e=t.map(a=>a.vertex).filter(a=>!!a),r=t.map(a=>a.fragment).filter(a=>!!a);let n=Q(e,o.vertex,!0);n=wt(e,n);const i=Q(r,o.fragment,!0);return{vertex:n,fragment:i}}function lt(o,t){return t.map(e=>(k.has(e)||k.set(e,zt++),k.get(e))).sort((e,r)=>e-r).join("-")+o.vertex+o.fragment}function ct(o,t,e){const r=Z(o),n=Z(t);return e.forEach(i=>{Y(i.vertex,r,i.name),Y(i.fragment,n,i.name)}),{vertex:et(o,r),fragment:et(t,n)}}const jt=`
    @in aPosition: vec2<f32>;
    @in aUV: vec2<f32>;

    @out @builtin(position) vPosition: vec4<f32>;
    @out vUV : vec2<f32>;
    @out vColor : vec4<f32>;

    {{header}}

    struct VSOutput {
        {{struct}}
    };

    @vertex
    fn main( {{in}} ) -> VSOutput {

        var worldTransformMatrix = globalUniforms.uWorldTransformMatrix;
        var modelMatrix = mat3x3<f32>(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        var position = aPosition;
        var uv = aUV;

        {{start}}
        
        vColor = vec4<f32>(1., 1., 1., 1.);

        {{main}}

        vUV = uv;

        var modelViewProjectionMatrix = globalUniforms.uProjectionMatrix * worldTransformMatrix * modelMatrix;

        vPosition =  vec4<f32>((modelViewProjectionMatrix *  vec3<f32>(position, 1.0)).xy, 0.0, 1.0);
       
        vColor *= globalUniforms.uWorldColorAlpha;

        {{end}}

        {{return}}
    };
`,Dt=`
    @in vUV : vec2<f32>;
    @in vColor : vec4<f32>;
   
    {{header}}

    @fragment
    fn main(
        {{in}}
      ) -> @location(0) vec4<f32> {
        
        {{start}}

        var outColor:vec4<f32>;
      
        {{main}}
        
        return outColor * vColor;
      };
`,kt=`
    in vec2 aPosition;
    in vec2 aUV;

    out vec4 vColor;
    out vec2 vUV;

    {{header}}

    void main(void){

        mat3 worldTransformMatrix = uWorldTransformMatrix;
        mat3 modelMatrix = mat3(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        vec2 position = aPosition;
        vec2 uv = aUV;
        
        {{start}}
        
        vColor = vec4(1.);
        
        {{main}}
        
        vUV = uv;
        
        mat3 modelViewProjectionMatrix = uProjectionMatrix * worldTransformMatrix * modelMatrix;

        gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);

        vColor *= uWorldColorAlpha;

        {{end}}
    }
`,Nt=`
   
    in vec4 vColor;
    in vec2 vUV;

    out vec4 finalColor;

    {{header}}

    void main(void) {
        
        {{start}}

        vec4 outColor;
      
        {{main}}
        
        finalColor = outColor * vColor;
    }
`,Ht={name:"global-uniforms-bit",vertex:{header:`
        struct GlobalUniforms {
            uProjectionMatrix:mat3x3<f32>,
            uWorldTransformMatrix:mat3x3<f32>,
            uWorldColorAlpha: vec4<f32>,
            uResolution: vec2<f32>,
        }

        @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
        `}},Lt={name:"global-uniforms-bit",vertex:{header:`
          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform vec4 uWorldColorAlpha;
          uniform vec2 uResolution;
        `}};function Vt({bits:o,name:t}){const e=Ot({template:{fragment:Dt,vertex:jt},bits:[Ht,...o]});return _.from({name:t,vertex:{source:e.vertex,entryPoint:"main"},fragment:{source:e.fragment,entryPoint:"main"}})}function Wt({bits:o,name:t}){return new W({name:t,...It({template:{vertex:kt,fragment:Nt},bits:[Lt,...o]})})}const Kt={name:"color-bit",vertex:{header:`
            @in aColor: vec4<f32>;
        `,main:`
            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);
        `}},Xt={name:"color-bit",vertex:{header:`
            in vec4 aColor;
        `,main:`
            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);
        `}},N={};function qt(o){const t=[];if(o===1)t.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;"),t.push("@group(1) @binding(1) var textureSampler1: sampler;");else{let e=0;for(let r=0;r<o;r++)t.push(`@group(1) @binding(${e++}) var textureSource${r+1}: texture_2d<f32>;`),t.push(`@group(1) @binding(${e++}) var textureSampler${r+1}: sampler;`)}return t.join(`
`)}function Yt(o){const t=[];if(o===1)t.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");else{t.push("switch vTextureId {");for(let e=0;e<o;e++)e===o-1?t.push("  default:{"):t.push(`  case ${e}:{`),t.push(`      outColor = textureSampleGrad(textureSource${e+1}, textureSampler${e+1}, vUV, uvDx, uvDy);`),t.push("      break;}");t.push("}")}return t.join(`
`)}function Zt(o){return N[o]||(N[o]={name:"texture-batch-bit",vertex:{header:`
                @in aTextureIdAndRound: vec2<u32>;
                @out @interpolate(flat) vTextureId : u32;
            `,main:`
                vTextureId = aTextureIdAndRound.y;
            `,end:`
                if(aTextureIdAndRound.x == 1)
                {
                    vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
                }
            `},fragment:{header:`
                @in @interpolate(flat) vTextureId: u32;
    
                ${qt(d.getMaxTexturesPerBatch())}
            `,main:`
                var uvDx = dpdx(vUV);
                var uvDy = dpdy(vUV);
    
                ${Yt(d.getMaxTexturesPerBatch())}
            `}}),N[o]}const H={};function Jt(o){const t=[];for(let e=0;e<o;e++)e>0&&t.push("else"),e<o-1&&t.push(`if(vTextureId < ${e}.5)`),t.push("{"),t.push(`	outColor = texture(uTextures[${e}], vUV);`),t.push("}");return t.join(`
`)}function Qt(o){return H[o]||(H[o]={name:"texture-batch-bit",vertex:{header:`
                in vec2 aTextureIdAndRound;
                out float vTextureId;
              
            `,main:`
                vTextureId = aTextureIdAndRound.y;
            `,end:`
                if(aTextureIdAndRound.x == 1.)
                {
                    gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
                }
            `},fragment:{header:`
                in float vTextureId;
    
                uniform sampler2D uTextures[${o}];
              
            `,main:`
    
                ${Jt(d.getMaxTexturesPerBatch())}
            `}}),H[o]}const te={name:"round-pixels-bit",vertex:{header:`
            fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32> 
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `}},ee={name:"round-pixels-bit",vertex:{header:`   
            vec2 roundPixels(vec2 position, vec2 targetSize)
            {       
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `}},U={name:"local-uniform-bit",vertex:{header:`

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,main:`
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,end:`
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `}},re={...U,vertex:{...U.vertex,header:U.vertex.header.replace("group(1)","group(2)")}},oe={name:"local-uniform-bit",vertex:{header:`

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,main:`
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `,end:`
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `}};class ne{constructor(){this.vertexSize=4,this.indexSize=6,this.location=0,this.batcher=null,this.batch=null,this.roundPixels=0}get blendMode(){return this.renderable.groupBlendMode}packAttributes(t,e,r,n){const i=this.renderable,a=this.texture,s=i.groupTransform,u=s.a,c=s.b,l=s.c,f=s.d,h=s.tx,m=s.ty,g=this.bounds,v=g.maxX,b=g.minX,P=g.maxY,y=g.minY,p=a.uvs,S=i.groupColorAlpha,M=n<<16|this.roundPixels&65535;t[r+0]=u*b+l*y+h,t[r+1]=f*y+c*b+m,t[r+2]=p.x0,t[r+3]=p.y0,e[r+4]=S,e[r+5]=M,t[r+6]=u*v+l*y+h,t[r+7]=f*y+c*v+m,t[r+8]=p.x1,t[r+9]=p.y1,e[r+10]=S,e[r+11]=M,t[r+12]=u*v+l*P+h,t[r+13]=f*P+c*v+m,t[r+14]=p.x2,t[r+15]=p.y2,e[r+16]=S,e[r+17]=M,t[r+18]=u*b+l*P+h,t[r+19]=f*P+c*b+m,t[r+20]=p.x3,t[r+21]=p.y3,e[r+22]=S,e[r+23]=M}packIndex(t,e,r){t[e]=r+0,t[e+1]=r+1,t[e+2]=r+2,t[e+3]=r+0,t[e+4]=r+2,t[e+5]=r+3}reset(){this.renderable=null,this.texture=null,this.batcher=null,this.batch=null,this.bounds=null}}function ie(o,t,e){const r=(o>>24&255)/255;t[e++]=(o&255)/255*r,t[e++]=(o>>8&255)/255*r,t[e++]=(o>>16&255)/255*r,t[e++]=r}exports.BatchableSprite=ne;exports.GlProgram=W;exports.GpuProgram=_;exports.RendererType=C;exports.Shader=K;exports.State=Ut;exports.TexturePool=At;exports.UniformGroup=at;exports.color32BitToUniform=ie;exports.colorBit=Kt;exports.colorBitGl=Xt;exports.compileHighShaderGlProgram=Wt;exports.compileHighShaderGpuProgram=Vt;exports.createIdFromString=$;exports.generateTextureBatchBit=Zt;exports.generateTextureBatchBitGl=Qt;exports.getAttributeInfoFromFormat=ot;exports.localUniformBit=U;exports.localUniformBitGl=oe;exports.localUniformBitGroup2=re;exports.roundPixelsBit=te;exports.roundPixelsBitGl=ee;
