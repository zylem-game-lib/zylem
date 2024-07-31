"use strict";const i=require("./main-b83e0172.js"),f=require("./colorToUniform-92f00749.js"),A=class k extends f.Shader{constructor(e){e={...k.defaultOptions,...e},super(e),this.enabled=!0,this._state=f.State.for2d(),this.padding=e.padding,typeof e.antialias=="boolean"?this.antialias=e.antialias?"on":"off":this.antialias=e.antialias,this.resolution=e.resolution,this.blendRequired=e.blendRequired,this.addResource("uTexture",0,1)}apply(e,t,r,n){e.applyFilter(this,t,r,n)}get blendMode(){return this._state.blendMode}set blendMode(e){this._state.blendMode=e}static from(e){const{gpu:t,gl:r,...n}=e;let a,o;return t&&(a=f.GpuProgram.from(t)),r&&(o=f.GlProgram.from(r)),new k({gpuProgram:a,glProgram:o,...n})}};A.defaultOptions={blendMode:"normal",resolution:1,padding:0,antialias:"off",blendRequired:!1};let oe=A;var ue=`in vec2 vMaskCoord;
in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;

uniform float uAlpha;
uniform vec4 uMaskClamp;

out vec4 finalColor;

void main(void)
{
    float clip = step(3.5,
        step(uMaskClamp.x, vMaskCoord.x) +
        step(uMaskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, uMaskClamp.z) +
        step(vMaskCoord.y, uMaskClamp.w));

    // TODO look into why this is needed
    float npmAlpha = uAlpha; 
    vec4 original = texture(uTexture, vTextureCoord);
    vec4 masky = texture(uMaskTexture, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * uAlpha * clip);

    finalColor = original;
}
`,le=`in vec2 aPosition;

out vec2 vTextureCoord;
out vec2 vMaskCoord;


uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
uniform mat3 uFilterMatrix;

vec4 filterVertexPosition(  vec2 aPosition )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
       
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(  vec2 aPosition )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

vec2 getFilterCoord( vec2 aPosition )
{
    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}   

void main(void)
{
    gl_Position = filterVertexPosition(aPosition);
    vTextureCoord = filterTextureCoord(aPosition);
    vMaskCoord = getFilterCoord(aPosition);
}
`,G=`struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,  
};

struct MaskUniforms {
  uFilterMatrix:mat3x3<f32>,
  uMaskClamp:vec4<f32>,
  uAlpha:f32,
};


@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> filterUniforms : MaskUniforms;
@group(1) @binding(1) var uMaskTexture: texture_2d<f32>;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) filterUv : vec2<f32>,
  };

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>
{
  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);  
}

fn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>
{
  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;
}

fn getSize() -> vec2<f32>
{

  
  return gfu.uGlobalFrame.zw;
}
  
@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>, 
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition),
   getFilterCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) filterUv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {

    var maskClamp = filterUniforms.uMaskClamp;

     var clip = step(3.5,
        step(maskClamp.x, filterUv.x) +
        step(maskClamp.y, filterUv.y) +
        step(filterUv.x, maskClamp.z) +
        step(filterUv.y, maskClamp.w));

    var mask = textureSample(uMaskTexture, uSampler, filterUv);
    var source = textureSample(uTexture, uSampler, uv);
    
    var npmAlpha = 0.0;

    var alphaMul = 1.0 - npmAlpha * (1.0 - mask.a);

    var a = (alphaMul * mask.r) * clip;

    return vec4(source.rgb, source.a) * a;
}`;class de extends oe{constructor(e){const{sprite:t,...r}=e,n=new i.TextureMatrix(t.texture),a=new f.UniformGroup({uFilterMatrix:{value:new i.Matrix,type:"mat3x3<f32>"},uMaskClamp:{value:n.uClampFrame,type:"vec4<f32>"},uAlpha:{value:1,type:"f32"}}),o=f.GpuProgram.from({vertex:{source:G,entryPoint:"mainVertex"},fragment:{source:G,entryPoint:"mainFragment"}}),l=f.GlProgram.from({vertex:le,fragment:ue,name:"mask-filter"});super({...r,gpuProgram:o,glProgram:l,resources:{filterUniforms:a,uMaskTexture:t.texture.source}}),this.sprite=t,this._textureMatrix=n}apply(e,t,r,n){this._textureMatrix.texture=this.sprite.texture,e.calculateSpriteMatrix(this.resources.filterUniforms.uniforms.uFilterMatrix,this.sprite).prepend(this._textureMatrix.mapCoord),this.resources.uMaskTexture=this.sprite.texture.source,e.applyFilter(this,t,r,n)}}class I{constructor(e,t){this.state=f.State.for2d(),this._batches=Object.create(null),this._geometries=Object.create(null),this.renderer=e,this._adaptor=t,this._adaptor.init(this)}buildStart(e){if(!this._batches[e.uid]){const t=new i.Batcher;this._batches[e.uid]=t,this._geometries[t.uid]=new i.BatchGeometry}this._activeBatch=this._batches[e.uid],this._activeGeometry=this._geometries[this._activeBatch.uid],this._activeBatch.begin()}addToBatch(e){this._activeBatch.add(e)}break(e){this._activeBatch.break(e)}buildEnd(e){const t=this._activeBatch,r=this._activeGeometry;t.finish(e),r.indexBuffer.setDataWithSize(t.indexBuffer,t.indexSize,!0),r.buffers[0].setDataWithSize(t.attributeBuffer.float32View,t.attributeSize,!1)}upload(e){const t=this._batches[e.uid],r=this._geometries[t.uid];t.dirty&&(t.dirty=!1,r.buffers[0].update(t.attributeSize*4))}execute(e){if(e.action==="startBatch"){const t=e.batcher,r=this._geometries[t.uid];this._adaptor.start(this,r)}this._adaptor.execute(this,e)}destroy(){this.state=null,this.renderer=null,this._adaptor.destroy(),this._adaptor=null;for(const e in this._batches)this._batches[e].destroy();this._batches=null;for(const e in this._geometries)this._geometries[e].destroy();this._geometries=null}}I.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"batch"};const ce={name:"texture-bit",vertex:{header:`

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `,main:`
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `},fragment:{header:`
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;

         
        `,main:`
            outColor = textureSample(uTexture, uSampler, vUV);
        `}},he={name:"texture-bit",vertex:{header:`
            uniform mat3 uTextureMatrix;
        `,main:`
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `},fragment:{header:`
        uniform sampler2D uTexture;

         
        `,main:`
            outColor = texture(uTexture, vUV);
        `}};function fe(s,e){const t=s.root,r=s.instructionSet;r.reset(),e.batch.buildStart(r),e.blendMode.buildStart(),e.colorMask.buildStart(),t.sortableChildren&&t.sortChildren(),D(t,r,e,!0),e.batch.buildEnd(r),e.blendMode.buildEnd(r)}function b(s,e,t){s.globalDisplayStatus<7||!s.includeInBuild||(s.sortableChildren&&s.sortChildren(),s.isSimple?pe(s,e,t):D(s,e,t,!1))}function pe(s,e,t){if(s.renderPipeId&&(t.blendMode.setBlendMode(s,s.groupBlendMode,e),s.didViewUpdate=!1,t[s.renderPipeId].addRenderable(s,e)),!s.renderGroup){const r=s.children,n=r.length;for(let a=0;a<n;a++)b(r[a],e,t)}}function D(s,e,t,r){if(!r&&s.renderGroup)t.renderGroup.addRenderGroup(s.renderGroup,e);else{for(let o=0;o<s.effects.length;o++){const l=s.effects[o];t[l.pipe].push(l,s,e)}const n=s.renderPipeId;n&&(t.blendMode.setBlendMode(s,s.groupBlendMode,e),s.didViewUpdate=!1,t[n].addRenderable(s,e));const a=s.children;if(a.length)for(let o=0;o<a.length;o++)b(a[o],e,t);for(let o=s.effects.length-1;o>=0;o--){const l=s.effects[o];t[l.pipe].pop(l,s,e)}}}const me=new i.Bounds;class xe extends i.FilterEffect{constructor(){super(),this.filters=[new de({sprite:new i.Sprite(i.Texture.EMPTY)})]}get sprite(){return this.filters[0].sprite}set sprite(e){this.filters[0].sprite=e}}class F{constructor(e){this._activeMaskStage=[],this._renderer=e}push(e,t,r){const n=this._renderer;if(n.renderPipes.batch.break(r),r.add({renderPipeId:"alphaMask",action:"pushMaskBegin",mask:e,canBundle:!1,maskedContainer:t}),e.renderMaskToTexture){const a=e.mask;a.includeInBuild=!0,b(a,r,n.renderPipes),a.includeInBuild=!1}n.renderPipes.batch.break(r),r.add({renderPipeId:"alphaMask",action:"pushMaskEnd",mask:e,maskedContainer:t,canBundle:!1})}pop(e,t,r){this._renderer.renderPipes.batch.break(r),r.add({renderPipeId:"alphaMask",action:"popMaskEnd",mask:e,canBundle:!1})}execute(e){const t=this._renderer,r=e.mask.renderMaskToTexture;if(e.action==="pushMaskBegin"){const n=i.BigPool.get(xe);if(r){e.mask.mask.measurable=!0;const a=i.getGlobalBounds(e.mask.mask,!0,me);e.mask.mask.measurable=!1,a.ceil();const o=f.TexturePool.getOptimalTexture(a.width,a.height,1,!1);t.renderTarget.push(o,!0),t.globalUniforms.push({offset:a,worldColor:4294967295});const l=n.sprite;l.texture=o,l.worldTransform.tx=a.minX,l.worldTransform.ty=a.minY,this._activeMaskStage.push({filterEffect:n,maskedContainer:e.maskedContainer,filterTexture:o})}else n.sprite=e.mask.mask,this._activeMaskStage.push({filterEffect:n,maskedContainer:e.maskedContainer})}else if(e.action==="pushMaskEnd"){const n=this._activeMaskStage[this._activeMaskStage.length-1];r&&(t.renderTarget.pop(),t.globalUniforms.pop()),t.filter.push({renderPipeId:"filter",action:"pushFilter",container:n.maskedContainer,filterEffect:n.filterEffect,canBundle:!1})}else if(e.action==="popMaskEnd"){t.filter.pop();const n=this._activeMaskStage.pop();r&&f.TexturePool.returnTexture(n.filterTexture),i.BigPool.return(n.filterEffect)}}destroy(){this._renderer=null,this._activeMaskStage=null}}F.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"alphaMask"};class O{constructor(e){this._colorStack=[],this._colorStackIndex=0,this._currentColor=0,this._renderer=e}buildStart(){this._colorStack[0]=15,this._colorStackIndex=1,this._currentColor=15}push(e,t,r){this._renderer.renderPipes.batch.break(r);const a=this._colorStack;a[this._colorStackIndex]=a[this._colorStackIndex-1]&e.mask;const o=this._colorStack[this._colorStackIndex];o!==this._currentColor&&(this._currentColor=o,r.add({renderPipeId:"colorMask",colorMask:o,canBundle:!1})),this._colorStackIndex++}pop(e,t,r){this._renderer.renderPipes.batch.break(r);const a=this._colorStack;this._colorStackIndex--;const o=a[this._colorStackIndex-1];o!==this._currentColor&&(this._currentColor=o,r.add({renderPipeId:"colorMask",colorMask:o,canBundle:!1}))}execute(e){this._renderer.colorMask.setMask(e.colorMask)}destroy(){this._colorStack=null}}O.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"colorMask"};class L{constructor(e){this._maskStackHash={},this._maskHash=new WeakMap,this._renderer=e}push(e,t,r){var n;const a=e,o=this._renderer;o.renderPipes.batch.break(r),o.renderPipes.blendMode.setBlendMode(a.mask,"none",r),r.add({renderPipeId:"stencilMask",action:"pushMaskBegin",mask:e,canBundle:!1});const l=a.mask;l.includeInBuild=!0,this._maskHash.has(a)||this._maskHash.set(a,{instructionsStart:0,instructionsLength:0});const u=this._maskHash.get(a);u.instructionsStart=r.instructionSize,b(l,r,o.renderPipes),l.includeInBuild=!1,o.renderPipes.batch.break(r),r.add({renderPipeId:"stencilMask",action:"pushMaskEnd",mask:e,canBundle:!1});const d=r.instructionSize-u.instructionsStart-1;u.instructionsLength=d;const c=o.renderTarget.renderTarget.uid;(n=this._maskStackHash)[c]??(n[c]=0)}pop(e,t,r){const n=e,a=this._renderer;a.renderPipes.batch.break(r),a.renderPipes.blendMode.setBlendMode(n.mask,"none",r),r.add({renderPipeId:"stencilMask",action:"popMaskBegin",canBundle:!1});const o=this._maskHash.get(e);for(let l=0;l<o.instructionsLength;l++)r.instructions[r.instructionSize++]=r.instructions[o.instructionsStart++];r.add({renderPipeId:"stencilMask",action:"popMaskEnd",canBundle:!1})}execute(e){var t;const r=this._renderer,n=r.renderTarget.renderTarget.uid;let a=(t=this._maskStackHash)[n]??(t[n]=0);e.action==="pushMaskBegin"?(r.renderTarget.ensureDepthStencil(),r.stencil.setStencilMode(i.STENCIL_MODES.RENDERING_MASK_ADD,a),a++,r.colorMask.setMask(0)):e.action==="pushMaskEnd"?(r.stencil.setStencilMode(i.STENCIL_MODES.MASK_ACTIVE,a),r.colorMask.setMask(15)):e.action==="popMaskBegin"?(r.colorMask.setMask(0),a!==0?r.stencil.setStencilMode(i.STENCIL_MODES.RENDERING_MASK_REMOVE,a):(r.renderTarget.clear(null,i.CLEAR.STENCIL),r.stencil.setStencilMode(i.STENCIL_MODES.DISABLED,a)),a--):e.action==="popMaskEnd"&&(r.stencil.setStencilMode(i.STENCIL_MODES.MASK_ACTIVE,a),r.colorMask.setMask(15)),this._maskStackHash[n]=a}destroy(){this._renderer=null,this._maskStackHash=null,this._maskHash=null}}L.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"stencilMask"};function ge(s,e){for(const t in s.attributes){const r=s.attributes[t],n=e[t];n?(r.location??(r.location=n.location),r.format??(r.format=n.format),r.offset??(r.offset=n.offset),r.instance??(r.instance=n.instance)):i.warn(`Attribute ${t} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`)}ve(s)}function ve(s){const{buffers:e,attributes:t}=s,r={},n={};for(const a in e){const o=e[a];r[o.uid]=0,n[o.uid]=0}for(const a in t){const o=t[a];r[o.buffer.uid]+=f.getAttributeInfoFromFormat(o.format).stride}for(const a in t){const o=t[a];o.stride??(o.stride=r[o.buffer.uid]),o.start??(o.start=n[o.buffer.uid]),n[o.buffer.uid]+=f.getAttributeInfoFromFormat(o.format).stride}}const x=[];x[i.STENCIL_MODES.NONE]=void 0;x[i.STENCIL_MODES.DISABLED]={stencilWriteMask:0,stencilReadMask:0};x[i.STENCIL_MODES.RENDERING_MASK_ADD]={stencilFront:{compare:"equal",passOp:"increment-clamp"},stencilBack:{compare:"equal",passOp:"increment-clamp"}};x[i.STENCIL_MODES.RENDERING_MASK_REMOVE]={stencilFront:{compare:"equal",passOp:"decrement-clamp"},stencilBack:{compare:"equal",passOp:"decrement-clamp"}};x[i.STENCIL_MODES.MASK_ACTIVE]={stencilWriteMask:0,stencilFront:{compare:"equal",passOp:"keep"},stencilBack:{compare:"equal",passOp:"keep"}};class _e{constructor(e){this._syncFunctionHash=Object.create(null),this._adaptor=e,this._systemCheck()}_systemCheck(){if(!i.unsafeEvalSupported())throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.")}ensureUniformGroup(e){const t=this.getUniformGroupData(e);e.buffer||(e.buffer=new i.Buffer({data:new Float32Array(t.layout.size/4),usage:i.BufferUsage.UNIFORM|i.BufferUsage.COPY_DST}))}getUniformGroupData(e){return this._syncFunctionHash[e._signature]||this._initUniformGroup(e)}_initUniformGroup(e){const t=e._signature;let r=this._syncFunctionHash[t];if(!r){const n=Object.keys(e.uniformStructures).map(l=>e.uniformStructures[l]),a=this._adaptor.createUboElements(n),o=this._generateUboSync(a.uboElements);r=this._syncFunctionHash[t]={layout:a,syncFunction:o}}return this._syncFunctionHash[t]}_generateUboSync(e){return this._adaptor.generateUboSync(e)}syncUniformGroup(e,t,r){const n=this.getUniformGroupData(e);return e.buffer||(e.buffer=new i.Buffer({data:new Float32Array(n.layout.size/4),usage:i.BufferUsage.UNIFORM|i.BufferUsage.COPY_DST})),t||(t=e.buffer.data),r||(r=0),n.syncFunction(e.uniforms,t,r),!0}updateUniformGroup(e){if(e.isStatic&&!e._dirtyId)return!1;e._dirtyId=0;const t=this.syncUniformGroup(e);return e.buffer.update(),t}destroy(){this._syncFunctionHash=null}}const v=[{type:"mat3x3<f32>",test:s=>s.value.a!==void 0,ubo:`
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,uniform:`
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `},{type:"vec4<f32>",test:s=>s.type==="vec4<f32>"&&s.size===1&&s.value.width!==void 0,ubo:`
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `},{type:"vec2<f32>",test:s=>s.type==="vec2<f32>"&&s.size===1&&s.value.x!==void 0,ubo:`
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `},{type:"vec4<f32>",test:s=>s.type==="vec4<f32>"&&s.size===1&&s.value.red!==void 0,ubo:`
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `},{type:"vec3<f32>",test:s=>s.type==="vec3<f32>"&&s.size===1&&s.value.red!==void 0,ubo:`
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,uniform:`
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `}];function be(s,e,t,r){const n=[`
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `];let a=0;for(let l=0;l<s.length;l++){const u=s[l],d=u.data.name;let c=!1,h=0;for(let p=0;p<v.length;p++)if(v[p].test(u.data)){h=u.offset/4,n.push(`name = "${d}";`,`offset += ${h-a};`,v[p][e]||v[p].ubo),c=!0;break}if(!c)if(u.data.size>1)h=u.offset/4,n.push(t(u,h-a));else{const p=r[u.data.type];h=u.offset/4,n.push(`
                    v = uv.${d};
                    offset += ${h-a};
                    ${p};
                `)}a=h}const o=n.join(`
`);return new Function("uv","data","offset",o)}function m(s,e){return`
        for (let i = 0; i < ${s*e}; i++) {
            data[offset + (((i / ${s})|0) * 4) + (i % ${s})] = v[i];
        }
    `}const z={f32:`
        data[offset] = v;`,i32:`
        data[offset] = v;`,"vec2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];`,"vec3<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,"vec4<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,"mat2x2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,"mat3x3<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,"mat4x4<f32>":`
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,"mat3x2<f32>":m(3,2),"mat4x2<f32>":m(4,2),"mat2x3<f32>":m(2,3),"mat4x3<f32>":m(4,3),"mat2x4<f32>":m(2,4),"mat3x4<f32>":m(3,4)},Te={...z,"mat2x2<f32>":`
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `};function ye(s,e,t,r,n,a){const o=a?1:-1;return s.identity(),s.a=1/r*2,s.d=o*(1/n*2),s.tx=-1-e*s.a,s.ty=-o-t*s.d,s}const g=new Map;function H(s,e){if(!g.has(s)){const t=new i.Texture({source:new i.CanvasSource({resource:s,...e})}),r=()=>{g.get(s)===t&&g.delete(s)};t.once("destroy",r),t.source.once("destroy",r),g.set(s,t)}return g.get(s)}function ke(s){const e=s.colorTexture.source.resource;return globalThis.HTMLCanvasElement&&e instanceof HTMLCanvasElement&&document.body.contains(e)}const W=class V{constructor(e={}){if(this.uid=i.uid("renderTarget"),this.colorTextures=[],this.dirtyId=0,this.isRoot=!1,this._size=new Float32Array(2),this._managedColorTextures=!1,e={...V.defaultOptions,...e},this.stencil=e.stencil,this.depth=e.depth,this.isRoot=e.isRoot,typeof e.colorTextures=="number"){this._managedColorTextures=!0;for(let t=0;t<e.colorTextures;t++)this.colorTextures.push(new i.TextureSource({width:e.width,height:e.height,resolution:e.resolution,antialias:e.antialias}))}else{this.colorTextures=[...e.colorTextures.map(r=>r.source)];const t=this.colorTexture.source;this.resize(t.width,t.height,t._resolution)}this.colorTexture.source.on("resize",this.onSourceResize,this),(e.depthStencilTexture||this.stencil)&&(e.depthStencilTexture instanceof i.Texture||e.depthStencilTexture instanceof i.TextureSource?this.depthStencilTexture=e.depthStencilTexture.source:this.ensureDepthStencilTexture())}get size(){const e=this._size;return e[0]=this.pixelWidth,e[1]=this.pixelHeight,e}get width(){return this.colorTexture.source.width}get height(){return this.colorTexture.source.height}get pixelWidth(){return this.colorTexture.source.pixelWidth}get pixelHeight(){return this.colorTexture.source.pixelHeight}get resolution(){return this.colorTexture.source._resolution}get colorTexture(){return this.colorTextures[0]}onSourceResize(e){this.resize(e.width,e.height,e._resolution,!0)}ensureDepthStencilTexture(){this.depthStencilTexture||(this.depthStencilTexture=new i.TextureSource({width:this.width,height:this.height,resolution:this.resolution,format:"depth24plus-stencil8",autoGenerateMipmaps:!1,antialias:!1,mipLevelCount:1}))}resize(e,t,r=this.resolution,n=!1){this.dirtyId++,this.colorTextures.forEach((a,o)=>{n&&o===0||a.source.resize(e,t,r)}),this.depthStencilTexture&&this.depthStencilTexture.source.resize(e,t,r)}destroy(){this.colorTexture.source.off("resize",this.onSourceResize,this),this._managedColorTextures&&this.colorTextures.forEach(e=>{e.destroy()}),this.depthStencilTexture&&(this.depthStencilTexture.destroy(),delete this.depthStencilTexture)}};W.defaultOptions={width:0,height:0,resolution:1,colorTextures:1,stencil:!1,depth:!1,antialias:!1,isRoot:!1};let S=W;class Se{constructor(e){this.rootViewPort=new i.Rectangle,this.viewport=new i.Rectangle,this.onRenderTargetChange=new i.SystemRunner("onRenderTargetChange"),this.projectionMatrix=new i.Matrix,this.defaultClearColor=[0,0,0,0],this._renderSurfaceToRenderTargetHash=new Map,this._gpuRenderTargetHash=Object.create(null),this._renderTargetStack=[],this._renderer=e}finishRenderPass(){this.adaptor.finishRenderPass(this.renderTarget)}renderStart({target:e,clear:t,clearColor:r,frame:n}){this._renderTargetStack.length=0,this.push(e,t,r,n),this.rootViewPort.copyFrom(this.viewport),this.rootRenderTarget=this.renderTarget,this.renderingToScreen=ke(this.rootRenderTarget)}bind(e,t=!0,r,n){const a=this.getRenderTarget(e),o=this.renderTarget!==a;this.renderTarget=a,this.renderSurface=e;const l=this.getGpuRenderTarget(a);(a.pixelWidth!==l.width||a.pixelHeight!==l.height)&&(this.adaptor.resizeGpuRenderTarget(a),l.width=a.pixelWidth,l.height=a.pixelHeight);const u=a.colorTexture,d=this.viewport,c=u.pixelWidth,h=u.pixelHeight;if(!n&&e instanceof i.Texture&&(n=e.frame),n){const p=u._resolution;d.x=n.x*p+.5|0,d.y=n.y*p+.5|0,d.width=n.width*p+.5|0,d.height=n.height*p+.5|0}else d.x=0,d.y=0,d.width=c,d.height=h;return ye(this.projectionMatrix,0,0,d.width/u.resolution,d.height/u.resolution,!a.isRoot),this.adaptor.startRenderPass(a,t,r,d),o&&this.onRenderTargetChange.emit(a),a}clear(e,t=i.CLEAR.ALL,r){t&&(e&&(e=this.getRenderTarget(e)),this.adaptor.clear(e||this.renderTarget,t,r,this.viewport))}contextChange(){this._gpuRenderTargetHash=Object.create(null)}push(e,t=i.CLEAR.ALL,r,n){const a=this.bind(e,t,r,n);return this._renderTargetStack.push({renderTarget:a,frame:n}),a}pop(){this._renderTargetStack.pop();const e=this._renderTargetStack[this._renderTargetStack.length-1];this.bind(e.renderTarget,!1,null,e.frame)}getRenderTarget(e){return e.isTexture&&(e=e.source),this._renderSurfaceToRenderTargetHash.get(e)??this._initRenderTarget(e)}copyToTexture(e,t,r,n,a){r.x<0&&(n.width+=r.x,a.x-=r.x,r.x=0),r.y<0&&(n.height+=r.y,a.y-=r.y,r.y=0);const{pixelWidth:o,pixelHeight:l}=e;return n.width=Math.min(n.width,o-r.x),n.height=Math.min(n.height,l-r.y),this.adaptor.copyToTexture(e,t,r,n,a)}ensureDepthStencil(){this.renderTarget.stencil||(this.renderTarget.stencil=!0,this.adaptor.startRenderPass(this.renderTarget,!1,null,this.viewport))}destroy(){this._renderer=null,this._renderSurfaceToRenderTargetHash.forEach((e,t)=>{e!==t&&e.destroy()}),this._renderSurfaceToRenderTargetHash.clear(),this._gpuRenderTargetHash=Object.create(null)}_initRenderTarget(e){let t=null;return i.CanvasSource.test(e)&&(e=H(e).source),e instanceof S?t=e:e instanceof i.TextureSource&&(t=new S({colorTextures:[e]}),i.CanvasSource.test(e.source.resource)&&(t.isRoot=!0),e.once("destroy",()=>{t.destroy();const r=this._gpuRenderTargetHash[t.uid];r&&(this._gpuRenderTargetHash[t.uid]=null,this.adaptor.destroyGpuRenderTarget(r))})),this._renderSurfaceToRenderTargetHash.set(e,t),t}getGpuRenderTarget(e){return this._gpuRenderTargetHash[e.uid]||(this._gpuRenderTargetHash[e.uid]=this.adaptor.initGpuRenderTarget(e))}}class Me extends i.EventEmitter{constructor({buffer:e,offset:t,size:r}){super(),this.uid=i.uid("buffer"),this._resourceType="bufferResource",this._touched=0,this._resourceId=i.uid("resource"),this._bufferResource=!0,this.destroyed=!1,this.buffer=e,this.offset=t|0,this.size=r,this.buffer.on("change",this.onBufferChange,this)}onBufferChange(){this._resourceId=i.uid("resource"),this.emit("change",this)}destroy(e=!1){this.destroyed=!0,e&&this.buffer.destroy(),this.emit("change",this),this.buffer=null}}class j{constructor(e){this._renderer=e}addRenderable(e,t){this._renderer.renderPipes.batch.break(t),t.add(e)}execute(e){e.isRenderable&&e.render(this._renderer)}destroy(){this._renderer=null}}j.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"customRender"};function N(s,e){const t=s.instructionSet,r=t.instructions;for(let n=0;n<t.instructionSize;n++){const a=r[n];e[a.renderPipeId].execute(a)}}class ${constructor(e){this._renderer=e}addRenderGroup(e,t){this._renderer.renderPipes.batch.break(t),t.add(e)}execute(e){e.isRenderable&&(this._renderer.globalUniforms.push({worldTransformMatrix:e.worldTransform,worldColor:e.worldColorAlpha}),N(e,this._renderer.renderPipes),this._renderer.globalUniforms.pop())}destroy(){this._renderer=null}}$.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"renderGroup"};function q(s,e=[]){e.push(s);for(let t=0;t<s.renderGroupChildren.length;t++)q(s.renderGroupChildren[t],e);return e}function Ce(s,e,t){const r=s>>16&255,n=s>>8&255,a=s&255,o=e>>16&255,l=e>>8&255,u=e&255,d=r+(o-r)*t,c=n+(l-n)*t,h=a+(u-a)*t;return(d<<16)+(c<<8)+h}const T=16777215;function K(s,e){return s===T||e===T?s+e-T:Ce(s,e,.5)}const we=new i.Container;function Y(s,e=!1){Pe(s);const t=s.childrenToUpdate,r=s.updateTick++;for(const n in t){const a=Number(n),o=t[n],l=o.list,u=o.index;for(let d=0;d<u;d++){const c=l[d];c.parentRenderGroup===s&&c.relativeRenderGroupDepth===a&&J(c,r,0)}o.index=0}if(e)for(let n=0;n<s.renderGroupChildren.length;n++)Y(s.renderGroupChildren[n],e)}function Pe(s){const e=s.root;let t;if(s.renderGroupParent){const r=s.renderGroupParent;s.worldTransform.appendFrom(e.relativeGroupTransform,r.worldTransform),s.worldColor=K(e.groupColor,r.worldColor),t=e.groupAlpha*r.worldAlpha}else s.worldTransform.copyFrom(e.localTransform),s.worldColor=e.localColor,t=e.localAlpha;t=t<0?0:t>1?1:t,s.worldAlpha=t,s.worldColorAlpha=s.worldColor+((t*255|0)<<24)}function J(s,e,t){if(e===s.updateTick)return;s.updateTick=e,s.didChange=!1;const r=s.localTransform;s.updateLocalTransform();const n=s.parent;if(n&&!n.renderGroup?(t=t|s._updateFlags,s.relativeGroupTransform.appendFrom(r,n.relativeGroupTransform),t&&R(s,n,t)):(t=s._updateFlags,s.relativeGroupTransform.copyFrom(r),t&&R(s,we,t)),!s.renderGroup){const a=s.children,o=a.length;for(let u=0;u<o;u++)J(a[u],e,t);const l=s.parentRenderGroup;s.renderPipeId&&!l.structureDidChange&&l.updateRenderable(s)}}function R(s,e,t){if(t&i.UPDATE_COLOR){s.groupColor=K(s.localColor,e.groupColor);let r=s.localAlpha*e.groupAlpha;r=r<0?0:r>1?1:r,s.groupAlpha=r,s.groupColorAlpha=s.groupColor+((r*255|0)<<24)}t&i.UPDATE_BLEND&&(s.groupBlendMode=s.localBlendMode==="inherit"?e.groupBlendMode:s.localBlendMode),t&i.UPDATE_VISIBLE&&(s.globalDisplayStatus=s.localDisplayStatus&e.globalDisplayStatus),s._updateFlags=0}function Ee(s,e){const{list:t,index:r}=s.childrenRenderablesToUpdate;let n=!1;for(let a=0;a<r;a++){const o=t[a];if(n=e[o.renderPipeId].validateRenderable(o),n)break}return s.structureDidChange=n,n}const Ge=new i.Matrix;class X{constructor(e){this._renderer=e}render({container:e,transform:t}){e.isRenderGroup=!0;const r=e.parent,n=e.renderGroup.renderGroupParent;e.parent=null,e.renderGroup.renderGroupParent=null;const a=this._renderer,o=q(e.renderGroup,[]);let l=Ge;t&&(l=l.copyFrom(e.renderGroup.localTransform),e.renderGroup.localTransform.copyFrom(t));const u=a.renderPipes;for(let d=0;d<o.length;d++){const c=o[d];c.runOnRender(),c.instructionSet.renderPipes=u,c.structureDidChange||Ee(c,u),Y(c),c.structureDidChange?(c.structureDidChange=!1,fe(c,u)):Re(c),c.childrenRenderablesToUpdate.index=0,a.renderPipes.batch.upload(c.instructionSet)}a.globalUniforms.start({worldTransformMatrix:t?e.renderGroup.localTransform:e.renderGroup.worldTransform,worldColor:e.renderGroup.worldColorAlpha}),N(e.renderGroup,u),u.uniformBatch&&u.uniformBatch.renderEnd(),t&&e.renderGroup.localTransform.copyFrom(l),e.parent=r,e.renderGroup.renderGroupParent=n}destroy(){this._renderer=null}}X.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem,i.ExtensionType.CanvasSystem],name:"renderGroup"};function Re(s){const{list:e,index:t}=s.childrenRenderablesToUpdate;for(let r=0;r<t;r++){const n=e[r];n.didViewUpdate&&s.updateRenderable(n)}}class Q{constructor(e){this._gpuSpriteHash=Object.create(null),this._renderer=e}addRenderable(e,t){const r=this._getGpuSprite(e);e._didSpriteUpdate&&this._updateBatchableSprite(e,r),this._renderer.renderPipes.batch.addToBatch(r)}updateRenderable(e){const t=this._gpuSpriteHash[e.uid];e._didSpriteUpdate&&this._updateBatchableSprite(e,t),t.batcher.updateElement(t)}validateRenderable(e){const t=e._texture,r=this._getGpuSprite(e);return r.texture._source!==t._source?!r.batcher.checkAndUpdateTexture(r,t):!1}destroyRenderable(e){const t=this._gpuSpriteHash[e.uid];i.BigPool.return(t),this._gpuSpriteHash[e.uid]=null}_updateBatchableSprite(e,t){e._didSpriteUpdate=!1,t.bounds=e.bounds,t.texture=e._texture}_getGpuSprite(e){return this._gpuSpriteHash[e.uid]||this._initGPUSprite(e)}_initGPUSprite(e){const t=i.BigPool.get(f.BatchableSprite);return t.renderable=e,t.texture=e._texture,t.bounds=e.bounds,t.roundPixels=this._renderer._roundPixels|e._roundPixels,this._gpuSpriteHash[e.uid]=t,e._didSpriteUpdate=!1,e.on("destroyed",()=>{this.destroyRenderable(e)}),t}destroy(){for(const e in this._gpuSpriteHash)i.BigPool.return(this._gpuSpriteHash[e]);this._gpuSpriteHash=null,this._renderer=null}}Q.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"sprite"};const M=class Z{constructor(){this.clearBeforeRender=!0,this._backgroundColor=new i.Color(0),this.color=this._backgroundColor,this.alpha=1}init(e){e={...Z.defaultOptions,...e},this.clearBeforeRender=e.clearBeforeRender,this.color=e.background||e.backgroundColor||this._backgroundColor,this.alpha=e.backgroundAlpha,this._backgroundColor.setAlpha(e.backgroundAlpha)}get color(){return this._backgroundColor}set color(e){this._backgroundColor.setValue(e)}get alpha(){return this._backgroundColor.alpha}set alpha(e){this._backgroundColor.setAlpha(e)}get colorRgba(){return this._backgroundColor.toArray()}destroy(){}};M.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem,i.ExtensionType.CanvasSystem],name:"background",priority:0};M.defaultOptions={backgroundAlpha:1,backgroundColor:0,clearBeforeRender:!0};let Be=M;const _={};i.extensions.handle(i.ExtensionType.BlendMode,s=>{if(!s.name)throw new Error("BlendMode extension must have a name property");_[s.name]=s.ref},s=>{delete _[s.name]});class ee{constructor(e){this._isAdvanced=!1,this._filterHash=Object.create(null),this._renderer=e}setBlendMode(e,t,r){if(this._activeBlendMode===t){this._isAdvanced&&this._renderableList.push(e);return}this._activeBlendMode=t,this._isAdvanced&&this._endAdvancedBlendMode(r),this._isAdvanced=!!_[t],this._isAdvanced&&(this._beginAdvancedBlendMode(r),this._renderableList.push(e))}_beginAdvancedBlendMode(e){this._renderer.renderPipes.batch.break(e);const t=this._activeBlendMode;if(!_[t]){i.warn(`Unable to assign BlendMode: '${t}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);return}let r=this._filterHash[t];r||(r=this._filterHash[t]=new i.FilterEffect,r.filters=[new _[t]]);const n={renderPipeId:"filter",action:"pushFilter",renderables:[],filterEffect:r,canBundle:!1};this._renderableList=n.renderables,e.add(n)}_endAdvancedBlendMode(e){this._renderableList=null,this._renderer.renderPipes.batch.break(e),e.add({renderPipeId:"filter",action:"popFilter",canBundle:!1})}buildStart(){this._isAdvanced=!1}buildEnd(e){this._isAdvanced&&this._endAdvancedBlendMode(e)}destroy(){this._renderer=null,this._renderableList=null;for(const e in this._filterHash)this._filterHash[e].destroy();this._filterHash=null}}ee.extension={type:[i.ExtensionType.WebGLPipes,i.ExtensionType.WebGPUPipes,i.ExtensionType.CanvasPipes],name:"blendMode"};const y={png:"image/png",jpg:"image/jpeg",webp:"image/webp"},C=class te{constructor(e){this._renderer=e}_normalizeOptions(e,t={}){return e instanceof i.Container||e instanceof i.Texture?{target:e,...t}:{...t,...e}}async image(e){const t=new Image;return t.src=await this.base64(e),t}async base64(e){e=this._normalizeOptions(e,te.defaultImageOptions);const{format:t,quality:r}=e,n=this.canvas(e);if(n.toBlob!==void 0)return new Promise((a,o)=>{n.toBlob(l=>{if(!l){o(new Error("ICanvas.toBlob failed!"));return}const u=new FileReader;u.onload=()=>a(u.result),u.onerror=o,u.readAsDataURL(l)},y[t],r)});if(n.toDataURL!==void 0)return n.toDataURL(y[t],r);if(n.convertToBlob!==void 0){const a=await n.convertToBlob({type:y[t],quality:r});return new Promise((o,l)=>{const u=new FileReader;u.onload=()=>o(u.result),u.onerror=l,u.readAsDataURL(a)})}throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented")}canvas(e){e=this._normalizeOptions(e);const t=e.target,r=this._renderer;if(t instanceof i.Texture)return r.texture.generateCanvas(t);const n=r.textureGenerator.generateTexture(e),a=r.texture.generateCanvas(n);return n.destroy(),a}pixels(e){e=this._normalizeOptions(e);const t=e.target,r=this._renderer,n=t instanceof i.Texture?t:r.textureGenerator.generateTexture(e),a=r.texture.getPixels(n);return t instanceof i.Container&&n.destroy(),a}texture(e){return e=this._normalizeOptions(e),e.target instanceof i.Texture?e.target:this._renderer.textureGenerator.generateTexture(e)}download(e){e=this._normalizeOptions(e);const t=this.canvas(e),r=document.createElement("a");r.download=e.filename??"image.png",r.href=t.toDataURL("image/png"),document.body.appendChild(r),r.click(),document.body.removeChild(r)}log(e){const t=e.width??200;e=this._normalizeOptions(e);const r=this.canvas(e),n=r.toDataURL();console.log(`[Pixi Texture] ${r.width}px ${r.height}px`);const a=["font-size: 1px;",`padding: ${t}px 300px;`,`background: url(${n}) no-repeat;`,"background-size: contain;"].join(" ");console.log("%c ",a)}destroy(){this._renderer=null}};C.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem],name:"extract"};C.defaultImageOptions={format:"png",quality:1};let Ue=C;class Ae extends i.Texture{static create(e){return new i.Texture({source:new i.TextureSource(e)})}resize(e,t,r){return this.source.resize(e,t,r),this}}const Ie=new i.Rectangle,De=new i.Bounds,Fe=[0,0,0,0];class re{constructor(e){this._renderer=e}generateTexture(e){var d;e instanceof i.Container&&(e={target:e,frame:void 0,textureSourceOptions:{},resolution:void 0});const t=e.resolution||this._renderer.resolution,r=e.antialias||this._renderer.view.antialias,n=e.target;let a=e.clearColor;a?a=Array.isArray(a)&&a.length===4?a:i.Color.shared.setValue(a).toArray():a=Fe;const o=((d=e.frame)==null?void 0:d.copyTo(Ie))||i.getLocalBounds(n,De).rectangle;o.width=Math.max(o.width,1/t)|0,o.height=Math.max(o.height,1/t)|0;const l=Ae.create({...e.textureSourceOptions,width:o.width,height:o.height,resolution:t,antialias:r}),u=i.Matrix.shared.translate(-o.x,-o.y);return this._renderer.render({container:n,transform:u,target:l,clearColor:a}),l.source.updateMipmaps(),l}destroy(){this._renderer=null}}re.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem],name:"textureGenerator"};class se{constructor(e){this._stackIndex=0,this._globalUniformDataStack=[],this._uniformsPool=[],this._activeUniforms=[],this._bindGroupPool=[],this._activeBindGroups=[],this._renderer=e}reset(){this._stackIndex=0;for(let e=0;e<this._activeUniforms.length;e++)this._uniformsPool.push(this._activeUniforms[e]);for(let e=0;e<this._activeBindGroups.length;e++)this._bindGroupPool.push(this._activeBindGroups[e]);this._activeUniforms.length=0,this._activeBindGroups.length=0}start(e){this.reset(),this.push(e)}bind({size:e,projectionMatrix:t,worldTransformMatrix:r,worldColor:n,offset:a}){const o=this._renderer.renderTarget.renderTarget,l=this._stackIndex?this._globalUniformDataStack[this._stackIndex-1]:{projectionData:o,worldTransformMatrix:new i.Matrix,worldColor:4294967295,offset:new i.Point},u={projectionMatrix:t||this._renderer.renderTarget.projectionMatrix,resolution:e||o.size,worldTransformMatrix:r||l.worldTransformMatrix,worldColor:n||l.worldColor,offset:a||l.offset,bindGroup:null},d=this._uniformsPool.pop()||this._createUniforms();this._activeUniforms.push(d);const c=d.uniforms;c.uProjectionMatrix=u.projectionMatrix,c.uResolution=u.resolution,c.uWorldTransformMatrix.copyFrom(u.worldTransformMatrix),c.uWorldTransformMatrix.tx-=u.offset.x,c.uWorldTransformMatrix.ty-=u.offset.y,f.color32BitToUniform(u.worldColor,c.uWorldColorAlpha,0),d.update();let h;this._renderer.renderPipes.uniformBatch?h=this._renderer.renderPipes.uniformBatch.getUniformBindGroup(d,!1):(h=this._bindGroupPool.pop()||new i.BindGroup,this._activeBindGroups.push(h),h.setResource(d,0)),u.bindGroup=h,this._currentGlobalUniformData=u}push(e){this.bind(e),this._globalUniformDataStack[this._stackIndex++]=this._currentGlobalUniformData}pop(){this._currentGlobalUniformData=this._globalUniformDataStack[--this._stackIndex-1],this._renderer.type===f.RendererType.WEBGL&&this._currentGlobalUniformData.bindGroup.resources[0].update()}get bindGroup(){return this._currentGlobalUniformData.bindGroup}get uniformGroup(){return this._currentGlobalUniformData.bindGroup.resources[0]}_createUniforms(){return new f.UniformGroup({uProjectionMatrix:{value:new i.Matrix,type:"mat3x3<f32>"},uWorldTransformMatrix:{value:new i.Matrix,type:"mat3x3<f32>"},uWorldColorAlpha:{value:new Float32Array(4),type:"vec4<f32>"},uResolution:{value:[0,0],type:"vec2<f32>"}},{isStatic:!0})}destroy(){this._renderer=null}}se.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem,i.ExtensionType.CanvasSystem],name:"globalUniforms"};let B=!1;const U="8.2.2";function Oe(s){if(!B){if(i.DOMAdapter.get().getNavigator().userAgent.toLowerCase().indexOf("chrome")>-1){const e=[`%c  %c  %c  %c  %c PixiJS %c v${U} (${s}) http://www.pixijs.com/

`,"background: #E72264; padding:5px 0;","background: #6CA2EA; padding:5px 0;","background: #B5D33D; padding:5px 0;","background: #FED23F; padding:5px 0;","color: #FFFFFF; background: #E72264; padding:5px 0;","color: #E72264; background: #FFFFFF; padding:5px 0;"];globalThis.console.log(...e)}else globalThis.console&&globalThis.console.log(`PixiJS ${U} - ${s} - http://www.pixijs.com/`);B=!0}}class w{constructor(e){this._renderer=e}init(e){if(e.hello){let t=this._renderer.name;this._renderer.type===f.RendererType.WEBGL&&(t+=` ${this._renderer.context.webGLVersion}`),Oe(t)}}}w.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem,i.ExtensionType.CanvasSystem],name:"hello",priority:-2};w.defaultOptions={hello:!1};const P=class ne{constructor(e){this._renderer=e,this.count=0,this.checkCount=0}init(e){e={...ne.defaultOptions,...e},this.checkCountMax=e.textureGCCheckCountMax,this.maxIdle=e.textureGCAMaxIdle,this.active=e.textureGCActive}postrender(){this._renderer.renderingToScreen&&(this.count++,this.active&&(this.checkCount++,this.checkCount>this.checkCountMax&&(this.checkCount=0,this.run())))}run(){const e=this._renderer.texture.managedTextures;for(let t=0;t<e.length;t++){const r=e[t];r.autoGarbageCollect&&r.resource&&r._touched>-1&&this.count-r._touched>this.maxIdle&&(r._touched=-1,r.unload())}}destroy(){this._renderer=null}};P.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem],name:"textureGC"};P.defaultOptions={textureGCActive:!0,textureGCAMaxIdle:60*60,textureGCCheckCountMax:600};let ie=P;i.extensions.add(ie);const E=class ae{get resolution(){return this.texture.source._resolution}set resolution(e){this.texture.source.resize(this.texture.source.width,this.texture.source.height,e)}init(e){e={...ae.defaultOptions,...e},e.view&&(i.deprecation(i.v8_0_0,"ViewSystem.view has been renamed to ViewSystem.canvas"),e.canvas=e.view),this.screen=new i.Rectangle(0,0,e.width,e.height),this.canvas=e.canvas||i.DOMAdapter.get().createCanvas(),this.antialias=!!e.antialias,this.texture=H(this.canvas,e),this.renderTarget=new S({colorTextures:[this.texture],depth:!!e.depth,isRoot:!0}),this.texture.source.transparent=e.backgroundAlpha<1,this.multiView=!!e.multiView,this.autoDensity&&(this.canvas.style.width=`${this.texture.width}px`,this.canvas.style.height=`${this.texture.height}px`),this.resolution=e.resolution}resize(e,t,r){this.texture.source.resize(e,t,r),this.screen.width=this.texture.frame.width,this.screen.height=this.texture.frame.height,this.autoDensity&&(this.canvas.style.width=`${e}px`,this.canvas.style.height=`${t}px`)}destroy(e=!1){(typeof e=="boolean"?e:!!(e!=null&&e.removeView))&&this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas)}};E.extension={type:[i.ExtensionType.WebGLSystem,i.ExtensionType.WebGPUSystem,i.ExtensionType.CanvasSystem],name:"view",priority:0};E.defaultOptions={width:800,height:600,autoDensity:!1,antialias:!1};let Le=E;const ze=[Be,se,w,Le,X,ie,re,Ue,i.RendererInitHook],He=[ee,I,Q,$,F,L,O,j];exports.BufferResource=Me;exports.GpuStencilModesToPixi=x;exports.RenderTargetSystem=Se;exports.SharedRenderPipes=He;exports.SharedSystems=ze;exports.UboSystem=_e;exports.createUboSyncFunction=be;exports.ensureAttributes=ge;exports.textureBit=ce;exports.textureBitGl=he;exports.uboSyncFunctionsSTD40=z;exports.uboSyncFunctionsWGSL=Te;exports.uniformParsers=v;
