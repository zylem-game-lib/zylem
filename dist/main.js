"use strict";var Th=Object.defineProperty;var xh=(Q,A,I)=>A in Q?Th(Q,A,{enumerable:!0,configurable:!0,writable:!0,value:I}):Q[A]=I;var aA=(Q,A,I)=>(xh(Q,typeof A!="symbol"?A+"":A,I),I);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});function ma(){const Q=navigator.userAgent,A=/android/i.test(Q)||/iPad|iPhone|iPod/.test(Q),I="ontouchstart"in window||navigator.maxTouchPoints>0;return A||I}const aE=(Q,A)=>{const I=A.x-Q.x,g=A.y-Q.y;return Math.sqrt(I*I+g*g)},bh=(Q,A)=>{const I=A.x-Q.x,g=A.y-Q.y;return vh(Math.atan2(g,I))},Oh=(Q,A,I)=>{const g={x:0,y:0};return I=kt(I),g.x=Q.x-A*Math.cos(I),g.y=Q.y-A*Math.sin(I),g},kt=Q=>Q*(Math.PI/180),vh=Q=>Q*(180/Math.PI),Zh=Q=>isNaN(Q.buttons)?Q.pressure!==0:Q.buttons!==0,bo=new Map,Ta=Q=>{bo.has(Q)&&clearTimeout(bo.get(Q)),bo.set(Q,setTimeout(Q,100))},KE=(Q,A,I)=>{const g=A.split(/[ ,]+/g);let C;for(let B=0;B<g.length;B+=1)C=g[B],Q.addEventListener?Q.addEventListener(C,I,!1):Q.attachEvent&&Q.attachEvent(C,I)},xa=(Q,A,I)=>{const g=A.split(/[ ,]+/g);let C;for(let B=0;B<g.length;B+=1)C=g[B],Q.removeEventListener?Q.removeEventListener(C,I):Q.detachEvent&&Q.detachEvent(C,I)},lD=Q=>(Q.preventDefault(),Q.type.match(/^touch/)?Q.changedTouches:Q),ba=()=>{const Q=window.pageXOffset!==void 0?window.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft,A=window.pageYOffset!==void 0?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop;return{x:Q,y:A}},Oa=(Q,A)=>{A.top||A.right||A.bottom||A.left?(Q.style.top=A.top,Q.style.right=A.right,Q.style.bottom=A.bottom,Q.style.left=A.left):(Q.style.left=A.x+"px",Q.style.top=A.y+"px")},ne=(Q,A,I)=>{const g=yD(Q);for(let C in g)if(g.hasOwnProperty(C))if(typeof A=="string")g[C]=A+" "+I;else{let B="";for(let i=0,E=A.length;i<E;i+=1)B+=A[i]+" "+I+", ";g[C]=B.slice(0,-2)}return g},Wh=(Q,A)=>{const I=yD(Q);for(let g in I)I.hasOwnProperty(g)&&(I[g]=A);return I},yD=Q=>{const A={};return A[Q]="",["webkit","Moz","o"].forEach(function(g){A[g+Q.charAt(0).toUpperCase()+Q.slice(1)]=""}),A},Oo=(Q,A)=>{for(let I in A)A.hasOwnProperty(I)&&(Q[I]=A[I]);return Q},Ph=(Q,A)=>{const I={};for(let g in Q)Q.hasOwnProperty(g)&&A.hasOwnProperty(g)?I[g]=A[g]:Q.hasOwnProperty(g)&&(I[g]=Q[g]);return I},Mt=(Q,A)=>{if(Q.length)for(let I=0,g=Q.length;I<g;I+=1)A(Q[I]);else A(Q)},_h=(Q,A,I)=>({x:Math.min(Math.max(Q.x,A.x-I),A.x+I),y:Math.min(Math.max(Q.y,A.y-I),A.y+I)});var jh="ontouchstart"in window,Vh=!!window.PointerEvent,Xh=!!window.MSPointerEvent,aQ={touch:{start:"touchstart",move:"touchmove",end:"touchend, touchcancel"},mouse:{start:"mousedown",move:"mousemove",end:"mouseup"},pointer:{start:"pointerdown",move:"pointermove",end:"pointerup, pointercancel"},MSPointer:{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}},LB,RQ={};Vh?LB=aQ.pointer:Xh?LB=aQ.MSPointer:jh?(LB=aQ.touch,RQ=aQ.mouse):LB=aQ.mouse;function BC(){}BC.prototype.on=function(Q,A){var I=this,g=Q.split(/[ ,]+/g),C;I._handlers_=I._handlers_||{};for(var B=0;B<g.length;B+=1)C=g[B],I._handlers_[C]=I._handlers_[C]||[],I._handlers_[C].push(A);return I};BC.prototype.off=function(Q,A){var I=this;return I._handlers_=I._handlers_||{},Q===void 0?I._handlers_={}:A===void 0?I._handlers_[Q]=null:I._handlers_[Q]&&I._handlers_[Q].indexOf(A)>=0&&I._handlers_[Q].splice(I._handlers_[Q].indexOf(A),1),I};BC.prototype.trigger=function(Q,A){var I=this,g=Q.split(/[ ,]+/g),C;I._handlers_=I._handlers_||{};for(var B=0;B<g.length;B+=1)C=g[B],I._handlers_[C]&&I._handlers_[C].length&&I._handlers_[C].forEach(function(i){i.call(I,{type:C,target:I},A)})};BC.prototype.config=function(Q){var A=this;A.options=A.defaults||{},Q&&(A.options=Ph(A.options,Q))};BC.prototype.bindEvt=function(Q,A){var I=this;return I._domHandlers_=I._domHandlers_||{},I._domHandlers_[A]=function(){typeof I["on"+A]=="function"?I["on"+A].apply(I,arguments):console.warn('[WARNING] : Missing "on'+A+'" handler.')},KE(Q,LB[A],I._domHandlers_[A]),RQ[A]&&KE(Q,RQ[A],I._domHandlers_[A]),I};BC.prototype.unbindEvt=function(Q,A){var I=this;return I._domHandlers_=I._domHandlers_||{},xa(Q,LB[A],I._domHandlers_[A]),RQ[A]&&xa(Q,RQ[A],I._domHandlers_[A]),delete I._domHandlers_[A],this};function LI(Q,A){return this.identifier=A.identifier,this.position=A.position,this.frontPosition=A.frontPosition,this.collection=Q,this.defaults={size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,mode:"dynamic",zone:document.body,lockX:!1,lockY:!1,shape:"circle"},this.config(A),this.options.mode==="dynamic"&&(this.options.restOpacity=0),this.id=LI.id,LI.id+=1,this.buildEl().stylize(),this.instance={el:this.ui.el,on:this.on.bind(this),off:this.off.bind(this),show:this.show.bind(this),hide:this.hide.bind(this),add:this.addToDom.bind(this),remove:this.removeFromDom.bind(this),destroy:this.destroy.bind(this),setPosition:this.setPosition.bind(this),resetDirection:this.resetDirection.bind(this),computeDirection:this.computeDirection.bind(this),trigger:this.trigger.bind(this),position:this.position,frontPosition:this.frontPosition,ui:this.ui,identifier:this.identifier,id:this.id,options:this.options},this.instance}LI.prototype=new BC;LI.constructor=LI;LI.id=0;LI.prototype.buildEl=function(Q){return this.ui={},this.options.dataOnly?this:(this.ui.el=document.createElement("div"),this.ui.back=document.createElement("div"),this.ui.front=document.createElement("div"),this.ui.el.className="nipple collection_"+this.collection.id,this.ui.back.className="back",this.ui.front.className="front",this.ui.el.setAttribute("id","nipple_"+this.collection.id+"_"+this.id),this.ui.el.appendChild(this.ui.back),this.ui.el.appendChild(this.ui.front),this)};LI.prototype.stylize=function(){if(this.options.dataOnly)return this;var Q=this.options.fadeTime+"ms",A=Wh("borderRadius","50%"),I=ne("transition","opacity",Q),g={};return g.el={position:"absolute",opacity:this.options.restOpacity,display:"block",zIndex:999},g.back={position:"absolute",display:"block",width:this.options.size+"px",height:this.options.size+"px",marginLeft:-this.options.size/2+"px",marginTop:-this.options.size/2+"px",background:this.options.color,opacity:".5"},g.front={width:this.options.size/2+"px",height:this.options.size/2+"px",position:"absolute",display:"block",marginLeft:-this.options.size/4+"px",marginTop:-this.options.size/4+"px",background:this.options.color,opacity:".5",transform:"translate(0px, 0px)"},Oo(g.el,I),this.options.shape==="circle"&&Oo(g.back,A),Oo(g.front,A),this.applyStyles(g),this};LI.prototype.applyStyles=function(Q){for(var A in this.ui)if(this.ui.hasOwnProperty(A))for(var I in Q[A])this.ui[A].style[I]=Q[A][I];return this};LI.prototype.addToDom=function(){return this.options.dataOnly||document.body.contains(this.ui.el)?this:(this.options.zone.appendChild(this.ui.el),this)};LI.prototype.removeFromDom=function(){return this.options.dataOnly||!document.body.contains(this.ui.el)?this:(this.options.zone.removeChild(this.ui.el),this)};LI.prototype.destroy=function(){clearTimeout(this.removeTimeout),clearTimeout(this.showTimeout),clearTimeout(this.restTimeout),this.trigger("destroyed",this.instance),this.removeFromDom(),this.off()};LI.prototype.show=function(Q){var A=this;return A.options.dataOnly||(clearTimeout(A.removeTimeout),clearTimeout(A.showTimeout),clearTimeout(A.restTimeout),A.addToDom(),A.restCallback(),setTimeout(function(){A.ui.el.style.opacity=1},0),A.showTimeout=setTimeout(function(){A.trigger("shown",A.instance),typeof Q=="function"&&Q.call(this)},A.options.fadeTime)),A};LI.prototype.hide=function(Q){var A=this;if(A.options.dataOnly)return A;if(A.ui.el.style.opacity=A.options.restOpacity,clearTimeout(A.removeTimeout),clearTimeout(A.showTimeout),clearTimeout(A.restTimeout),A.removeTimeout=setTimeout(function(){var I=A.options.mode==="dynamic"?"none":"block";A.ui.el.style.display=I,typeof Q=="function"&&Q.call(A),A.trigger("hidden",A.instance)},A.options.fadeTime),A.options.restJoystick){const I=A.options.restJoystick,g={};g.x=I===!0||I.x!==!1?0:A.instance.frontPosition.x,g.y=I===!0||I.y!==!1?0:A.instance.frontPosition.y,A.setPosition(Q,g)}return A};LI.prototype.setPosition=function(Q,A){var I=this;I.frontPosition={x:A.x,y:A.y};var g=I.options.fadeTime+"ms",C={};C.front=ne("transition",["transform"],g);var B={front:{}};B.front={transform:"translate("+I.frontPosition.x+"px,"+I.frontPosition.y+"px)"},I.applyStyles(C),I.applyStyles(B),I.restTimeout=setTimeout(function(){typeof Q=="function"&&Q.call(I),I.restCallback()},I.options.fadeTime)};LI.prototype.restCallback=function(){var Q=this,A={};A.front=ne("transition","none",""),Q.applyStyles(A),Q.trigger("rested",Q.instance)};LI.prototype.resetDirection=function(){this.direction={x:!1,y:!1,angle:!1}};LI.prototype.computeDirection=function(Q){var A=Q.angle.radian,I=Math.PI/4,g=Math.PI/2,C,B,i;if(A>I&&A<I*3&&!Q.lockX?C="up":A>-I&&A<=I&&!Q.lockY?C="left":A>-I*3&&A<=-I&&!Q.lockX?C="down":Q.lockY||(C="right"),Q.lockY||(A>-g&&A<g?B="left":B="right"),Q.lockX||(A>0?i="up":i="down"),Q.force>this.options.threshold){var E={},t;for(t in this.direction)this.direction.hasOwnProperty(t)&&(E[t]=this.direction[t]);var e={};this.direction={x:B,y:i,angle:C},Q.direction=this.direction;for(t in E)E[t]===this.direction[t]&&(e[t]=!0);if(e.x&&e.y&&e.angle)return Q;(!e.x||!e.y)&&this.trigger("plain",Q),e.x||this.trigger("plain:"+B,Q),e.y||this.trigger("plain:"+i,Q),e.angle||this.trigger("dir dir:"+C,Q)}else this.resetDirection();return Q};function RI(Q,A){var I=this;I.nipples=[],I.idles=[],I.actives=[],I.ids=[],I.pressureIntervals={},I.manager=Q,I.id=RI.id,RI.id+=1,I.defaults={zone:document.body,multitouch:!1,maxNumberOfNipples:10,mode:"dynamic",position:{top:0,left:0},catchDistance:200,size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,lockX:!1,lockY:!1,shape:"circle",dynamicPage:!1,follow:!1},I.config(A),(I.options.mode==="static"||I.options.mode==="semi")&&(I.options.multitouch=!1),I.options.multitouch||(I.options.maxNumberOfNipples=1);const g=getComputedStyle(I.options.zone.parentElement);return g&&g.display==="flex"&&(I.parentIsFlex=!0),I.updateBox(),I.prepareNipples(),I.bindings(),I.begin(),I.nipples}RI.prototype=new BC;RI.constructor=RI;RI.id=0;RI.prototype.prepareNipples=function(){var Q=this,A=Q.nipples;A.on=Q.on.bind(Q),A.off=Q.off.bind(Q),A.options=Q.options,A.destroy=Q.destroy.bind(Q),A.ids=Q.ids,A.id=Q.id,A.processOnMove=Q.processOnMove.bind(Q),A.processOnEnd=Q.processOnEnd.bind(Q),A.get=function(I){if(I===void 0)return A[0];for(var g=0,C=A.length;g<C;g+=1)if(A[g].identifier===I)return A[g];return!1}};RI.prototype.bindings=function(){var Q=this;Q.bindEvt(Q.options.zone,"start"),Q.options.zone.style.touchAction="none",Q.options.zone.style.msTouchAction="none"};RI.prototype.begin=function(){var Q=this,A=Q.options;if(A.mode==="static"){var I=Q.createNipple(A.position,Q.manager.getIdentifier());I.add(),Q.idles.push(I)}};RI.prototype.createNipple=function(Q,A){var I=this,g=I.manager.scroll,C={},B=I.options,i={x:I.parentIsFlex?g.x:g.x+I.box.left,y:I.parentIsFlex?g.y:g.y+I.box.top};if(Q.x&&Q.y)C={x:Q.x-i.x,y:Q.y-i.y};else if(Q.top||Q.right||Q.bottom||Q.left){var E=document.createElement("DIV");E.style.display="hidden",E.style.top=Q.top,E.style.right=Q.right,E.style.bottom=Q.bottom,E.style.left=Q.left,E.style.position="absolute",B.zone.appendChild(E);var t=E.getBoundingClientRect();B.zone.removeChild(E),C=Q,Q={x:t.left+g.x,y:t.top+g.y}}var e=new LI(I,{color:B.color,size:B.size,threshold:B.threshold,fadeTime:B.fadeTime,dataOnly:B.dataOnly,restJoystick:B.restJoystick,restOpacity:B.restOpacity,mode:B.mode,identifier:A,position:Q,zone:B.zone,frontPosition:{x:0,y:0},shape:B.shape});return B.dataOnly||(Oa(e.ui.el,C),Oa(e.ui.front,e.frontPosition)),I.nipples.push(e),I.trigger("added "+e.identifier+":added",e),I.manager.trigger("added "+e.identifier+":added",e),I.bindNipple(e),e};RI.prototype.updateBox=function(){var Q=this;Q.box=Q.options.zone.getBoundingClientRect()};RI.prototype.bindNipple=function(Q){var A=this,I,g=function(C,B){I=C.type+" "+B.id+":"+C.type,A.trigger(I,B)};Q.on("destroyed",A.onDestroyed.bind(A)),Q.on("shown hidden rested dir plain",g),Q.on("dir:up dir:right dir:down dir:left",g),Q.on("plain:up plain:right plain:down plain:left",g)};RI.prototype.pressureFn=function(Q,A,I){var g=this,C=0;clearInterval(g.pressureIntervals[I]),g.pressureIntervals[I]=setInterval(function(){var B=Q.force||Q.pressure||Q.webkitForce||0;B!==C&&(A.trigger("pressure",B),g.trigger("pressure "+A.identifier+":pressure",B),C=B)}.bind(g),100)};RI.prototype.onstart=function(Q){var A=this,I=A.options,g=Q;Q=lD(Q),A.updateBox();var C=function(B){A.actives.length<I.maxNumberOfNipples?A.processOnStart(B):g.type.match(/^touch/)&&(Object.keys(A.manager.ids).forEach(function(i){if(Object.values(g.touches).findIndex(function(t){return t.identifier===i})<0){var E=[Q[0]];E.identifier=i,A.processOnEnd(E)}}),A.actives.length<I.maxNumberOfNipples&&A.processOnStart(B))};return Mt(Q,C),A.manager.bindDocument(),!1};RI.prototype.processOnStart=function(Q){var A=this,I=A.options,g,C=A.manager.getIdentifier(Q),B=Q.force||Q.pressure||Q.webkitForce||0,i={x:Q.pageX,y:Q.pageY},E=A.getOrCreate(C,i);E.identifier!==C&&A.manager.removeIdentifier(E.identifier),E.identifier=C;var t=function(s){s.trigger("start",s),A.trigger("start "+s.id+":start",s),s.show(),B>0&&A.pressureFn(Q,s,s.identifier),A.processOnMove(Q)};if((g=A.idles.indexOf(E))>=0&&A.idles.splice(g,1),A.actives.push(E),A.ids.push(E.identifier),I.mode!=="semi")t(E);else{var e=aE(i,E.position);if(e<=I.catchDistance)t(E);else{E.destroy(),A.processOnStart(Q);return}}return E};RI.prototype.getOrCreate=function(Q,A){var I=this,g=I.options,C;return/(semi|static)/.test(g.mode)?(C=I.idles[0],C?(I.idles.splice(0,1),C):g.mode==="semi"?I.createNipple(A,Q):(console.warn("Coudln't find the needed nipple."),!1)):(C=I.createNipple(A,Q),C)};RI.prototype.processOnMove=function(Q){var A=this,I=A.options,g=A.manager.getIdentifier(Q),C=A.nipples.get(g),B=A.manager.scroll;if(!Zh(Q)){this.processOnEnd(Q);return}if(!C){console.error("Found zombie joystick with ID "+g),A.manager.removeIdentifier(g);return}if(I.dynamicPage){var i=C.el.getBoundingClientRect();C.position={x:B.x+i.left,y:B.y+i.top}}C.identifier=g;var E=C.options.size/2,t={x:Q.pageX,y:Q.pageY};I.lockX&&(t.y=C.position.y),I.lockY&&(t.x=C.position.x);var e=aE(t,C.position),s=bh(t,C.position),o=kt(s),a=e/E,D={distance:e,position:t},h,c;if(C.options.shape==="circle"?(h=Math.min(e,E),c=Oh(C.position,h,s)):(c=_h(t,C.position,E),h=aE(c,C.position)),I.follow){if(e>E){let G=t.x-c.x,l=t.y-c.y;C.position.x+=G,C.position.y+=l,C.el.style.top=C.position.y-(A.box.top+B.y)+"px",C.el.style.left=C.position.x-(A.box.left+B.x)+"px",e=aE(t,C.position)}}else t=c,e=h;var r=t.x-C.position.x,n=t.y-C.position.y;C.frontPosition={x:r,y:n},I.dataOnly||(C.ui.front.style.transform="translate("+r+"px,"+n+"px)");var S={identifier:C.identifier,position:t,force:a,pressure:Q.force||Q.pressure||Q.webkitForce||0,distance:e,angle:{radian:o,degree:s},vector:{x:r/E,y:-n/E},raw:D,instance:C,lockX:I.lockX,lockY:I.lockY};S=C.computeDirection(S),S.angle={radian:kt(180-s),degree:180-s},C.trigger("move",S),A.trigger("move "+C.id+":move",S)};RI.prototype.processOnEnd=function(Q){var A=this,I=A.options,g=A.manager.getIdentifier(Q),C=A.nipples.get(g),B=A.manager.removeIdentifier(C.identifier);C&&(I.dataOnly||C.hide(function(){I.mode==="dynamic"&&(C.trigger("removed",C),A.trigger("removed "+C.id+":removed",C),A.manager.trigger("removed "+C.id+":removed",C),C.destroy())}),clearInterval(A.pressureIntervals[C.identifier]),C.resetDirection(),C.trigger("end",C),A.trigger("end "+C.id+":end",C),A.ids.indexOf(C.identifier)>=0&&A.ids.splice(A.ids.indexOf(C.identifier),1),A.actives.indexOf(C)>=0&&A.actives.splice(A.actives.indexOf(C),1),/(semi|static)/.test(I.mode)?A.idles.push(C):A.nipples.indexOf(C)>=0&&A.nipples.splice(A.nipples.indexOf(C),1),A.manager.unbindDocument(),/(semi|static)/.test(I.mode)&&(A.manager.ids[B.id]=B.identifier))};RI.prototype.onDestroyed=function(Q,A){var I=this;I.nipples.indexOf(A)>=0&&I.nipples.splice(I.nipples.indexOf(A),1),I.actives.indexOf(A)>=0&&I.actives.splice(I.actives.indexOf(A),1),I.idles.indexOf(A)>=0&&I.idles.splice(I.idles.indexOf(A),1),I.ids.indexOf(A.identifier)>=0&&I.ids.splice(I.ids.indexOf(A.identifier),1),I.manager.removeIdentifier(A.identifier),I.manager.unbindDocument()};RI.prototype.destroy=function(){var Q=this;Q.unbindEvt(Q.options.zone,"start"),Q.nipples.forEach(function(I){I.destroy()});for(var A in Q.pressureIntervals)Q.pressureIntervals.hasOwnProperty(A)&&clearInterval(Q.pressureIntervals[A]);Q.trigger("destroyed",Q.nipples),Q.manager.unbindDocument(),Q.off()};function bI(Q){var A=this;A.ids={},A.index=0,A.collections=[],A.scroll=ba(),A.config(Q),A.prepareCollections();var I=function(){var C;A.collections.forEach(function(B){B.forEach(function(i){C=i.el.getBoundingClientRect(),i.position={x:A.scroll.x+C.left,y:A.scroll.y+C.top}})})};KE(window,"resize",function(){Ta(I)});var g=function(){A.scroll=ba()};return KE(window,"scroll",function(){Ta(g)}),A.collections}bI.prototype=new BC;bI.constructor=bI;bI.prototype.prepareCollections=function(){var Q=this;Q.collections.create=Q.create.bind(Q),Q.collections.on=Q.on.bind(Q),Q.collections.off=Q.off.bind(Q),Q.collections.destroy=Q.destroy.bind(Q),Q.collections.get=function(A){var I;return Q.collections.every(function(g){return I=g.get(A),!I}),I}};bI.prototype.create=function(Q){return this.createCollection(Q)};bI.prototype.createCollection=function(Q){var A=this,I=new RI(A,Q);return A.bindCollection(I),A.collections.push(I),I};bI.prototype.bindCollection=function(Q){var A=this,I,g=function(C,B){I=C.type+" "+B.id+":"+C.type,A.trigger(I,B)};Q.on("destroyed",A.onDestroyed.bind(A)),Q.on("shown hidden rested dir plain",g),Q.on("dir:up dir:right dir:down dir:left",g),Q.on("plain:up plain:right plain:down plain:left",g)};bI.prototype.bindDocument=function(){var Q=this;Q.binded||(Q.bindEvt(document,"move").bindEvt(document,"end"),Q.binded=!0)};bI.prototype.unbindDocument=function(Q){var A=this;(!Object.keys(A.ids).length||Q===!0)&&(A.unbindEvt(document,"move").unbindEvt(document,"end"),A.binded=!1)};bI.prototype.getIdentifier=function(Q){var A;return Q?(A=Q.identifier===void 0?Q.pointerId:Q.identifier,A===void 0&&(A=this.latest||0)):A=this.index,this.ids[A]===void 0&&(this.ids[A]=this.index,this.index+=1),this.latest=A,this.ids[A]};bI.prototype.removeIdentifier=function(Q){var A={};for(var I in this.ids)if(this.ids[I]===Q){A.id=I,A.identifier=this.ids[I],delete this.ids[I];break}return A};bI.prototype.onmove=function(Q){var A=this;return A.onAny("move",Q),!1};bI.prototype.onend=function(Q){var A=this;return A.onAny("end",Q),!1};bI.prototype.oncancel=function(Q){var A=this;return A.onAny("end",Q),!1};bI.prototype.onAny=function(Q,A){var I=this,g,C="processOn"+Q.charAt(0).toUpperCase()+Q.slice(1);A=lD(A);var B=function(E,t,e){e.ids.indexOf(t)>=0&&(e[C](E),E._found_=!0)},i=function(E){g=I.getIdentifier(E),Mt(I.collections,B.bind(null,E,g)),E._found_||I.removeIdentifier(g)};return Mt(A,i),!1};bI.prototype.destroy=function(){var Q=this;Q.unbindDocument(!0),Q.ids={},Q.index=0,Q.collections.forEach(function(A){A.destroy()}),Q.off()};bI.prototype.onDestroyed=function(Q,A){var I=this;if(I.collections.indexOf(A)<0)return!1;I.collections.splice(I.collections.indexOf(A),1)};const va=new bI,zh={create:function(Q){return va.create(Q)},factory:va};class $h{constructor(){aA(this,"hasSupport",!0);aA(this,"mobileGamepad");aA(this,"lastConnection",-1);aA(this,"connections",new Map);aA(this,"keyboardInput",new Map);let A=setInterval(()=>{this.hasSupport||clearInterval(A),this.connections.size>this.lastConnection&&this.scanGamePads()},200);window.addEventListener("gamepadconnected",({gamepad:I})=>this.connections.set(I.index,I.connected)),window.addEventListener("gamepaddisconnected",({gamepad:I})=>this.connections.delete(I.index)),window.addEventListener("keydown",({key:I})=>this.keyboardInput.set(I,!0)),window.addEventListener("keyup",({key:I})=>this.keyboardInput.set(I,!1)),ma()&&(this.mobileGamepad=zh.create({mode:"dynamic"}))}scanGamePads(){if(!!!navigator.getGamepads){console.warn("This browser doesn't support gamepads"),this.hasSupport=!1;return}this.lastConnection=navigator.getGamepads().length}getInputAtIndex(A){var v;ma()&&console.log((v=this.mobileGamepad)==null?void 0:v.get(0));const I=navigator.getGamepads()[A],g=this.connections.get(A)||!1,C=this.keyboardInput.get("ArrowUp")||!1,B=this.keyboardInput.get("ArrowDown")||!1,i=this.keyboardInput.get("ArrowLeft")||!1,E=this.keyboardInput.get("ArrowRight")||!1,t=this.keyboardInput.get("w")||!1,e=this.keyboardInput.get("a")||!1,s=this.keyboardInput.get("s")||!1,o=this.keyboardInput.get("d")||!1,a=this.keyboardInput.get("z")||!1,D=this.keyboardInput.get("x")||!1,h=this.keyboardInput.get("Enter")||!1,c=this.keyboardInput.get(" ")||!1;let r=E?1:i?-1:0,n=C?-1:B?1:0,S=a?1:0,G=D?1:0,l=e?1:0,k=s?1:0,N=t?1:0,p=o?1:0,F=h?1:0,y=c?1:0;if(!g||!I)return{horizontal:r,vertical:n,buttonA:S,buttonB:G,buttonX:l,buttonY:k,buttonW:N,buttonD:p,buttonSelect:F,buttonStart:y,moveUp:n<0?1:0,moveDown:n>0?1:0,moveRight:r>0?1:0,moveLeft:r<0?1:0};const[U,m]=I.axes;return r=Math.abs(U)>.1?U:r,n=Math.abs(m)>.1?m:n,S=I.buttons[0].value||S,G=I.buttons[1].value||G,l=I.buttons[2].value||l,k=I.buttons[3].value||k,F=I.buttons[8].value||F,y=I.buttons[9].value||y,{horizontal:r,vertical:n,buttonA:S,buttonB:G,buttonX:l,buttonY:k,buttonSelect:F,buttonStart:y,moveUp:n<0?1:0,moveDown:n>0?1:0,moveRight:r>0?1:0,moveLeft:r<0?1:0,buttonW:N,buttonD:p}}getInputs(){return[this.getInputAtIndex(0),this.getInputAtIndex(1)]}getDebugInfo(){const A=navigator.getGamepads();let I="";for(let g=0;g<A.length;g++){const C=A[g];C&&(I+=`
Gamepad ${g}: ${C.id} connected: ${C.connected}
`,I+=`
Axes: ${C.axes}
`,I+=`
Buttons: ${C.buttons}
`)}return I}}var pg;(function(Q){Q.FirstPerson="first-person",Q.ThirdPerson="third-person",Q.Isometric="isometric",Q.Flat2D="flat-2d",Q.Fixed2D="fixed-2d"})(pg||(pg={}));const Ar={id:"",perspective:pg.ThirdPerson,globals:{},stage:{},stages:{},debug:{}};window.__game__={};const AB=window.__game__.gameState=Ar,sE=(Q,A)=>{window.__game__.gameState[Q]=A};/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _E="151",Ir={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},gr={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},kD=0,Ut=1,MD=2,Cr=3,Br=0,he=1,UD=2,HB=3,$g=0,$I=1,qg=2,Qr=2,zg=0,VC=1,Kt=2,Nt=3,Jt=4,KD=5,OC=100,ND=101,JD=102,Ft=103,Rt=104,FD=200,RD=201,pD=202,dD=203,re=204,ce=205,qD=206,fD=207,uD=208,YD=209,LD=210,HD=0,mD=1,TD=2,NE=3,xD=4,bD=5,OD=6,vD=7,Ii=0,ZD=1,WD=2,fg=0,PD=1,_D=2,jD=3,VD=4,XD=5,jE=300,wC=301,GC=302,pQ=303,dQ=304,AQ=306,qQ=1e3,WI=1001,fQ=1002,JI=1003,JE=1004,ir=1004,UQ=1005,Er=1005,yI=1006,we=1007,or=1007,SC=1008,tr=1008,lC=1009,zD=1010,$D=1011,Ge=1012,An=1013,nC=1014,Xg=1015,ZB=1016,In=1017,gn=1018,XC=1020,Cn=1021,ag=1023,Bn=1024,Qn=1025,rC=1026,IB=1027,En=1028,on=1029,tn=1030,en=1031,an=1033,DE=33776,nE=33777,hE=33778,rE=33779,pt=35840,dt=35841,qt=35842,ft=35843,sn=36196,ut=37492,Yt=37496,Lt=37808,Ht=37809,mt=37810,Tt=37811,xt=37812,bt=37813,Ot=37814,vt=37815,Zt=37816,Wt=37817,Pt=37818,_t=37819,jt=37820,Vt=37821,cE=36492,Dn=36283,Xt=36284,zt=36285,$t=36286,nn=2200,hn=2201,rn=2202,uQ=2300,YQ=2301,wE=2302,ZC=2400,WC=2401,LQ=2402,VE=2500,Se=2501,er=0,ar=1,sr=2,yC=3e3,sI=3001,cn=3200,wn=3201,NC=0,Gn=1,Dr="",Sg="srgb",WB="srgb-linear",le="display-p3",nr=0,GE=7680,hr=7681,rr=7682,cr=7683,wr=34055,Gr=34056,Sr=5386,lr=512,yr=513,kr=514,Mr=515,Ur=516,Kr=517,Nr=518,Sn=519,HQ=35044,Jr=35048,Fr=35040,Rr=35045,pr=35049,dr=35041,qr=35046,fr=35050,ur=35042,Yr="100",Ae="300 es",FE=1035;class QC{addEventListener(A,I){this._listeners===void 0&&(this._listeners={});const g=this._listeners;g[A]===void 0&&(g[A]=[]),g[A].indexOf(I)===-1&&g[A].push(I)}hasEventListener(A,I){if(this._listeners===void 0)return!1;const g=this._listeners;return g[A]!==void 0&&g[A].indexOf(I)!==-1}removeEventListener(A,I){if(this._listeners===void 0)return;const C=this._listeners[A];if(C!==void 0){const B=C.indexOf(I);B!==-1&&C.splice(B,1)}}dispatchEvent(A){if(this._listeners===void 0)return;const g=this._listeners[A.type];if(g!==void 0){A.target=this;const C=g.slice(0);for(let B=0,i=C.length;B<i;B++)C[B].call(this,A);A.target=null}}}const vI=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Za=1234567;const zC=Math.PI/180,PB=180/Math.PI;function Dg(){const Q=Math.random()*4294967295|0,A=Math.random()*4294967295|0,I=Math.random()*4294967295|0,g=Math.random()*4294967295|0;return(vI[Q&255]+vI[Q>>8&255]+vI[Q>>16&255]+vI[Q>>24&255]+"-"+vI[A&255]+vI[A>>8&255]+"-"+vI[A>>16&15|64]+vI[A>>24&255]+"-"+vI[I&63|128]+vI[I>>8&255]+"-"+vI[I>>16&255]+vI[I>>24&255]+vI[g&255]+vI[g>>8&255]+vI[g>>16&255]+vI[g>>24&255]).toLowerCase()}function kI(Q,A,I){return Math.max(A,Math.min(I,Q))}function ye(Q,A){return(Q%A+A)%A}function Lr(Q,A,I,g,C){return g+(Q-A)*(C-g)/(I-A)}function Hr(Q,A,I){return Q!==A?(I-Q)/(A-Q):0}function KQ(Q,A,I){return(1-I)*Q+I*A}function mr(Q,A,I,g){return KQ(Q,A,1-Math.exp(-I*g))}function Tr(Q,A=1){return A-Math.abs(ye(Q,A*2)-A)}function xr(Q,A,I){return Q<=A?0:Q>=I?1:(Q=(Q-A)/(I-A),Q*Q*(3-2*Q))}function br(Q,A,I){return Q<=A?0:Q>=I?1:(Q=(Q-A)/(I-A),Q*Q*Q*(Q*(Q*6-15)+10))}function Or(Q,A){return Q+Math.floor(Math.random()*(A-Q+1))}function vr(Q,A){return Q+Math.random()*(A-Q)}function Zr(Q){return Q*(.5-Math.random())}function Wr(Q){Q!==void 0&&(Za=Q);let A=Za+=1831565813;return A=Math.imul(A^A>>>15,A|1),A^=A+Math.imul(A^A>>>7,A|61),((A^A>>>14)>>>0)/4294967296}function Pr(Q){return Q*zC}function _r(Q){return Q*PB}function Ie(Q){return(Q&Q-1)===0&&Q!==0}function ln(Q){return Math.pow(2,Math.ceil(Math.log(Q)/Math.LN2))}function yn(Q){return Math.pow(2,Math.floor(Math.log(Q)/Math.LN2))}function jr(Q,A,I,g,C){const B=Math.cos,i=Math.sin,E=B(I/2),t=i(I/2),e=B((A+g)/2),s=i((A+g)/2),o=B((A-g)/2),a=i((A-g)/2),D=B((g-A)/2),h=i((g-A)/2);switch(C){case"XYX":Q.set(E*s,t*o,t*a,E*e);break;case"YZY":Q.set(t*a,E*s,t*o,E*e);break;case"ZXZ":Q.set(t*o,t*a,E*s,E*e);break;case"XZX":Q.set(E*s,t*h,t*D,E*e);break;case"YXY":Q.set(t*D,E*s,t*h,E*e);break;case"ZYZ":Q.set(t*h,t*D,E*s,E*e);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+C)}}function sg(Q,A){switch(A.constructor){case Float32Array:return Q;case Uint16Array:return Q/65535;case Uint8Array:return Q/255;case Int16Array:return Math.max(Q/32767,-1);case Int8Array:return Math.max(Q/127,-1);default:throw new Error("Invalid component type.")}}function vA(Q,A){switch(A.constructor){case Float32Array:return Q;case Uint16Array:return Math.round(Q*65535);case Uint8Array:return Math.round(Q*255);case Int16Array:return Math.round(Q*32767);case Int8Array:return Math.round(Q*127);default:throw new Error("Invalid component type.")}}const Vr={DEG2RAD:zC,RAD2DEG:PB,generateUUID:Dg,clamp:kI,euclideanModulo:ye,mapLinear:Lr,inverseLerp:Hr,lerp:KQ,damp:mr,pingpong:Tr,smoothstep:xr,smootherstep:br,randInt:Or,randFloat:vr,randFloatSpread:Zr,seededRandom:Wr,degToRad:Pr,radToDeg:_r,isPowerOfTwo:Ie,ceilPowerOfTwo:ln,floorPowerOfTwo:yn,setQuaternionFromProperEuler:jr,normalize:vA,denormalize:sg};class z{constructor(A=0,I=0){z.prototype.isVector2=!0,this.x=A,this.y=I}get width(){return this.x}set width(A){this.x=A}get height(){return this.y}set height(A){this.y=A}set(A,I){return this.x=A,this.y=I,this}setScalar(A){return this.x=A,this.y=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setComponent(A,I){switch(A){case 0:this.x=I;break;case 1:this.y=I;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y)}copy(A){return this.x=A.x,this.y=A.y,this}add(A){return this.x+=A.x,this.y+=A.y,this}addScalar(A){return this.x+=A,this.y+=A,this}addVectors(A,I){return this.x=A.x+I.x,this.y=A.y+I.y,this}addScaledVector(A,I){return this.x+=A.x*I,this.y+=A.y*I,this}sub(A){return this.x-=A.x,this.y-=A.y,this}subScalar(A){return this.x-=A,this.y-=A,this}subVectors(A,I){return this.x=A.x-I.x,this.y=A.y-I.y,this}multiply(A){return this.x*=A.x,this.y*=A.y,this}multiplyScalar(A){return this.x*=A,this.y*=A,this}divide(A){return this.x/=A.x,this.y/=A.y,this}divideScalar(A){return this.multiplyScalar(1/A)}applyMatrix3(A){const I=this.x,g=this.y,C=A.elements;return this.x=C[0]*I+C[3]*g+C[6],this.y=C[1]*I+C[4]*g+C[7],this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this}clamp(A,I){return this.x=Math.max(A.x,Math.min(I.x,this.x)),this.y=Math.max(A.y,Math.min(I.y,this.y)),this}clampScalar(A,I){return this.x=Math.max(A,Math.min(I,this.x)),this.y=Math.max(A,Math.min(I,this.y)),this}clampLength(A,I){const g=this.length();return this.divideScalar(g||1).multiplyScalar(Math.max(A,Math.min(I,g)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(A){return this.x*A.x+this.y*A.y}cross(A){return this.x*A.y-this.y*A.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(A){const I=Math.sqrt(this.lengthSq()*A.lengthSq());if(I===0)return Math.PI/2;const g=this.dot(A)/I;return Math.acos(kI(g,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const I=this.x-A.x,g=this.y-A.y;return I*I+g*g}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,I){return this.x+=(A.x-this.x)*I,this.y+=(A.y-this.y)*I,this}lerpVectors(A,I,g){return this.x=A.x+(I.x-A.x)*g,this.y=A.y+(I.y-A.y)*g,this}equals(A){return A.x===this.x&&A.y===this.y}fromArray(A,I=0){return this.x=A[I],this.y=A[I+1],this}toArray(A=[],I=0){return A[I]=this.x,A[I+1]=this.y,A}fromBufferAttribute(A,I){return this.x=A.getX(I),this.y=A.getY(I),this}rotateAround(A,I){const g=Math.cos(I),C=Math.sin(I),B=this.x-A.x,i=this.y-A.y;return this.x=B*g-i*C+A.x,this.y=B*C+i*g+A.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class zA{constructor(){zA.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(A,I,g,C,B,i,E,t,e){const s=this.elements;return s[0]=A,s[1]=C,s[2]=E,s[3]=I,s[4]=B,s[5]=t,s[6]=g,s[7]=i,s[8]=e,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(A){const I=this.elements,g=A.elements;return I[0]=g[0],I[1]=g[1],I[2]=g[2],I[3]=g[3],I[4]=g[4],I[5]=g[5],I[6]=g[6],I[7]=g[7],I[8]=g[8],this}extractBasis(A,I,g){return A.setFromMatrix3Column(this,0),I.setFromMatrix3Column(this,1),g.setFromMatrix3Column(this,2),this}setFromMatrix4(A){const I=A.elements;return this.set(I[0],I[4],I[8],I[1],I[5],I[9],I[2],I[6],I[10]),this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,I){const g=A.elements,C=I.elements,B=this.elements,i=g[0],E=g[3],t=g[6],e=g[1],s=g[4],o=g[7],a=g[2],D=g[5],h=g[8],c=C[0],r=C[3],n=C[6],S=C[1],G=C[4],l=C[7],k=C[2],N=C[5],p=C[8];return B[0]=i*c+E*S+t*k,B[3]=i*r+E*G+t*N,B[6]=i*n+E*l+t*p,B[1]=e*c+s*S+o*k,B[4]=e*r+s*G+o*N,B[7]=e*n+s*l+o*p,B[2]=a*c+D*S+h*k,B[5]=a*r+D*G+h*N,B[8]=a*n+D*l+h*p,this}multiplyScalar(A){const I=this.elements;return I[0]*=A,I[3]*=A,I[6]*=A,I[1]*=A,I[4]*=A,I[7]*=A,I[2]*=A,I[5]*=A,I[8]*=A,this}determinant(){const A=this.elements,I=A[0],g=A[1],C=A[2],B=A[3],i=A[4],E=A[5],t=A[6],e=A[7],s=A[8];return I*i*s-I*E*e-g*B*s+g*E*t+C*B*e-C*i*t}invert(){const A=this.elements,I=A[0],g=A[1],C=A[2],B=A[3],i=A[4],E=A[5],t=A[6],e=A[7],s=A[8],o=s*i-E*e,a=E*t-s*B,D=e*B-i*t,h=I*o+g*a+C*D;if(h===0)return this.set(0,0,0,0,0,0,0,0,0);const c=1/h;return A[0]=o*c,A[1]=(C*e-s*g)*c,A[2]=(E*g-C*i)*c,A[3]=a*c,A[4]=(s*I-C*t)*c,A[5]=(C*B-E*I)*c,A[6]=D*c,A[7]=(g*t-e*I)*c,A[8]=(i*I-g*B)*c,this}transpose(){let A;const I=this.elements;return A=I[1],I[1]=I[3],I[3]=A,A=I[2],I[2]=I[6],I[6]=A,A=I[5],I[5]=I[7],I[7]=A,this}getNormalMatrix(A){return this.setFromMatrix4(A).invert().transpose()}transposeIntoArray(A){const I=this.elements;return A[0]=I[0],A[1]=I[3],A[2]=I[6],A[3]=I[1],A[4]=I[4],A[5]=I[7],A[6]=I[2],A[7]=I[5],A[8]=I[8],this}setUvTransform(A,I,g,C,B,i,E){const t=Math.cos(B),e=Math.sin(B);return this.set(g*t,g*e,-g*(t*i+e*E)+i+A,-C*e,C*t,-C*(-e*i+t*E)+E+I,0,0,1),this}scale(A,I){return this.premultiply(vo.makeScale(A,I)),this}rotate(A){return this.premultiply(vo.makeRotation(-A)),this}translate(A,I){return this.premultiply(vo.makeTranslation(A,I)),this}makeTranslation(A,I){return this.set(1,0,A,0,1,I,0,0,1),this}makeRotation(A){const I=Math.cos(A),g=Math.sin(A);return this.set(I,-g,0,g,I,0,0,0,1),this}makeScale(A,I){return this.set(A,0,0,0,I,0,0,0,1),this}equals(A){const I=this.elements,g=A.elements;for(let C=0;C<9;C++)if(I[C]!==g[C])return!1;return!0}fromArray(A,I=0){for(let g=0;g<9;g++)this.elements[g]=A[g+I];return this}toArray(A=[],I=0){const g=this.elements;return A[I]=g[0],A[I+1]=g[1],A[I+2]=g[2],A[I+3]=g[3],A[I+4]=g[4],A[I+5]=g[5],A[I+6]=g[6],A[I+7]=g[7],A[I+8]=g[8],A}clone(){return new this.constructor().fromArray(this.elements)}}const vo=new zA;function kn(Q){for(let A=Q.length-1;A>=0;--A)if(Q[A]>=65535)return!0;return!1}const Xr={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function mB(Q,A){return new Xr[Q](A)}function mQ(Q){return document.createElementNS("http://www.w3.org/1999/xhtml",Q)}function OB(Q){return Q<.04045?Q*.0773993808:Math.pow(Q*.9478672986+.0521327014,2.4)}function Zo(Q){return Q<.0031308?Q*12.92:1.055*Math.pow(Q,.41666)-.055}const zr=new zA().fromArray([.8224621,.0331941,.0170827,.177538,.9668058,.0723974,-1e-7,1e-7,.9105199]),$r=new zA().fromArray([1.2249401,-.0420569,-.0196376,-.2249404,1.0420571,-.0786361,1e-7,0,1.0982735]);function Ac(Q){return Q.convertSRGBToLinear().applyMatrix3($r)}function Ic(Q){return Q.applyMatrix3(zr).convertLinearToSRGB()}const gc={[WB]:Q=>Q,[Sg]:Q=>Q.convertSRGBToLinear(),[le]:Ac},Cc={[WB]:Q=>Q,[Sg]:Q=>Q.convertLinearToSRGB(),[le]:Ic},Ig={enabled:!1,get legacyMode(){return console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),!this.enabled},set legacyMode(Q){console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),this.enabled=!Q},get workingColorSpace(){return WB},set workingColorSpace(Q){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(Q,A,I){if(this.enabled===!1||A===I||!A||!I)return Q;const g=gc[A],C=Cc[I];if(g===void 0||C===void 0)throw new Error(`Unsupported color space conversion, "${A}" to "${I}".`);return C(g(Q))},fromWorkingColorSpace:function(Q,A){return this.convert(Q,this.workingColorSpace,A)},toWorkingColorSpace:function(Q,A){return this.convert(Q,A,this.workingColorSpace)}};let DB;class ke{static getDataURL(A){if(/^data:/i.test(A.src)||typeof HTMLCanvasElement>"u")return A.src;let I;if(A instanceof HTMLCanvasElement)I=A;else{DB===void 0&&(DB=mQ("canvas")),DB.width=A.width,DB.height=A.height;const g=DB.getContext("2d");A instanceof ImageData?g.putImageData(A,0,0):g.drawImage(A,0,0,A.width,A.height),I=DB}return I.width>2048||I.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",A),I.toDataURL("image/jpeg",.6)):I.toDataURL("image/png")}static sRGBToLinear(A){if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const I=mQ("canvas");I.width=A.width,I.height=A.height;const g=I.getContext("2d");g.drawImage(A,0,0,A.width,A.height);const C=g.getImageData(0,0,A.width,A.height),B=C.data;for(let i=0;i<B.length;i++)B[i]=OB(B[i]/255)*255;return g.putImageData(C,0,0),I}else if(A.data){const I=A.data.slice(0);for(let g=0;g<I.length;g++)I instanceof Uint8Array||I instanceof Uint8ClampedArray?I[g]=Math.floor(OB(I[g]/255)*255):I[g]=OB(I[g]);return{data:I,width:A.width,height:A.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),A}}class PC{constructor(A=null){this.isSource=!0,this.uuid=Dg(),this.data=A,this.version=0}set needsUpdate(A){A===!0&&this.version++}toJSON(A){const I=A===void 0||typeof A=="string";if(!I&&A.images[this.uuid]!==void 0)return A.images[this.uuid];const g={uuid:this.uuid,url:""},C=this.data;if(C!==null){let B;if(Array.isArray(C)){B=[];for(let i=0,E=C.length;i<E;i++)C[i].isDataTexture?B.push(Wo(C[i].image)):B.push(Wo(C[i]))}else B=Wo(C);g.url=B}return I||(A.images[this.uuid]=g),g}}function Wo(Q){return typeof HTMLImageElement<"u"&&Q instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&Q instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&Q instanceof ImageBitmap?ke.getDataURL(Q):Q.data?{data:Array.from(Q.data),width:Q.width,height:Q.height,type:Q.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Bc=0;class MI extends QC{constructor(A=MI.DEFAULT_IMAGE,I=MI.DEFAULT_MAPPING,g=WI,C=WI,B=yI,i=SC,E=ag,t=lC,e=MI.DEFAULT_ANISOTROPY,s=yC){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Bc++}),this.uuid=Dg(),this.name="",this.source=new PC(A),this.mipmaps=[],this.mapping=I,this.channel=0,this.wrapS=g,this.wrapT=C,this.magFilter=B,this.minFilter=i,this.anisotropy=e,this.format=E,this.internalFormat=null,this.type=t,this.offset=new z(0,0),this.repeat=new z(1,1),this.center=new z(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new zA,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=s,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(A=null){this.source.data=A}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(A){return this.name=A.name,this.source=A.source,this.mipmaps=A.mipmaps.slice(0),this.mapping=A.mapping,this.channel=A.channel,this.wrapS=A.wrapS,this.wrapT=A.wrapT,this.magFilter=A.magFilter,this.minFilter=A.minFilter,this.anisotropy=A.anisotropy,this.format=A.format,this.internalFormat=A.internalFormat,this.type=A.type,this.offset.copy(A.offset),this.repeat.copy(A.repeat),this.center.copy(A.center),this.rotation=A.rotation,this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrix.copy(A.matrix),this.generateMipmaps=A.generateMipmaps,this.premultiplyAlpha=A.premultiplyAlpha,this.flipY=A.flipY,this.unpackAlignment=A.unpackAlignment,this.encoding=A.encoding,this.userData=JSON.parse(JSON.stringify(A.userData)),this.needsUpdate=!0,this}toJSON(A){const I=A===void 0||typeof A=="string";if(!I&&A.textures[this.uuid]!==void 0)return A.textures[this.uuid];const g={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(A).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(g.userData=this.userData),I||(A.textures[this.uuid]=g),g}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(A){if(this.mapping!==jE)return A;if(A.applyMatrix3(this.matrix),A.x<0||A.x>1)switch(this.wrapS){case qQ:A.x=A.x-Math.floor(A.x);break;case WI:A.x=A.x<0?0:1;break;case fQ:Math.abs(Math.floor(A.x)%2)===1?A.x=Math.ceil(A.x)-A.x:A.x=A.x-Math.floor(A.x);break}if(A.y<0||A.y>1)switch(this.wrapT){case qQ:A.y=A.y-Math.floor(A.y);break;case WI:A.y=A.y<0?0:1;break;case fQ:Math.abs(Math.floor(A.y)%2)===1?A.y=Math.ceil(A.y)-A.y:A.y=A.y-Math.floor(A.y);break}return this.flipY&&(A.y=1-A.y),A}set needsUpdate(A){A===!0&&(this.version++,this.source.needsUpdate=!0)}}MI.DEFAULT_IMAGE=null;MI.DEFAULT_MAPPING=jE;MI.DEFAULT_ANISOTROPY=1;class EI{constructor(A=0,I=0,g=0,C=1){EI.prototype.isVector4=!0,this.x=A,this.y=I,this.z=g,this.w=C}get width(){return this.z}set width(A){this.z=A}get height(){return this.w}set height(A){this.w=A}set(A,I,g,C){return this.x=A,this.y=I,this.z=g,this.w=C,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this.w=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setW(A){return this.w=A,this}setComponent(A,I){switch(A){case 0:this.x=I;break;case 1:this.y=I;break;case 2:this.z=I;break;case 3:this.w=I;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this.w=A.w!==void 0?A.w:1,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this.w+=A.w,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this.w+=A,this}addVectors(A,I){return this.x=A.x+I.x,this.y=A.y+I.y,this.z=A.z+I.z,this.w=A.w+I.w,this}addScaledVector(A,I){return this.x+=A.x*I,this.y+=A.y*I,this.z+=A.z*I,this.w+=A.w*I,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this.w-=A.w,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this.w-=A,this}subVectors(A,I){return this.x=A.x-I.x,this.y=A.y-I.y,this.z=A.z-I.z,this.w=A.w-I.w,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this.w*=A.w,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this.w*=A,this}applyMatrix4(A){const I=this.x,g=this.y,C=this.z,B=this.w,i=A.elements;return this.x=i[0]*I+i[4]*g+i[8]*C+i[12]*B,this.y=i[1]*I+i[5]*g+i[9]*C+i[13]*B,this.z=i[2]*I+i[6]*g+i[10]*C+i[14]*B,this.w=i[3]*I+i[7]*g+i[11]*C+i[15]*B,this}divideScalar(A){return this.multiplyScalar(1/A)}setAxisAngleFromQuaternion(A){this.w=2*Math.acos(A.w);const I=Math.sqrt(1-A.w*A.w);return I<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=A.x/I,this.y=A.y/I,this.z=A.z/I),this}setAxisAngleFromRotationMatrix(A){let I,g,C,B;const t=A.elements,e=t[0],s=t[4],o=t[8],a=t[1],D=t[5],h=t[9],c=t[2],r=t[6],n=t[10];if(Math.abs(s-a)<.01&&Math.abs(o-c)<.01&&Math.abs(h-r)<.01){if(Math.abs(s+a)<.1&&Math.abs(o+c)<.1&&Math.abs(h+r)<.1&&Math.abs(e+D+n-3)<.1)return this.set(1,0,0,0),this;I=Math.PI;const G=(e+1)/2,l=(D+1)/2,k=(n+1)/2,N=(s+a)/4,p=(o+c)/4,F=(h+r)/4;return G>l&&G>k?G<.01?(g=0,C=.707106781,B=.707106781):(g=Math.sqrt(G),C=N/g,B=p/g):l>k?l<.01?(g=.707106781,C=0,B=.707106781):(C=Math.sqrt(l),g=N/C,B=F/C):k<.01?(g=.707106781,C=.707106781,B=0):(B=Math.sqrt(k),g=p/B,C=F/B),this.set(g,C,B,I),this}let S=Math.sqrt((r-h)*(r-h)+(o-c)*(o-c)+(a-s)*(a-s));return Math.abs(S)<.001&&(S=1),this.x=(r-h)/S,this.y=(o-c)/S,this.z=(a-s)/S,this.w=Math.acos((e+D+n-1)/2),this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this.w=Math.min(this.w,A.w),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this.w=Math.max(this.w,A.w),this}clamp(A,I){return this.x=Math.max(A.x,Math.min(I.x,this.x)),this.y=Math.max(A.y,Math.min(I.y,this.y)),this.z=Math.max(A.z,Math.min(I.z,this.z)),this.w=Math.max(A.w,Math.min(I.w,this.w)),this}clampScalar(A,I){return this.x=Math.max(A,Math.min(I,this.x)),this.y=Math.max(A,Math.min(I,this.y)),this.z=Math.max(A,Math.min(I,this.z)),this.w=Math.max(A,Math.min(I,this.w)),this}clampLength(A,I){const g=this.length();return this.divideScalar(g||1).multiplyScalar(Math.max(A,Math.min(I,g)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z+this.w*A.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,I){return this.x+=(A.x-this.x)*I,this.y+=(A.y-this.y)*I,this.z+=(A.z-this.z)*I,this.w+=(A.w-this.w)*I,this}lerpVectors(A,I,g){return this.x=A.x+(I.x-A.x)*g,this.y=A.y+(I.y-A.y)*g,this.z=A.z+(I.z-A.z)*g,this.w=A.w+(I.w-A.w)*g,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z&&A.w===this.w}fromArray(A,I=0){return this.x=A[I],this.y=A[I+1],this.z=A[I+2],this.w=A[I+3],this}toArray(A=[],I=0){return A[I]=this.x,A[I+1]=this.y,A[I+2]=this.z,A[I+3]=this.w,A}fromBufferAttribute(A,I){return this.x=A.getX(I),this.y=A.getY(I),this.z=A.getZ(I),this.w=A.getW(I),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ig extends QC{constructor(A=1,I=1,g={}){super(),this.isWebGLRenderTarget=!0,this.width=A,this.height=I,this.depth=1,this.scissor=new EI(0,0,A,I),this.scissorTest=!1,this.viewport=new EI(0,0,A,I);const C={width:A,height:I,depth:1};this.texture=new MI(C,g.mapping,g.wrapS,g.wrapT,g.magFilter,g.minFilter,g.format,g.type,g.anisotropy,g.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=g.generateMipmaps!==void 0?g.generateMipmaps:!1,this.texture.internalFormat=g.internalFormat!==void 0?g.internalFormat:null,this.texture.minFilter=g.minFilter!==void 0?g.minFilter:yI,this.depthBuffer=g.depthBuffer!==void 0?g.depthBuffer:!0,this.stencilBuffer=g.stencilBuffer!==void 0?g.stencilBuffer:!1,this.depthTexture=g.depthTexture!==void 0?g.depthTexture:null,this.samples=g.samples!==void 0?g.samples:0}setSize(A,I,g=1){(this.width!==A||this.height!==I||this.depth!==g)&&(this.width=A,this.height=I,this.depth=g,this.texture.image.width=A,this.texture.image.height=I,this.texture.image.depth=g,this.dispose()),this.viewport.set(0,0,A,I),this.scissor.set(0,0,A,I)}clone(){return new this.constructor().copy(this)}copy(A){this.width=A.width,this.height=A.height,this.depth=A.depth,this.viewport.copy(A.viewport),this.texture=A.texture.clone(),this.texture.isRenderTargetTexture=!0;const I=Object.assign({},A.texture.image);return this.texture.source=new PC(I),this.depthBuffer=A.depthBuffer,this.stencilBuffer=A.stencilBuffer,A.depthTexture!==null&&(this.depthTexture=A.depthTexture.clone()),this.samples=A.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class XE extends MI{constructor(A=null,I=1,g=1,C=1){super(null),this.isDataArrayTexture=!0,this.image={data:A,width:I,height:g,depth:C},this.magFilter=JI,this.minFilter=JI,this.wrapR=WI,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Qc extends ig{constructor(A=1,I=1,g=1){super(A,I),this.isWebGLArrayRenderTarget=!0,this.depth=g,this.texture=new XE(null,A,I,g),this.texture.isRenderTargetTexture=!0}}class Me extends MI{constructor(A=null,I=1,g=1,C=1){super(null),this.isData3DTexture=!0,this.image={data:A,width:I,height:g,depth:C},this.magFilter=JI,this.minFilter=JI,this.wrapR=WI,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ic extends ig{constructor(A=1,I=1,g=1){super(A,I),this.isWebGL3DRenderTarget=!0,this.depth=g,this.texture=new Me(null,A,I,g),this.texture.isRenderTargetTexture=!0}}class Ec extends ig{constructor(A=1,I=1,g=1,C={}){super(A,I,C),this.isWebGLMultipleRenderTargets=!0;const B=this.texture;this.texture=[];for(let i=0;i<g;i++)this.texture[i]=B.clone(),this.texture[i].isRenderTargetTexture=!0}setSize(A,I,g=1){if(this.width!==A||this.height!==I||this.depth!==g){this.width=A,this.height=I,this.depth=g;for(let C=0,B=this.texture.length;C<B;C++)this.texture[C].image.width=A,this.texture[C].image.height=I,this.texture[C].image.depth=g;this.dispose()}return this.viewport.set(0,0,A,I),this.scissor.set(0,0,A,I),this}copy(A){this.dispose(),this.width=A.width,this.height=A.height,this.depth=A.depth,this.viewport.set(0,0,this.width,this.height),this.scissor.set(0,0,this.width,this.height),this.depthBuffer=A.depthBuffer,this.stencilBuffer=A.stencilBuffer,A.depthTexture!==null&&(this.depthTexture=A.depthTexture.clone()),this.texture.length=0;for(let I=0,g=A.texture.length;I<g;I++)this.texture[I]=A.texture[I].clone(),this.texture[I].isRenderTargetTexture=!0;return this}}class Qg{constructor(A=0,I=0,g=0,C=1){this.isQuaternion=!0,this._x=A,this._y=I,this._z=g,this._w=C}static slerpFlat(A,I,g,C,B,i,E){let t=g[C+0],e=g[C+1],s=g[C+2],o=g[C+3];const a=B[i+0],D=B[i+1],h=B[i+2],c=B[i+3];if(E===0){A[I+0]=t,A[I+1]=e,A[I+2]=s,A[I+3]=o;return}if(E===1){A[I+0]=a,A[I+1]=D,A[I+2]=h,A[I+3]=c;return}if(o!==c||t!==a||e!==D||s!==h){let r=1-E;const n=t*a+e*D+s*h+o*c,S=n>=0?1:-1,G=1-n*n;if(G>Number.EPSILON){const k=Math.sqrt(G),N=Math.atan2(k,n*S);r=Math.sin(r*N)/k,E=Math.sin(E*N)/k}const l=E*S;if(t=t*r+a*l,e=e*r+D*l,s=s*r+h*l,o=o*r+c*l,r===1-E){const k=1/Math.sqrt(t*t+e*e+s*s+o*o);t*=k,e*=k,s*=k,o*=k}}A[I]=t,A[I+1]=e,A[I+2]=s,A[I+3]=o}static multiplyQuaternionsFlat(A,I,g,C,B,i){const E=g[C],t=g[C+1],e=g[C+2],s=g[C+3],o=B[i],a=B[i+1],D=B[i+2],h=B[i+3];return A[I]=E*h+s*o+t*D-e*a,A[I+1]=t*h+s*a+e*o-E*D,A[I+2]=e*h+s*D+E*a-t*o,A[I+3]=s*h-E*o-t*a-e*D,A}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get w(){return this._w}set w(A){this._w=A,this._onChangeCallback()}set(A,I,g,C){return this._x=A,this._y=I,this._z=g,this._w=C,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(A){return this._x=A.x,this._y=A.y,this._z=A.z,this._w=A.w,this._onChangeCallback(),this}setFromEuler(A,I){const g=A._x,C=A._y,B=A._z,i=A._order,E=Math.cos,t=Math.sin,e=E(g/2),s=E(C/2),o=E(B/2),a=t(g/2),D=t(C/2),h=t(B/2);switch(i){case"XYZ":this._x=a*s*o+e*D*h,this._y=e*D*o-a*s*h,this._z=e*s*h+a*D*o,this._w=e*s*o-a*D*h;break;case"YXZ":this._x=a*s*o+e*D*h,this._y=e*D*o-a*s*h,this._z=e*s*h-a*D*o,this._w=e*s*o+a*D*h;break;case"ZXY":this._x=a*s*o-e*D*h,this._y=e*D*o+a*s*h,this._z=e*s*h+a*D*o,this._w=e*s*o-a*D*h;break;case"ZYX":this._x=a*s*o-e*D*h,this._y=e*D*o+a*s*h,this._z=e*s*h-a*D*o,this._w=e*s*o+a*D*h;break;case"YZX":this._x=a*s*o+e*D*h,this._y=e*D*o+a*s*h,this._z=e*s*h-a*D*o,this._w=e*s*o-a*D*h;break;case"XZY":this._x=a*s*o-e*D*h,this._y=e*D*o-a*s*h,this._z=e*s*h+a*D*o,this._w=e*s*o+a*D*h;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+i)}return I!==!1&&this._onChangeCallback(),this}setFromAxisAngle(A,I){const g=I/2,C=Math.sin(g);return this._x=A.x*C,this._y=A.y*C,this._z=A.z*C,this._w=Math.cos(g),this._onChangeCallback(),this}setFromRotationMatrix(A){const I=A.elements,g=I[0],C=I[4],B=I[8],i=I[1],E=I[5],t=I[9],e=I[2],s=I[6],o=I[10],a=g+E+o;if(a>0){const D=.5/Math.sqrt(a+1);this._w=.25/D,this._x=(s-t)*D,this._y=(B-e)*D,this._z=(i-C)*D}else if(g>E&&g>o){const D=2*Math.sqrt(1+g-E-o);this._w=(s-t)/D,this._x=.25*D,this._y=(C+i)/D,this._z=(B+e)/D}else if(E>o){const D=2*Math.sqrt(1+E-g-o);this._w=(B-e)/D,this._x=(C+i)/D,this._y=.25*D,this._z=(t+s)/D}else{const D=2*Math.sqrt(1+o-g-E);this._w=(i-C)/D,this._x=(B+e)/D,this._y=(t+s)/D,this._z=.25*D}return this._onChangeCallback(),this}setFromUnitVectors(A,I){let g=A.dot(I)+1;return g<Number.EPSILON?(g=0,Math.abs(A.x)>Math.abs(A.z)?(this._x=-A.y,this._y=A.x,this._z=0,this._w=g):(this._x=0,this._y=-A.z,this._z=A.y,this._w=g)):(this._x=A.y*I.z-A.z*I.y,this._y=A.z*I.x-A.x*I.z,this._z=A.x*I.y-A.y*I.x,this._w=g),this.normalize()}angleTo(A){return 2*Math.acos(Math.abs(kI(this.dot(A),-1,1)))}rotateTowards(A,I){const g=this.angleTo(A);if(g===0)return this;const C=Math.min(1,I/g);return this.slerp(A,C),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(A){return this._x*A._x+this._y*A._y+this._z*A._z+this._w*A._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let A=this.length();return A===0?(this._x=0,this._y=0,this._z=0,this._w=1):(A=1/A,this._x=this._x*A,this._y=this._y*A,this._z=this._z*A,this._w=this._w*A),this._onChangeCallback(),this}multiply(A){return this.multiplyQuaternions(this,A)}premultiply(A){return this.multiplyQuaternions(A,this)}multiplyQuaternions(A,I){const g=A._x,C=A._y,B=A._z,i=A._w,E=I._x,t=I._y,e=I._z,s=I._w;return this._x=g*s+i*E+C*e-B*t,this._y=C*s+i*t+B*E-g*e,this._z=B*s+i*e+g*t-C*E,this._w=i*s-g*E-C*t-B*e,this._onChangeCallback(),this}slerp(A,I){if(I===0)return this;if(I===1)return this.copy(A);const g=this._x,C=this._y,B=this._z,i=this._w;let E=i*A._w+g*A._x+C*A._y+B*A._z;if(E<0?(this._w=-A._w,this._x=-A._x,this._y=-A._y,this._z=-A._z,E=-E):this.copy(A),E>=1)return this._w=i,this._x=g,this._y=C,this._z=B,this;const t=1-E*E;if(t<=Number.EPSILON){const D=1-I;return this._w=D*i+I*this._w,this._x=D*g+I*this._x,this._y=D*C+I*this._y,this._z=D*B+I*this._z,this.normalize(),this._onChangeCallback(),this}const e=Math.sqrt(t),s=Math.atan2(e,E),o=Math.sin((1-I)*s)/e,a=Math.sin(I*s)/e;return this._w=i*o+this._w*a,this._x=g*o+this._x*a,this._y=C*o+this._y*a,this._z=B*o+this._z*a,this._onChangeCallback(),this}slerpQuaternions(A,I,g){return this.copy(A).slerp(I,g)}random(){const A=Math.random(),I=Math.sqrt(1-A),g=Math.sqrt(A),C=2*Math.PI*Math.random(),B=2*Math.PI*Math.random();return this.set(I*Math.cos(C),g*Math.sin(B),g*Math.cos(B),I*Math.sin(C))}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._w===this._w}fromArray(A,I=0){return this._x=A[I],this._y=A[I+1],this._z=A[I+2],this._w=A[I+3],this._onChangeCallback(),this}toArray(A=[],I=0){return A[I]=this._x,A[I+1]=this._y,A[I+2]=this._z,A[I+3]=this._w,A}fromBufferAttribute(A,I){return this._x=A.getX(I),this._y=A.getY(I),this._z=A.getZ(I),this._w=A.getW(I),this}toJSON(){return this.toArray()}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class K{constructor(A=0,I=0,g=0){K.prototype.isVector3=!0,this.x=A,this.y=I,this.z=g}set(A,I,g){return g===void 0&&(g=this.z),this.x=A,this.y=I,this.z=g,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setComponent(A,I){switch(A){case 0:this.x=I;break;case 1:this.y=I;break;case 2:this.z=I;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this}addVectors(A,I){return this.x=A.x+I.x,this.y=A.y+I.y,this.z=A.z+I.z,this}addScaledVector(A,I){return this.x+=A.x*I,this.y+=A.y*I,this.z+=A.z*I,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this}subVectors(A,I){return this.x=A.x-I.x,this.y=A.y-I.y,this.z=A.z-I.z,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this}multiplyVectors(A,I){return this.x=A.x*I.x,this.y=A.y*I.y,this.z=A.z*I.z,this}applyEuler(A){return this.applyQuaternion(Wa.setFromEuler(A))}applyAxisAngle(A,I){return this.applyQuaternion(Wa.setFromAxisAngle(A,I))}applyMatrix3(A){const I=this.x,g=this.y,C=this.z,B=A.elements;return this.x=B[0]*I+B[3]*g+B[6]*C,this.y=B[1]*I+B[4]*g+B[7]*C,this.z=B[2]*I+B[5]*g+B[8]*C,this}applyNormalMatrix(A){return this.applyMatrix3(A).normalize()}applyMatrix4(A){const I=this.x,g=this.y,C=this.z,B=A.elements,i=1/(B[3]*I+B[7]*g+B[11]*C+B[15]);return this.x=(B[0]*I+B[4]*g+B[8]*C+B[12])*i,this.y=(B[1]*I+B[5]*g+B[9]*C+B[13])*i,this.z=(B[2]*I+B[6]*g+B[10]*C+B[14])*i,this}applyQuaternion(A){const I=this.x,g=this.y,C=this.z,B=A.x,i=A.y,E=A.z,t=A.w,e=t*I+i*C-E*g,s=t*g+E*I-B*C,o=t*C+B*g-i*I,a=-B*I-i*g-E*C;return this.x=e*t+a*-B+s*-E-o*-i,this.y=s*t+a*-i+o*-B-e*-E,this.z=o*t+a*-E+e*-i-s*-B,this}project(A){return this.applyMatrix4(A.matrixWorldInverse).applyMatrix4(A.projectionMatrix)}unproject(A){return this.applyMatrix4(A.projectionMatrixInverse).applyMatrix4(A.matrixWorld)}transformDirection(A){const I=this.x,g=this.y,C=this.z,B=A.elements;return this.x=B[0]*I+B[4]*g+B[8]*C,this.y=B[1]*I+B[5]*g+B[9]*C,this.z=B[2]*I+B[6]*g+B[10]*C,this.normalize()}divide(A){return this.x/=A.x,this.y/=A.y,this.z/=A.z,this}divideScalar(A){return this.multiplyScalar(1/A)}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this}clamp(A,I){return this.x=Math.max(A.x,Math.min(I.x,this.x)),this.y=Math.max(A.y,Math.min(I.y,this.y)),this.z=Math.max(A.z,Math.min(I.z,this.z)),this}clampScalar(A,I){return this.x=Math.max(A,Math.min(I,this.x)),this.y=Math.max(A,Math.min(I,this.y)),this.z=Math.max(A,Math.min(I,this.z)),this}clampLength(A,I){const g=this.length();return this.divideScalar(g||1).multiplyScalar(Math.max(A,Math.min(I,g)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,I){return this.x+=(A.x-this.x)*I,this.y+=(A.y-this.y)*I,this.z+=(A.z-this.z)*I,this}lerpVectors(A,I,g){return this.x=A.x+(I.x-A.x)*g,this.y=A.y+(I.y-A.y)*g,this.z=A.z+(I.z-A.z)*g,this}cross(A){return this.crossVectors(this,A)}crossVectors(A,I){const g=A.x,C=A.y,B=A.z,i=I.x,E=I.y,t=I.z;return this.x=C*t-B*E,this.y=B*i-g*t,this.z=g*E-C*i,this}projectOnVector(A){const I=A.lengthSq();if(I===0)return this.set(0,0,0);const g=A.dot(this)/I;return this.copy(A).multiplyScalar(g)}projectOnPlane(A){return Po.copy(this).projectOnVector(A),this.sub(Po)}reflect(A){return this.sub(Po.copy(A).multiplyScalar(2*this.dot(A)))}angleTo(A){const I=Math.sqrt(this.lengthSq()*A.lengthSq());if(I===0)return Math.PI/2;const g=this.dot(A)/I;return Math.acos(kI(g,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const I=this.x-A.x,g=this.y-A.y,C=this.z-A.z;return I*I+g*g+C*C}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)+Math.abs(this.z-A.z)}setFromSpherical(A){return this.setFromSphericalCoords(A.radius,A.phi,A.theta)}setFromSphericalCoords(A,I,g){const C=Math.sin(I)*A;return this.x=C*Math.sin(g),this.y=Math.cos(I)*A,this.z=C*Math.cos(g),this}setFromCylindrical(A){return this.setFromCylindricalCoords(A.radius,A.theta,A.y)}setFromCylindricalCoords(A,I,g){return this.x=A*Math.sin(I),this.y=g,this.z=A*Math.cos(I),this}setFromMatrixPosition(A){const I=A.elements;return this.x=I[12],this.y=I[13],this.z=I[14],this}setFromMatrixScale(A){const I=this.setFromMatrixColumn(A,0).length(),g=this.setFromMatrixColumn(A,1).length(),C=this.setFromMatrixColumn(A,2).length();return this.x=I,this.y=g,this.z=C,this}setFromMatrixColumn(A,I){return this.fromArray(A.elements,I*4)}setFromMatrix3Column(A,I){return this.fromArray(A.elements,I*3)}setFromEuler(A){return this.x=A._x,this.y=A._y,this.z=A._z,this}setFromColor(A){return this.x=A.r,this.y=A.g,this.z=A.b,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z}fromArray(A,I=0){return this.x=A[I],this.y=A[I+1],this.z=A[I+2],this}toArray(A=[],I=0){return A[I]=this.x,A[I+1]=this.y,A[I+2]=this.z,A}fromBufferAttribute(A,I){return this.x=A.getX(I),this.y=A.getY(I),this.z=A.getZ(I),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const A=(Math.random()-.5)*2,I=Math.random()*Math.PI*2,g=Math.sqrt(1-A**2);return this.x=g*Math.cos(I),this.y=g*Math.sin(I),this.z=A,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Po=new K,Wa=new Qg;class mg{constructor(A=new K(1/0,1/0,1/0),I=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=A,this.max=I}set(A,I){return this.min.copy(A),this.max.copy(I),this}setFromArray(A){this.makeEmpty();for(let I=0,g=A.length;I<g;I+=3)this.expandByPoint(vg.fromArray(A,I));return this}setFromBufferAttribute(A){this.makeEmpty();for(let I=0,g=A.count;I<g;I++)this.expandByPoint(vg.fromBufferAttribute(A,I));return this}setFromPoints(A){this.makeEmpty();for(let I=0,g=A.length;I<g;I++)this.expandByPoint(A[I]);return this}setFromCenterAndSize(A,I){const g=vg.copy(I).multiplyScalar(.5);return this.min.copy(A).sub(g),this.max.copy(A).add(g),this}setFromObject(A,I=!1){return this.makeEmpty(),this.expandByObject(A,I)}clone(){return new this.constructor().copy(this)}copy(A){return this.min.copy(A.min),this.max.copy(A.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(A){return this.isEmpty()?A.set(0,0,0):A.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(A){return this.isEmpty()?A.set(0,0,0):A.subVectors(this.max,this.min)}expandByPoint(A){return this.min.min(A),this.max.max(A),this}expandByVector(A){return this.min.sub(A),this.max.add(A),this}expandByScalar(A){return this.min.addScalar(-A),this.max.addScalar(A),this}expandByObject(A,I=!1){if(A.updateWorldMatrix(!1,!1),A.boundingBox!==void 0)A.boundingBox===null&&A.computeBoundingBox(),nB.copy(A.boundingBox),nB.applyMatrix4(A.matrixWorld),this.union(nB);else{const C=A.geometry;if(C!==void 0)if(I&&C.attributes!==void 0&&C.attributes.position!==void 0){const B=C.attributes.position;for(let i=0,E=B.count;i<E;i++)vg.fromBufferAttribute(B,i).applyMatrix4(A.matrixWorld),this.expandByPoint(vg)}else C.boundingBox===null&&C.computeBoundingBox(),nB.copy(C.boundingBox),nB.applyMatrix4(A.matrixWorld),this.union(nB)}const g=A.children;for(let C=0,B=g.length;C<B;C++)this.expandByObject(g[C],I);return this}containsPoint(A){return!(A.x<this.min.x||A.x>this.max.x||A.y<this.min.y||A.y>this.max.y||A.z<this.min.z||A.z>this.max.z)}containsBox(A){return this.min.x<=A.min.x&&A.max.x<=this.max.x&&this.min.y<=A.min.y&&A.max.y<=this.max.y&&this.min.z<=A.min.z&&A.max.z<=this.max.z}getParameter(A,I){return I.set((A.x-this.min.x)/(this.max.x-this.min.x),(A.y-this.min.y)/(this.max.y-this.min.y),(A.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(A){return!(A.max.x<this.min.x||A.min.x>this.max.x||A.max.y<this.min.y||A.min.y>this.max.y||A.max.z<this.min.z||A.min.z>this.max.z)}intersectsSphere(A){return this.clampPoint(A.center,vg),vg.distanceToSquared(A.center)<=A.radius*A.radius}intersectsPlane(A){let I,g;return A.normal.x>0?(I=A.normal.x*this.min.x,g=A.normal.x*this.max.x):(I=A.normal.x*this.max.x,g=A.normal.x*this.min.x),A.normal.y>0?(I+=A.normal.y*this.min.y,g+=A.normal.y*this.max.y):(I+=A.normal.y*this.max.y,g+=A.normal.y*this.min.y),A.normal.z>0?(I+=A.normal.z*this.min.z,g+=A.normal.z*this.max.z):(I+=A.normal.z*this.max.z,g+=A.normal.z*this.min.z),I<=-A.constant&&g>=-A.constant}intersectsTriangle(A){if(this.isEmpty())return!1;this.getCenter(sQ),yi.subVectors(this.max,sQ),hB.subVectors(A.a,sQ),rB.subVectors(A.b,sQ),cB.subVectors(A.c,sQ),oC.subVectors(rB,hB),tC.subVectors(cB,rB),qC.subVectors(hB,cB);let I=[0,-oC.z,oC.y,0,-tC.z,tC.y,0,-qC.z,qC.y,oC.z,0,-oC.x,tC.z,0,-tC.x,qC.z,0,-qC.x,-oC.y,oC.x,0,-tC.y,tC.x,0,-qC.y,qC.x,0];return!_o(I,hB,rB,cB,yi)||(I=[1,0,0,0,1,0,0,0,1],!_o(I,hB,rB,cB,yi))?!1:(ki.crossVectors(oC,tC),I=[ki.x,ki.y,ki.z],_o(I,hB,rB,cB,yi))}clampPoint(A,I){return I.copy(A).clamp(this.min,this.max)}distanceToPoint(A){return this.clampPoint(A,vg).distanceTo(A)}getBoundingSphere(A){return this.isEmpty()?A.makeEmpty():(this.getCenter(A.center),A.radius=this.getSize(vg).length()*.5),A}intersect(A){return this.min.max(A.min),this.max.min(A.max),this.isEmpty()&&this.makeEmpty(),this}union(A){return this.min.min(A.min),this.max.max(A.max),this}applyMatrix4(A){return this.isEmpty()?this:(Og[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(A),Og[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(A),Og[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(A),Og[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(A),Og[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(A),Og[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(A),Og[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(A),Og[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(A),this.setFromPoints(Og),this)}translate(A){return this.min.add(A),this.max.add(A),this}equals(A){return A.min.equals(this.min)&&A.max.equals(this.max)}}const Og=[new K,new K,new K,new K,new K,new K,new K,new K],vg=new K,nB=new mg,hB=new K,rB=new K,cB=new K,oC=new K,tC=new K,qC=new K,sQ=new K,yi=new K,ki=new K,fC=new K;function _o(Q,A,I,g,C){for(let B=0,i=Q.length-3;B<=i;B+=3){fC.fromArray(Q,B);const E=C.x*Math.abs(fC.x)+C.y*Math.abs(fC.y)+C.z*Math.abs(fC.z),t=A.dot(fC),e=I.dot(fC),s=g.dot(fC);if(Math.max(-Math.max(t,e,s),Math.min(t,e,s))>E)return!1}return!0}const oc=new mg,DQ=new K,jo=new K;class Tg{constructor(A=new K,I=-1){this.center=A,this.radius=I}set(A,I){return this.center.copy(A),this.radius=I,this}setFromPoints(A,I){const g=this.center;I!==void 0?g.copy(I):oc.setFromPoints(A).getCenter(g);let C=0;for(let B=0,i=A.length;B<i;B++)C=Math.max(C,g.distanceToSquared(A[B]));return this.radius=Math.sqrt(C),this}copy(A){return this.center.copy(A.center),this.radius=A.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(A){return A.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(A){return A.distanceTo(this.center)-this.radius}intersectsSphere(A){const I=this.radius+A.radius;return A.center.distanceToSquared(this.center)<=I*I}intersectsBox(A){return A.intersectsSphere(this)}intersectsPlane(A){return Math.abs(A.distanceToPoint(this.center))<=this.radius}clampPoint(A,I){const g=this.center.distanceToSquared(A);return I.copy(A),g>this.radius*this.radius&&(I.sub(this.center).normalize(),I.multiplyScalar(this.radius).add(this.center)),I}getBoundingBox(A){return this.isEmpty()?(A.makeEmpty(),A):(A.set(this.center,this.center),A.expandByScalar(this.radius),A)}applyMatrix4(A){return this.center.applyMatrix4(A),this.radius=this.radius*A.getMaxScaleOnAxis(),this}translate(A){return this.center.add(A),this}expandByPoint(A){if(this.isEmpty())return this.center.copy(A),this.radius=0,this;DQ.subVectors(A,this.center);const I=DQ.lengthSq();if(I>this.radius*this.radius){const g=Math.sqrt(I),C=(g-this.radius)*.5;this.center.addScaledVector(DQ,C/g),this.radius+=C}return this}union(A){return A.isEmpty()?this:this.isEmpty()?(this.copy(A),this):(this.center.equals(A.center)===!0?this.radius=Math.max(this.radius,A.radius):(jo.subVectors(A.center,this.center).setLength(A.radius),this.expandByPoint(DQ.copy(A.center).add(jo)),this.expandByPoint(DQ.copy(A.center).sub(jo))),this)}equals(A){return A.center.equals(this.center)&&A.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Zg=new K,Vo=new K,Mi=new K,eC=new K,Xo=new K,Ui=new K,zo=new K;class gi{constructor(A=new K,I=new K(0,0,-1)){this.origin=A,this.direction=I}set(A,I){return this.origin.copy(A),this.direction.copy(I),this}copy(A){return this.origin.copy(A.origin),this.direction.copy(A.direction),this}at(A,I){return I.copy(this.origin).addScaledVector(this.direction,A)}lookAt(A){return this.direction.copy(A).sub(this.origin).normalize(),this}recast(A){return this.origin.copy(this.at(A,Zg)),this}closestPointToPoint(A,I){I.subVectors(A,this.origin);const g=I.dot(this.direction);return g<0?I.copy(this.origin):I.copy(this.origin).addScaledVector(this.direction,g)}distanceToPoint(A){return Math.sqrt(this.distanceSqToPoint(A))}distanceSqToPoint(A){const I=Zg.subVectors(A,this.origin).dot(this.direction);return I<0?this.origin.distanceToSquared(A):(Zg.copy(this.origin).addScaledVector(this.direction,I),Zg.distanceToSquared(A))}distanceSqToSegment(A,I,g,C){Vo.copy(A).add(I).multiplyScalar(.5),Mi.copy(I).sub(A).normalize(),eC.copy(this.origin).sub(Vo);const B=A.distanceTo(I)*.5,i=-this.direction.dot(Mi),E=eC.dot(this.direction),t=-eC.dot(Mi),e=eC.lengthSq(),s=Math.abs(1-i*i);let o,a,D,h;if(s>0)if(o=i*t-E,a=i*E-t,h=B*s,o>=0)if(a>=-h)if(a<=h){const c=1/s;o*=c,a*=c,D=o*(o+i*a+2*E)+a*(i*o+a+2*t)+e}else a=B,o=Math.max(0,-(i*a+E)),D=-o*o+a*(a+2*t)+e;else a=-B,o=Math.max(0,-(i*a+E)),D=-o*o+a*(a+2*t)+e;else a<=-h?(o=Math.max(0,-(-i*B+E)),a=o>0?-B:Math.min(Math.max(-B,-t),B),D=-o*o+a*(a+2*t)+e):a<=h?(o=0,a=Math.min(Math.max(-B,-t),B),D=a*(a+2*t)+e):(o=Math.max(0,-(i*B+E)),a=o>0?B:Math.min(Math.max(-B,-t),B),D=-o*o+a*(a+2*t)+e);else a=i>0?-B:B,o=Math.max(0,-(i*a+E)),D=-o*o+a*(a+2*t)+e;return g&&g.copy(this.origin).addScaledVector(this.direction,o),C&&C.copy(Vo).addScaledVector(Mi,a),D}intersectSphere(A,I){Zg.subVectors(A.center,this.origin);const g=Zg.dot(this.direction),C=Zg.dot(Zg)-g*g,B=A.radius*A.radius;if(C>B)return null;const i=Math.sqrt(B-C),E=g-i,t=g+i;return t<0?null:E<0?this.at(t,I):this.at(E,I)}intersectsSphere(A){return this.distanceSqToPoint(A.center)<=A.radius*A.radius}distanceToPlane(A){const I=A.normal.dot(this.direction);if(I===0)return A.distanceToPoint(this.origin)===0?0:null;const g=-(this.origin.dot(A.normal)+A.constant)/I;return g>=0?g:null}intersectPlane(A,I){const g=this.distanceToPlane(A);return g===null?null:this.at(g,I)}intersectsPlane(A){const I=A.distanceToPoint(this.origin);return I===0||A.normal.dot(this.direction)*I<0}intersectBox(A,I){let g,C,B,i,E,t;const e=1/this.direction.x,s=1/this.direction.y,o=1/this.direction.z,a=this.origin;return e>=0?(g=(A.min.x-a.x)*e,C=(A.max.x-a.x)*e):(g=(A.max.x-a.x)*e,C=(A.min.x-a.x)*e),s>=0?(B=(A.min.y-a.y)*s,i=(A.max.y-a.y)*s):(B=(A.max.y-a.y)*s,i=(A.min.y-a.y)*s),g>i||B>C||((B>g||isNaN(g))&&(g=B),(i<C||isNaN(C))&&(C=i),o>=0?(E=(A.min.z-a.z)*o,t=(A.max.z-a.z)*o):(E=(A.max.z-a.z)*o,t=(A.min.z-a.z)*o),g>t||E>C)||((E>g||g!==g)&&(g=E),(t<C||C!==C)&&(C=t),C<0)?null:this.at(g>=0?g:C,I)}intersectsBox(A){return this.intersectBox(A,Zg)!==null}intersectTriangle(A,I,g,C,B){Xo.subVectors(I,A),Ui.subVectors(g,A),zo.crossVectors(Xo,Ui);let i=this.direction.dot(zo),E;if(i>0){if(C)return null;E=1}else if(i<0)E=-1,i=-i;else return null;eC.subVectors(this.origin,A);const t=E*this.direction.dot(Ui.crossVectors(eC,Ui));if(t<0)return null;const e=E*this.direction.dot(Xo.cross(eC));if(e<0||t+e>i)return null;const s=-E*eC.dot(zo);return s<0?null:this.at(s/i,B)}applyMatrix4(A){return this.origin.applyMatrix4(A),this.direction.transformDirection(A),this}equals(A){return A.origin.equals(this.origin)&&A.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class xA{constructor(){xA.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(A,I,g,C,B,i,E,t,e,s,o,a,D,h,c,r){const n=this.elements;return n[0]=A,n[4]=I,n[8]=g,n[12]=C,n[1]=B,n[5]=i,n[9]=E,n[13]=t,n[2]=e,n[6]=s,n[10]=o,n[14]=a,n[3]=D,n[7]=h,n[11]=c,n[15]=r,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new xA().fromArray(this.elements)}copy(A){const I=this.elements,g=A.elements;return I[0]=g[0],I[1]=g[1],I[2]=g[2],I[3]=g[3],I[4]=g[4],I[5]=g[5],I[6]=g[6],I[7]=g[7],I[8]=g[8],I[9]=g[9],I[10]=g[10],I[11]=g[11],I[12]=g[12],I[13]=g[13],I[14]=g[14],I[15]=g[15],this}copyPosition(A){const I=this.elements,g=A.elements;return I[12]=g[12],I[13]=g[13],I[14]=g[14],this}setFromMatrix3(A){const I=A.elements;return this.set(I[0],I[3],I[6],0,I[1],I[4],I[7],0,I[2],I[5],I[8],0,0,0,0,1),this}extractBasis(A,I,g){return A.setFromMatrixColumn(this,0),I.setFromMatrixColumn(this,1),g.setFromMatrixColumn(this,2),this}makeBasis(A,I,g){return this.set(A.x,I.x,g.x,0,A.y,I.y,g.y,0,A.z,I.z,g.z,0,0,0,0,1),this}extractRotation(A){const I=this.elements,g=A.elements,C=1/wB.setFromMatrixColumn(A,0).length(),B=1/wB.setFromMatrixColumn(A,1).length(),i=1/wB.setFromMatrixColumn(A,2).length();return I[0]=g[0]*C,I[1]=g[1]*C,I[2]=g[2]*C,I[3]=0,I[4]=g[4]*B,I[5]=g[5]*B,I[6]=g[6]*B,I[7]=0,I[8]=g[8]*i,I[9]=g[9]*i,I[10]=g[10]*i,I[11]=0,I[12]=0,I[13]=0,I[14]=0,I[15]=1,this}makeRotationFromEuler(A){const I=this.elements,g=A.x,C=A.y,B=A.z,i=Math.cos(g),E=Math.sin(g),t=Math.cos(C),e=Math.sin(C),s=Math.cos(B),o=Math.sin(B);if(A.order==="XYZ"){const a=i*s,D=i*o,h=E*s,c=E*o;I[0]=t*s,I[4]=-t*o,I[8]=e,I[1]=D+h*e,I[5]=a-c*e,I[9]=-E*t,I[2]=c-a*e,I[6]=h+D*e,I[10]=i*t}else if(A.order==="YXZ"){const a=t*s,D=t*o,h=e*s,c=e*o;I[0]=a+c*E,I[4]=h*E-D,I[8]=i*e,I[1]=i*o,I[5]=i*s,I[9]=-E,I[2]=D*E-h,I[6]=c+a*E,I[10]=i*t}else if(A.order==="ZXY"){const a=t*s,D=t*o,h=e*s,c=e*o;I[0]=a-c*E,I[4]=-i*o,I[8]=h+D*E,I[1]=D+h*E,I[5]=i*s,I[9]=c-a*E,I[2]=-i*e,I[6]=E,I[10]=i*t}else if(A.order==="ZYX"){const a=i*s,D=i*o,h=E*s,c=E*o;I[0]=t*s,I[4]=h*e-D,I[8]=a*e+c,I[1]=t*o,I[5]=c*e+a,I[9]=D*e-h,I[2]=-e,I[6]=E*t,I[10]=i*t}else if(A.order==="YZX"){const a=i*t,D=i*e,h=E*t,c=E*e;I[0]=t*s,I[4]=c-a*o,I[8]=h*o+D,I[1]=o,I[5]=i*s,I[9]=-E*s,I[2]=-e*s,I[6]=D*o+h,I[10]=a-c*o}else if(A.order==="XZY"){const a=i*t,D=i*e,h=E*t,c=E*e;I[0]=t*s,I[4]=-o,I[8]=e*s,I[1]=a*o+c,I[5]=i*s,I[9]=D*o-h,I[2]=h*o-D,I[6]=E*s,I[10]=c*o+a}return I[3]=0,I[7]=0,I[11]=0,I[12]=0,I[13]=0,I[14]=0,I[15]=1,this}makeRotationFromQuaternion(A){return this.compose(tc,A,ec)}lookAt(A,I,g){const C=this.elements;return og.subVectors(A,I),og.lengthSq()===0&&(og.z=1),og.normalize(),aC.crossVectors(g,og),aC.lengthSq()===0&&(Math.abs(g.z)===1?og.x+=1e-4:og.z+=1e-4,og.normalize(),aC.crossVectors(g,og)),aC.normalize(),Ki.crossVectors(og,aC),C[0]=aC.x,C[4]=Ki.x,C[8]=og.x,C[1]=aC.y,C[5]=Ki.y,C[9]=og.y,C[2]=aC.z,C[6]=Ki.z,C[10]=og.z,this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,I){const g=A.elements,C=I.elements,B=this.elements,i=g[0],E=g[4],t=g[8],e=g[12],s=g[1],o=g[5],a=g[9],D=g[13],h=g[2],c=g[6],r=g[10],n=g[14],S=g[3],G=g[7],l=g[11],k=g[15],N=C[0],p=C[4],F=C[8],y=C[12],U=C[1],m=C[5],v=C[9],u=C[13],Y=C[2],b=C[6],gA=C[10],QA=C[14],X=C[3],CA=C[7],oA=C[11],MA=C[15];return B[0]=i*N+E*U+t*Y+e*X,B[4]=i*p+E*m+t*b+e*CA,B[8]=i*F+E*v+t*gA+e*oA,B[12]=i*y+E*u+t*QA+e*MA,B[1]=s*N+o*U+a*Y+D*X,B[5]=s*p+o*m+a*b+D*CA,B[9]=s*F+o*v+a*gA+D*oA,B[13]=s*y+o*u+a*QA+D*MA,B[2]=h*N+c*U+r*Y+n*X,B[6]=h*p+c*m+r*b+n*CA,B[10]=h*F+c*v+r*gA+n*oA,B[14]=h*y+c*u+r*QA+n*MA,B[3]=S*N+G*U+l*Y+k*X,B[7]=S*p+G*m+l*b+k*CA,B[11]=S*F+G*v+l*gA+k*oA,B[15]=S*y+G*u+l*QA+k*MA,this}multiplyScalar(A){const I=this.elements;return I[0]*=A,I[4]*=A,I[8]*=A,I[12]*=A,I[1]*=A,I[5]*=A,I[9]*=A,I[13]*=A,I[2]*=A,I[6]*=A,I[10]*=A,I[14]*=A,I[3]*=A,I[7]*=A,I[11]*=A,I[15]*=A,this}determinant(){const A=this.elements,I=A[0],g=A[4],C=A[8],B=A[12],i=A[1],E=A[5],t=A[9],e=A[13],s=A[2],o=A[6],a=A[10],D=A[14],h=A[3],c=A[7],r=A[11],n=A[15];return h*(+B*t*o-C*e*o-B*E*a+g*e*a+C*E*D-g*t*D)+c*(+I*t*D-I*e*a+B*i*a-C*i*D+C*e*s-B*t*s)+r*(+I*e*o-I*E*D-B*i*o+g*i*D+B*E*s-g*e*s)+n*(-C*E*s-I*t*o+I*E*a+C*i*o-g*i*a+g*t*s)}transpose(){const A=this.elements;let I;return I=A[1],A[1]=A[4],A[4]=I,I=A[2],A[2]=A[8],A[8]=I,I=A[6],A[6]=A[9],A[9]=I,I=A[3],A[3]=A[12],A[12]=I,I=A[7],A[7]=A[13],A[13]=I,I=A[11],A[11]=A[14],A[14]=I,this}setPosition(A,I,g){const C=this.elements;return A.isVector3?(C[12]=A.x,C[13]=A.y,C[14]=A.z):(C[12]=A,C[13]=I,C[14]=g),this}invert(){const A=this.elements,I=A[0],g=A[1],C=A[2],B=A[3],i=A[4],E=A[5],t=A[6],e=A[7],s=A[8],o=A[9],a=A[10],D=A[11],h=A[12],c=A[13],r=A[14],n=A[15],S=o*r*e-c*a*e+c*t*D-E*r*D-o*t*n+E*a*n,G=h*a*e-s*r*e-h*t*D+i*r*D+s*t*n-i*a*n,l=s*c*e-h*o*e+h*E*D-i*c*D-s*E*n+i*o*n,k=h*o*t-s*c*t-h*E*a+i*c*a+s*E*r-i*o*r,N=I*S+g*G+C*l+B*k;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const p=1/N;return A[0]=S*p,A[1]=(c*a*B-o*r*B-c*C*D+g*r*D+o*C*n-g*a*n)*p,A[2]=(E*r*B-c*t*B+c*C*e-g*r*e-E*C*n+g*t*n)*p,A[3]=(o*t*B-E*a*B-o*C*e+g*a*e+E*C*D-g*t*D)*p,A[4]=G*p,A[5]=(s*r*B-h*a*B+h*C*D-I*r*D-s*C*n+I*a*n)*p,A[6]=(h*t*B-i*r*B-h*C*e+I*r*e+i*C*n-I*t*n)*p,A[7]=(i*a*B-s*t*B+s*C*e-I*a*e-i*C*D+I*t*D)*p,A[8]=l*p,A[9]=(h*o*B-s*c*B-h*g*D+I*c*D+s*g*n-I*o*n)*p,A[10]=(i*c*B-h*E*B+h*g*e-I*c*e-i*g*n+I*E*n)*p,A[11]=(s*E*B-i*o*B-s*g*e+I*o*e+i*g*D-I*E*D)*p,A[12]=k*p,A[13]=(s*c*C-h*o*C+h*g*a-I*c*a-s*g*r+I*o*r)*p,A[14]=(h*E*C-i*c*C-h*g*t+I*c*t+i*g*r-I*E*r)*p,A[15]=(i*o*C-s*E*C+s*g*t-I*o*t-i*g*a+I*E*a)*p,this}scale(A){const I=this.elements,g=A.x,C=A.y,B=A.z;return I[0]*=g,I[4]*=C,I[8]*=B,I[1]*=g,I[5]*=C,I[9]*=B,I[2]*=g,I[6]*=C,I[10]*=B,I[3]*=g,I[7]*=C,I[11]*=B,this}getMaxScaleOnAxis(){const A=this.elements,I=A[0]*A[0]+A[1]*A[1]+A[2]*A[2],g=A[4]*A[4]+A[5]*A[5]+A[6]*A[6],C=A[8]*A[8]+A[9]*A[9]+A[10]*A[10];return Math.sqrt(Math.max(I,g,C))}makeTranslation(A,I,g){return this.set(1,0,0,A,0,1,0,I,0,0,1,g,0,0,0,1),this}makeRotationX(A){const I=Math.cos(A),g=Math.sin(A);return this.set(1,0,0,0,0,I,-g,0,0,g,I,0,0,0,0,1),this}makeRotationY(A){const I=Math.cos(A),g=Math.sin(A);return this.set(I,0,g,0,0,1,0,0,-g,0,I,0,0,0,0,1),this}makeRotationZ(A){const I=Math.cos(A),g=Math.sin(A);return this.set(I,-g,0,0,g,I,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(A,I){const g=Math.cos(I),C=Math.sin(I),B=1-g,i=A.x,E=A.y,t=A.z,e=B*i,s=B*E;return this.set(e*i+g,e*E-C*t,e*t+C*E,0,e*E+C*t,s*E+g,s*t-C*i,0,e*t-C*E,s*t+C*i,B*t*t+g,0,0,0,0,1),this}makeScale(A,I,g){return this.set(A,0,0,0,0,I,0,0,0,0,g,0,0,0,0,1),this}makeShear(A,I,g,C,B,i){return this.set(1,g,B,0,A,1,i,0,I,C,1,0,0,0,0,1),this}compose(A,I,g){const C=this.elements,B=I._x,i=I._y,E=I._z,t=I._w,e=B+B,s=i+i,o=E+E,a=B*e,D=B*s,h=B*o,c=i*s,r=i*o,n=E*o,S=t*e,G=t*s,l=t*o,k=g.x,N=g.y,p=g.z;return C[0]=(1-(c+n))*k,C[1]=(D+l)*k,C[2]=(h-G)*k,C[3]=0,C[4]=(D-l)*N,C[5]=(1-(a+n))*N,C[6]=(r+S)*N,C[7]=0,C[8]=(h+G)*p,C[9]=(r-S)*p,C[10]=(1-(a+c))*p,C[11]=0,C[12]=A.x,C[13]=A.y,C[14]=A.z,C[15]=1,this}decompose(A,I,g){const C=this.elements;let B=wB.set(C[0],C[1],C[2]).length();const i=wB.set(C[4],C[5],C[6]).length(),E=wB.set(C[8],C[9],C[10]).length();this.determinant()<0&&(B=-B),A.x=C[12],A.y=C[13],A.z=C[14],kg.copy(this);const e=1/B,s=1/i,o=1/E;return kg.elements[0]*=e,kg.elements[1]*=e,kg.elements[2]*=e,kg.elements[4]*=s,kg.elements[5]*=s,kg.elements[6]*=s,kg.elements[8]*=o,kg.elements[9]*=o,kg.elements[10]*=o,I.setFromRotationMatrix(kg),g.x=B,g.y=i,g.z=E,this}makePerspective(A,I,g,C,B,i){const E=this.elements,t=2*B/(I-A),e=2*B/(g-C),s=(I+A)/(I-A),o=(g+C)/(g-C),a=-(i+B)/(i-B),D=-2*i*B/(i-B);return E[0]=t,E[4]=0,E[8]=s,E[12]=0,E[1]=0,E[5]=e,E[9]=o,E[13]=0,E[2]=0,E[6]=0,E[10]=a,E[14]=D,E[3]=0,E[7]=0,E[11]=-1,E[15]=0,this}makeOrthographic(A,I,g,C,B,i){const E=this.elements,t=1/(I-A),e=1/(g-C),s=1/(i-B),o=(I+A)*t,a=(g+C)*e,D=(i+B)*s;return E[0]=2*t,E[4]=0,E[8]=0,E[12]=-o,E[1]=0,E[5]=2*e,E[9]=0,E[13]=-a,E[2]=0,E[6]=0,E[10]=-2*s,E[14]=-D,E[3]=0,E[7]=0,E[11]=0,E[15]=1,this}equals(A){const I=this.elements,g=A.elements;for(let C=0;C<16;C++)if(I[C]!==g[C])return!1;return!0}fromArray(A,I=0){for(let g=0;g<16;g++)this.elements[g]=A[g+I];return this}toArray(A=[],I=0){const g=this.elements;return A[I]=g[0],A[I+1]=g[1],A[I+2]=g[2],A[I+3]=g[3],A[I+4]=g[4],A[I+5]=g[5],A[I+6]=g[6],A[I+7]=g[7],A[I+8]=g[8],A[I+9]=g[9],A[I+10]=g[10],A[I+11]=g[11],A[I+12]=g[12],A[I+13]=g[13],A[I+14]=g[14],A[I+15]=g[15],A}}const wB=new K,kg=new xA,tc=new K(0,0,0),ec=new K(1,1,1),aC=new K,Ki=new K,og=new K,Pa=new xA,_a=new Qg;class Ci{constructor(A=0,I=0,g=0,C=Ci.DEFAULT_ORDER){this.isEuler=!0,this._x=A,this._y=I,this._z=g,this._order=C}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get order(){return this._order}set order(A){this._order=A,this._onChangeCallback()}set(A,I,g,C=this._order){return this._x=A,this._y=I,this._z=g,this._order=C,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(A){return this._x=A._x,this._y=A._y,this._z=A._z,this._order=A._order,this._onChangeCallback(),this}setFromRotationMatrix(A,I=this._order,g=!0){const C=A.elements,B=C[0],i=C[4],E=C[8],t=C[1],e=C[5],s=C[9],o=C[2],a=C[6],D=C[10];switch(I){case"XYZ":this._y=Math.asin(kI(E,-1,1)),Math.abs(E)<.9999999?(this._x=Math.atan2(-s,D),this._z=Math.atan2(-i,B)):(this._x=Math.atan2(a,e),this._z=0);break;case"YXZ":this._x=Math.asin(-kI(s,-1,1)),Math.abs(s)<.9999999?(this._y=Math.atan2(E,D),this._z=Math.atan2(t,e)):(this._y=Math.atan2(-o,B),this._z=0);break;case"ZXY":this._x=Math.asin(kI(a,-1,1)),Math.abs(a)<.9999999?(this._y=Math.atan2(-o,D),this._z=Math.atan2(-i,e)):(this._y=0,this._z=Math.atan2(t,B));break;case"ZYX":this._y=Math.asin(-kI(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(a,D),this._z=Math.atan2(t,B)):(this._x=0,this._z=Math.atan2(-i,e));break;case"YZX":this._z=Math.asin(kI(t,-1,1)),Math.abs(t)<.9999999?(this._x=Math.atan2(-s,e),this._y=Math.atan2(-o,B)):(this._x=0,this._y=Math.atan2(E,D));break;case"XZY":this._z=Math.asin(-kI(i,-1,1)),Math.abs(i)<.9999999?(this._x=Math.atan2(a,e),this._y=Math.atan2(E,B)):(this._x=Math.atan2(-s,D),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+I)}return this._order=I,g===!0&&this._onChangeCallback(),this}setFromQuaternion(A,I,g){return Pa.makeRotationFromQuaternion(A),this.setFromRotationMatrix(Pa,I,g)}setFromVector3(A,I=this._order){return this.set(A.x,A.y,A.z,I)}reorder(A){return _a.setFromEuler(this),this.setFromQuaternion(_a,A)}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._order===this._order}fromArray(A){return this._x=A[0],this._y=A[1],this._z=A[2],A[3]!==void 0&&(this._order=A[3]),this._onChangeCallback(),this}toArray(A=[],I=0){return A[I]=this._x,A[I+1]=this._y,A[I+2]=this._z,A[I+3]=this._order,A}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ci.DEFAULT_ORDER="XYZ";class zE{constructor(){this.mask=1}set(A){this.mask=(1<<A|0)>>>0}enable(A){this.mask|=1<<A|0}enableAll(){this.mask=-1}toggle(A){this.mask^=1<<A|0}disable(A){this.mask&=~(1<<A|0)}disableAll(){this.mask=0}test(A){return(this.mask&A.mask)!==0}isEnabled(A){return(this.mask&(1<<A|0))!==0}}let ac=0;const ja=new K,GB=new Qg,Wg=new xA,Ni=new K,nQ=new K,sc=new K,Dc=new Qg,Va=new K(1,0,0),Xa=new K(0,1,0),za=new K(0,0,1),nc={type:"added"},$a={type:"removed"};class BI extends QC{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ac++}),this.uuid=Dg(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=BI.DEFAULT_UP.clone();const A=new K,I=new Ci,g=new Qg,C=new K(1,1,1);function B(){g.setFromEuler(I,!1)}function i(){I.setFromQuaternion(g,void 0,!1)}I._onChange(B),g._onChange(i),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:A},rotation:{configurable:!0,enumerable:!0,value:I},quaternion:{configurable:!0,enumerable:!0,value:g},scale:{configurable:!0,enumerable:!0,value:C},modelViewMatrix:{value:new xA},normalMatrix:{value:new zA}}),this.matrix=new xA,this.matrixWorld=new xA,this.matrixAutoUpdate=BI.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=BI.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.layers=new zE,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(A){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(A),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(A){return this.quaternion.premultiply(A),this}setRotationFromAxisAngle(A,I){this.quaternion.setFromAxisAngle(A,I)}setRotationFromEuler(A){this.quaternion.setFromEuler(A,!0)}setRotationFromMatrix(A){this.quaternion.setFromRotationMatrix(A)}setRotationFromQuaternion(A){this.quaternion.copy(A)}rotateOnAxis(A,I){return GB.setFromAxisAngle(A,I),this.quaternion.multiply(GB),this}rotateOnWorldAxis(A,I){return GB.setFromAxisAngle(A,I),this.quaternion.premultiply(GB),this}rotateX(A){return this.rotateOnAxis(Va,A)}rotateY(A){return this.rotateOnAxis(Xa,A)}rotateZ(A){return this.rotateOnAxis(za,A)}translateOnAxis(A,I){return ja.copy(A).applyQuaternion(this.quaternion),this.position.add(ja.multiplyScalar(I)),this}translateX(A){return this.translateOnAxis(Va,A)}translateY(A){return this.translateOnAxis(Xa,A)}translateZ(A){return this.translateOnAxis(za,A)}localToWorld(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(this.matrixWorld)}worldToLocal(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(Wg.copy(this.matrixWorld).invert())}lookAt(A,I,g){A.isVector3?Ni.copy(A):Ni.set(A,I,g);const C=this.parent;this.updateWorldMatrix(!0,!1),nQ.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Wg.lookAt(nQ,Ni,this.up):Wg.lookAt(Ni,nQ,this.up),this.quaternion.setFromRotationMatrix(Wg),C&&(Wg.extractRotation(C.matrixWorld),GB.setFromRotationMatrix(Wg),this.quaternion.premultiply(GB.invert()))}add(A){if(arguments.length>1){for(let I=0;I<arguments.length;I++)this.add(arguments[I]);return this}return A===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",A),this):(A&&A.isObject3D?(A.parent!==null&&A.parent.remove(A),A.parent=this,this.children.push(A),A.dispatchEvent(nc)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",A),this)}remove(A){if(arguments.length>1){for(let g=0;g<arguments.length;g++)this.remove(arguments[g]);return this}const I=this.children.indexOf(A);return I!==-1&&(A.parent=null,this.children.splice(I,1),A.dispatchEvent($a)),this}removeFromParent(){const A=this.parent;return A!==null&&A.remove(this),this}clear(){for(let A=0;A<this.children.length;A++){const I=this.children[A];I.parent=null,I.dispatchEvent($a)}return this.children.length=0,this}attach(A){return this.updateWorldMatrix(!0,!1),Wg.copy(this.matrixWorld).invert(),A.parent!==null&&(A.parent.updateWorldMatrix(!0,!1),Wg.multiply(A.parent.matrixWorld)),A.applyMatrix4(Wg),this.add(A),A.updateWorldMatrix(!1,!0),this}getObjectById(A){return this.getObjectByProperty("id",A)}getObjectByName(A){return this.getObjectByProperty("name",A)}getObjectByProperty(A,I){if(this[A]===I)return this;for(let g=0,C=this.children.length;g<C;g++){const i=this.children[g].getObjectByProperty(A,I);if(i!==void 0)return i}}getObjectsByProperty(A,I){let g=[];this[A]===I&&g.push(this);for(let C=0,B=this.children.length;C<B;C++){const i=this.children[C].getObjectsByProperty(A,I);i.length>0&&(g=g.concat(i))}return g}getWorldPosition(A){return this.updateWorldMatrix(!0,!1),A.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(nQ,A,sc),A}getWorldScale(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(nQ,Dc,A),A}getWorldDirection(A){this.updateWorldMatrix(!0,!1);const I=this.matrixWorld.elements;return A.set(I[8],I[9],I[10]).normalize()}raycast(){}traverse(A){A(this);const I=this.children;for(let g=0,C=I.length;g<C;g++)I[g].traverse(A)}traverseVisible(A){if(this.visible===!1)return;A(this);const I=this.children;for(let g=0,C=I.length;g<C;g++)I[g].traverseVisible(A)}traverseAncestors(A){const I=this.parent;I!==null&&(A(I),I.traverseAncestors(A))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(A){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||A)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,A=!0);const I=this.children;for(let g=0,C=I.length;g<C;g++){const B=I[g];(B.matrixWorldAutoUpdate===!0||A===!0)&&B.updateMatrixWorld(A)}}updateWorldMatrix(A,I){const g=this.parent;if(A===!0&&g!==null&&g.matrixWorldAutoUpdate===!0&&g.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),I===!0){const C=this.children;for(let B=0,i=C.length;B<i;B++){const E=C[B];E.matrixWorldAutoUpdate===!0&&E.updateWorldMatrix(!1,!0)}}}toJSON(A){const I=A===void 0||typeof A=="string",g={};I&&(A={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},g.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const C={};C.uuid=this.uuid,C.type=this.type,this.name!==""&&(C.name=this.name),this.castShadow===!0&&(C.castShadow=!0),this.receiveShadow===!0&&(C.receiveShadow=!0),this.visible===!1&&(C.visible=!1),this.frustumCulled===!1&&(C.frustumCulled=!1),this.renderOrder!==0&&(C.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(C.userData=this.userData),C.layers=this.layers.mask,C.matrix=this.matrix.toArray(),C.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(C.matrixAutoUpdate=!1),this.isInstancedMesh&&(C.type="InstancedMesh",C.count=this.count,C.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(C.instanceColor=this.instanceColor.toJSON()));function B(E,t){return E[t.uuid]===void 0&&(E[t.uuid]=t.toJSON(A)),t.uuid}if(this.isScene)this.background&&(this.background.isColor?C.background=this.background.toJSON():this.background.isTexture&&(C.background=this.background.toJSON(A).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(C.environment=this.environment.toJSON(A).uuid);else if(this.isMesh||this.isLine||this.isPoints){C.geometry=B(A.geometries,this.geometry);const E=this.geometry.parameters;if(E!==void 0&&E.shapes!==void 0){const t=E.shapes;if(Array.isArray(t))for(let e=0,s=t.length;e<s;e++){const o=t[e];B(A.shapes,o)}else B(A.shapes,t)}}if(this.isSkinnedMesh&&(C.bindMode=this.bindMode,C.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(B(A.skeletons,this.skeleton),C.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const E=[];for(let t=0,e=this.material.length;t<e;t++)E.push(B(A.materials,this.material[t]));C.material=E}else C.material=B(A.materials,this.material);if(this.children.length>0){C.children=[];for(let E=0;E<this.children.length;E++)C.children.push(this.children[E].toJSON(A).object)}if(this.animations.length>0){C.animations=[];for(let E=0;E<this.animations.length;E++){const t=this.animations[E];C.animations.push(B(A.animations,t))}}if(I){const E=i(A.geometries),t=i(A.materials),e=i(A.textures),s=i(A.images),o=i(A.shapes),a=i(A.skeletons),D=i(A.animations),h=i(A.nodes);E.length>0&&(g.geometries=E),t.length>0&&(g.materials=t),e.length>0&&(g.textures=e),s.length>0&&(g.images=s),o.length>0&&(g.shapes=o),a.length>0&&(g.skeletons=a),D.length>0&&(g.animations=D),h.length>0&&(g.nodes=h)}return g.object=C,g;function i(E){const t=[];for(const e in E){const s=E[e];delete s.metadata,t.push(s)}return t}}clone(A){return new this.constructor().copy(this,A)}copy(A,I=!0){if(this.name=A.name,this.up.copy(A.up),this.position.copy(A.position),this.rotation.order=A.rotation.order,this.quaternion.copy(A.quaternion),this.scale.copy(A.scale),this.matrix.copy(A.matrix),this.matrixWorld.copy(A.matrixWorld),this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrixWorldNeedsUpdate=A.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=A.matrixWorldAutoUpdate,this.layers.mask=A.layers.mask,this.visible=A.visible,this.castShadow=A.castShadow,this.receiveShadow=A.receiveShadow,this.frustumCulled=A.frustumCulled,this.renderOrder=A.renderOrder,this.userData=JSON.parse(JSON.stringify(A.userData)),I===!0)for(let g=0;g<A.children.length;g++){const C=A.children[g];this.add(C.clone())}return this}}BI.DEFAULT_UP=new K(0,1,0);BI.DEFAULT_MATRIX_AUTO_UPDATE=!0;BI.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Mg=new K,Pg=new K,$o=new K,_g=new K,SB=new K,lB=new K,As=new K,At=new K,It=new K,gt=new K;let Ji=!1;class Bg{constructor(A=new K,I=new K,g=new K){this.a=A,this.b=I,this.c=g}static getNormal(A,I,g,C){C.subVectors(g,I),Mg.subVectors(A,I),C.cross(Mg);const B=C.lengthSq();return B>0?C.multiplyScalar(1/Math.sqrt(B)):C.set(0,0,0)}static getBarycoord(A,I,g,C,B){Mg.subVectors(C,I),Pg.subVectors(g,I),$o.subVectors(A,I);const i=Mg.dot(Mg),E=Mg.dot(Pg),t=Mg.dot($o),e=Pg.dot(Pg),s=Pg.dot($o),o=i*e-E*E;if(o===0)return B.set(-2,-1,-1);const a=1/o,D=(e*t-E*s)*a,h=(i*s-E*t)*a;return B.set(1-D-h,h,D)}static containsPoint(A,I,g,C){return this.getBarycoord(A,I,g,C,_g),_g.x>=0&&_g.y>=0&&_g.x+_g.y<=1}static getUV(A,I,g,C,B,i,E,t){return Ji===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ji=!0),this.getInterpolation(A,I,g,C,B,i,E,t)}static getInterpolation(A,I,g,C,B,i,E,t){return this.getBarycoord(A,I,g,C,_g),t.setScalar(0),t.addScaledVector(B,_g.x),t.addScaledVector(i,_g.y),t.addScaledVector(E,_g.z),t}static isFrontFacing(A,I,g,C){return Mg.subVectors(g,I),Pg.subVectors(A,I),Mg.cross(Pg).dot(C)<0}set(A,I,g){return this.a.copy(A),this.b.copy(I),this.c.copy(g),this}setFromPointsAndIndices(A,I,g,C){return this.a.copy(A[I]),this.b.copy(A[g]),this.c.copy(A[C]),this}setFromAttributeAndIndices(A,I,g,C){return this.a.fromBufferAttribute(A,I),this.b.fromBufferAttribute(A,g),this.c.fromBufferAttribute(A,C),this}clone(){return new this.constructor().copy(this)}copy(A){return this.a.copy(A.a),this.b.copy(A.b),this.c.copy(A.c),this}getArea(){return Mg.subVectors(this.c,this.b),Pg.subVectors(this.a,this.b),Mg.cross(Pg).length()*.5}getMidpoint(A){return A.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(A){return Bg.getNormal(this.a,this.b,this.c,A)}getPlane(A){return A.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(A,I){return Bg.getBarycoord(A,this.a,this.b,this.c,I)}getUV(A,I,g,C,B){return Ji===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Ji=!0),Bg.getInterpolation(A,this.a,this.b,this.c,I,g,C,B)}getInterpolation(A,I,g,C,B){return Bg.getInterpolation(A,this.a,this.b,this.c,I,g,C,B)}containsPoint(A){return Bg.containsPoint(A,this.a,this.b,this.c)}isFrontFacing(A){return Bg.isFrontFacing(this.a,this.b,this.c,A)}intersectsBox(A){return A.intersectsTriangle(this)}closestPointToPoint(A,I){const g=this.a,C=this.b,B=this.c;let i,E;SB.subVectors(C,g),lB.subVectors(B,g),At.subVectors(A,g);const t=SB.dot(At),e=lB.dot(At);if(t<=0&&e<=0)return I.copy(g);It.subVectors(A,C);const s=SB.dot(It),o=lB.dot(It);if(s>=0&&o<=s)return I.copy(C);const a=t*o-s*e;if(a<=0&&t>=0&&s<=0)return i=t/(t-s),I.copy(g).addScaledVector(SB,i);gt.subVectors(A,B);const D=SB.dot(gt),h=lB.dot(gt);if(h>=0&&D<=h)return I.copy(B);const c=D*e-t*h;if(c<=0&&e>=0&&h<=0)return E=e/(e-h),I.copy(g).addScaledVector(lB,E);const r=s*h-D*o;if(r<=0&&o-s>=0&&D-h>=0)return As.subVectors(B,C),E=(o-s)/(o-s+(D-h)),I.copy(C).addScaledVector(As,E);const n=1/(r+c+a);return i=c*n,E=a*n,I.copy(g).addScaledVector(SB,i).addScaledVector(lB,E)}equals(A){return A.a.equals(this.a)&&A.b.equals(this.b)&&A.c.equals(this.c)}}let hc=0;class PI extends QC{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:hc++}),this.uuid=Dg(),this.name="",this.type="Material",this.blending=VC,this.side=$g,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=re,this.blendDst=ce,this.blendEquation=OC,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=NE,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sn,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=GE,this.stencilZFail=GE,this.stencilZPass=GE,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(A){this._alphaTest>0!=A>0&&this.version++,this._alphaTest=A}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(A){if(A!==void 0)for(const I in A){const g=A[I];if(g===void 0){console.warn(`THREE.Material: parameter '${I}' has value of undefined.`);continue}const C=this[I];if(C===void 0){console.warn(`THREE.Material: '${I}' is not a property of THREE.${this.type}.`);continue}C&&C.isColor?C.set(g):C&&C.isVector3&&g&&g.isVector3?C.copy(g):this[I]=g}}toJSON(A){const I=A===void 0||typeof A=="string";I&&(A={textures:{},images:{}});const g={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};g.uuid=this.uuid,g.type=this.type,this.name!==""&&(g.name=this.name),this.color&&this.color.isColor&&(g.color=this.color.getHex()),this.roughness!==void 0&&(g.roughness=this.roughness),this.metalness!==void 0&&(g.metalness=this.metalness),this.sheen!==void 0&&(g.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(g.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(g.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(g.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(g.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(g.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(g.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(g.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(g.shininess=this.shininess),this.clearcoat!==void 0&&(g.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(g.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(g.clearcoatMap=this.clearcoatMap.toJSON(A).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(g.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(A).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(g.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(A).uuid,g.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(g.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(g.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(g.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(g.iridescenceMap=this.iridescenceMap.toJSON(A).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(g.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(A).uuid),this.map&&this.map.isTexture&&(g.map=this.map.toJSON(A).uuid),this.matcap&&this.matcap.isTexture&&(g.matcap=this.matcap.toJSON(A).uuid),this.alphaMap&&this.alphaMap.isTexture&&(g.alphaMap=this.alphaMap.toJSON(A).uuid),this.lightMap&&this.lightMap.isTexture&&(g.lightMap=this.lightMap.toJSON(A).uuid,g.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(g.aoMap=this.aoMap.toJSON(A).uuid,g.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(g.bumpMap=this.bumpMap.toJSON(A).uuid,g.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(g.normalMap=this.normalMap.toJSON(A).uuid,g.normalMapType=this.normalMapType,g.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(g.displacementMap=this.displacementMap.toJSON(A).uuid,g.displacementScale=this.displacementScale,g.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(g.roughnessMap=this.roughnessMap.toJSON(A).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(g.metalnessMap=this.metalnessMap.toJSON(A).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(g.emissiveMap=this.emissiveMap.toJSON(A).uuid),this.specularMap&&this.specularMap.isTexture&&(g.specularMap=this.specularMap.toJSON(A).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(g.specularIntensityMap=this.specularIntensityMap.toJSON(A).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(g.specularColorMap=this.specularColorMap.toJSON(A).uuid),this.envMap&&this.envMap.isTexture&&(g.envMap=this.envMap.toJSON(A).uuid,this.combine!==void 0&&(g.combine=this.combine)),this.envMapIntensity!==void 0&&(g.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(g.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(g.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(g.gradientMap=this.gradientMap.toJSON(A).uuid),this.transmission!==void 0&&(g.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(g.transmissionMap=this.transmissionMap.toJSON(A).uuid),this.thickness!==void 0&&(g.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(g.thicknessMap=this.thicknessMap.toJSON(A).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(g.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(g.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(g.size=this.size),this.shadowSide!==null&&(g.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(g.sizeAttenuation=this.sizeAttenuation),this.blending!==VC&&(g.blending=this.blending),this.side!==$g&&(g.side=this.side),this.vertexColors&&(g.vertexColors=!0),this.opacity<1&&(g.opacity=this.opacity),this.transparent===!0&&(g.transparent=this.transparent),g.depthFunc=this.depthFunc,g.depthTest=this.depthTest,g.depthWrite=this.depthWrite,g.colorWrite=this.colorWrite,g.stencilWrite=this.stencilWrite,g.stencilWriteMask=this.stencilWriteMask,g.stencilFunc=this.stencilFunc,g.stencilRef=this.stencilRef,g.stencilFuncMask=this.stencilFuncMask,g.stencilFail=this.stencilFail,g.stencilZFail=this.stencilZFail,g.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(g.rotation=this.rotation),this.polygonOffset===!0&&(g.polygonOffset=!0),this.polygonOffsetFactor!==0&&(g.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(g.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(g.linewidth=this.linewidth),this.dashSize!==void 0&&(g.dashSize=this.dashSize),this.gapSize!==void 0&&(g.gapSize=this.gapSize),this.scale!==void 0&&(g.scale=this.scale),this.dithering===!0&&(g.dithering=!0),this.alphaTest>0&&(g.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(g.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(g.premultipliedAlpha=this.premultipliedAlpha),this.forceSinglePass===!0&&(g.forceSinglePass=this.forceSinglePass),this.wireframe===!0&&(g.wireframe=this.wireframe),this.wireframeLinewidth>1&&(g.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(g.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(g.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(g.flatShading=this.flatShading),this.visible===!1&&(g.visible=!1),this.toneMapped===!1&&(g.toneMapped=!1),this.fog===!1&&(g.fog=!1),Object.keys(this.userData).length>0&&(g.userData=this.userData);function C(B){const i=[];for(const E in B){const t=B[E];delete t.metadata,i.push(t)}return i}if(I){const B=C(A.textures),i=C(A.images);B.length>0&&(g.textures=B),i.length>0&&(g.images=i)}return g}clone(){return new this.constructor().copy(this)}copy(A){this.name=A.name,this.blending=A.blending,this.side=A.side,this.vertexColors=A.vertexColors,this.opacity=A.opacity,this.transparent=A.transparent,this.blendSrc=A.blendSrc,this.blendDst=A.blendDst,this.blendEquation=A.blendEquation,this.blendSrcAlpha=A.blendSrcAlpha,this.blendDstAlpha=A.blendDstAlpha,this.blendEquationAlpha=A.blendEquationAlpha,this.depthFunc=A.depthFunc,this.depthTest=A.depthTest,this.depthWrite=A.depthWrite,this.stencilWriteMask=A.stencilWriteMask,this.stencilFunc=A.stencilFunc,this.stencilRef=A.stencilRef,this.stencilFuncMask=A.stencilFuncMask,this.stencilFail=A.stencilFail,this.stencilZFail=A.stencilZFail,this.stencilZPass=A.stencilZPass,this.stencilWrite=A.stencilWrite;const I=A.clippingPlanes;let g=null;if(I!==null){const C=I.length;g=new Array(C);for(let B=0;B!==C;++B)g[B]=I[B].clone()}return this.clippingPlanes=g,this.clipIntersection=A.clipIntersection,this.clipShadows=A.clipShadows,this.shadowSide=A.shadowSide,this.colorWrite=A.colorWrite,this.precision=A.precision,this.polygonOffset=A.polygonOffset,this.polygonOffsetFactor=A.polygonOffsetFactor,this.polygonOffsetUnits=A.polygonOffsetUnits,this.dithering=A.dithering,this.alphaTest=A.alphaTest,this.alphaToCoverage=A.alphaToCoverage,this.premultipliedAlpha=A.premultipliedAlpha,this.forceSinglePass=A.forceSinglePass,this.visible=A.visible,this.toneMapped=A.toneMapped,this.userData=JSON.parse(JSON.stringify(A.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(A){A===!0&&this.version++}}const Mn={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ug={h:0,s:0,l:0},Fi={h:0,s:0,l:0};function Ct(Q,A,I){return I<0&&(I+=1),I>1&&(I-=1),I<1/6?Q+(A-Q)*6*I:I<1/2?A:I<2/3?Q+(A-Q)*6*(2/3-I):Q}class cA{constructor(A,I,g){return this.isColor=!0,this.r=1,this.g=1,this.b=1,I===void 0&&g===void 0?this.set(A):this.setRGB(A,I,g)}set(A){return A&&A.isColor?this.copy(A):typeof A=="number"?this.setHex(A):typeof A=="string"&&this.setStyle(A),this}setScalar(A){return this.r=A,this.g=A,this.b=A,this}setHex(A,I=Sg){return A=Math.floor(A),this.r=(A>>16&255)/255,this.g=(A>>8&255)/255,this.b=(A&255)/255,Ig.toWorkingColorSpace(this,I),this}setRGB(A,I,g,C=Ig.workingColorSpace){return this.r=A,this.g=I,this.b=g,Ig.toWorkingColorSpace(this,C),this}setHSL(A,I,g,C=Ig.workingColorSpace){if(A=ye(A,1),I=kI(I,0,1),g=kI(g,0,1),I===0)this.r=this.g=this.b=g;else{const B=g<=.5?g*(1+I):g+I-g*I,i=2*g-B;this.r=Ct(i,B,A+1/3),this.g=Ct(i,B,A),this.b=Ct(i,B,A-1/3)}return Ig.toWorkingColorSpace(this,C),this}setStyle(A,I=Sg){function g(B){B!==void 0&&parseFloat(B)<1&&console.warn("THREE.Color: Alpha component of "+A+" will be ignored.")}let C;if(C=/^(\w+)\(([^\)]*)\)/.exec(A)){let B;const i=C[1],E=C[2];switch(i){case"rgb":case"rgba":if(B=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(E))return this.r=Math.min(255,parseInt(B[1],10))/255,this.g=Math.min(255,parseInt(B[2],10))/255,this.b=Math.min(255,parseInt(B[3],10))/255,Ig.toWorkingColorSpace(this,I),g(B[4]),this;if(B=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(E))return this.r=Math.min(100,parseInt(B[1],10))/100,this.g=Math.min(100,parseInt(B[2],10))/100,this.b=Math.min(100,parseInt(B[3],10))/100,Ig.toWorkingColorSpace(this,I),g(B[4]),this;break;case"hsl":case"hsla":if(B=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(E)){const t=parseFloat(B[1])/360,e=parseFloat(B[2])/100,s=parseFloat(B[3])/100;return g(B[4]),this.setHSL(t,e,s,I)}break;default:console.warn("THREE.Color: Unknown color model "+A)}}else if(C=/^\#([A-Fa-f\d]+)$/.exec(A)){const B=C[1],i=B.length;if(i===3)return this.setRGB(parseInt(B.charAt(0),16)/15,parseInt(B.charAt(1),16)/15,parseInt(B.charAt(2),16)/15,I);if(i===6)return this.setHex(parseInt(B,16),I);console.warn("THREE.Color: Invalid hex color "+A)}else if(A&&A.length>0)return this.setColorName(A,I);return this}setColorName(A,I=Sg){const g=Mn[A.toLowerCase()];return g!==void 0?this.setHex(g,I):console.warn("THREE.Color: Unknown color "+A),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(A){return this.r=A.r,this.g=A.g,this.b=A.b,this}copySRGBToLinear(A){return this.r=OB(A.r),this.g=OB(A.g),this.b=OB(A.b),this}copyLinearToSRGB(A){return this.r=Zo(A.r),this.g=Zo(A.g),this.b=Zo(A.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(A=Sg){return Ig.fromWorkingColorSpace(ZI.copy(this),A),kI(ZI.r*255,0,255)<<16^kI(ZI.g*255,0,255)<<8^kI(ZI.b*255,0,255)<<0}getHexString(A=Sg){return("000000"+this.getHex(A).toString(16)).slice(-6)}getHSL(A,I=Ig.workingColorSpace){Ig.fromWorkingColorSpace(ZI.copy(this),I);const g=ZI.r,C=ZI.g,B=ZI.b,i=Math.max(g,C,B),E=Math.min(g,C,B);let t,e;const s=(E+i)/2;if(E===i)t=0,e=0;else{const o=i-E;switch(e=s<=.5?o/(i+E):o/(2-i-E),i){case g:t=(C-B)/o+(C<B?6:0);break;case C:t=(B-g)/o+2;break;case B:t=(g-C)/o+4;break}t/=6}return A.h=t,A.s=e,A.l=s,A}getRGB(A,I=Ig.workingColorSpace){return Ig.fromWorkingColorSpace(ZI.copy(this),I),A.r=ZI.r,A.g=ZI.g,A.b=ZI.b,A}getStyle(A=Sg){Ig.fromWorkingColorSpace(ZI.copy(this),A);const I=ZI.r,g=ZI.g,C=ZI.b;return A!==Sg?`color(${A} ${I.toFixed(3)} ${g.toFixed(3)} ${C.toFixed(3)})`:`rgb(${I*255|0},${g*255|0},${C*255|0})`}offsetHSL(A,I,g){return this.getHSL(Ug),Ug.h+=A,Ug.s+=I,Ug.l+=g,this.setHSL(Ug.h,Ug.s,Ug.l),this}add(A){return this.r+=A.r,this.g+=A.g,this.b+=A.b,this}addColors(A,I){return this.r=A.r+I.r,this.g=A.g+I.g,this.b=A.b+I.b,this}addScalar(A){return this.r+=A,this.g+=A,this.b+=A,this}sub(A){return this.r=Math.max(0,this.r-A.r),this.g=Math.max(0,this.g-A.g),this.b=Math.max(0,this.b-A.b),this}multiply(A){return this.r*=A.r,this.g*=A.g,this.b*=A.b,this}multiplyScalar(A){return this.r*=A,this.g*=A,this.b*=A,this}lerp(A,I){return this.r+=(A.r-this.r)*I,this.g+=(A.g-this.g)*I,this.b+=(A.b-this.b)*I,this}lerpColors(A,I,g){return this.r=A.r+(I.r-A.r)*g,this.g=A.g+(I.g-A.g)*g,this.b=A.b+(I.b-A.b)*g,this}lerpHSL(A,I){this.getHSL(Ug),A.getHSL(Fi);const g=KQ(Ug.h,Fi.h,I),C=KQ(Ug.s,Fi.s,I),B=KQ(Ug.l,Fi.l,I);return this.setHSL(g,C,B),this}setFromVector3(A){return this.r=A.x,this.g=A.y,this.b=A.z,this}applyMatrix3(A){const I=this.r,g=this.g,C=this.b,B=A.elements;return this.r=B[0]*I+B[3]*g+B[6]*C,this.g=B[1]*I+B[4]*g+B[7]*C,this.b=B[2]*I+B[5]*g+B[8]*C,this}equals(A){return A.r===this.r&&A.g===this.g&&A.b===this.b}fromArray(A,I=0){return this.r=A[I],this.g=A[I+1],this.b=A[I+2],this}toArray(A=[],I=0){return A[I]=this.r,A[I+1]=this.g,A[I+2]=this.b,A}fromBufferAttribute(A,I){return this.r=A.getX(I),this.g=A.getY(I),this.b=A.getZ(I),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ZI=new cA;cA.NAMES=Mn;class JC extends PI{constructor(A){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new cA(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ii,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.specularMap=A.specularMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.combine=A.combine,this.reflectivity=A.reflectivity,this.refractionRatio=A.refractionRatio,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.fog=A.fog,this}}const Vg=rc();function rc(){const Q=new ArrayBuffer(4),A=new Float32Array(Q),I=new Uint32Array(Q),g=new Uint32Array(512),C=new Uint32Array(512);for(let t=0;t<256;++t){const e=t-127;e<-27?(g[t]=0,g[t|256]=32768,C[t]=24,C[t|256]=24):e<-14?(g[t]=1024>>-e-14,g[t|256]=1024>>-e-14|32768,C[t]=-e-1,C[t|256]=-e-1):e<=15?(g[t]=e+15<<10,g[t|256]=e+15<<10|32768,C[t]=13,C[t|256]=13):e<128?(g[t]=31744,g[t|256]=64512,C[t]=24,C[t|256]=24):(g[t]=31744,g[t|256]=64512,C[t]=13,C[t|256]=13)}const B=new Uint32Array(2048),i=new Uint32Array(64),E=new Uint32Array(64);for(let t=1;t<1024;++t){let e=t<<13,s=0;for(;!(e&8388608);)e<<=1,s-=8388608;e&=-8388609,s+=947912704,B[t]=e|s}for(let t=1024;t<2048;++t)B[t]=939524096+(t-1024<<13);for(let t=1;t<31;++t)i[t]=t<<23;i[31]=1199570944,i[32]=2147483648;for(let t=33;t<63;++t)i[t]=2147483648+(t-32<<23);i[63]=3347054592;for(let t=1;t<64;++t)t!==32&&(E[t]=1024);return{floatView:A,uint32View:I,baseTable:g,shiftTable:C,mantissaTable:B,exponentTable:i,offsetTable:E}}function gg(Q){Math.abs(Q)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),Q=kI(Q,-65504,65504),Vg.floatView[0]=Q;const A=Vg.uint32View[0],I=A>>23&511;return Vg.baseTable[I]+((A&8388607)>>Vg.shiftTable[I])}function kQ(Q){const A=Q>>10;return Vg.uint32View[0]=Vg.mantissaTable[Vg.offsetTable[A]+(Q&1023)]+Vg.exponentTable[A],Vg.floatView[0]}const cc={toHalfFloat:gg,fromHalfFloat:kQ},dI=new K,Ri=new z;class aI{constructor(A,I,g=!1){if(Array.isArray(A))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=A,this.itemSize=I,this.count=A!==void 0?A.length/I:0,this.normalized=g,this.usage=HQ,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(A){A===!0&&this.version++}setUsage(A){return this.usage=A,this}copy(A){return this.name=A.name,this.array=new A.array.constructor(A.array),this.itemSize=A.itemSize,this.count=A.count,this.normalized=A.normalized,this.usage=A.usage,this}copyAt(A,I,g){A*=this.itemSize,g*=I.itemSize;for(let C=0,B=this.itemSize;C<B;C++)this.array[A+C]=I.array[g+C];return this}copyArray(A){return this.array.set(A),this}applyMatrix3(A){if(this.itemSize===2)for(let I=0,g=this.count;I<g;I++)Ri.fromBufferAttribute(this,I),Ri.applyMatrix3(A),this.setXY(I,Ri.x,Ri.y);else if(this.itemSize===3)for(let I=0,g=this.count;I<g;I++)dI.fromBufferAttribute(this,I),dI.applyMatrix3(A),this.setXYZ(I,dI.x,dI.y,dI.z);return this}applyMatrix4(A){for(let I=0,g=this.count;I<g;I++)dI.fromBufferAttribute(this,I),dI.applyMatrix4(A),this.setXYZ(I,dI.x,dI.y,dI.z);return this}applyNormalMatrix(A){for(let I=0,g=this.count;I<g;I++)dI.fromBufferAttribute(this,I),dI.applyNormalMatrix(A),this.setXYZ(I,dI.x,dI.y,dI.z);return this}transformDirection(A){for(let I=0,g=this.count;I<g;I++)dI.fromBufferAttribute(this,I),dI.transformDirection(A),this.setXYZ(I,dI.x,dI.y,dI.z);return this}set(A,I=0){return this.array.set(A,I),this}getX(A){let I=this.array[A*this.itemSize];return this.normalized&&(I=sg(I,this.array)),I}setX(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize]=I,this}getY(A){let I=this.array[A*this.itemSize+1];return this.normalized&&(I=sg(I,this.array)),I}setY(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+1]=I,this}getZ(A){let I=this.array[A*this.itemSize+2];return this.normalized&&(I=sg(I,this.array)),I}setZ(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+2]=I,this}getW(A){let I=this.array[A*this.itemSize+3];return this.normalized&&(I=sg(I,this.array)),I}setW(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+3]=I,this}setXY(A,I,g){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array)),this.array[A+0]=I,this.array[A+1]=g,this}setXYZ(A,I,g,C){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array),C=vA(C,this.array)),this.array[A+0]=I,this.array[A+1]=g,this.array[A+2]=C,this}setXYZW(A,I,g,C,B){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array),C=vA(C,this.array),B=vA(B,this.array)),this.array[A+0]=I,this.array[A+1]=g,this.array[A+2]=C,this.array[A+3]=B,this}onUpload(A){return this.onUploadCallback=A,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const A={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(A.name=this.name),this.usage!==HQ&&(A.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(A.updateRange=this.updateRange),A}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class wc extends aI{constructor(A,I,g){super(new Int8Array(A),I,g)}}class Gc extends aI{constructor(A,I,g){super(new Uint8Array(A),I,g)}}class Sc extends aI{constructor(A,I,g){super(new Uint8ClampedArray(A),I,g)}}class lc extends aI{constructor(A,I,g){super(new Int16Array(A),I,g)}}class Ue extends aI{constructor(A,I,g){super(new Uint16Array(A),I,g)}}class yc extends aI{constructor(A,I,g){super(new Int32Array(A),I,g)}}class Ke extends aI{constructor(A,I,g){super(new Uint32Array(A),I,g)}}class kc extends aI{constructor(A,I,g){super(new Uint16Array(A),I,g),this.isFloat16BufferAttribute=!0}getX(A){let I=kQ(this.array[A*this.itemSize]);return this.normalized&&(I=sg(I,this.array)),I}setX(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize]=gg(I),this}getY(A){let I=kQ(this.array[A*this.itemSize+1]);return this.normalized&&(I=sg(I,this.array)),I}setY(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+1]=gg(I),this}getZ(A){let I=kQ(this.array[A*this.itemSize+2]);return this.normalized&&(I=sg(I,this.array)),I}setZ(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+2]=gg(I),this}getW(A){let I=kQ(this.array[A*this.itemSize+3]);return this.normalized&&(I=sg(I,this.array)),I}setW(A,I){return this.normalized&&(I=vA(I,this.array)),this.array[A*this.itemSize+3]=gg(I),this}setXY(A,I,g){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array)),this.array[A+0]=gg(I),this.array[A+1]=gg(g),this}setXYZ(A,I,g,C){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array),C=vA(C,this.array)),this.array[A+0]=gg(I),this.array[A+1]=gg(g),this.array[A+2]=gg(C),this}setXYZW(A,I,g,C,B){return A*=this.itemSize,this.normalized&&(I=vA(I,this.array),g=vA(g,this.array),C=vA(C,this.array),B=vA(B,this.array)),this.array[A+0]=gg(I),this.array[A+1]=gg(g),this.array[A+2]=gg(C),this.array[A+3]=gg(B),this}}class yA extends aI{constructor(A,I,g){super(new Float32Array(A),I,g)}}class Mc extends aI{constructor(A,I,g){super(new Float64Array(A),I,g)}}let Uc=0;const cg=new xA,Bt=new BI,yB=new K,tg=new mg,hQ=new mg,xI=new K;class ZA extends QC{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Uc++}),this.uuid=Dg(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(A){return Array.isArray(A)?this.index=new(kn(A)?Ke:Ue)(A,1):this.index=A,this}getAttribute(A){return this.attributes[A]}setAttribute(A,I){return this.attributes[A]=I,this}deleteAttribute(A){return delete this.attributes[A],this}hasAttribute(A){return this.attributes[A]!==void 0}addGroup(A,I,g=0){this.groups.push({start:A,count:I,materialIndex:g})}clearGroups(){this.groups=[]}setDrawRange(A,I){this.drawRange.start=A,this.drawRange.count=I}applyMatrix4(A){const I=this.attributes.position;I!==void 0&&(I.applyMatrix4(A),I.needsUpdate=!0);const g=this.attributes.normal;if(g!==void 0){const B=new zA().getNormalMatrix(A);g.applyNormalMatrix(B),g.needsUpdate=!0}const C=this.attributes.tangent;return C!==void 0&&(C.transformDirection(A),C.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(A){return cg.makeRotationFromQuaternion(A),this.applyMatrix4(cg),this}rotateX(A){return cg.makeRotationX(A),this.applyMatrix4(cg),this}rotateY(A){return cg.makeRotationY(A),this.applyMatrix4(cg),this}rotateZ(A){return cg.makeRotationZ(A),this.applyMatrix4(cg),this}translate(A,I,g){return cg.makeTranslation(A,I,g),this.applyMatrix4(cg),this}scale(A,I,g){return cg.makeScale(A,I,g),this.applyMatrix4(cg),this}lookAt(A){return Bt.lookAt(A),Bt.updateMatrix(),this.applyMatrix4(Bt.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(yB).negate(),this.translate(yB.x,yB.y,yB.z),this}setFromPoints(A){const I=[];for(let g=0,C=A.length;g<C;g++){const B=A[g];I.push(B.x,B.y,B.z||0)}return this.setAttribute("position",new yA(I,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new mg);const A=this.attributes.position,I=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));return}if(A!==void 0){if(this.boundingBox.setFromBufferAttribute(A),I)for(let g=0,C=I.length;g<C;g++){const B=I[g];tg.setFromBufferAttribute(B),this.morphTargetsRelative?(xI.addVectors(this.boundingBox.min,tg.min),this.boundingBox.expandByPoint(xI),xI.addVectors(this.boundingBox.max,tg.max),this.boundingBox.expandByPoint(xI)):(this.boundingBox.expandByPoint(tg.min),this.boundingBox.expandByPoint(tg.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tg);const A=this.attributes.position,I=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new K,1/0);return}if(A){const g=this.boundingSphere.center;if(tg.setFromBufferAttribute(A),I)for(let B=0,i=I.length;B<i;B++){const E=I[B];hQ.setFromBufferAttribute(E),this.morphTargetsRelative?(xI.addVectors(tg.min,hQ.min),tg.expandByPoint(xI),xI.addVectors(tg.max,hQ.max),tg.expandByPoint(xI)):(tg.expandByPoint(hQ.min),tg.expandByPoint(hQ.max))}tg.getCenter(g);let C=0;for(let B=0,i=A.count;B<i;B++)xI.fromBufferAttribute(A,B),C=Math.max(C,g.distanceToSquared(xI));if(I)for(let B=0,i=I.length;B<i;B++){const E=I[B],t=this.morphTargetsRelative;for(let e=0,s=E.count;e<s;e++)xI.fromBufferAttribute(E,e),t&&(yB.fromBufferAttribute(A,e),xI.add(yB)),C=Math.max(C,g.distanceToSquared(xI))}this.boundingSphere.radius=Math.sqrt(C),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const A=this.index,I=this.attributes;if(A===null||I.position===void 0||I.normal===void 0||I.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const g=A.array,C=I.position.array,B=I.normal.array,i=I.uv.array,E=C.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new aI(new Float32Array(4*E),4));const t=this.getAttribute("tangent").array,e=[],s=[];for(let U=0;U<E;U++)e[U]=new K,s[U]=new K;const o=new K,a=new K,D=new K,h=new z,c=new z,r=new z,n=new K,S=new K;function G(U,m,v){o.fromArray(C,U*3),a.fromArray(C,m*3),D.fromArray(C,v*3),h.fromArray(i,U*2),c.fromArray(i,m*2),r.fromArray(i,v*2),a.sub(o),D.sub(o),c.sub(h),r.sub(h);const u=1/(c.x*r.y-r.x*c.y);isFinite(u)&&(n.copy(a).multiplyScalar(r.y).addScaledVector(D,-c.y).multiplyScalar(u),S.copy(D).multiplyScalar(c.x).addScaledVector(a,-r.x).multiplyScalar(u),e[U].add(n),e[m].add(n),e[v].add(n),s[U].add(S),s[m].add(S),s[v].add(S))}let l=this.groups;l.length===0&&(l=[{start:0,count:g.length}]);for(let U=0,m=l.length;U<m;++U){const v=l[U],u=v.start,Y=v.count;for(let b=u,gA=u+Y;b<gA;b+=3)G(g[b+0],g[b+1],g[b+2])}const k=new K,N=new K,p=new K,F=new K;function y(U){p.fromArray(B,U*3),F.copy(p);const m=e[U];k.copy(m),k.sub(p.multiplyScalar(p.dot(m))).normalize(),N.crossVectors(F,m);const u=N.dot(s[U])<0?-1:1;t[U*4]=k.x,t[U*4+1]=k.y,t[U*4+2]=k.z,t[U*4+3]=u}for(let U=0,m=l.length;U<m;++U){const v=l[U],u=v.start,Y=v.count;for(let b=u,gA=u+Y;b<gA;b+=3)y(g[b+0]),y(g[b+1]),y(g[b+2])}}computeVertexNormals(){const A=this.index,I=this.getAttribute("position");if(I!==void 0){let g=this.getAttribute("normal");if(g===void 0)g=new aI(new Float32Array(I.count*3),3),this.setAttribute("normal",g);else for(let a=0,D=g.count;a<D;a++)g.setXYZ(a,0,0,0);const C=new K,B=new K,i=new K,E=new K,t=new K,e=new K,s=new K,o=new K;if(A)for(let a=0,D=A.count;a<D;a+=3){const h=A.getX(a+0),c=A.getX(a+1),r=A.getX(a+2);C.fromBufferAttribute(I,h),B.fromBufferAttribute(I,c),i.fromBufferAttribute(I,r),s.subVectors(i,B),o.subVectors(C,B),s.cross(o),E.fromBufferAttribute(g,h),t.fromBufferAttribute(g,c),e.fromBufferAttribute(g,r),E.add(s),t.add(s),e.add(s),g.setXYZ(h,E.x,E.y,E.z),g.setXYZ(c,t.x,t.y,t.z),g.setXYZ(r,e.x,e.y,e.z)}else for(let a=0,D=I.count;a<D;a+=3)C.fromBufferAttribute(I,a+0),B.fromBufferAttribute(I,a+1),i.fromBufferAttribute(I,a+2),s.subVectors(i,B),o.subVectors(C,B),s.cross(o),g.setXYZ(a+0,s.x,s.y,s.z),g.setXYZ(a+1,s.x,s.y,s.z),g.setXYZ(a+2,s.x,s.y,s.z);this.normalizeNormals(),g.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeGeometries() instead."),this}normalizeNormals(){const A=this.attributes.normal;for(let I=0,g=A.count;I<g;I++)xI.fromBufferAttribute(A,I),xI.normalize(),A.setXYZ(I,xI.x,xI.y,xI.z)}toNonIndexed(){function A(E,t){const e=E.array,s=E.itemSize,o=E.normalized,a=new e.constructor(t.length*s);let D=0,h=0;for(let c=0,r=t.length;c<r;c++){E.isInterleavedBufferAttribute?D=t[c]*E.data.stride+E.offset:D=t[c]*s;for(let n=0;n<s;n++)a[h++]=e[D++]}return new aI(a,s,o)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const I=new ZA,g=this.index.array,C=this.attributes;for(const E in C){const t=C[E],e=A(t,g);I.setAttribute(E,e)}const B=this.morphAttributes;for(const E in B){const t=[],e=B[E];for(let s=0,o=e.length;s<o;s++){const a=e[s],D=A(a,g);t.push(D)}I.morphAttributes[E]=t}I.morphTargetsRelative=this.morphTargetsRelative;const i=this.groups;for(let E=0,t=i.length;E<t;E++){const e=i[E];I.addGroup(e.start,e.count,e.materialIndex)}return I}toJSON(){const A={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(A.uuid=this.uuid,A.type=this.type,this.name!==""&&(A.name=this.name),Object.keys(this.userData).length>0&&(A.userData=this.userData),this.parameters!==void 0){const t=this.parameters;for(const e in t)t[e]!==void 0&&(A[e]=t[e]);return A}A.data={attributes:{}};const I=this.index;I!==null&&(A.data.index={type:I.array.constructor.name,array:Array.prototype.slice.call(I.array)});const g=this.attributes;for(const t in g){const e=g[t];A.data.attributes[t]=e.toJSON(A.data)}const C={};let B=!1;for(const t in this.morphAttributes){const e=this.morphAttributes[t],s=[];for(let o=0,a=e.length;o<a;o++){const D=e[o];s.push(D.toJSON(A.data))}s.length>0&&(C[t]=s,B=!0)}B&&(A.data.morphAttributes=C,A.data.morphTargetsRelative=this.morphTargetsRelative);const i=this.groups;i.length>0&&(A.data.groups=JSON.parse(JSON.stringify(i)));const E=this.boundingSphere;return E!==null&&(A.data.boundingSphere={center:E.center.toArray(),radius:E.radius}),A}clone(){return new this.constructor().copy(this)}copy(A){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const I={};this.name=A.name;const g=A.index;g!==null&&this.setIndex(g.clone(I));const C=A.attributes;for(const e in C){const s=C[e];this.setAttribute(e,s.clone(I))}const B=A.morphAttributes;for(const e in B){const s=[],o=B[e];for(let a=0,D=o.length;a<D;a++)s.push(o[a].clone(I));this.morphAttributes[e]=s}this.morphTargetsRelative=A.morphTargetsRelative;const i=A.groups;for(let e=0,s=i.length;e<s;e++){const o=i[e];this.addGroup(o.start,o.count,o.materialIndex)}const E=A.boundingBox;E!==null&&(this.boundingBox=E.clone());const t=A.boundingSphere;return t!==null&&(this.boundingSphere=t.clone()),this.drawRange.start=A.drawRange.start,this.drawRange.count=A.drawRange.count,this.userData=A.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Is=new xA,Rg=new gi,pi=new Tg,gs=new K,kB=new K,MB=new K,UB=new K,Qt=new K,di=new K,qi=new z,fi=new z,ui=new z,Cs=new K,Bs=new K,Qs=new K,Yi=new K,Li=new K;class FI extends BI{constructor(A=new ZA,I=new JC){super(),this.isMesh=!0,this.type="Mesh",this.geometry=A,this.material=I,this.updateMorphTargets()}copy(A,I){return super.copy(A,I),A.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=A.morphTargetInfluences.slice()),A.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},A.morphTargetDictionary)),this.material=A.material,this.geometry=A.geometry,this}updateMorphTargets(){const I=this.geometry.morphAttributes,g=Object.keys(I);if(g.length>0){const C=I[g[0]];if(C!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let B=0,i=C.length;B<i;B++){const E=C[B].name||String(B);this.morphTargetInfluences.push(0),this.morphTargetDictionary[E]=B}}}}getVertexPosition(A,I){const g=this.geometry,C=g.attributes.position,B=g.morphAttributes.position,i=g.morphTargetsRelative;I.fromBufferAttribute(C,A);const E=this.morphTargetInfluences;if(B&&E){di.set(0,0,0);for(let t=0,e=B.length;t<e;t++){const s=E[t],o=B[t];s!==0&&(Qt.fromBufferAttribute(o,A),i?di.addScaledVector(Qt,s):di.addScaledVector(Qt.sub(I),s))}I.add(di)}return this.isSkinnedMesh&&this.applyBoneTransform(A,I),I}raycast(A,I){const g=this.geometry,C=this.material,B=this.matrixWorld;if(C===void 0||(g.boundingSphere===null&&g.computeBoundingSphere(),pi.copy(g.boundingSphere),pi.applyMatrix4(B),Rg.copy(A.ray).recast(A.near),pi.containsPoint(Rg.origin)===!1&&(Rg.intersectSphere(pi,gs)===null||Rg.origin.distanceToSquared(gs)>(A.far-A.near)**2))||(Is.copy(B).invert(),Rg.copy(A.ray).applyMatrix4(Is),g.boundingBox!==null&&Rg.intersectsBox(g.boundingBox)===!1))return;let i;const E=g.index,t=g.attributes.position,e=g.attributes.uv,s=g.attributes.uv2,o=g.attributes.normal,a=g.groups,D=g.drawRange;if(E!==null)if(Array.isArray(C))for(let h=0,c=a.length;h<c;h++){const r=a[h],n=C[r.materialIndex],S=Math.max(r.start,D.start),G=Math.min(E.count,Math.min(r.start+r.count,D.start+D.count));for(let l=S,k=G;l<k;l+=3){const N=E.getX(l),p=E.getX(l+1),F=E.getX(l+2);i=Hi(this,n,A,Rg,e,s,o,N,p,F),i&&(i.faceIndex=Math.floor(l/3),i.face.materialIndex=r.materialIndex,I.push(i))}}else{const h=Math.max(0,D.start),c=Math.min(E.count,D.start+D.count);for(let r=h,n=c;r<n;r+=3){const S=E.getX(r),G=E.getX(r+1),l=E.getX(r+2);i=Hi(this,C,A,Rg,e,s,o,S,G,l),i&&(i.faceIndex=Math.floor(r/3),I.push(i))}}else if(t!==void 0)if(Array.isArray(C))for(let h=0,c=a.length;h<c;h++){const r=a[h],n=C[r.materialIndex],S=Math.max(r.start,D.start),G=Math.min(t.count,Math.min(r.start+r.count,D.start+D.count));for(let l=S,k=G;l<k;l+=3){const N=l,p=l+1,F=l+2;i=Hi(this,n,A,Rg,e,s,o,N,p,F),i&&(i.faceIndex=Math.floor(l/3),i.face.materialIndex=r.materialIndex,I.push(i))}}else{const h=Math.max(0,D.start),c=Math.min(t.count,D.start+D.count);for(let r=h,n=c;r<n;r+=3){const S=r,G=r+1,l=r+2;i=Hi(this,C,A,Rg,e,s,o,S,G,l),i&&(i.faceIndex=Math.floor(r/3),I.push(i))}}}}function Kc(Q,A,I,g,C,B,i,E){let t;if(A.side===$I?t=g.intersectTriangle(i,B,C,!0,E):t=g.intersectTriangle(C,B,i,A.side===$g,E),t===null)return null;Li.copy(E),Li.applyMatrix4(Q.matrixWorld);const e=I.ray.origin.distanceTo(Li);return e<I.near||e>I.far?null:{distance:e,point:Li.clone(),object:Q}}function Hi(Q,A,I,g,C,B,i,E,t,e){Q.getVertexPosition(E,kB),Q.getVertexPosition(t,MB),Q.getVertexPosition(e,UB);const s=Kc(Q,A,I,g,kB,MB,UB,Yi);if(s){C&&(qi.fromBufferAttribute(C,E),fi.fromBufferAttribute(C,t),ui.fromBufferAttribute(C,e),s.uv=Bg.getInterpolation(Yi,kB,MB,UB,qi,fi,ui,new z)),B&&(qi.fromBufferAttribute(B,E),fi.fromBufferAttribute(B,t),ui.fromBufferAttribute(B,e),s.uv2=Bg.getInterpolation(Yi,kB,MB,UB,qi,fi,ui,new z)),i&&(Cs.fromBufferAttribute(i,E),Bs.fromBufferAttribute(i,t),Qs.fromBufferAttribute(i,e),s.normal=Bg.getInterpolation(Yi,kB,MB,UB,Cs,Bs,Qs,new K),s.normal.dot(g.direction)>0&&s.normal.multiplyScalar(-1));const o={a:E,b:t,c:e,normal:new K,materialIndex:0};Bg.getNormal(kB,MB,UB,o.normal),s.face=o}return s}class xg extends ZA{constructor(A=1,I=1,g=1,C=1,B=1,i=1){super(),this.type="BoxGeometry",this.parameters={width:A,height:I,depth:g,widthSegments:C,heightSegments:B,depthSegments:i};const E=this;C=Math.floor(C),B=Math.floor(B),i=Math.floor(i);const t=[],e=[],s=[],o=[];let a=0,D=0;h("z","y","x",-1,-1,g,I,A,i,B,0),h("z","y","x",1,-1,g,I,-A,i,B,1),h("x","z","y",1,1,A,g,I,C,i,2),h("x","z","y",1,-1,A,g,-I,C,i,3),h("x","y","z",1,-1,A,I,g,C,B,4),h("x","y","z",-1,-1,A,I,-g,C,B,5),this.setIndex(t),this.setAttribute("position",new yA(e,3)),this.setAttribute("normal",new yA(s,3)),this.setAttribute("uv",new yA(o,2));function h(c,r,n,S,G,l,k,N,p,F,y){const U=l/p,m=k/F,v=l/2,u=k/2,Y=N/2,b=p+1,gA=F+1;let QA=0,X=0;const CA=new K;for(let oA=0;oA<gA;oA++){const MA=oA*m-u;for(let hA=0;hA<b;hA++){const Z=hA*U-v;CA[c]=Z*S,CA[r]=MA*G,CA[n]=Y,e.push(CA.x,CA.y,CA.z),CA[c]=0,CA[r]=0,CA[n]=N>0?1:-1,s.push(CA.x,CA.y,CA.z),o.push(hA/p),o.push(1-oA/F),QA+=1}}for(let oA=0;oA<F;oA++)for(let MA=0;MA<p;MA++){const hA=a+MA+b*oA,Z=a+MA+b*(oA+1),$=a+(MA+1)+b*(oA+1),DA=a+(MA+1)+b*oA;t.push(hA,Z,DA),t.push(Z,$,DA),X+=6}E.addGroup(D,X,y),D+=X,a+=QA}}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new xg(A.width,A.height,A.depth,A.widthSegments,A.heightSegments,A.depthSegments)}}function _B(Q){const A={};for(const I in Q){A[I]={};for(const g in Q[I]){const C=Q[I][g];C&&(C.isColor||C.isMatrix3||C.isMatrix4||C.isVector2||C.isVector3||C.isVector4||C.isTexture||C.isQuaternion)?C.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),A[I][g]=null):A[I][g]=C.clone():Array.isArray(C)?A[I][g]=C.slice():A[I][g]=C}}return A}function XI(Q){const A={};for(let I=0;I<Q.length;I++){const g=_B(Q[I]);for(const C in g)A[C]=g[C]}return A}function Nc(Q){const A=[];for(let I=0;I<Q.length;I++)A.push(Q[I].clone());return A}function Un(Q){return Q.getRenderTarget()===null&&Q.outputEncoding===sI?Sg:WB}const Ne={clone:_B,merge:XI};var Jc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Fc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ng extends PI{constructor(A){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jc,this.fragmentShader=Fc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,A!==void 0&&this.setValues(A)}copy(A){return super.copy(A),this.fragmentShader=A.fragmentShader,this.vertexShader=A.vertexShader,this.uniforms=_B(A.uniforms),this.uniformsGroups=Nc(A.uniformsGroups),this.defines=Object.assign({},A.defines),this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.fog=A.fog,this.lights=A.lights,this.clipping=A.clipping,this.extensions=Object.assign({},A.extensions),this.glslVersion=A.glslVersion,this}toJSON(A){const I=super.toJSON(A);I.glslVersion=this.glslVersion,I.uniforms={};for(const C in this.uniforms){const i=this.uniforms[C].value;i&&i.isTexture?I.uniforms[C]={type:"t",value:i.toJSON(A).uuid}:i&&i.isColor?I.uniforms[C]={type:"c",value:i.getHex()}:i&&i.isVector2?I.uniforms[C]={type:"v2",value:i.toArray()}:i&&i.isVector3?I.uniforms[C]={type:"v3",value:i.toArray()}:i&&i.isVector4?I.uniforms[C]={type:"v4",value:i.toArray()}:i&&i.isMatrix3?I.uniforms[C]={type:"m3",value:i.toArray()}:i&&i.isMatrix4?I.uniforms[C]={type:"m4",value:i.toArray()}:I.uniforms[C]={value:i}}Object.keys(this.defines).length>0&&(I.defines=this.defines),I.vertexShader=this.vertexShader,I.fragmentShader=this.fragmentShader;const g={};for(const C in this.extensions)this.extensions[C]===!0&&(g[C]=!0);return Object.keys(g).length>0&&(I.extensions=g),I}}class $E extends BI{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new xA,this.projectionMatrix=new xA,this.projectionMatrixInverse=new xA}copy(A,I){return super.copy(A,I),this.matrixWorldInverse.copy(A.matrixWorldInverse),this.projectionMatrix.copy(A.projectionMatrix),this.projectionMatrixInverse.copy(A.projectionMatrixInverse),this}getWorldDirection(A){this.updateWorldMatrix(!0,!1);const I=this.matrixWorld.elements;return A.set(-I[8],-I[9],-I[10]).normalize()}updateMatrixWorld(A){super.updateMatrixWorld(A),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(A,I){super.updateWorldMatrix(A,I),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class YI extends $E{constructor(A=50,I=1,g=.1,C=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=A,this.zoom=1,this.near=g,this.far=C,this.focus=10,this.aspect=I,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(A,I){return super.copy(A,I),this.fov=A.fov,this.zoom=A.zoom,this.near=A.near,this.far=A.far,this.focus=A.focus,this.aspect=A.aspect,this.view=A.view===null?null:Object.assign({},A.view),this.filmGauge=A.filmGauge,this.filmOffset=A.filmOffset,this}setFocalLength(A){const I=.5*this.getFilmHeight()/A;this.fov=PB*2*Math.atan(I),this.updateProjectionMatrix()}getFocalLength(){const A=Math.tan(zC*.5*this.fov);return .5*this.getFilmHeight()/A}getEffectiveFOV(){return PB*2*Math.atan(Math.tan(zC*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(A,I,g,C,B,i){this.aspect=A/I,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=A,this.view.fullHeight=I,this.view.offsetX=g,this.view.offsetY=C,this.view.width=B,this.view.height=i,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const A=this.near;let I=A*Math.tan(zC*.5*this.fov)/this.zoom,g=2*I,C=this.aspect*g,B=-.5*C;const i=this.view;if(this.view!==null&&this.view.enabled){const t=i.fullWidth,e=i.fullHeight;B+=i.offsetX*C/t,I-=i.offsetY*g/e,C*=i.width/t,g*=i.height/e}const E=this.filmOffset;E!==0&&(B+=A*E/this.getFilmWidth()),this.projectionMatrix.makePerspective(B,B+C,I,I-g,A,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(A){const I=super.toJSON(A);return I.object.fov=this.fov,I.object.zoom=this.zoom,I.object.near=this.near,I.object.far=this.far,I.object.focus=this.focus,I.object.aspect=this.aspect,this.view!==null&&(I.object.view=Object.assign({},this.view)),I.object.filmGauge=this.filmGauge,I.object.filmOffset=this.filmOffset,I}}const KB=-90,NB=1;class Kn extends BI{constructor(A,I,g){super(),this.type="CubeCamera",this.renderTarget=g;const C=new YI(KB,NB,A,I);C.layers=this.layers,C.up.set(0,1,0),C.lookAt(1,0,0),this.add(C);const B=new YI(KB,NB,A,I);B.layers=this.layers,B.up.set(0,1,0),B.lookAt(-1,0,0),this.add(B);const i=new YI(KB,NB,A,I);i.layers=this.layers,i.up.set(0,0,-1),i.lookAt(0,1,0),this.add(i);const E=new YI(KB,NB,A,I);E.layers=this.layers,E.up.set(0,0,1),E.lookAt(0,-1,0),this.add(E);const t=new YI(KB,NB,A,I);t.layers=this.layers,t.up.set(0,1,0),t.lookAt(0,0,1),this.add(t);const e=new YI(KB,NB,A,I);e.layers=this.layers,e.up.set(0,1,0),e.lookAt(0,0,-1),this.add(e)}update(A,I){this.parent===null&&this.updateMatrixWorld();const g=this.renderTarget,[C,B,i,E,t,e]=this.children,s=A.getRenderTarget(),o=A.toneMapping,a=A.xr.enabled;A.toneMapping=fg,A.xr.enabled=!1;const D=g.texture.generateMipmaps;g.texture.generateMipmaps=!1,A.setRenderTarget(g,0),A.render(I,C),A.setRenderTarget(g,1),A.render(I,B),A.setRenderTarget(g,2),A.render(I,i),A.setRenderTarget(g,3),A.render(I,E),A.setRenderTarget(g,4),A.render(I,t),g.texture.generateMipmaps=D,A.setRenderTarget(g,5),A.render(I,e),A.setRenderTarget(s),A.toneMapping=o,A.xr.enabled=a,g.texture.needsPMREMUpdate=!0}}class Bi extends MI{constructor(A,I,g,C,B,i,E,t,e,s){A=A!==void 0?A:[],I=I!==void 0?I:wC,super(A,I,g,C,B,i,E,t,e,s),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(A){this.image=A}}class Nn extends ig{constructor(A=1,I={}){super(A,A,I),this.isWebGLCubeRenderTarget=!0;const g={width:A,height:A,depth:1},C=[g,g,g,g,g,g];this.texture=new Bi(C,I.mapping,I.wrapS,I.wrapT,I.magFilter,I.minFilter,I.format,I.type,I.anisotropy,I.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=I.generateMipmaps!==void 0?I.generateMipmaps:!1,this.texture.minFilter=I.minFilter!==void 0?I.minFilter:yI}fromEquirectangularTexture(A,I){this.texture.type=I.type,this.texture.encoding=I.encoding,this.texture.generateMipmaps=I.generateMipmaps,this.texture.minFilter=I.minFilter,this.texture.magFilter=I.magFilter;const g={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},C=new xg(5,5,5),B=new ng({name:"CubemapFromEquirect",uniforms:_B(g.uniforms),vertexShader:g.vertexShader,fragmentShader:g.fragmentShader,side:$I,blending:zg});B.uniforms.tEquirect.value=I;const i=new FI(C,B),E=I.minFilter;return I.minFilter===SC&&(I.minFilter=yI),new Kn(1,10,this).update(A,i),I.minFilter=E,i.geometry.dispose(),i.material.dispose(),this}clear(A,I,g,C){const B=A.getRenderTarget();for(let i=0;i<6;i++)A.setRenderTarget(this,i),A.clear(I,g,C);A.setRenderTarget(B)}}const it=new K,Rc=new K,pc=new zA;class DC{constructor(A=new K(1,0,0),I=0){this.isPlane=!0,this.normal=A,this.constant=I}set(A,I){return this.normal.copy(A),this.constant=I,this}setComponents(A,I,g,C){return this.normal.set(A,I,g),this.constant=C,this}setFromNormalAndCoplanarPoint(A,I){return this.normal.copy(A),this.constant=-I.dot(this.normal),this}setFromCoplanarPoints(A,I,g){const C=it.subVectors(g,I).cross(Rc.subVectors(A,I)).normalize();return this.setFromNormalAndCoplanarPoint(C,A),this}copy(A){return this.normal.copy(A.normal),this.constant=A.constant,this}normalize(){const A=1/this.normal.length();return this.normal.multiplyScalar(A),this.constant*=A,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(A){return this.normal.dot(A)+this.constant}distanceToSphere(A){return this.distanceToPoint(A.center)-A.radius}projectPoint(A,I){return I.copy(A).addScaledVector(this.normal,-this.distanceToPoint(A))}intersectLine(A,I){const g=A.delta(it),C=this.normal.dot(g);if(C===0)return this.distanceToPoint(A.start)===0?I.copy(A.start):null;const B=-(A.start.dot(this.normal)+this.constant)/C;return B<0||B>1?null:I.copy(A.start).addScaledVector(g,B)}intersectsLine(A){const I=this.distanceToPoint(A.start),g=this.distanceToPoint(A.end);return I<0&&g>0||g<0&&I>0}intersectsBox(A){return A.intersectsPlane(this)}intersectsSphere(A){return A.intersectsPlane(this)}coplanarPoint(A){return A.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(A,I){const g=I||pc.getNormalMatrix(A),C=this.coplanarPoint(it).applyMatrix4(A),B=this.normal.applyMatrix3(g).normalize();return this.constant=-C.dot(B),this}translate(A){return this.constant-=A.dot(this.normal),this}equals(A){return A.normal.equals(this.normal)&&A.constant===this.constant}clone(){return new this.constructor().copy(this)}}const uC=new Tg,mi=new K;class Ao{constructor(A=new DC,I=new DC,g=new DC,C=new DC,B=new DC,i=new DC){this.planes=[A,I,g,C,B,i]}set(A,I,g,C,B,i){const E=this.planes;return E[0].copy(A),E[1].copy(I),E[2].copy(g),E[3].copy(C),E[4].copy(B),E[5].copy(i),this}copy(A){const I=this.planes;for(let g=0;g<6;g++)I[g].copy(A.planes[g]);return this}setFromProjectionMatrix(A){const I=this.planes,g=A.elements,C=g[0],B=g[1],i=g[2],E=g[3],t=g[4],e=g[5],s=g[6],o=g[7],a=g[8],D=g[9],h=g[10],c=g[11],r=g[12],n=g[13],S=g[14],G=g[15];return I[0].setComponents(E-C,o-t,c-a,G-r).normalize(),I[1].setComponents(E+C,o+t,c+a,G+r).normalize(),I[2].setComponents(E+B,o+e,c+D,G+n).normalize(),I[3].setComponents(E-B,o-e,c-D,G-n).normalize(),I[4].setComponents(E-i,o-s,c-h,G-S).normalize(),I[5].setComponents(E+i,o+s,c+h,G+S).normalize(),this}intersectsObject(A){if(A.boundingSphere!==void 0)A.boundingSphere===null&&A.computeBoundingSphere(),uC.copy(A.boundingSphere).applyMatrix4(A.matrixWorld);else{const I=A.geometry;I.boundingSphere===null&&I.computeBoundingSphere(),uC.copy(I.boundingSphere).applyMatrix4(A.matrixWorld)}return this.intersectsSphere(uC)}intersectsSprite(A){return uC.center.set(0,0,0),uC.radius=.7071067811865476,uC.applyMatrix4(A.matrixWorld),this.intersectsSphere(uC)}intersectsSphere(A){const I=this.planes,g=A.center,C=-A.radius;for(let B=0;B<6;B++)if(I[B].distanceToPoint(g)<C)return!1;return!0}intersectsBox(A){const I=this.planes;for(let g=0;g<6;g++){const C=I[g];if(mi.x=C.normal.x>0?A.max.x:A.min.x,mi.y=C.normal.y>0?A.max.y:A.min.y,mi.z=C.normal.z>0?A.max.z:A.min.z,C.distanceToPoint(mi)<0)return!1}return!0}containsPoint(A){const I=this.planes;for(let g=0;g<6;g++)if(I[g].distanceToPoint(A)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Jn(){let Q=null,A=!1,I=null,g=null;function C(B,i){I(B,i),g=Q.requestAnimationFrame(C)}return{start:function(){A!==!0&&I!==null&&(g=Q.requestAnimationFrame(C),A=!0)},stop:function(){Q.cancelAnimationFrame(g),A=!1},setAnimationLoop:function(B){I=B},setContext:function(B){Q=B}}}function dc(Q,A){const I=A.isWebGL2,g=new WeakMap;function C(e,s){const o=e.array,a=e.usage,D=Q.createBuffer();Q.bindBuffer(s,D),Q.bufferData(s,o,a),e.onUploadCallback();let h;if(o instanceof Float32Array)h=5126;else if(o instanceof Uint16Array)if(e.isFloat16BufferAttribute)if(I)h=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else h=5123;else if(o instanceof Int16Array)h=5122;else if(o instanceof Uint32Array)h=5125;else if(o instanceof Int32Array)h=5124;else if(o instanceof Int8Array)h=5120;else if(o instanceof Uint8Array)h=5121;else if(o instanceof Uint8ClampedArray)h=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+o);return{buffer:D,type:h,bytesPerElement:o.BYTES_PER_ELEMENT,version:e.version}}function B(e,s,o){const a=s.array,D=s.updateRange;Q.bindBuffer(o,e),D.count===-1?Q.bufferSubData(o,0,a):(I?Q.bufferSubData(o,D.offset*a.BYTES_PER_ELEMENT,a,D.offset,D.count):Q.bufferSubData(o,D.offset*a.BYTES_PER_ELEMENT,a.subarray(D.offset,D.offset+D.count)),D.count=-1),s.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),g.get(e)}function E(e){e.isInterleavedBufferAttribute&&(e=e.data);const s=g.get(e);s&&(Q.deleteBuffer(s.buffer),g.delete(e))}function t(e,s){if(e.isGLBufferAttribute){const a=g.get(e);(!a||a.version<e.version)&&g.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}e.isInterleavedBufferAttribute&&(e=e.data);const o=g.get(e);o===void 0?g.set(e,C(e,s)):o.version<e.version&&(B(o.buffer,e,s),o.version=e.version)}return{get:i,remove:E,update:t}}class IQ extends ZA{constructor(A=1,I=1,g=1,C=1){super(),this.type="PlaneGeometry",this.parameters={width:A,height:I,widthSegments:g,heightSegments:C};const B=A/2,i=I/2,E=Math.floor(g),t=Math.floor(C),e=E+1,s=t+1,o=A/E,a=I/t,D=[],h=[],c=[],r=[];for(let n=0;n<s;n++){const S=n*a-i;for(let G=0;G<e;G++){const l=G*o-B;h.push(l,-S,0),c.push(0,0,1),r.push(G/E),r.push(1-n/t)}}for(let n=0;n<t;n++)for(let S=0;S<E;S++){const G=S+e*n,l=S+e*(n+1),k=S+1+e*(n+1),N=S+1+e*n;D.push(G,l,N),D.push(l,k,N)}this.setIndex(D),this.setAttribute("position",new yA(h,3)),this.setAttribute("normal",new yA(c,3)),this.setAttribute("uv",new yA(r,2))}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new IQ(A.width,A.height,A.widthSegments,A.heightSegments)}}var qc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,fc=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,uc=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,Yc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Lc=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Hc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,mc="vec3 transformed = vec3( position );",Tc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,xc=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,bc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			 return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Oc=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,vc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Zc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Wc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Pc=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_c=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,jc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Vc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Xc=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,zc=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,$c=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Aw=`vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Iw=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,gw=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Cw=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Bw=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Qw="gl_FragColor = linearToOutputTexel( gl_FragColor );",iw=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ew=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ow=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,tw=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ew=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,aw=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,sw=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Dw=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,nw=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,hw=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,rw=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,cw=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,ww=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gw=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Sw=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lw=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,yw=`#if defined( USE_ENVMAP )
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
#endif`,kw=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Mw=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Uw=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kw=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Nw=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif`,Jw=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
	float D = D_GGX( alpha, dotNH );
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Fw=`
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometry, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Rw=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,pw=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,dw=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,qw=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,fw=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,uw=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Yw=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Lw=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Hw=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,mw=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Tw=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,xw=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,bw=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ow=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,vw=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,Zw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Ww=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#ifdef USE_NORMALMAP_TANGENTSPACE
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal, vNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 geometryNormal = normal;`,Pw=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,_w=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,jw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vw=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Xw=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,zw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,$w=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,AG=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,IG=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,gG=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,CG=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,BG=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,QG=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,iG=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,EG=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,oG=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,tG=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,eG=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,aG=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,sG=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,DG=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,nG=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,hG=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`,rG=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,cG=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,wG=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,GG=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,SG=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,lG=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,yG=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmission = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmission.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmission.rgb, material.transmission );
#endif`,kG=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, vec2 fullSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		
		vec2 lodFudge = pow( 1.95, lod ) / fullSize;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec2 fullSize = vec2( textureSize( sampler, 0 ) );
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), fullSize, floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), fullSize, ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 applyVolumeAttenuation( const in vec3 radiance, const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return radiance;
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance * radiance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 attenuatedColor = applyVolumeAttenuation( transmittedLight.rgb, length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		return vec4( ( 1.0 - F ) * attenuatedColor * diffuseColor, transmittedLight.a );
	}
#endif`,MG=`#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,UG=`#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_UV2
	attribute vec2 uv2;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,KG=`#ifdef USE_UV
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,NG=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const JG=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,FG=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,RG=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,pG=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,dG=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,qG=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,fG=`#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,uG=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,YG=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,LG=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,HG=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,mG=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,TG=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,xG=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,bG=`#include <common>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,OG=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vG=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ZG=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,WG=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,PG=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_G=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,jG=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,VG=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,XG=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zG=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,$G=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,AS=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,IS=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gS=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,CS=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,BS=`#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,QS=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,iS=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ES=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,OA={alphamap_fragment:qc,alphamap_pars_fragment:fc,alphatest_fragment:uc,alphatest_pars_fragment:Yc,aomap_fragment:Lc,aomap_pars_fragment:Hc,begin_vertex:mc,beginnormal_vertex:Tc,bsdfs:xc,iridescence_fragment:bc,bumpmap_pars_fragment:Oc,clipping_planes_fragment:vc,clipping_planes_pars_fragment:Zc,clipping_planes_pars_vertex:Wc,clipping_planes_vertex:Pc,color_fragment:_c,color_pars_fragment:jc,color_pars_vertex:Vc,color_vertex:Xc,common:zc,cube_uv_reflection_fragment:$c,defaultnormal_vertex:Aw,displacementmap_pars_vertex:Iw,displacementmap_vertex:gw,emissivemap_fragment:Cw,emissivemap_pars_fragment:Bw,encodings_fragment:Qw,encodings_pars_fragment:iw,envmap_fragment:Ew,envmap_common_pars_fragment:ow,envmap_pars_fragment:tw,envmap_pars_vertex:ew,envmap_physical_pars_fragment:yw,envmap_vertex:aw,fog_vertex:sw,fog_pars_vertex:Dw,fog_fragment:nw,fog_pars_fragment:hw,gradientmap_pars_fragment:rw,lightmap_fragment:cw,lightmap_pars_fragment:ww,lights_lambert_fragment:Gw,lights_lambert_pars_fragment:Sw,lights_pars_begin:lw,lights_toon_fragment:kw,lights_toon_pars_fragment:Mw,lights_phong_fragment:Uw,lights_phong_pars_fragment:Kw,lights_physical_fragment:Nw,lights_physical_pars_fragment:Jw,lights_fragment_begin:Fw,lights_fragment_maps:Rw,lights_fragment_end:pw,logdepthbuf_fragment:dw,logdepthbuf_pars_fragment:qw,logdepthbuf_pars_vertex:fw,logdepthbuf_vertex:uw,map_fragment:Yw,map_pars_fragment:Lw,map_particle_fragment:Hw,map_particle_pars_fragment:mw,metalnessmap_fragment:Tw,metalnessmap_pars_fragment:xw,morphcolor_vertex:bw,morphnormal_vertex:Ow,morphtarget_pars_vertex:vw,morphtarget_vertex:Zw,normal_fragment_begin:Ww,normal_fragment_maps:Pw,normal_pars_fragment:_w,normal_pars_vertex:jw,normal_vertex:Vw,normalmap_pars_fragment:Xw,clearcoat_normal_fragment_begin:zw,clearcoat_normal_fragment_maps:$w,clearcoat_pars_fragment:AG,iridescence_pars_fragment:IG,output_fragment:gG,packing:CG,premultiplied_alpha_fragment:BG,project_vertex:QG,dithering_fragment:iG,dithering_pars_fragment:EG,roughnessmap_fragment:oG,roughnessmap_pars_fragment:tG,shadowmap_pars_fragment:eG,shadowmap_pars_vertex:aG,shadowmap_vertex:sG,shadowmask_pars_fragment:DG,skinbase_vertex:nG,skinning_pars_vertex:hG,skinning_vertex:rG,skinnormal_vertex:cG,specularmap_fragment:wG,specularmap_pars_fragment:GG,tonemapping_fragment:SG,tonemapping_pars_fragment:lG,transmission_fragment:yG,transmission_pars_fragment:kG,uv_pars_fragment:MG,uv_pars_vertex:UG,uv_vertex:KG,worldpos_vertex:NG,background_vert:JG,background_frag:FG,backgroundCube_vert:RG,backgroundCube_frag:pG,cube_vert:dG,cube_frag:qG,depth_vert:fG,depth_frag:uG,distanceRGBA_vert:YG,distanceRGBA_frag:LG,equirect_vert:HG,equirect_frag:mG,linedashed_vert:TG,linedashed_frag:xG,meshbasic_vert:bG,meshbasic_frag:OG,meshlambert_vert:vG,meshlambert_frag:ZG,meshmatcap_vert:WG,meshmatcap_frag:PG,meshnormal_vert:_G,meshnormal_frag:jG,meshphong_vert:VG,meshphong_frag:XG,meshphysical_vert:zG,meshphysical_frag:$G,meshtoon_vert:AS,meshtoon_frag:IS,points_vert:gS,points_frag:CS,shadow_vert:BS,shadow_frag:QS,sprite_vert:iS,sprite_frag:ES},eA={common:{diffuse:{value:new cA(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new zA},alphaMap:{value:null},alphaMapTransform:{value:new zA},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new zA}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new zA}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new zA}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new zA},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new zA},normalScale:{value:new z(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new zA},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new zA}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new zA}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new zA}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new cA(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new cA(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new zA}},sprite:{diffuse:{value:new cA(16777215)},opacity:{value:1},center:{value:new z(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new zA},alphaMap:{value:null},alphaTest:{value:0}}},Kg={basic:{uniforms:XI([eA.common,eA.specularmap,eA.envmap,eA.aomap,eA.lightmap,eA.fog]),vertexShader:OA.meshbasic_vert,fragmentShader:OA.meshbasic_frag},lambert:{uniforms:XI([eA.common,eA.specularmap,eA.envmap,eA.aomap,eA.lightmap,eA.emissivemap,eA.bumpmap,eA.normalmap,eA.displacementmap,eA.fog,eA.lights,{emissive:{value:new cA(0)}}]),vertexShader:OA.meshlambert_vert,fragmentShader:OA.meshlambert_frag},phong:{uniforms:XI([eA.common,eA.specularmap,eA.envmap,eA.aomap,eA.lightmap,eA.emissivemap,eA.bumpmap,eA.normalmap,eA.displacementmap,eA.fog,eA.lights,{emissive:{value:new cA(0)},specular:{value:new cA(1118481)},shininess:{value:30}}]),vertexShader:OA.meshphong_vert,fragmentShader:OA.meshphong_frag},standard:{uniforms:XI([eA.common,eA.envmap,eA.aomap,eA.lightmap,eA.emissivemap,eA.bumpmap,eA.normalmap,eA.displacementmap,eA.roughnessmap,eA.metalnessmap,eA.fog,eA.lights,{emissive:{value:new cA(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:OA.meshphysical_vert,fragmentShader:OA.meshphysical_frag},toon:{uniforms:XI([eA.common,eA.aomap,eA.lightmap,eA.emissivemap,eA.bumpmap,eA.normalmap,eA.displacementmap,eA.gradientmap,eA.fog,eA.lights,{emissive:{value:new cA(0)}}]),vertexShader:OA.meshtoon_vert,fragmentShader:OA.meshtoon_frag},matcap:{uniforms:XI([eA.common,eA.bumpmap,eA.normalmap,eA.displacementmap,eA.fog,{matcap:{value:null}}]),vertexShader:OA.meshmatcap_vert,fragmentShader:OA.meshmatcap_frag},points:{uniforms:XI([eA.points,eA.fog]),vertexShader:OA.points_vert,fragmentShader:OA.points_frag},dashed:{uniforms:XI([eA.common,eA.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:OA.linedashed_vert,fragmentShader:OA.linedashed_frag},depth:{uniforms:XI([eA.common,eA.displacementmap]),vertexShader:OA.depth_vert,fragmentShader:OA.depth_frag},normal:{uniforms:XI([eA.common,eA.bumpmap,eA.normalmap,eA.displacementmap,{opacity:{value:1}}]),vertexShader:OA.meshnormal_vert,fragmentShader:OA.meshnormal_frag},sprite:{uniforms:XI([eA.sprite,eA.fog]),vertexShader:OA.sprite_vert,fragmentShader:OA.sprite_frag},background:{uniforms:{uvTransform:{value:new zA},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:OA.background_vert,fragmentShader:OA.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:OA.backgroundCube_vert,fragmentShader:OA.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:OA.cube_vert,fragmentShader:OA.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:OA.equirect_vert,fragmentShader:OA.equirect_frag},distanceRGBA:{uniforms:XI([eA.common,eA.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:OA.distanceRGBA_vert,fragmentShader:OA.distanceRGBA_frag},shadow:{uniforms:XI([eA.lights,eA.fog,{color:{value:new cA(0)},opacity:{value:1}}]),vertexShader:OA.shadow_vert,fragmentShader:OA.shadow_frag}};Kg.physical={uniforms:XI([Kg.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new zA},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new zA},clearcoatNormalScale:{value:new z(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new zA},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new zA},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new zA},sheen:{value:0},sheenColor:{value:new cA(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new zA},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new zA},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new zA},transmissionSamplerSize:{value:new z},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new zA},attenuationDistance:{value:0},attenuationColor:{value:new cA(0)},specularColor:{value:new cA(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new zA},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new zA}}]),vertexShader:OA.meshphysical_vert,fragmentShader:OA.meshphysical_frag};const Ti={r:0,b:0,g:0};function oS(Q,A,I,g,C,B,i){const E=new cA(0);let t=B===!0?0:1,e,s,o=null,a=0,D=null;function h(r,n){let S=!1,G=n.isScene===!0?n.background:null;G&&G.isTexture&&(G=(n.backgroundBlurriness>0?I:A).get(G));const l=Q.xr,k=l.getSession&&l.getSession();k&&k.environmentBlendMode==="additive"&&(G=null),G===null?c(E,t):G&&G.isColor&&(c(G,1),S=!0),(Q.autoClear||S)&&Q.clear(Q.autoClearColor,Q.autoClearDepth,Q.autoClearStencil),G&&(G.isCubeTexture||G.mapping===AQ)?(s===void 0&&(s=new FI(new xg(1,1,1),new ng({name:"BackgroundCubeMaterial",uniforms:_B(Kg.backgroundCube.uniforms),vertexShader:Kg.backgroundCube.vertexShader,fragmentShader:Kg.backgroundCube.fragmentShader,side:$I,depthTest:!1,depthWrite:!1,fog:!1})),s.geometry.deleteAttribute("normal"),s.geometry.deleteAttribute("uv"),s.onBeforeRender=function(N,p,F){this.matrixWorld.copyPosition(F.matrixWorld)},Object.defineProperty(s.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),C.update(s)),s.material.uniforms.envMap.value=G,s.material.uniforms.flipEnvMap.value=G.isCubeTexture&&G.isRenderTargetTexture===!1?-1:1,s.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,s.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,s.material.toneMapped=G.encoding!==sI,(o!==G||a!==G.version||D!==Q.toneMapping)&&(s.material.needsUpdate=!0,o=G,a=G.version,D=Q.toneMapping),s.layers.enableAll(),r.unshift(s,s.geometry,s.material,0,0,null)):G&&G.isTexture&&(e===void 0&&(e=new FI(new IQ(2,2),new ng({name:"BackgroundMaterial",uniforms:_B(Kg.background.uniforms),vertexShader:Kg.background.vertexShader,fragmentShader:Kg.background.fragmentShader,side:$g,depthTest:!1,depthWrite:!1,fog:!1})),e.geometry.deleteAttribute("normal"),Object.defineProperty(e.material,"map",{get:function(){return this.uniforms.t2D.value}}),C.update(e)),e.material.uniforms.t2D.value=G,e.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,e.material.toneMapped=G.encoding!==sI,G.matrixAutoUpdate===!0&&G.updateMatrix(),e.material.uniforms.uvTransform.value.copy(G.matrix),(o!==G||a!==G.version||D!==Q.toneMapping)&&(e.material.needsUpdate=!0,o=G,a=G.version,D=Q.toneMapping),e.layers.enableAll(),r.unshift(e,e.geometry,e.material,0,0,null))}function c(r,n){r.getRGB(Ti,Un(Q)),g.buffers.color.setClear(Ti.r,Ti.g,Ti.b,n,i)}return{getClearColor:function(){return E},setClearColor:function(r,n=1){E.set(r),t=n,c(E,t)},getClearAlpha:function(){return t},setClearAlpha:function(r){t=r,c(E,t)},render:h}}function tS(Q,A,I,g){const C=Q.getParameter(34921),B=g.isWebGL2?null:A.get("OES_vertex_array_object"),i=g.isWebGL2||B!==null,E={},t=r(null);let e=t,s=!1;function o(Y,b,gA,QA,X){let CA=!1;if(i){const oA=c(QA,gA,b);e!==oA&&(e=oA,D(e.object)),CA=n(Y,QA,gA,X),CA&&S(Y,QA,gA,X)}else{const oA=b.wireframe===!0;(e.geometry!==QA.id||e.program!==gA.id||e.wireframe!==oA)&&(e.geometry=QA.id,e.program=gA.id,e.wireframe=oA,CA=!0)}X!==null&&I.update(X,34963),(CA||s)&&(s=!1,F(Y,b,gA,QA),X!==null&&Q.bindBuffer(34963,I.get(X).buffer))}function a(){return g.isWebGL2?Q.createVertexArray():B.createVertexArrayOES()}function D(Y){return g.isWebGL2?Q.bindVertexArray(Y):B.bindVertexArrayOES(Y)}function h(Y){return g.isWebGL2?Q.deleteVertexArray(Y):B.deleteVertexArrayOES(Y)}function c(Y,b,gA){const QA=gA.wireframe===!0;let X=E[Y.id];X===void 0&&(X={},E[Y.id]=X);let CA=X[b.id];CA===void 0&&(CA={},X[b.id]=CA);let oA=CA[QA];return oA===void 0&&(oA=r(a()),CA[QA]=oA),oA}function r(Y){const b=[],gA=[],QA=[];for(let X=0;X<C;X++)b[X]=0,gA[X]=0,QA[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:b,enabledAttributes:gA,attributeDivisors:QA,object:Y,attributes:{},index:null}}function n(Y,b,gA,QA){const X=e.attributes,CA=b.attributes;let oA=0;const MA=gA.getAttributes();for(const hA in MA)if(MA[hA].location>=0){const $=X[hA];let DA=CA[hA];if(DA===void 0&&(hA==="instanceMatrix"&&Y.instanceMatrix&&(DA=Y.instanceMatrix),hA==="instanceColor"&&Y.instanceColor&&(DA=Y.instanceColor)),$===void 0||$.attribute!==DA||DA&&$.data!==DA.data)return!0;oA++}return e.attributesNum!==oA||e.index!==QA}function S(Y,b,gA,QA){const X={},CA=b.attributes;let oA=0;const MA=gA.getAttributes();for(const hA in MA)if(MA[hA].location>=0){let $=CA[hA];$===void 0&&(hA==="instanceMatrix"&&Y.instanceMatrix&&($=Y.instanceMatrix),hA==="instanceColor"&&Y.instanceColor&&($=Y.instanceColor));const DA={};DA.attribute=$,$&&$.data&&(DA.data=$.data),X[hA]=DA,oA++}e.attributes=X,e.attributesNum=oA,e.index=QA}function G(){const Y=e.newAttributes;for(let b=0,gA=Y.length;b<gA;b++)Y[b]=0}function l(Y){k(Y,0)}function k(Y,b){const gA=e.newAttributes,QA=e.enabledAttributes,X=e.attributeDivisors;gA[Y]=1,QA[Y]===0&&(Q.enableVertexAttribArray(Y),QA[Y]=1),X[Y]!==b&&((g.isWebGL2?Q:A.get("ANGLE_instanced_arrays"))[g.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](Y,b),X[Y]=b)}function N(){const Y=e.newAttributes,b=e.enabledAttributes;for(let gA=0,QA=b.length;gA<QA;gA++)b[gA]!==Y[gA]&&(Q.disableVertexAttribArray(gA),b[gA]=0)}function p(Y,b,gA,QA,X,CA){g.isWebGL2===!0&&(gA===5124||gA===5125)?Q.vertexAttribIPointer(Y,b,gA,X,CA):Q.vertexAttribPointer(Y,b,gA,QA,X,CA)}function F(Y,b,gA,QA){if(g.isWebGL2===!1&&(Y.isInstancedMesh||QA.isInstancedBufferGeometry)&&A.get("ANGLE_instanced_arrays")===null)return;G();const X=QA.attributes,CA=gA.getAttributes(),oA=b.defaultAttributeValues;for(const MA in CA){const hA=CA[MA];if(hA.location>=0){let Z=X[MA];if(Z===void 0&&(MA==="instanceMatrix"&&Y.instanceMatrix&&(Z=Y.instanceMatrix),MA==="instanceColor"&&Y.instanceColor&&(Z=Y.instanceColor)),Z!==void 0){const $=Z.normalized,DA=Z.itemSize,rA=I.get(Z);if(rA===void 0)continue;const x=rA.buffer,LA=rA.type,HA=rA.bytesPerElement;if(Z.isInterleavedBufferAttribute){const tA=Z.data,KA=tA.stride,AA=Z.offset;if(tA.isInstancedInterleavedBuffer){for(let j=0;j<hA.locationSize;j++)k(hA.location+j,tA.meshPerAttribute);Y.isInstancedMesh!==!0&&QA._maxInstanceCount===void 0&&(QA._maxInstanceCount=tA.meshPerAttribute*tA.count)}else for(let j=0;j<hA.locationSize;j++)l(hA.location+j);Q.bindBuffer(34962,x);for(let j=0;j<hA.locationSize;j++)p(hA.location+j,DA/hA.locationSize,LA,$,KA*HA,(AA+DA/hA.locationSize*j)*HA)}else{if(Z.isInstancedBufferAttribute){for(let tA=0;tA<hA.locationSize;tA++)k(hA.location+tA,Z.meshPerAttribute);Y.isInstancedMesh!==!0&&QA._maxInstanceCount===void 0&&(QA._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let tA=0;tA<hA.locationSize;tA++)l(hA.location+tA);Q.bindBuffer(34962,x);for(let tA=0;tA<hA.locationSize;tA++)p(hA.location+tA,DA/hA.locationSize,LA,$,DA*HA,DA/hA.locationSize*tA*HA)}}else if(oA!==void 0){const $=oA[MA];if($!==void 0)switch($.length){case 2:Q.vertexAttrib2fv(hA.location,$);break;case 3:Q.vertexAttrib3fv(hA.location,$);break;case 4:Q.vertexAttrib4fv(hA.location,$);break;default:Q.vertexAttrib1fv(hA.location,$)}}}}N()}function y(){v();for(const Y in E){const b=E[Y];for(const gA in b){const QA=b[gA];for(const X in QA)h(QA[X].object),delete QA[X];delete b[gA]}delete E[Y]}}function U(Y){if(E[Y.id]===void 0)return;const b=E[Y.id];for(const gA in b){const QA=b[gA];for(const X in QA)h(QA[X].object),delete QA[X];delete b[gA]}delete E[Y.id]}function m(Y){for(const b in E){const gA=E[b];if(gA[Y.id]===void 0)continue;const QA=gA[Y.id];for(const X in QA)h(QA[X].object),delete QA[X];delete gA[Y.id]}}function v(){u(),s=!0,e!==t&&(e=t,D(e.object))}function u(){t.geometry=null,t.program=null,t.wireframe=!1}return{setup:o,reset:v,resetDefaultState:u,dispose:y,releaseStatesOfGeometry:U,releaseStatesOfProgram:m,initAttributes:G,enableAttribute:l,disableUnusedAttributes:N}}function eS(Q,A,I,g){const C=g.isWebGL2;let B;function i(e){B=e}function E(e,s){Q.drawArrays(B,e,s),I.update(s,B,1)}function t(e,s,o){if(o===0)return;let a,D;if(C)a=Q,D="drawArraysInstanced";else if(a=A.get("ANGLE_instanced_arrays"),D="drawArraysInstancedANGLE",a===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}a[D](B,e,s,o),I.update(s,B,o)}this.setMode=i,this.render=E,this.renderInstances=t}function aS(Q,A,I){let g;function C(){if(g!==void 0)return g;if(A.has("EXT_texture_filter_anisotropic")===!0){const p=A.get("EXT_texture_filter_anisotropic");g=Q.getParameter(p.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else g=0;return g}function B(p){if(p==="highp"){if(Q.getShaderPrecisionFormat(35633,36338).precision>0&&Q.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";p="mediump"}return p==="mediump"&&Q.getShaderPrecisionFormat(35633,36337).precision>0&&Q.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const i=typeof WebGL2RenderingContext<"u"&&Q.constructor.name==="WebGL2RenderingContext";let E=I.precision!==void 0?I.precision:"highp";const t=B(E);t!==E&&(console.warn("THREE.WebGLRenderer:",E,"not supported, using",t,"instead."),E=t);const e=i||A.has("WEBGL_draw_buffers"),s=I.logarithmicDepthBuffer===!0,o=Q.getParameter(34930),a=Q.getParameter(35660),D=Q.getParameter(3379),h=Q.getParameter(34076),c=Q.getParameter(34921),r=Q.getParameter(36347),n=Q.getParameter(36348),S=Q.getParameter(36349),G=a>0,l=i||A.has("OES_texture_float"),k=G&&l,N=i?Q.getParameter(36183):0;return{isWebGL2:i,drawBuffers:e,getMaxAnisotropy:C,getMaxPrecision:B,precision:E,logarithmicDepthBuffer:s,maxTextures:o,maxVertexTextures:a,maxTextureSize:D,maxCubemapSize:h,maxAttributes:c,maxVertexUniforms:r,maxVaryings:n,maxFragmentUniforms:S,vertexTextures:G,floatFragmentTextures:l,floatVertexTextures:k,maxSamples:N}}function sS(Q){const A=this;let I=null,g=0,C=!1,B=!1;const i=new DC,E=new zA,t={value:null,needsUpdate:!1};this.uniform=t,this.numPlanes=0,this.numIntersection=0,this.init=function(o,a){const D=o.length!==0||a||g!==0||C;return C=a,g=o.length,D},this.beginShadows=function(){B=!0,s(null)},this.endShadows=function(){B=!1},this.setGlobalState=function(o,a){I=s(o,a,0)},this.setState=function(o,a,D){const h=o.clippingPlanes,c=o.clipIntersection,r=o.clipShadows,n=Q.get(o);if(!C||h===null||h.length===0||B&&!r)B?s(null):e();else{const S=B?0:g,G=S*4;let l=n.clippingState||null;t.value=l,l=s(h,a,G,D);for(let k=0;k!==G;++k)l[k]=I[k];n.clippingState=l,this.numIntersection=c?this.numPlanes:0,this.numPlanes+=S}};function e(){t.value!==I&&(t.value=I,t.needsUpdate=g>0),A.numPlanes=g,A.numIntersection=0}function s(o,a,D,h){const c=o!==null?o.length:0;let r=null;if(c!==0){if(r=t.value,h!==!0||r===null){const n=D+c*4,S=a.matrixWorldInverse;E.getNormalMatrix(S),(r===null||r.length<n)&&(r=new Float32Array(n));for(let G=0,l=D;G!==c;++G,l+=4)i.copy(o[G]).applyMatrix4(S,E),i.normal.toArray(r,l),r[l+3]=i.constant}t.value=r,t.needsUpdate=!0}return A.numPlanes=c,A.numIntersection=0,r}}function DS(Q){let A=new WeakMap;function I(i,E){return E===pQ?i.mapping=wC:E===dQ&&(i.mapping=GC),i}function g(i){if(i&&i.isTexture&&i.isRenderTargetTexture===!1){const E=i.mapping;if(E===pQ||E===dQ)if(A.has(i)){const t=A.get(i).texture;return I(t,i.mapping)}else{const t=i.image;if(t&&t.height>0){const e=new Nn(t.height/2);return e.fromEquirectangularTexture(Q,i),A.set(i,e),i.addEventListener("dispose",C),I(e.texture,i.mapping)}else return null}}return i}function C(i){const E=i.target;E.removeEventListener("dispose",C);const t=A.get(E);t!==void 0&&(A.delete(E),t.dispose())}function B(){A=new WeakMap}return{get:g,dispose:B}}class gB extends $E{constructor(A=-1,I=1,g=1,C=-1,B=.1,i=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=A,this.right=I,this.top=g,this.bottom=C,this.near=B,this.far=i,this.updateProjectionMatrix()}copy(A,I){return super.copy(A,I),this.left=A.left,this.right=A.right,this.top=A.top,this.bottom=A.bottom,this.near=A.near,this.far=A.far,this.zoom=A.zoom,this.view=A.view===null?null:Object.assign({},A.view),this}setViewOffset(A,I,g,C,B,i){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=A,this.view.fullHeight=I,this.view.offsetX=g,this.view.offsetY=C,this.view.width=B,this.view.height=i,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const A=(this.right-this.left)/(2*this.zoom),I=(this.top-this.bottom)/(2*this.zoom),g=(this.right+this.left)/2,C=(this.top+this.bottom)/2;let B=g-A,i=g+A,E=C+I,t=C-I;if(this.view!==null&&this.view.enabled){const e=(this.right-this.left)/this.view.fullWidth/this.zoom,s=(this.top-this.bottom)/this.view.fullHeight/this.zoom;B+=e*this.view.offsetX,i=B+e*this.view.width,E-=s*this.view.offsetY,t=E-s*this.view.height}this.projectionMatrix.makeOrthographic(B,i,E,t,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(A){const I=super.toJSON(A);return I.object.zoom=this.zoom,I.object.left=this.left,I.object.right=this.right,I.object.top=this.top,I.object.bottom=this.bottom,I.object.near=this.near,I.object.far=this.far,this.view!==null&&(I.object.view=Object.assign({},this.view)),I}}const TB=4,is=[.125,.215,.35,.446,.526,.582],vC=20,Et=new gB,Es=new cA;let ot=null;const bC=(1+Math.sqrt(5))/2,JB=1/bC,os=[new K(1,1,1),new K(-1,1,1),new K(1,1,-1),new K(-1,1,-1),new K(0,bC,JB),new K(0,bC,-JB),new K(JB,0,bC),new K(-JB,0,bC),new K(bC,JB,0),new K(-bC,JB,0)];class ge{constructor(A){this._renderer=A,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(A,I=0,g=.1,C=100){ot=this._renderer.getRenderTarget(),this._setSize(256);const B=this._allocateTargets();return B.depthBuffer=!0,this._sceneToCubeUV(A,g,C,B),I>0&&this._blur(B,0,0,I),this._applyPMREM(B),this._cleanup(B),B}fromEquirectangular(A,I=null){return this._fromTexture(A,I)}fromCubemap(A,I=null){return this._fromTexture(A,I)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=as(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=es(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(A){this._lodMax=Math.floor(Math.log2(A)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let A=0;A<this._lodPlanes.length;A++)this._lodPlanes[A].dispose()}_cleanup(A){this._renderer.setRenderTarget(ot),A.scissorTest=!1,xi(A,0,0,A.width,A.height)}_fromTexture(A,I){A.mapping===wC||A.mapping===GC?this._setSize(A.image.length===0?16:A.image[0].width||A.image[0].image.width):this._setSize(A.image.width/4),ot=this._renderer.getRenderTarget();const g=I||this._allocateTargets();return this._textureToCubeUV(A,g),this._applyPMREM(g),this._cleanup(g),g}_allocateTargets(){const A=3*Math.max(this._cubeSize,112),I=4*this._cubeSize,g={magFilter:yI,minFilter:yI,generateMipmaps:!1,type:ZB,format:ag,encoding:yC,depthBuffer:!1},C=ts(A,I,g);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==A||this._pingPongRenderTarget.height!==I){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ts(A,I,g);const{_lodMax:B}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=nS(B)),this._blurMaterial=hS(B,A,I)}return C}_compileMaterial(A){const I=new FI(this._lodPlanes[0],A);this._renderer.compile(I,Et)}_sceneToCubeUV(A,I,g,C){const E=new YI(90,1,I,g),t=[1,-1,1,1,1,1],e=[1,1,1,-1,-1,-1],s=this._renderer,o=s.autoClear,a=s.toneMapping;s.getClearColor(Es),s.toneMapping=fg,s.autoClear=!1;const D=new JC({name:"PMREM.Background",side:$I,depthWrite:!1,depthTest:!1}),h=new FI(new xg,D);let c=!1;const r=A.background;r?r.isColor&&(D.color.copy(r),A.background=null,c=!0):(D.color.copy(Es),c=!0);for(let n=0;n<6;n++){const S=n%3;S===0?(E.up.set(0,t[n],0),E.lookAt(e[n],0,0)):S===1?(E.up.set(0,0,t[n]),E.lookAt(0,e[n],0)):(E.up.set(0,t[n],0),E.lookAt(0,0,e[n]));const G=this._cubeSize;xi(C,S*G,n>2?G:0,G,G),s.setRenderTarget(C),c&&s.render(h,E),s.render(A,E)}h.geometry.dispose(),h.material.dispose(),s.toneMapping=a,s.autoClear=o,A.background=r}_textureToCubeUV(A,I){const g=this._renderer,C=A.mapping===wC||A.mapping===GC;C?(this._cubemapMaterial===null&&(this._cubemapMaterial=as()),this._cubemapMaterial.uniforms.flipEnvMap.value=A.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=es());const B=C?this._cubemapMaterial:this._equirectMaterial,i=new FI(this._lodPlanes[0],B),E=B.uniforms;E.envMap.value=A;const t=this._cubeSize;xi(I,0,0,3*t,2*t),g.setRenderTarget(I),g.render(i,Et)}_applyPMREM(A){const I=this._renderer,g=I.autoClear;I.autoClear=!1;for(let C=1;C<this._lodPlanes.length;C++){const B=Math.sqrt(this._sigmas[C]*this._sigmas[C]-this._sigmas[C-1]*this._sigmas[C-1]),i=os[(C-1)%os.length];this._blur(A,C-1,C,B,i)}I.autoClear=g}_blur(A,I,g,C,B){const i=this._pingPongRenderTarget;this._halfBlur(A,i,I,g,C,"latitudinal",B),this._halfBlur(i,A,g,g,C,"longitudinal",B)}_halfBlur(A,I,g,C,B,i,E){const t=this._renderer,e=this._blurMaterial;i!=="latitudinal"&&i!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const s=3,o=new FI(this._lodPlanes[C],e),a=e.uniforms,D=this._sizeLods[g]-1,h=isFinite(B)?Math.PI/(2*D):2*Math.PI/(2*vC-1),c=B/h,r=isFinite(B)?1+Math.floor(s*c):vC;r>vC&&console.warn(`sigmaRadians, ${B}, is too large and will clip, as it requested ${r} samples when the maximum is set to ${vC}`);const n=[];let S=0;for(let p=0;p<vC;++p){const F=p/c,y=Math.exp(-F*F/2);n.push(y),p===0?S+=y:p<r&&(S+=2*y)}for(let p=0;p<n.length;p++)n[p]=n[p]/S;a.envMap.value=A.texture,a.samples.value=r,a.weights.value=n,a.latitudinal.value=i==="latitudinal",E&&(a.poleAxis.value=E);const{_lodMax:G}=this;a.dTheta.value=h,a.mipInt.value=G-g;const l=this._sizeLods[C],k=3*l*(C>G-TB?C-G+TB:0),N=4*(this._cubeSize-l);xi(I,k,N,3*l,2*l),t.setRenderTarget(I),t.render(o,Et)}}function nS(Q){const A=[],I=[],g=[];let C=Q;const B=Q-TB+1+is.length;for(let i=0;i<B;i++){const E=Math.pow(2,C);I.push(E);let t=1/E;i>Q-TB?t=is[i-Q+TB-1]:i===0&&(t=0),g.push(t);const e=1/(E-2),s=-e,o=1+e,a=[s,s,o,s,o,o,s,s,o,o,s,o],D=6,h=6,c=3,r=2,n=1,S=new Float32Array(c*h*D),G=new Float32Array(r*h*D),l=new Float32Array(n*h*D);for(let N=0;N<D;N++){const p=N%3*2/3-1,F=N>2?0:-1,y=[p,F,0,p+2/3,F,0,p+2/3,F+1,0,p,F,0,p+2/3,F+1,0,p,F+1,0];S.set(y,c*h*N),G.set(a,r*h*N);const U=[N,N,N,N,N,N];l.set(U,n*h*N)}const k=new ZA;k.setAttribute("position",new aI(S,c)),k.setAttribute("uv",new aI(G,r)),k.setAttribute("faceIndex",new aI(l,n)),A.push(k),C>TB&&C--}return{lodPlanes:A,sizeLods:I,sigmas:g}}function ts(Q,A,I){const g=new ig(Q,A,I);return g.texture.mapping=AQ,g.texture.name="PMREM.cubeUv",g.scissorTest=!0,g}function xi(Q,A,I,g,C){Q.viewport.set(A,I,g,C),Q.scissor.set(A,I,g,C)}function hS(Q,A,I){const g=new Float32Array(vC),C=new K(0,1,0);return new ng({name:"SphericalGaussianBlur",defines:{n:vC,CUBEUV_TEXEL_WIDTH:1/A,CUBEUV_TEXEL_HEIGHT:1/I,CUBEUV_MAX_MIP:`${Q}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:g},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:C}},vertexShader:Je(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:zg,depthTest:!1,depthWrite:!1})}function es(){return new ng({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Je(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:zg,depthTest:!1,depthWrite:!1})}function as(){return new ng({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Je(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:zg,depthTest:!1,depthWrite:!1})}function Je(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function rS(Q){let A=new WeakMap,I=null;function g(E){if(E&&E.isTexture){const t=E.mapping,e=t===pQ||t===dQ,s=t===wC||t===GC;if(e||s)if(E.isRenderTargetTexture&&E.needsPMREMUpdate===!0){E.needsPMREMUpdate=!1;let o=A.get(E);return I===null&&(I=new ge(Q)),o=e?I.fromEquirectangular(E,o):I.fromCubemap(E,o),A.set(E,o),o.texture}else{if(A.has(E))return A.get(E).texture;{const o=E.image;if(e&&o&&o.height>0||s&&o&&C(o)){I===null&&(I=new ge(Q));const a=e?I.fromEquirectangular(E):I.fromCubemap(E);return A.set(E,a),E.addEventListener("dispose",B),a.texture}else return null}}}return E}function C(E){let t=0;const e=6;for(let s=0;s<e;s++)E[s]!==void 0&&t++;return t===e}function B(E){const t=E.target;t.removeEventListener("dispose",B);const e=A.get(t);e!==void 0&&(A.delete(t),e.dispose())}function i(){A=new WeakMap,I!==null&&(I.dispose(),I=null)}return{get:g,dispose:i}}function cS(Q){const A={};function I(g){if(A[g]!==void 0)return A[g];let C;switch(g){case"WEBGL_depth_texture":C=Q.getExtension("WEBGL_depth_texture")||Q.getExtension("MOZ_WEBGL_depth_texture")||Q.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":C=Q.getExtension("EXT_texture_filter_anisotropic")||Q.getExtension("MOZ_EXT_texture_filter_anisotropic")||Q.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":C=Q.getExtension("WEBGL_compressed_texture_s3tc")||Q.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||Q.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":C=Q.getExtension("WEBGL_compressed_texture_pvrtc")||Q.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:C=Q.getExtension(g)}return A[g]=C,C}return{has:function(g){return I(g)!==null},init:function(g){g.isWebGL2?I("EXT_color_buffer_float"):(I("WEBGL_depth_texture"),I("OES_texture_float"),I("OES_texture_half_float"),I("OES_texture_half_float_linear"),I("OES_standard_derivatives"),I("OES_element_index_uint"),I("OES_vertex_array_object"),I("ANGLE_instanced_arrays")),I("OES_texture_float_linear"),I("EXT_color_buffer_half_float"),I("WEBGL_multisampled_render_to_texture")},get:function(g){const C=I(g);return C===null&&console.warn("THREE.WebGLRenderer: "+g+" extension not supported."),C}}}function wS(Q,A,I,g){const C={},B=new WeakMap;function i(o){const a=o.target;a.index!==null&&A.remove(a.index);for(const h in a.attributes)A.remove(a.attributes[h]);a.removeEventListener("dispose",i),delete C[a.id];const D=B.get(a);D&&(A.remove(D),B.delete(a)),g.releaseStatesOfGeometry(a),a.isInstancedBufferGeometry===!0&&delete a._maxInstanceCount,I.memory.geometries--}function E(o,a){return C[a.id]===!0||(a.addEventListener("dispose",i),C[a.id]=!0,I.memory.geometries++),a}function t(o){const a=o.attributes;for(const h in a)A.update(a[h],34962);const D=o.morphAttributes;for(const h in D){const c=D[h];for(let r=0,n=c.length;r<n;r++)A.update(c[r],34962)}}function e(o){const a=[],D=o.index,h=o.attributes.position;let c=0;if(D!==null){const S=D.array;c=D.version;for(let G=0,l=S.length;G<l;G+=3){const k=S[G+0],N=S[G+1],p=S[G+2];a.push(k,N,N,p,p,k)}}else{const S=h.array;c=h.version;for(let G=0,l=S.length/3-1;G<l;G+=3){const k=G+0,N=G+1,p=G+2;a.push(k,N,N,p,p,k)}}const r=new(kn(a)?Ke:Ue)(a,1);r.version=c;const n=B.get(o);n&&A.remove(n),B.set(o,r)}function s(o){const a=B.get(o);if(a){const D=o.index;D!==null&&a.version<D.version&&e(o)}else e(o);return B.get(o)}return{get:E,update:t,getWireframeAttribute:s}}function GS(Q,A,I,g){const C=g.isWebGL2;let B;function i(a){B=a}let E,t;function e(a){E=a.type,t=a.bytesPerElement}function s(a,D){Q.drawElements(B,D,E,a*t),I.update(D,B,1)}function o(a,D,h){if(h===0)return;let c,r;if(C)c=Q,r="drawElementsInstanced";else if(c=A.get("ANGLE_instanced_arrays"),r="drawElementsInstancedANGLE",c===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}c[r](B,D,E,a*t,h),I.update(D,B,h)}this.setMode=i,this.setIndex=e,this.render=s,this.renderInstances=o}function SS(Q){const A={geometries:0,textures:0},I={frame:0,calls:0,triangles:0,points:0,lines:0};function g(B,i,E){switch(I.calls++,i){case 4:I.triangles+=E*(B/3);break;case 1:I.lines+=E*(B/2);break;case 3:I.lines+=E*(B-1);break;case 2:I.lines+=E*B;break;case 0:I.points+=E*B;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",i);break}}function C(){I.frame++,I.calls=0,I.triangles=0,I.points=0,I.lines=0}return{memory:A,render:I,programs:null,autoReset:!0,reset:C,update:g}}function lS(Q,A){return Q[0]-A[0]}function yS(Q,A){return Math.abs(A[1])-Math.abs(Q[1])}function kS(Q,A,I){const g={},C=new Float32Array(8),B=new WeakMap,i=new EI,E=[];for(let e=0;e<8;e++)E[e]=[e,0];function t(e,s,o){const a=e.morphTargetInfluences;if(A.isWebGL2===!0){const D=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,h=D!==void 0?D.length:0;let c=B.get(s);if(c===void 0||c.count!==h){let Y=function(){v.dispose(),B.delete(s),s.removeEventListener("dispose",Y)};c!==void 0&&c.texture.dispose();const S=s.morphAttributes.position!==void 0,G=s.morphAttributes.normal!==void 0,l=s.morphAttributes.color!==void 0,k=s.morphAttributes.position||[],N=s.morphAttributes.normal||[],p=s.morphAttributes.color||[];let F=0;S===!0&&(F=1),G===!0&&(F=2),l===!0&&(F=3);let y=s.attributes.position.count*F,U=1;y>A.maxTextureSize&&(U=Math.ceil(y/A.maxTextureSize),y=A.maxTextureSize);const m=new Float32Array(y*U*4*h),v=new XE(m,y,U,h);v.type=Xg,v.needsUpdate=!0;const u=F*4;for(let b=0;b<h;b++){const gA=k[b],QA=N[b],X=p[b],CA=y*U*4*b;for(let oA=0;oA<gA.count;oA++){const MA=oA*u;S===!0&&(i.fromBufferAttribute(gA,oA),m[CA+MA+0]=i.x,m[CA+MA+1]=i.y,m[CA+MA+2]=i.z,m[CA+MA+3]=0),G===!0&&(i.fromBufferAttribute(QA,oA),m[CA+MA+4]=i.x,m[CA+MA+5]=i.y,m[CA+MA+6]=i.z,m[CA+MA+7]=0),l===!0&&(i.fromBufferAttribute(X,oA),m[CA+MA+8]=i.x,m[CA+MA+9]=i.y,m[CA+MA+10]=i.z,m[CA+MA+11]=X.itemSize===4?i.w:1)}}c={count:h,texture:v,size:new z(y,U)},B.set(s,c),s.addEventListener("dispose",Y)}let r=0;for(let S=0;S<a.length;S++)r+=a[S];const n=s.morphTargetsRelative?1:1-r;o.getUniforms().setValue(Q,"morphTargetBaseInfluence",n),o.getUniforms().setValue(Q,"morphTargetInfluences",a),o.getUniforms().setValue(Q,"morphTargetsTexture",c.texture,I),o.getUniforms().setValue(Q,"morphTargetsTextureSize",c.size)}else{const D=a===void 0?0:a.length;let h=g[s.id];if(h===void 0||h.length!==D){h=[];for(let G=0;G<D;G++)h[G]=[G,0];g[s.id]=h}for(let G=0;G<D;G++){const l=h[G];l[0]=G,l[1]=a[G]}h.sort(yS);for(let G=0;G<8;G++)G<D&&h[G][1]?(E[G][0]=h[G][0],E[G][1]=h[G][1]):(E[G][0]=Number.MAX_SAFE_INTEGER,E[G][1]=0);E.sort(lS);const c=s.morphAttributes.position,r=s.morphAttributes.normal;let n=0;for(let G=0;G<8;G++){const l=E[G],k=l[0],N=l[1];k!==Number.MAX_SAFE_INTEGER&&N?(c&&s.getAttribute("morphTarget"+G)!==c[k]&&s.setAttribute("morphTarget"+G,c[k]),r&&s.getAttribute("morphNormal"+G)!==r[k]&&s.setAttribute("morphNormal"+G,r[k]),C[G]=N,n+=N):(c&&s.hasAttribute("morphTarget"+G)===!0&&s.deleteAttribute("morphTarget"+G),r&&s.hasAttribute("morphNormal"+G)===!0&&s.deleteAttribute("morphNormal"+G),C[G]=0)}const S=s.morphTargetsRelative?1:1-n;o.getUniforms().setValue(Q,"morphTargetBaseInfluence",S),o.getUniforms().setValue(Q,"morphTargetInfluences",C)}}return{update:t}}function MS(Q,A,I,g){let C=new WeakMap;function B(t){const e=g.render.frame,s=t.geometry,o=A.get(t,s);return C.get(o)!==e&&(A.update(o),C.set(o,e)),t.isInstancedMesh&&(t.hasEventListener("dispose",E)===!1&&t.addEventListener("dispose",E),I.update(t.instanceMatrix,34962),t.instanceColor!==null&&I.update(t.instanceColor,34962)),o}function i(){C=new WeakMap}function E(t){const e=t.target;e.removeEventListener("dispose",E),I.remove(e.instanceMatrix),e.instanceColor!==null&&I.remove(e.instanceColor)}return{update:B,dispose:i}}const Fn=new MI,Rn=new XE,pn=new Me,dn=new Bi,ss=[],Ds=[],ns=new Float32Array(16),hs=new Float32Array(9),rs=new Float32Array(4);function gQ(Q,A,I){const g=Q[0];if(g<=0||g>0)return Q;const C=A*I;let B=ss[C];if(B===void 0&&(B=new Float32Array(C),ss[C]=B),A!==0){g.toArray(B,0);for(let i=1,E=0;i!==A;++i)E+=I,Q[i].toArray(B,E)}return B}function HI(Q,A){if(Q.length!==A.length)return!1;for(let I=0,g=Q.length;I<g;I++)if(Q[I]!==A[I])return!1;return!0}function mI(Q,A){for(let I=0,g=A.length;I<g;I++)Q[I]=A[I]}function Io(Q,A){let I=Ds[A];I===void 0&&(I=new Int32Array(A),Ds[A]=I);for(let g=0;g!==A;++g)I[g]=Q.allocateTextureUnit();return I}function US(Q,A){const I=this.cache;I[0]!==A&&(Q.uniform1f(this.addr,A),I[0]=A)}function KS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y)&&(Q.uniform2f(this.addr,A.x,A.y),I[0]=A.x,I[1]=A.y);else{if(HI(I,A))return;Q.uniform2fv(this.addr,A),mI(I,A)}}function NS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z)&&(Q.uniform3f(this.addr,A.x,A.y,A.z),I[0]=A.x,I[1]=A.y,I[2]=A.z);else if(A.r!==void 0)(I[0]!==A.r||I[1]!==A.g||I[2]!==A.b)&&(Q.uniform3f(this.addr,A.r,A.g,A.b),I[0]=A.r,I[1]=A.g,I[2]=A.b);else{if(HI(I,A))return;Q.uniform3fv(this.addr,A),mI(I,A)}}function JS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z||I[3]!==A.w)&&(Q.uniform4f(this.addr,A.x,A.y,A.z,A.w),I[0]=A.x,I[1]=A.y,I[2]=A.z,I[3]=A.w);else{if(HI(I,A))return;Q.uniform4fv(this.addr,A),mI(I,A)}}function FS(Q,A){const I=this.cache,g=A.elements;if(g===void 0){if(HI(I,A))return;Q.uniformMatrix2fv(this.addr,!1,A),mI(I,A)}else{if(HI(I,g))return;rs.set(g),Q.uniformMatrix2fv(this.addr,!1,rs),mI(I,g)}}function RS(Q,A){const I=this.cache,g=A.elements;if(g===void 0){if(HI(I,A))return;Q.uniformMatrix3fv(this.addr,!1,A),mI(I,A)}else{if(HI(I,g))return;hs.set(g),Q.uniformMatrix3fv(this.addr,!1,hs),mI(I,g)}}function pS(Q,A){const I=this.cache,g=A.elements;if(g===void 0){if(HI(I,A))return;Q.uniformMatrix4fv(this.addr,!1,A),mI(I,A)}else{if(HI(I,g))return;ns.set(g),Q.uniformMatrix4fv(this.addr,!1,ns),mI(I,g)}}function dS(Q,A){const I=this.cache;I[0]!==A&&(Q.uniform1i(this.addr,A),I[0]=A)}function qS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y)&&(Q.uniform2i(this.addr,A.x,A.y),I[0]=A.x,I[1]=A.y);else{if(HI(I,A))return;Q.uniform2iv(this.addr,A),mI(I,A)}}function fS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z)&&(Q.uniform3i(this.addr,A.x,A.y,A.z),I[0]=A.x,I[1]=A.y,I[2]=A.z);else{if(HI(I,A))return;Q.uniform3iv(this.addr,A),mI(I,A)}}function uS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z||I[3]!==A.w)&&(Q.uniform4i(this.addr,A.x,A.y,A.z,A.w),I[0]=A.x,I[1]=A.y,I[2]=A.z,I[3]=A.w);else{if(HI(I,A))return;Q.uniform4iv(this.addr,A),mI(I,A)}}function YS(Q,A){const I=this.cache;I[0]!==A&&(Q.uniform1ui(this.addr,A),I[0]=A)}function LS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y)&&(Q.uniform2ui(this.addr,A.x,A.y),I[0]=A.x,I[1]=A.y);else{if(HI(I,A))return;Q.uniform2uiv(this.addr,A),mI(I,A)}}function HS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z)&&(Q.uniform3ui(this.addr,A.x,A.y,A.z),I[0]=A.x,I[1]=A.y,I[2]=A.z);else{if(HI(I,A))return;Q.uniform3uiv(this.addr,A),mI(I,A)}}function mS(Q,A){const I=this.cache;if(A.x!==void 0)(I[0]!==A.x||I[1]!==A.y||I[2]!==A.z||I[3]!==A.w)&&(Q.uniform4ui(this.addr,A.x,A.y,A.z,A.w),I[0]=A.x,I[1]=A.y,I[2]=A.z,I[3]=A.w);else{if(HI(I,A))return;Q.uniform4uiv(this.addr,A),mI(I,A)}}function TS(Q,A,I){const g=this.cache,C=I.allocateTextureUnit();g[0]!==C&&(Q.uniform1i(this.addr,C),g[0]=C),I.setTexture2D(A||Fn,C)}function xS(Q,A,I){const g=this.cache,C=I.allocateTextureUnit();g[0]!==C&&(Q.uniform1i(this.addr,C),g[0]=C),I.setTexture3D(A||pn,C)}function bS(Q,A,I){const g=this.cache,C=I.allocateTextureUnit();g[0]!==C&&(Q.uniform1i(this.addr,C),g[0]=C),I.setTextureCube(A||dn,C)}function OS(Q,A,I){const g=this.cache,C=I.allocateTextureUnit();g[0]!==C&&(Q.uniform1i(this.addr,C),g[0]=C),I.setTexture2DArray(A||Rn,C)}function vS(Q){switch(Q){case 5126:return US;case 35664:return KS;case 35665:return NS;case 35666:return JS;case 35674:return FS;case 35675:return RS;case 35676:return pS;case 5124:case 35670:return dS;case 35667:case 35671:return qS;case 35668:case 35672:return fS;case 35669:case 35673:return uS;case 5125:return YS;case 36294:return LS;case 36295:return HS;case 36296:return mS;case 35678:case 36198:case 36298:case 36306:case 35682:return TS;case 35679:case 36299:case 36307:return xS;case 35680:case 36300:case 36308:case 36293:return bS;case 36289:case 36303:case 36311:case 36292:return OS}}function ZS(Q,A){Q.uniform1fv(this.addr,A)}function WS(Q,A){const I=gQ(A,this.size,2);Q.uniform2fv(this.addr,I)}function PS(Q,A){const I=gQ(A,this.size,3);Q.uniform3fv(this.addr,I)}function _S(Q,A){const I=gQ(A,this.size,4);Q.uniform4fv(this.addr,I)}function jS(Q,A){const I=gQ(A,this.size,4);Q.uniformMatrix2fv(this.addr,!1,I)}function VS(Q,A){const I=gQ(A,this.size,9);Q.uniformMatrix3fv(this.addr,!1,I)}function XS(Q,A){const I=gQ(A,this.size,16);Q.uniformMatrix4fv(this.addr,!1,I)}function zS(Q,A){Q.uniform1iv(this.addr,A)}function $S(Q,A){Q.uniform2iv(this.addr,A)}function Al(Q,A){Q.uniform3iv(this.addr,A)}function Il(Q,A){Q.uniform4iv(this.addr,A)}function gl(Q,A){Q.uniform1uiv(this.addr,A)}function Cl(Q,A){Q.uniform2uiv(this.addr,A)}function Bl(Q,A){Q.uniform3uiv(this.addr,A)}function Ql(Q,A){Q.uniform4uiv(this.addr,A)}function il(Q,A,I){const g=this.cache,C=A.length,B=Io(I,C);HI(g,B)||(Q.uniform1iv(this.addr,B),mI(g,B));for(let i=0;i!==C;++i)I.setTexture2D(A[i]||Fn,B[i])}function El(Q,A,I){const g=this.cache,C=A.length,B=Io(I,C);HI(g,B)||(Q.uniform1iv(this.addr,B),mI(g,B));for(let i=0;i!==C;++i)I.setTexture3D(A[i]||pn,B[i])}function ol(Q,A,I){const g=this.cache,C=A.length,B=Io(I,C);HI(g,B)||(Q.uniform1iv(this.addr,B),mI(g,B));for(let i=0;i!==C;++i)I.setTextureCube(A[i]||dn,B[i])}function tl(Q,A,I){const g=this.cache,C=A.length,B=Io(I,C);HI(g,B)||(Q.uniform1iv(this.addr,B),mI(g,B));for(let i=0;i!==C;++i)I.setTexture2DArray(A[i]||Rn,B[i])}function el(Q){switch(Q){case 5126:return ZS;case 35664:return WS;case 35665:return PS;case 35666:return _S;case 35674:return jS;case 35675:return VS;case 35676:return XS;case 5124:case 35670:return zS;case 35667:case 35671:return $S;case 35668:case 35672:return Al;case 35669:case 35673:return Il;case 5125:return gl;case 36294:return Cl;case 36295:return Bl;case 36296:return Ql;case 35678:case 36198:case 36298:case 36306:case 35682:return il;case 35679:case 36299:case 36307:return El;case 35680:case 36300:case 36308:case 36293:return ol;case 36289:case 36303:case 36311:case 36292:return tl}}class al{constructor(A,I,g){this.id=A,this.addr=g,this.cache=[],this.setValue=vS(I.type)}}class sl{constructor(A,I,g){this.id=A,this.addr=g,this.cache=[],this.size=I.size,this.setValue=el(I.type)}}class Dl{constructor(A){this.id=A,this.seq=[],this.map={}}setValue(A,I,g){const C=this.seq;for(let B=0,i=C.length;B!==i;++B){const E=C[B];E.setValue(A,I[E.id],g)}}}const tt=/(\w+)(\])?(\[|\.)?/g;function cs(Q,A){Q.seq.push(A),Q.map[A.id]=A}function nl(Q,A,I){const g=Q.name,C=g.length;for(tt.lastIndex=0;;){const B=tt.exec(g),i=tt.lastIndex;let E=B[1];const t=B[2]==="]",e=B[3];if(t&&(E=E|0),e===void 0||e==="["&&i+2===C){cs(I,e===void 0?new al(E,Q,A):new sl(E,Q,A));break}else{let o=I.map[E];o===void 0&&(o=new Dl(E),cs(I,o)),I=o}}}class SE{constructor(A,I){this.seq=[],this.map={};const g=A.getProgramParameter(I,35718);for(let C=0;C<g;++C){const B=A.getActiveUniform(I,C),i=A.getUniformLocation(I,B.name);nl(B,i,this)}}setValue(A,I,g,C){const B=this.map[I];B!==void 0&&B.setValue(A,g,C)}setOptional(A,I,g){const C=I[g];C!==void 0&&this.setValue(A,g,C)}static upload(A,I,g,C){for(let B=0,i=I.length;B!==i;++B){const E=I[B],t=g[E.id];t.needsUpdate!==!1&&E.setValue(A,t.value,C)}}static seqWithValue(A,I){const g=[];for(let C=0,B=A.length;C!==B;++C){const i=A[C];i.id in I&&g.push(i)}return g}}function ws(Q,A,I){const g=Q.createShader(A);return Q.shaderSource(g,I),Q.compileShader(g),g}let hl=0;function rl(Q,A){const I=Q.split(`
`),g=[],C=Math.max(A-6,0),B=Math.min(A+6,I.length);for(let i=C;i<B;i++){const E=i+1;g.push(`${E===A?">":" "} ${E}: ${I[i]}`)}return g.join(`
`)}function cl(Q){switch(Q){case yC:return["Linear","( value )"];case sI:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",Q),["Linear","( value )"]}}function Gs(Q,A,I){const g=Q.getShaderParameter(A,35713),C=Q.getShaderInfoLog(A).trim();if(g&&C==="")return"";const B=/ERROR: 0:(\d+)/.exec(C);if(B){const i=parseInt(B[1]);return I.toUpperCase()+`

`+C+`

`+rl(Q.getShaderSource(A),i)}else return C}function wl(Q,A){const I=cl(A);return"vec4 "+Q+"( vec4 value ) { return LinearTo"+I[0]+I[1]+"; }"}function Gl(Q,A){let I;switch(A){case PD:I="Linear";break;case _D:I="Reinhard";break;case jD:I="OptimizedCineon";break;case VD:I="ACESFilmic";break;case XD:I="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",A),I="Linear"}return"vec3 "+Q+"( vec3 color ) { return "+I+"ToneMapping( color ); }"}function Sl(Q){return[Q.extensionDerivatives||Q.envMapCubeUVHeight||Q.bumpMap||Q.normalMapTangentSpace||Q.clearcoatNormalMap||Q.flatShading||Q.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(Q.extensionFragDepth||Q.logarithmicDepthBuffer)&&Q.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",Q.extensionDrawBuffers&&Q.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(Q.extensionShaderTextureLOD||Q.envMap||Q.transmission)&&Q.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(MQ).join(`
`)}function ll(Q){const A=[];for(const I in Q){const g=Q[I];g!==!1&&A.push("#define "+I+" "+g)}return A.join(`
`)}function yl(Q,A){const I={},g=Q.getProgramParameter(A,35721);for(let C=0;C<g;C++){const B=Q.getActiveAttrib(A,C),i=B.name;let E=1;B.type===35674&&(E=2),B.type===35675&&(E=3),B.type===35676&&(E=4),I[i]={type:B.type,location:Q.getAttribLocation(A,i),locationSize:E}}return I}function MQ(Q){return Q!==""}function Ss(Q,A){const I=A.numSpotLightShadows+A.numSpotLightMaps-A.numSpotLightShadowsWithMaps;return Q.replace(/NUM_DIR_LIGHTS/g,A.numDirLights).replace(/NUM_SPOT_LIGHTS/g,A.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,A.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,I).replace(/NUM_RECT_AREA_LIGHTS/g,A.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,A.numPointLights).replace(/NUM_HEMI_LIGHTS/g,A.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,A.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,A.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,A.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,A.numPointLightShadows)}function ls(Q,A){return Q.replace(/NUM_CLIPPING_PLANES/g,A.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,A.numClippingPlanes-A.numClipIntersection)}const kl=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ce(Q){return Q.replace(kl,Ml)}function Ml(Q,A){const I=OA[A];if(I===void 0)throw new Error("Can not resolve #include <"+A+">");return Ce(I)}const Ul=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ys(Q){return Q.replace(Ul,Kl)}function Kl(Q,A,I,g){let C="";for(let B=parseInt(A);B<parseInt(I);B++)C+=g.replace(/\[\s*i\s*\]/g,"[ "+B+" ]").replace(/UNROLLED_LOOP_INDEX/g,B);return C}function ks(Q){let A="precision "+Q.precision+` float;
precision `+Q.precision+" int;";return Q.precision==="highp"?A+=`
#define HIGH_PRECISION`:Q.precision==="mediump"?A+=`
#define MEDIUM_PRECISION`:Q.precision==="lowp"&&(A+=`
#define LOW_PRECISION`),A}function Nl(Q){let A="SHADOWMAP_TYPE_BASIC";return Q.shadowMapType===he?A="SHADOWMAP_TYPE_PCF":Q.shadowMapType===UD?A="SHADOWMAP_TYPE_PCF_SOFT":Q.shadowMapType===HB&&(A="SHADOWMAP_TYPE_VSM"),A}function Jl(Q){let A="ENVMAP_TYPE_CUBE";if(Q.envMap)switch(Q.envMapMode){case wC:case GC:A="ENVMAP_TYPE_CUBE";break;case AQ:A="ENVMAP_TYPE_CUBE_UV";break}return A}function Fl(Q){let A="ENVMAP_MODE_REFLECTION";if(Q.envMap)switch(Q.envMapMode){case GC:A="ENVMAP_MODE_REFRACTION";break}return A}function Rl(Q){let A="ENVMAP_BLENDING_NONE";if(Q.envMap)switch(Q.combine){case Ii:A="ENVMAP_BLENDING_MULTIPLY";break;case ZD:A="ENVMAP_BLENDING_MIX";break;case WD:A="ENVMAP_BLENDING_ADD";break}return A}function pl(Q){const A=Q.envMapCubeUVHeight;if(A===null)return null;const I=Math.log2(A)-2,g=1/A;return{texelWidth:1/(3*Math.max(Math.pow(2,I),7*16)),texelHeight:g,maxMip:I}}function dl(Q,A,I,g){const C=Q.getContext(),B=I.defines;let i=I.vertexShader,E=I.fragmentShader;const t=Nl(I),e=Jl(I),s=Fl(I),o=Rl(I),a=pl(I),D=I.isWebGL2?"":Sl(I),h=ll(B),c=C.createProgram();let r,n,S=I.glslVersion?"#version "+I.glslVersion+`
`:"";I.isRawShaderMaterial?(r=[h].filter(MQ).join(`
`),r.length>0&&(r+=`
`),n=[D,h].filter(MQ).join(`
`),n.length>0&&(n+=`
`)):(r=[ks(I),"#define SHADER_NAME "+I.shaderName,h,I.instancing?"#define USE_INSTANCING":"",I.instancingColor?"#define USE_INSTANCING_COLOR":"",I.useFog&&I.fog?"#define USE_FOG":"",I.useFog&&I.fogExp2?"#define FOG_EXP2":"",I.map?"#define USE_MAP":"",I.envMap?"#define USE_ENVMAP":"",I.envMap?"#define "+s:"",I.lightMap?"#define USE_LIGHTMAP":"",I.aoMap?"#define USE_AOMAP":"",I.bumpMap?"#define USE_BUMPMAP":"",I.normalMap?"#define USE_NORMALMAP":"",I.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",I.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",I.displacementMap?"#define USE_DISPLACEMENTMAP":"",I.emissiveMap?"#define USE_EMISSIVEMAP":"",I.clearcoatMap?"#define USE_CLEARCOATMAP":"",I.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",I.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",I.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",I.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",I.specularMap?"#define USE_SPECULARMAP":"",I.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",I.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",I.roughnessMap?"#define USE_ROUGHNESSMAP":"",I.metalnessMap?"#define USE_METALNESSMAP":"",I.alphaMap?"#define USE_ALPHAMAP":"",I.transmission?"#define USE_TRANSMISSION":"",I.transmissionMap?"#define USE_TRANSMISSIONMAP":"",I.thicknessMap?"#define USE_THICKNESSMAP":"",I.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",I.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",I.mapUv?"#define MAP_UV "+I.mapUv:"",I.alphaMapUv?"#define ALPHAMAP_UV "+I.alphaMapUv:"",I.lightMapUv?"#define LIGHTMAP_UV "+I.lightMapUv:"",I.aoMapUv?"#define AOMAP_UV "+I.aoMapUv:"",I.emissiveMapUv?"#define EMISSIVEMAP_UV "+I.emissiveMapUv:"",I.bumpMapUv?"#define BUMPMAP_UV "+I.bumpMapUv:"",I.normalMapUv?"#define NORMALMAP_UV "+I.normalMapUv:"",I.displacementMapUv?"#define DISPLACEMENTMAP_UV "+I.displacementMapUv:"",I.metalnessMapUv?"#define METALNESSMAP_UV "+I.metalnessMapUv:"",I.roughnessMapUv?"#define ROUGHNESSMAP_UV "+I.roughnessMapUv:"",I.clearcoatMapUv?"#define CLEARCOATMAP_UV "+I.clearcoatMapUv:"",I.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+I.clearcoatNormalMapUv:"",I.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+I.clearcoatRoughnessMapUv:"",I.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+I.iridescenceMapUv:"",I.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+I.iridescenceThicknessMapUv:"",I.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+I.sheenColorMapUv:"",I.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+I.sheenRoughnessMapUv:"",I.specularMapUv?"#define SPECULARMAP_UV "+I.specularMapUv:"",I.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+I.specularColorMapUv:"",I.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+I.specularIntensityMapUv:"",I.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+I.transmissionMapUv:"",I.thicknessMapUv?"#define THICKNESSMAP_UV "+I.thicknessMapUv:"",I.vertexTangents?"#define USE_TANGENT":"",I.vertexColors?"#define USE_COLOR":"",I.vertexAlphas?"#define USE_COLOR_ALPHA":"",I.vertexUvs2?"#define USE_UV2":"",I.pointsUvs?"#define USE_POINTS_UV":"",I.flatShading?"#define FLAT_SHADED":"",I.skinning?"#define USE_SKINNING":"",I.morphTargets?"#define USE_MORPHTARGETS":"",I.morphNormals&&I.flatShading===!1?"#define USE_MORPHNORMALS":"",I.morphColors&&I.isWebGL2?"#define USE_MORPHCOLORS":"",I.morphTargetsCount>0&&I.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",I.morphTargetsCount>0&&I.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+I.morphTextureStride:"",I.morphTargetsCount>0&&I.isWebGL2?"#define MORPHTARGETS_COUNT "+I.morphTargetsCount:"",I.doubleSided?"#define DOUBLE_SIDED":"",I.flipSided?"#define FLIP_SIDED":"",I.shadowMapEnabled?"#define USE_SHADOWMAP":"",I.shadowMapEnabled?"#define "+t:"",I.sizeAttenuation?"#define USE_SIZEATTENUATION":"",I.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",I.logarithmicDepthBuffer&&I.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(MQ).join(`
`),n=[D,ks(I),"#define SHADER_NAME "+I.shaderName,h,I.useFog&&I.fog?"#define USE_FOG":"",I.useFog&&I.fogExp2?"#define FOG_EXP2":"",I.map?"#define USE_MAP":"",I.matcap?"#define USE_MATCAP":"",I.envMap?"#define USE_ENVMAP":"",I.envMap?"#define "+e:"",I.envMap?"#define "+s:"",I.envMap?"#define "+o:"",a?"#define CUBEUV_TEXEL_WIDTH "+a.texelWidth:"",a?"#define CUBEUV_TEXEL_HEIGHT "+a.texelHeight:"",a?"#define CUBEUV_MAX_MIP "+a.maxMip+".0":"",I.lightMap?"#define USE_LIGHTMAP":"",I.aoMap?"#define USE_AOMAP":"",I.bumpMap?"#define USE_BUMPMAP":"",I.normalMap?"#define USE_NORMALMAP":"",I.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",I.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",I.emissiveMap?"#define USE_EMISSIVEMAP":"",I.clearcoat?"#define USE_CLEARCOAT":"",I.clearcoatMap?"#define USE_CLEARCOATMAP":"",I.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",I.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",I.iridescence?"#define USE_IRIDESCENCE":"",I.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",I.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",I.specularMap?"#define USE_SPECULARMAP":"",I.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",I.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",I.roughnessMap?"#define USE_ROUGHNESSMAP":"",I.metalnessMap?"#define USE_METALNESSMAP":"",I.alphaMap?"#define USE_ALPHAMAP":"",I.alphaTest?"#define USE_ALPHATEST":"",I.sheen?"#define USE_SHEEN":"",I.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",I.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",I.transmission?"#define USE_TRANSMISSION":"",I.transmissionMap?"#define USE_TRANSMISSIONMAP":"",I.thicknessMap?"#define USE_THICKNESSMAP":"",I.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",I.vertexTangents?"#define USE_TANGENT":"",I.vertexColors||I.instancingColor?"#define USE_COLOR":"",I.vertexAlphas?"#define USE_COLOR_ALPHA":"",I.vertexUvs2?"#define USE_UV2":"",I.pointsUvs?"#define USE_POINTS_UV":"",I.gradientMap?"#define USE_GRADIENTMAP":"",I.flatShading?"#define FLAT_SHADED":"",I.doubleSided?"#define DOUBLE_SIDED":"",I.flipSided?"#define FLIP_SIDED":"",I.shadowMapEnabled?"#define USE_SHADOWMAP":"",I.shadowMapEnabled?"#define "+t:"",I.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",I.useLegacyLights?"#define LEGACY_LIGHTS":"",I.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",I.logarithmicDepthBuffer&&I.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",I.toneMapping!==fg?"#define TONE_MAPPING":"",I.toneMapping!==fg?OA.tonemapping_pars_fragment:"",I.toneMapping!==fg?Gl("toneMapping",I.toneMapping):"",I.dithering?"#define DITHERING":"",I.opaque?"#define OPAQUE":"",OA.encodings_pars_fragment,wl("linearToOutputTexel",I.outputEncoding),I.useDepthPacking?"#define DEPTH_PACKING "+I.depthPacking:"",`
`].filter(MQ).join(`
`)),i=Ce(i),i=Ss(i,I),i=ls(i,I),E=Ce(E),E=Ss(E,I),E=ls(E,I),i=ys(i),E=ys(E),I.isWebGL2&&I.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,r=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+r,n=["#define varying in",I.glslVersion===Ae?"":"layout(location = 0) out highp vec4 pc_fragColor;",I.glslVersion===Ae?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+n);const G=S+r+i,l=S+n+E,k=ws(C,35633,G),N=ws(C,35632,l);if(C.attachShader(c,k),C.attachShader(c,N),I.index0AttributeName!==void 0?C.bindAttribLocation(c,0,I.index0AttributeName):I.morphTargets===!0&&C.bindAttribLocation(c,0,"position"),C.linkProgram(c),Q.debug.checkShaderErrors){const y=C.getProgramInfoLog(c).trim(),U=C.getShaderInfoLog(k).trim(),m=C.getShaderInfoLog(N).trim();let v=!0,u=!0;if(C.getProgramParameter(c,35714)===!1)if(v=!1,typeof Q.debug.onShaderError=="function")Q.debug.onShaderError(C,c,k,N);else{const Y=Gs(C,k,"vertex"),b=Gs(C,N,"fragment");console.error("THREE.WebGLProgram: Shader Error "+C.getError()+" - VALIDATE_STATUS "+C.getProgramParameter(c,35715)+`

Program Info Log: `+y+`
`+Y+`
`+b)}else y!==""?console.warn("THREE.WebGLProgram: Program Info Log:",y):(U===""||m==="")&&(u=!1);u&&(this.diagnostics={runnable:v,programLog:y,vertexShader:{log:U,prefix:r},fragmentShader:{log:m,prefix:n}})}C.deleteShader(k),C.deleteShader(N);let p;this.getUniforms=function(){return p===void 0&&(p=new SE(C,c)),p};let F;return this.getAttributes=function(){return F===void 0&&(F=yl(C,c)),F},this.destroy=function(){g.releaseStatesOfProgram(this),C.deleteProgram(c),this.program=void 0},this.name=I.shaderName,this.id=hl++,this.cacheKey=A,this.usedTimes=1,this.program=c,this.vertexShader=k,this.fragmentShader=N,this}let ql=0;class fl{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(A){const I=A.vertexShader,g=A.fragmentShader,C=this._getShaderStage(I),B=this._getShaderStage(g),i=this._getShaderCacheForMaterial(A);return i.has(C)===!1&&(i.add(C),C.usedTimes++),i.has(B)===!1&&(i.add(B),B.usedTimes++),this}remove(A){const I=this.materialCache.get(A);for(const g of I)g.usedTimes--,g.usedTimes===0&&this.shaderCache.delete(g.code);return this.materialCache.delete(A),this}getVertexShaderID(A){return this._getShaderStage(A.vertexShader).id}getFragmentShaderID(A){return this._getShaderStage(A.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(A){const I=this.materialCache;let g=I.get(A);return g===void 0&&(g=new Set,I.set(A,g)),g}_getShaderStage(A){const I=this.shaderCache;let g=I.get(A);return g===void 0&&(g=new ul(A),I.set(A,g)),g}}class ul{constructor(A){this.id=ql++,this.code=A,this.usedTimes=0}}function Yl(Q,A,I,g,C,B,i){const E=new zE,t=new fl,e=[],s=C.isWebGL2,o=C.logarithmicDepthBuffer,a=C.vertexTextures;let D=C.precision;const h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function c(y){return y===1?"uv2":"uv"}function r(y,U,m,v,u){const Y=v.fog,b=u.geometry,gA=y.isMeshStandardMaterial?v.environment:null,QA=(y.isMeshStandardMaterial?I:A).get(y.envMap||gA),X=QA&&QA.mapping===AQ?QA.image.height:null,CA=h[y.type];y.precision!==null&&(D=C.getMaxPrecision(y.precision),D!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",D,"instead."));const oA=b.morphAttributes.position||b.morphAttributes.normal||b.morphAttributes.color,MA=oA!==void 0?oA.length:0;let hA=0;b.morphAttributes.position!==void 0&&(hA=1),b.morphAttributes.normal!==void 0&&(hA=2),b.morphAttributes.color!==void 0&&(hA=3);let Z,$,DA,rA;if(CA){const wA=Kg[CA];Z=wA.vertexShader,$=wA.fragmentShader}else Z=y.vertexShader,$=y.fragmentShader,t.update(y),DA=t.getVertexShaderID(y),rA=t.getFragmentShaderID(y);const x=Q.getRenderTarget(),LA=u.isInstancedMesh===!0,HA=!!y.map,tA=!!y.matcap,KA=!!QA,AA=!!y.aoMap,j=!!y.lightMap,IA=!!y.bumpMap,SA=!!y.normalMap,sA=!!y.displacementMap,qA=!!y.emissiveMap,fA=!!y.metalnessMap,FA=!!y.roughnessMap,PA=y.clearcoat>0,QI=y.iridescence>0,R=y.sheen>0,M=y.transmission>0,O=PA&&!!y.clearcoatMap,BA=PA&&!!y.clearcoatNormalMap,EA=PA&&!!y.clearcoatRoughnessMap,nA=QI&&!!y.iridescenceMap,YA=QI&&!!y.iridescenceThicknessMap,GA=R&&!!y.sheenColorMap,_=R&&!!y.sheenRoughnessMap,UA=!!y.specularMap,RA=!!y.specularColorMap,uA=!!y.specularIntensityMap,lA=M&&!!y.transmissionMap,NA=M&&!!y.thicknessMap,AI=!!y.gradientMap,oI=!!y.alphaMap,UI=y.alphaTest>0,q=!!y.extensions,P=!!b.attributes.uv2;return{isWebGL2:s,shaderID:CA,shaderName:y.type,vertexShader:Z,fragmentShader:$,defines:y.defines,customVertexShaderID:DA,customFragmentShaderID:rA,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:D,instancing:LA,instancingColor:LA&&u.instanceColor!==null,supportsVertexTextures:a,outputEncoding:x===null?Q.outputEncoding:x.isXRRenderTarget===!0?x.texture.encoding:yC,map:HA,matcap:tA,envMap:KA,envMapMode:KA&&QA.mapping,envMapCubeUVHeight:X,aoMap:AA,lightMap:j,bumpMap:IA,normalMap:SA,displacementMap:a&&sA,emissiveMap:qA,normalMapObjectSpace:SA&&y.normalMapType===Gn,normalMapTangentSpace:SA&&y.normalMapType===NC,decodeVideoTexture:HA&&y.map.isVideoTexture===!0&&y.map.encoding===sI,metalnessMap:fA,roughnessMap:FA,clearcoat:PA,clearcoatMap:O,clearcoatNormalMap:BA,clearcoatRoughnessMap:EA,iridescence:QI,iridescenceMap:nA,iridescenceThicknessMap:YA,sheen:R,sheenColorMap:GA,sheenRoughnessMap:_,specularMap:UA,specularColorMap:RA,specularIntensityMap:uA,transmission:M,transmissionMap:lA,thicknessMap:NA,gradientMap:AI,opaque:y.transparent===!1&&y.blending===VC,alphaMap:oI,alphaTest:UI,combine:y.combine,mapUv:HA&&c(y.map.channel),aoMapUv:AA&&c(y.aoMap.channel),lightMapUv:j&&c(y.lightMap.channel),bumpMapUv:IA&&c(y.bumpMap.channel),normalMapUv:SA&&c(y.normalMap.channel),displacementMapUv:sA&&c(y.displacementMap.channel),emissiveMapUv:qA&&c(y.emissiveMap.channel),metalnessMapUv:fA&&c(y.metalnessMap.channel),roughnessMapUv:FA&&c(y.roughnessMap.channel),clearcoatMapUv:O&&c(y.clearcoatMap.channel),clearcoatNormalMapUv:BA&&c(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:EA&&c(y.clearcoatRoughnessMap.channel),iridescenceMapUv:nA&&c(y.iridescenceMap.channel),iridescenceThicknessMapUv:YA&&c(y.iridescenceThicknessMap.channel),sheenColorMapUv:GA&&c(y.sheenColorMap.channel),sheenRoughnessMapUv:_&&c(y.sheenRoughnessMap.channel),specularMapUv:UA&&c(y.specularMap.channel),specularColorMapUv:RA&&c(y.specularColorMap.channel),specularIntensityMapUv:uA&&c(y.specularIntensityMap.channel),transmissionMapUv:lA&&c(y.transmissionMap.channel),thicknessMapUv:NA&&c(y.thicknessMap.channel),alphaMapUv:oI&&c(y.alphaMap.channel),vertexTangents:SA&&!!b.attributes.tangent,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!b.attributes.color&&b.attributes.color.itemSize===4,vertexUvs2:P,pointsUvs:u.isPoints===!0&&!!b.attributes.uv&&(HA||oI),fog:!!Y,useFog:y.fog===!0,fogExp2:Y&&Y.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:o,skinning:u.isSkinnedMesh===!0,morphTargets:b.morphAttributes.position!==void 0,morphNormals:b.morphAttributes.normal!==void 0,morphColors:b.morphAttributes.color!==void 0,morphTargetsCount:MA,morphTextureStride:hA,numDirLights:U.directional.length,numPointLights:U.point.length,numSpotLights:U.spot.length,numSpotLightMaps:U.spotLightMap.length,numRectAreaLights:U.rectArea.length,numHemiLights:U.hemi.length,numDirLightShadows:U.directionalShadowMap.length,numPointLightShadows:U.pointShadowMap.length,numSpotLightShadows:U.spotShadowMap.length,numSpotLightShadowsWithMaps:U.numSpotLightShadowsWithMaps,numClippingPlanes:i.numPlanes,numClipIntersection:i.numIntersection,dithering:y.dithering,shadowMapEnabled:Q.shadowMap.enabled&&m.length>0,shadowMapType:Q.shadowMap.type,toneMapping:y.toneMapped?Q.toneMapping:fg,useLegacyLights:Q.useLegacyLights,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===qg,flipSided:y.side===$I,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionDerivatives:q&&y.extensions.derivatives===!0,extensionFragDepth:q&&y.extensions.fragDepth===!0,extensionDrawBuffers:q&&y.extensions.drawBuffers===!0,extensionShaderTextureLOD:q&&y.extensions.shaderTextureLOD===!0,rendererExtensionFragDepth:s||g.has("EXT_frag_depth"),rendererExtensionDrawBuffers:s||g.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:s||g.has("EXT_shader_texture_lod"),customProgramCacheKey:y.customProgramCacheKey()}}function n(y){const U=[];if(y.shaderID?U.push(y.shaderID):(U.push(y.customVertexShaderID),U.push(y.customFragmentShaderID)),y.defines!==void 0)for(const m in y.defines)U.push(m),U.push(y.defines[m]);return y.isRawShaderMaterial===!1&&(S(U,y),G(U,y),U.push(Q.outputEncoding)),U.push(y.customProgramCacheKey),U.join()}function S(y,U){y.push(U.precision),y.push(U.outputEncoding),y.push(U.envMapMode),y.push(U.envMapCubeUVHeight),y.push(U.mapUv),y.push(U.alphaMapUv),y.push(U.lightMapUv),y.push(U.aoMapUv),y.push(U.bumpMapUv),y.push(U.normalMapUv),y.push(U.displacementMapUv),y.push(U.emissiveMapUv),y.push(U.metalnessMapUv),y.push(U.roughnessMapUv),y.push(U.clearcoatMapUv),y.push(U.clearcoatNormalMapUv),y.push(U.clearcoatRoughnessMapUv),y.push(U.iridescenceMapUv),y.push(U.iridescenceThicknessMapUv),y.push(U.sheenColorMapUv),y.push(U.sheenRoughnessMapUv),y.push(U.specularMapUv),y.push(U.specularColorMapUv),y.push(U.specularIntensityMapUv),y.push(U.transmissionMapUv),y.push(U.thicknessMapUv),y.push(U.combine),y.push(U.fogExp2),y.push(U.sizeAttenuation),y.push(U.morphTargetsCount),y.push(U.morphAttributeCount),y.push(U.numDirLights),y.push(U.numPointLights),y.push(U.numSpotLights),y.push(U.numSpotLightMaps),y.push(U.numHemiLights),y.push(U.numRectAreaLights),y.push(U.numDirLightShadows),y.push(U.numPointLightShadows),y.push(U.numSpotLightShadows),y.push(U.numSpotLightShadowsWithMaps),y.push(U.shadowMapType),y.push(U.toneMapping),y.push(U.numClippingPlanes),y.push(U.numClipIntersection),y.push(U.depthPacking)}function G(y,U){E.disableAll(),U.isWebGL2&&E.enable(0),U.supportsVertexTextures&&E.enable(1),U.instancing&&E.enable(2),U.instancingColor&&E.enable(3),U.matcap&&E.enable(4),U.envMap&&E.enable(5),U.normalMapObjectSpace&&E.enable(6),U.normalMapTangentSpace&&E.enable(7),U.clearcoat&&E.enable(8),U.iridescence&&E.enable(9),U.alphaTest&&E.enable(10),U.vertexColors&&E.enable(11),U.vertexAlphas&&E.enable(12),U.vertexUvs2&&E.enable(13),U.vertexTangents&&E.enable(14),y.push(E.mask),E.disableAll(),U.fog&&E.enable(0),U.useFog&&E.enable(1),U.flatShading&&E.enable(2),U.logarithmicDepthBuffer&&E.enable(3),U.skinning&&E.enable(4),U.morphTargets&&E.enable(5),U.morphNormals&&E.enable(6),U.morphColors&&E.enable(7),U.premultipliedAlpha&&E.enable(8),U.shadowMapEnabled&&E.enable(9),U.useLegacyLights&&E.enable(10),U.doubleSided&&E.enable(11),U.flipSided&&E.enable(12),U.useDepthPacking&&E.enable(13),U.dithering&&E.enable(14),U.transmission&&E.enable(15),U.sheen&&E.enable(16),U.decodeVideoTexture&&E.enable(17),U.opaque&&E.enable(18),U.pointsUvs&&E.enable(19),y.push(E.mask)}function l(y){const U=h[y.type];let m;if(U){const v=Kg[U];m=Ne.clone(v.uniforms)}else m=y.uniforms;return m}function k(y,U){let m;for(let v=0,u=e.length;v<u;v++){const Y=e[v];if(Y.cacheKey===U){m=Y,++m.usedTimes;break}}return m===void 0&&(m=new dl(Q,U,y,B),e.push(m)),m}function N(y){if(--y.usedTimes===0){const U=e.indexOf(y);e[U]=e[e.length-1],e.pop(),y.destroy()}}function p(y){t.remove(y)}function F(){t.dispose()}return{getParameters:r,getProgramCacheKey:n,getUniforms:l,acquireProgram:k,releaseProgram:N,releaseShaderCache:p,programs:e,dispose:F}}function Ll(){let Q=new WeakMap;function A(B){let i=Q.get(B);return i===void 0&&(i={},Q.set(B,i)),i}function I(B){Q.delete(B)}function g(B,i,E){Q.get(B)[i]=E}function C(){Q=new WeakMap}return{get:A,remove:I,update:g,dispose:C}}function Hl(Q,A){return Q.groupOrder!==A.groupOrder?Q.groupOrder-A.groupOrder:Q.renderOrder!==A.renderOrder?Q.renderOrder-A.renderOrder:Q.material.id!==A.material.id?Q.material.id-A.material.id:Q.z!==A.z?Q.z-A.z:Q.id-A.id}function Ms(Q,A){return Q.groupOrder!==A.groupOrder?Q.groupOrder-A.groupOrder:Q.renderOrder!==A.renderOrder?Q.renderOrder-A.renderOrder:Q.z!==A.z?A.z-Q.z:Q.id-A.id}function Us(){const Q=[];let A=0;const I=[],g=[],C=[];function B(){A=0,I.length=0,g.length=0,C.length=0}function i(o,a,D,h,c,r){let n=Q[A];return n===void 0?(n={id:o.id,object:o,geometry:a,material:D,groupOrder:h,renderOrder:o.renderOrder,z:c,group:r},Q[A]=n):(n.id=o.id,n.object=o,n.geometry=a,n.material=D,n.groupOrder=h,n.renderOrder=o.renderOrder,n.z=c,n.group=r),A++,n}function E(o,a,D,h,c,r){const n=i(o,a,D,h,c,r);D.transmission>0?g.push(n):D.transparent===!0?C.push(n):I.push(n)}function t(o,a,D,h,c,r){const n=i(o,a,D,h,c,r);D.transmission>0?g.unshift(n):D.transparent===!0?C.unshift(n):I.unshift(n)}function e(o,a){I.length>1&&I.sort(o||Hl),g.length>1&&g.sort(a||Ms),C.length>1&&C.sort(a||Ms)}function s(){for(let o=A,a=Q.length;o<a;o++){const D=Q[o];if(D.id===null)break;D.id=null,D.object=null,D.geometry=null,D.material=null,D.group=null}}return{opaque:I,transmissive:g,transparent:C,init:B,push:E,unshift:t,finish:s,sort:e}}function ml(){let Q=new WeakMap;function A(g,C){const B=Q.get(g);let i;return B===void 0?(i=new Us,Q.set(g,[i])):C>=B.length?(i=new Us,B.push(i)):i=B[C],i}function I(){Q=new WeakMap}return{get:A,dispose:I}}function Tl(){const Q={};return{get:function(A){if(Q[A.id]!==void 0)return Q[A.id];let I;switch(A.type){case"DirectionalLight":I={direction:new K,color:new cA};break;case"SpotLight":I={position:new K,direction:new K,color:new cA,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":I={position:new K,color:new cA,distance:0,decay:0};break;case"HemisphereLight":I={direction:new K,skyColor:new cA,groundColor:new cA};break;case"RectAreaLight":I={color:new cA,position:new K,halfWidth:new K,halfHeight:new K};break}return Q[A.id]=I,I}}}function xl(){const Q={};return{get:function(A){if(Q[A.id]!==void 0)return Q[A.id];let I;switch(A.type){case"DirectionalLight":I={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z};break;case"SpotLight":I={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z};break;case"PointLight":I={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new z,shadowCameraNear:1,shadowCameraFar:1e3};break}return Q[A.id]=I,I}}}let bl=0;function Ol(Q,A){return(A.castShadow?2:0)-(Q.castShadow?2:0)+(A.map?1:0)-(Q.map?1:0)}function vl(Q,A){const I=new Tl,g=xl(),C={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let s=0;s<9;s++)C.probe.push(new K);const B=new K,i=new xA,E=new xA;function t(s,o){let a=0,D=0,h=0;for(let m=0;m<9;m++)C.probe[m].set(0,0,0);let c=0,r=0,n=0,S=0,G=0,l=0,k=0,N=0,p=0,F=0;s.sort(Ol);const y=o===!0?Math.PI:1;for(let m=0,v=s.length;m<v;m++){const u=s[m],Y=u.color,b=u.intensity,gA=u.distance,QA=u.shadow&&u.shadow.map?u.shadow.map.texture:null;if(u.isAmbientLight)a+=Y.r*b*y,D+=Y.g*b*y,h+=Y.b*b*y;else if(u.isLightProbe)for(let X=0;X<9;X++)C.probe[X].addScaledVector(u.sh.coefficients[X],b);else if(u.isDirectionalLight){const X=I.get(u);if(X.color.copy(u.color).multiplyScalar(u.intensity*y),u.castShadow){const CA=u.shadow,oA=g.get(u);oA.shadowBias=CA.bias,oA.shadowNormalBias=CA.normalBias,oA.shadowRadius=CA.radius,oA.shadowMapSize=CA.mapSize,C.directionalShadow[c]=oA,C.directionalShadowMap[c]=QA,C.directionalShadowMatrix[c]=u.shadow.matrix,l++}C.directional[c]=X,c++}else if(u.isSpotLight){const X=I.get(u);X.position.setFromMatrixPosition(u.matrixWorld),X.color.copy(Y).multiplyScalar(b*y),X.distance=gA,X.coneCos=Math.cos(u.angle),X.penumbraCos=Math.cos(u.angle*(1-u.penumbra)),X.decay=u.decay,C.spot[n]=X;const CA=u.shadow;if(u.map&&(C.spotLightMap[p]=u.map,p++,CA.updateMatrices(u),u.castShadow&&F++),C.spotLightMatrix[n]=CA.matrix,u.castShadow){const oA=g.get(u);oA.shadowBias=CA.bias,oA.shadowNormalBias=CA.normalBias,oA.shadowRadius=CA.radius,oA.shadowMapSize=CA.mapSize,C.spotShadow[n]=oA,C.spotShadowMap[n]=QA,N++}n++}else if(u.isRectAreaLight){const X=I.get(u);X.color.copy(Y).multiplyScalar(b),X.halfWidth.set(u.width*.5,0,0),X.halfHeight.set(0,u.height*.5,0),C.rectArea[S]=X,S++}else if(u.isPointLight){const X=I.get(u);if(X.color.copy(u.color).multiplyScalar(u.intensity*y),X.distance=u.distance,X.decay=u.decay,u.castShadow){const CA=u.shadow,oA=g.get(u);oA.shadowBias=CA.bias,oA.shadowNormalBias=CA.normalBias,oA.shadowRadius=CA.radius,oA.shadowMapSize=CA.mapSize,oA.shadowCameraNear=CA.camera.near,oA.shadowCameraFar=CA.camera.far,C.pointShadow[r]=oA,C.pointShadowMap[r]=QA,C.pointShadowMatrix[r]=u.shadow.matrix,k++}C.point[r]=X,r++}else if(u.isHemisphereLight){const X=I.get(u);X.skyColor.copy(u.color).multiplyScalar(b*y),X.groundColor.copy(u.groundColor).multiplyScalar(b*y),C.hemi[G]=X,G++}}S>0&&(A.isWebGL2||Q.has("OES_texture_float_linear")===!0?(C.rectAreaLTC1=eA.LTC_FLOAT_1,C.rectAreaLTC2=eA.LTC_FLOAT_2):Q.has("OES_texture_half_float_linear")===!0?(C.rectAreaLTC1=eA.LTC_HALF_1,C.rectAreaLTC2=eA.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),C.ambient[0]=a,C.ambient[1]=D,C.ambient[2]=h;const U=C.hash;(U.directionalLength!==c||U.pointLength!==r||U.spotLength!==n||U.rectAreaLength!==S||U.hemiLength!==G||U.numDirectionalShadows!==l||U.numPointShadows!==k||U.numSpotShadows!==N||U.numSpotMaps!==p)&&(C.directional.length=c,C.spot.length=n,C.rectArea.length=S,C.point.length=r,C.hemi.length=G,C.directionalShadow.length=l,C.directionalShadowMap.length=l,C.pointShadow.length=k,C.pointShadowMap.length=k,C.spotShadow.length=N,C.spotShadowMap.length=N,C.directionalShadowMatrix.length=l,C.pointShadowMatrix.length=k,C.spotLightMatrix.length=N+p-F,C.spotLightMap.length=p,C.numSpotLightShadowsWithMaps=F,U.directionalLength=c,U.pointLength=r,U.spotLength=n,U.rectAreaLength=S,U.hemiLength=G,U.numDirectionalShadows=l,U.numPointShadows=k,U.numSpotShadows=N,U.numSpotMaps=p,C.version=bl++)}function e(s,o){let a=0,D=0,h=0,c=0,r=0;const n=o.matrixWorldInverse;for(let S=0,G=s.length;S<G;S++){const l=s[S];if(l.isDirectionalLight){const k=C.directional[a];k.direction.setFromMatrixPosition(l.matrixWorld),B.setFromMatrixPosition(l.target.matrixWorld),k.direction.sub(B),k.direction.transformDirection(n),a++}else if(l.isSpotLight){const k=C.spot[h];k.position.setFromMatrixPosition(l.matrixWorld),k.position.applyMatrix4(n),k.direction.setFromMatrixPosition(l.matrixWorld),B.setFromMatrixPosition(l.target.matrixWorld),k.direction.sub(B),k.direction.transformDirection(n),h++}else if(l.isRectAreaLight){const k=C.rectArea[c];k.position.setFromMatrixPosition(l.matrixWorld),k.position.applyMatrix4(n),E.identity(),i.copy(l.matrixWorld),i.premultiply(n),E.extractRotation(i),k.halfWidth.set(l.width*.5,0,0),k.halfHeight.set(0,l.height*.5,0),k.halfWidth.applyMatrix4(E),k.halfHeight.applyMatrix4(E),c++}else if(l.isPointLight){const k=C.point[D];k.position.setFromMatrixPosition(l.matrixWorld),k.position.applyMatrix4(n),D++}else if(l.isHemisphereLight){const k=C.hemi[r];k.direction.setFromMatrixPosition(l.matrixWorld),k.direction.transformDirection(n),r++}}}return{setup:t,setupView:e,state:C}}function Ks(Q,A){const I=new vl(Q,A),g=[],C=[];function B(){g.length=0,C.length=0}function i(o){g.push(o)}function E(o){C.push(o)}function t(o){I.setup(g,o)}function e(o){I.setupView(g,o)}return{init:B,state:{lightsArray:g,shadowsArray:C,lights:I},setupLights:t,setupLightsView:e,pushLight:i,pushShadow:E}}function Zl(Q,A){let I=new WeakMap;function g(B,i=0){const E=I.get(B);let t;return E===void 0?(t=new Ks(Q,A),I.set(B,[t])):i>=E.length?(t=new Ks(Q,A),E.push(t)):t=E[i],t}function C(){I=new WeakMap}return{get:g,dispose:C}}class Fe extends PI{constructor(A){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cn,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(A)}copy(A){return super.copy(A),this.depthPacking=A.depthPacking,this.map=A.map,this.alphaMap=A.alphaMap,this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this}}class Re extends PI{constructor(A){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(A)}copy(A){return super.copy(A),this.map=A.map,this.alphaMap=A.alphaMap,this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this}}const Wl=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Pl=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );
			gl_FragColor.a *= opacity;


		}`};class Lo{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const GM=new gB(-1,1,1,-1,0,1),fa=new ZA;fa.setAttribute("position",new yA([-1,3,0,-1,-1,0,3,-1,0],3));fa.setAttribute("uv",new yA([0,2,0,0,2,0],2));class dh{constructor(A){this._mesh=new FI(fa,A)}dispose(){this._mesh.geometry.dispose()}render(A){A.render(this._mesh,GM)}get material(){return this._mesh.material}set material(A){this._mesh.material=A}}class SM extends Lo{constructor(A,I){super(),this.textureID=I!==void 0?I:"tDiffuse",A instanceof ng?(this.uniforms=A.uniforms,this.material=A):A&&(this.uniforms=Ne.clone(A.uniforms),this.material=new ng({defines:Object.assign({},A.defines),uniforms:this.uniforms,vertexShader:A.vertexShader,fragmentShader:A.fragmentShader})),this.fsQuad=new dh(this.material)}render(A,I,g){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=g.texture),this.fsQuad.material=this.material,this.renderToScreen?(A.setRenderTarget(null),this.fsQuad.render(A)):(A.setRenderTarget(I),this.clear&&A.clear(A.autoClearColor,A.autoClearDepth,A.autoClearStencil),this.fsQuad.render(A))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class wD extends Lo{constructor(A,I){super(),this.scene=A,this.camera=I,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(A,I,g){const C=A.getContext(),B=A.state;B.buffers.color.setMask(!1),B.buffers.depth.setMask(!1),B.buffers.color.setLocked(!0),B.buffers.depth.setLocked(!0);let i,E;this.inverse?(i=0,E=1):(i=1,E=0),B.buffers.stencil.setTest(!0),B.buffers.stencil.setOp(C.REPLACE,C.REPLACE,C.REPLACE),B.buffers.stencil.setFunc(C.ALWAYS,i,4294967295),B.buffers.stencil.setClear(E),B.buffers.stencil.setLocked(!0),A.setRenderTarget(g),this.clear&&A.clear(),A.render(this.scene,this.camera),A.setRenderTarget(I),this.clear&&A.clear(),A.render(this.scene,this.camera),B.buffers.color.setLocked(!1),B.buffers.depth.setLocked(!1),B.buffers.stencil.setLocked(!1),B.buffers.stencil.setFunc(C.EQUAL,1,4294967295),B.buffers.stencil.setOp(C.KEEP,C.KEEP,C.KEEP),B.buffers.stencil.setLocked(!0)}}class lM extends Lo{constructor(){super(),this.needsSwap=!1}render(A){A.state.buffers.stencil.setLocked(!1),A.state.buffers.stencil.setTest(!1)}}class yM{constructor(A,I){if(this.renderer=A,I===void 0){const g=A.getSize(new z);this._pixelRatio=A.getPixelRatio(),this._width=g.width,this._height=g.height,I=new ig(this._width*this._pixelRatio,this._height*this._pixelRatio),I.texture.name="EffectComposer.rt1"}else this._pixelRatio=1,this._width=I.width,this._height=I.height;this.renderTarget1=I,this.renderTarget2=I.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new SM(wM),this.clock=new so}swapBuffers(){const A=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=A}addPass(A){this.passes.push(A),A.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(A,I){this.passes.splice(I,0,A),A.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(A){const I=this.passes.indexOf(A);I!==-1&&this.passes.splice(I,1)}isLastEnabledPass(A){for(let I=A+1;I<this.passes.length;I++)if(this.passes[I].enabled)return!1;return!0}render(A){A===void 0&&(A=this.clock.getDelta());const I=this.renderer.getRenderTarget();let g=!1;for(let C=0,B=this.passes.length;C<B;C++){const i=this.passes[C];if(i.enabled!==!1){if(i.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(C),i.render(this.renderer,this.writeBuffer,this.readBuffer,A,g),i.needsSwap){if(g){const E=this.renderer.getContext(),t=this.renderer.state.buffers.stencil;t.setFunc(E.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,A),t.setFunc(E.EQUAL,1,4294967295)}this.swapBuffers()}wD!==void 0&&(i instanceof wD?g=!0:i instanceof lM&&(g=!1))}}this.renderer.setRenderTarget(I)}reset(A){if(A===void 0){const I=this.renderer.getSize(new z);this._pixelRatio=this.renderer.getPixelRatio(),this._width=I.width,this._height=I.height,A=this.renderTarget1.clone(),A.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=A,this.renderTarget2=A.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(A,I){this._width=A,this._height=I;const g=this._width*this._pixelRatio,C=this._height*this._pixelRatio;this.renderTarget1.setSize(g,C),this.renderTarget2.setSize(g,C);for(let B=0;B<this.passes.length;B++)this.passes[B].setSize(g,C)}setPixelRatio(A){this._pixelRatio=A,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class kM{constructor(A){aA(this,"cameraRig");aA(this,"camera");let I=A.x/A.y;const g=25,C=new K(0,0,g),B=AB.perspective;this.camera=this[B](I,C),this.cameraRig=new BI,this.cameraRig.position.set(0,0,g),this.cameraRig.add(this.camera),this.camera.lookAt(new K(0,0,0))}[pg.ThirdPerson](A){return console.warn("Third person camera not fully implemented"),new YI(45,A,.1,1e3)}[pg.Fixed2D](A,I){const g=I.z,C=I.distanceTo(new K(0,0,0)),B=new gB(g*A/-2,g*A/2,g/2,g/-2,.1,C*2);return B.position.copy(I),B}[pg.FirstPerson](){return console.warn("First person camera not fully implemented"),new YI(45,1,.1,1e3)}[pg.Flat2D](A,I){return console.warn("Flat2D camera not fully implemented"),this[pg.Fixed2D](A,I)}[pg.Isometric](A,I){console.warn("Isometric camera not fully implemented");const g=20,C=new gB(g*A/-2,g*A/2,g/2,g/-2,.1,I.z*2);return C.position.copy(I),C.lookAt(new K(0,0,0)),C.rotation.set(Math.atan(-1/Math.sqrt(2)),0,0,"YXZ"),C}update(){}moveFollowCamera(){}}class MM extends Lo{constructor(I,g,C){super();aA(this,"fsQuad");aA(this,"resolution");aA(this,"scene");aA(this,"camera");aA(this,"rgbRenderTarget");aA(this,"normalRenderTarget");aA(this,"normalMaterial");this.resolution=I,this.fsQuad=new dh(this.material()),this.scene=g,this.camera=C,this.rgbRenderTarget=new ig(I.x*4,I.y*4),this.normalRenderTarget=new ig(I.x*4,I.y*4),this.normalMaterial=new be}render(I,g){I.setRenderTarget(this.rgbRenderTarget),I.render(this.scene,this.camera);const C=this.scene.overrideMaterial;I.setRenderTarget(this.normalRenderTarget),this.scene.overrideMaterial=this.normalMaterial,I.render(this.scene,this.camera),this.scene.overrideMaterial=C;const B=this.fsQuad.material.uniforms;B.tDiffuse.value=this.rgbRenderTarget.texture,B.tDepth.value=this.rgbRenderTarget.depthTexture,B.tNormal.value=this.normalRenderTarget.texture,this.renderToScreen?I.setRenderTarget(null):I.setRenderTarget(g),this.fsQuad.render(I)}material(){return new ng({uniforms:{tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null},resolution:{value:new EI(this.resolution.x,this.resolution.y,1/this.resolution.x,1/this.resolution.y)}},vertexShader:`varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`uniform sampler2D tDiffuse;
			varying vec2 vUv;
			
			void main() {
				vec4 texel = texture2D( tDiffuse, vUv );
			
				gl_FragColor = texel;
			}`})}}function UM(Q,A){var I=Q==null?null:typeof Symbol<"u"&&Q[Symbol.iterator]||Q["@@iterator"];if(I!=null){var g,C,B,i,E=[],t=!0,e=!1;try{if(B=(I=I.call(Q)).next,A===0){if(Object(I)!==I)return;t=!1}else for(;!(t=(g=B.call(I)).done)&&(E.push(g.value),E.length!==A);t=!0);}catch(s){e=!0,C=s}finally{try{if(!t&&I.return!=null&&(i=I.return(),Object(i)!==i))return}finally{if(e)throw C}}return E}}function KM(Q,A){if(!(Q instanceof A))throw new TypeError("Cannot call a class as a function")}function GD(Q,A){for(var I=0;I<A.length;I++){var g=A[I];g.enumerable=g.enumerable||!1,g.configurable=!0,"value"in g&&(g.writable=!0),Object.defineProperty(Q,mM(g.key),g)}}function NM(Q,A,I){return A&&GD(Q.prototype,A),I&&GD(Q,I),Object.defineProperty(Q,"prototype",{writable:!1}),Q}function JM(Q,A){if(typeof A!="function"&&A!==null)throw new TypeError("Super expression must either be null or a function");Q.prototype=Object.create(A&&A.prototype,{constructor:{value:Q,writable:!0,configurable:!0}}),Object.defineProperty(Q,"prototype",{writable:!1}),A&&ae(Q,A)}function PE(Q){return PE=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(I){return I.__proto__||Object.getPrototypeOf(I)},PE(Q)}function ae(Q,A){return ae=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(g,C){return g.__proto__=C,g},ae(Q,A)}function FM(){if(typeof Reflect>"u"||!Reflect.construct||Reflect.construct.sham)return!1;if(typeof Proxy=="function")return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch{return!1}}function RM(Q){if(Q===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return Q}function pM(Q,A){if(A&&(typeof A=="object"||typeof A=="function"))return A;if(A!==void 0)throw new TypeError("Derived constructors may only return object or undefined");return RM(Q)}function dM(Q){var A=FM();return function(){var g=PE(Q),C;if(A){var B=PE(this).constructor;C=Reflect.construct(g,arguments,B)}else C=g.apply(this,arguments);return pM(this,C)}}function SD(Q,A){return fM(Q)||UM(Q,A)||qh(Q,A)||LM()}function eE(Q){return qM(Q)||uM(Q)||qh(Q)||YM()}function qM(Q){if(Array.isArray(Q))return se(Q)}function fM(Q){if(Array.isArray(Q))return Q}function uM(Q){if(typeof Symbol<"u"&&Q[Symbol.iterator]!=null||Q["@@iterator"]!=null)return Array.from(Q)}function qh(Q,A){if(Q){if(typeof Q=="string")return se(Q,A);var I=Object.prototype.toString.call(Q).slice(8,-1);if(I==="Object"&&Q.constructor&&(I=Q.constructor.name),I==="Map"||I==="Set")return Array.from(Q);if(I==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(I))return se(Q,A)}}function se(Q,A){(A==null||A>Q.length)&&(A=Q.length);for(var I=0,g=new Array(A);I<A;I++)g[I]=Q[I];return g}function YM(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function LM(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function HM(Q,A){if(typeof Q!="object"||Q===null)return Q;var I=Q[Symbol.toPrimitive];if(I!==void 0){var g=I.call(Q,A||"default");if(typeof g!="object")return g;throw new TypeError("@@toPrimitive must return a primitive value.")}return(A==="string"?String:Number)(Q)}function mM(Q){var A=HM(Q,"string");return typeof A=="symbol"?A:String(A)}var YB=typeof window<"u"&&window.THREE?window.THREE:{LinearFilter:yI,Sprite:Qo,SpriteMaterial:Qi,SRGBColorSpace:Sg,Texture:MI},TM=function(Q){JM(I,Q);var A=dM(I);function I(){var g,C=arguments.length>0&&arguments[0]!==void 0?arguments[0]:"",B=arguments.length>1&&arguments[1]!==void 0?arguments[1]:10,i=arguments.length>2&&arguments[2]!==void 0?arguments[2]:"rgba(255, 255, 255, 1)";return KM(this,I),g=A.call(this,new YB.SpriteMaterial),g._text="".concat(C),g._textHeight=B,g._color=i,g._backgroundColor=!1,g._padding=0,g._borderWidth=0,g._borderRadius=0,g._borderColor="white",g._strokeWidth=0,g._strokeColor="white",g._fontFace="system-ui",g._fontSize=90,g._fontWeight="normal",g._canvas=document.createElement("canvas"),g._genCanvas(),g}return NM(I,[{key:"text",get:function(){return this._text},set:function(C){this._text=C,this._genCanvas()}},{key:"textHeight",get:function(){return this._textHeight},set:function(C){this._textHeight=C,this._genCanvas()}},{key:"color",get:function(){return this._color},set:function(C){this._color=C,this._genCanvas()}},{key:"backgroundColor",get:function(){return this._backgroundColor},set:function(C){this._backgroundColor=C,this._genCanvas()}},{key:"padding",get:function(){return this._padding},set:function(C){this._padding=C,this._genCanvas()}},{key:"borderWidth",get:function(){return this._borderWidth},set:function(C){this._borderWidth=C,this._genCanvas()}},{key:"borderRadius",get:function(){return this._borderRadius},set:function(C){this._borderRadius=C,this._genCanvas()}},{key:"borderColor",get:function(){return this._borderColor},set:function(C){this._borderColor=C,this._genCanvas()}},{key:"fontFace",get:function(){return this._fontFace},set:function(C){this._fontFace=C,this._genCanvas()}},{key:"fontSize",get:function(){return this._fontSize},set:function(C){this._fontSize=C,this._genCanvas()}},{key:"fontWeight",get:function(){return this._fontWeight},set:function(C){this._fontWeight=C,this._genCanvas()}},{key:"strokeWidth",get:function(){return this._strokeWidth},set:function(C){this._strokeWidth=C,this._genCanvas()}},{key:"strokeColor",get:function(){return this._strokeColor},set:function(C){this._strokeColor=C,this._genCanvas()}},{key:"_genCanvas",value:function(){var C=this,B=this._canvas,i=B.getContext("2d"),E=Array.isArray(this.borderWidth)?this.borderWidth:[this.borderWidth,this.borderWidth],t=E.map(function(F){return F*C.fontSize*.1}),e=Array.isArray(this.borderRadius)?this.borderRadius:[this.borderRadius,this.borderRadius,this.borderRadius,this.borderRadius],s=e.map(function(F){return F*C.fontSize*.1}),o=Array.isArray(this.padding)?this.padding:[this.padding,this.padding],a=o.map(function(F){return F*C.fontSize*.1}),D=this.text.split(`
`),h="".concat(this.fontWeight," ").concat(this.fontSize,"px ").concat(this.fontFace);i.font=h;var c=Math.max.apply(Math,eE(D.map(function(F){return i.measureText(F).width}))),r=this.fontSize*D.length;if(B.width=c+t[0]*2+a[0]*2,B.height=r+t[1]*2+a[1]*2,this.borderWidth){if(i.strokeStyle=this.borderColor,t[0]){var n=t[0]/2;i.lineWidth=t[0],i.beginPath(),i.moveTo(n,s[0]),i.lineTo(n,B.height-s[3]),i.moveTo(B.width-n,s[1]),i.lineTo(B.width-n,B.height-s[2]),i.stroke()}if(t[1]){var S=t[1]/2;i.lineWidth=t[1],i.beginPath(),i.moveTo(Math.max(t[0],s[0]),S),i.lineTo(B.width-Math.max(t[0],s[1]),S),i.moveTo(Math.max(t[0],s[3]),B.height-S),i.lineTo(B.width-Math.max(t[0],s[2]),B.height-S),i.stroke()}if(this.borderRadius){var G=Math.max.apply(Math,eE(t)),l=G/2;i.lineWidth=G,i.beginPath(),[!!s[0]&&[s[0],l,l,s[0]],!!s[1]&&[B.width-s[1],B.width-l,l,s[1]],!!s[2]&&[B.width-s[2],B.width-l,B.height-l,B.height-s[2]],!!s[3]&&[s[3],l,B.height-l,B.height-s[3]]].filter(function(F){return F}).forEach(function(F){var y=SD(F,4),U=y[0],m=y[1],v=y[2],u=y[3];i.moveTo(U,v),i.quadraticCurveTo(m,v,m,u)}),i.stroke()}}this.backgroundColor&&(i.fillStyle=this.backgroundColor,this.borderRadius?(i.beginPath(),i.moveTo(t[0],s[0]),[[t[0],s[0],B.width-s[1],t[1],t[1],t[1]],[B.width-t[0],B.width-t[0],B.width-t[0],t[1],s[1],B.height-s[2]],[B.width-t[0],B.width-s[2],s[3],B.height-t[1],B.height-t[1],B.height-t[1]],[t[0],t[0],t[0],B.height-t[1],B.height-s[3],s[0]]].forEach(function(F){var y=SD(F,6),U=y[0],m=y[1],v=y[2],u=y[3],Y=y[4],b=y[5];i.quadraticCurveTo(U,u,m,Y),i.lineTo(v,b)}),i.closePath(),i.fill()):i.fillRect(t[0],t[1],B.width-t[0]*2,B.height-t[1]*2)),i.translate.apply(i,eE(t)),i.translate.apply(i,eE(a)),i.font=h,i.fillStyle=this.color,i.textBaseline="bottom";var k=this.strokeWidth>0;k&&(i.lineWidth=this.strokeWidth*this.fontSize/10,i.strokeStyle=this.strokeColor),D.forEach(function(F,y){var U=(c-i.measureText(F).width)/2,m=(y+1)*C.fontSize;k&&i.strokeText(F,U,m),i.fillText(F,U,m)}),this.material.map&&this.material.map.dispose();var N=this.material.map=new YB.Texture(B);N.minFilter=YB.LinearFilter,N.colorSpace=YB.SRGBColorSpace,N.needsUpdate=!0;var p=this.textHeight*D.length+E[1]*2+o[1]*2;this.scale.set(p*B.width/B.height,p,0)}},{key:"clone",value:function(){return new this.constructor(this.text,this.textHeight,this.color).copy(this)}},{key:"copy",value:function(C){return YB.Sprite.prototype.copy.call(this,C),this.color=C.color,this.backgroundColor=C.backgroundColor,this.padding=C.padding,this.borderWidth=C.borderWidth,this.borderColor=C.borderColor,this.fontFace=C.fontFace,this.fontSize=C.fontSize,this.fontWeight=C.fontWeight,this.strokeWidth=C.strokeWidth,this.strokeColor=C.strokeColor,this}}]),I}(YB.Sprite);class xM{constructor(){aA(this,"_hudText");this._hudText=[]}createText({text:A,binding:I,position:g}){const C=new TM(A);C.textHeight=2;const B={sprite:C,binding:I,position:g};this._hudText.push(B)}update(){this._hudText&&this._hudText.forEach(A=>{const{binding:I}=A;if(!I)return;const C=`${AB.globals[I]}`;C&&(A.sprite.text=C)})}}class bM{constructor(A){aA(this,"_type","Scene");aA(this,"_setup");aA(this,"_hud",null);aA(this,"scene");aA(this,"screenResolution");aA(this,"renderer");aA(this,"composer");aA(this,"zylemCamera");aA(this,"containerElement",null);const I=new de;I.background=new cA(eM.backgroundColor),this.setupRenderer(),this.setupLighting(I),this.setupCamera(I),this.scene=I;const g=document.getElementById(A);if(!g)throw new Error(`Could not find element with id: ${A}`);g.firstChild&&g.removeChild(g.firstChild),this.containerElement=g,g.appendChild(this.renderer.domElement)}setup(){this._setup&&(this._hud=new xM,this._setup(this,this._hud),this._hud._hudText.forEach(A=>{this.add(A.sprite,A.position)}))}destroy(){}update(A){this.composer.render(A),this._hud&&this._hud.update()}setupCamera(A){this.zylemCamera=new kM(this.screenResolution);let I=this.screenResolution.clone().divideScalar(2);I.x|=0,I.y|=0,A.add(this.zylemCamera.cameraRig),this.composer.addPass(new MM(I,A,this.zylemCamera.camera))}setupLighting(A){const I=new Ve(16777215,.5);A.add(I);const g=new je(16777215,1);g.name="Light",g.position.set(0,100,0),g.castShadow=!0,g.shadow.camera.near=.1,g.shadow.camera.far=2e3,g.shadow.mapSize.width=1024,g.shadow.mapSize.height=1024,A.add(g)}setupRenderer(){var C,B;const A=((C=this.containerElement)==null?void 0:C.clientWidth)||window.innerWidth,I=((B=this.containerElement)==null?void 0:B.clientHeight)||window.innerHeight,g=new z(A,I);this.screenResolution=g,this.renderer=new pe({antialias:!1}),this.renderer.setSize(g.x,g.y),this.composer=new yM(this.renderer)}updateRenderer(A,I){this.screenResolution=new z(A,I),this.renderer.setSize(this.screenResolution.x,this.screenResolution.y)}add(A,I=new K(0,0,0)){A.position.set(I.x,I.y,I.z),this.scene.add(A)}addEntity(A){this.scene.add(A.mesh)}}class ua{}var De;(function(Q){Q.Box="Box",Q.Sphere="Sphere",Q.Sprite="Sprite"})(De||(De={}));class OM extends ua{constructor(I){super();aA(this,"_type");aA(this,"mesh");aA(this,"body");aA(this,"size");aA(this,"bodyDescription");aA(this,"_update");aA(this,"_setup");this._type="Box",this.mesh=this.createMesh(I.size),this.bodyDescription=this.createBodyDescription(),this._update=I.update,this._setup=I.setup}setup(){this._setup(this)}destroy(){}update(I,{inputs:g}){if(!this.body)return;const{x:C,y:B,z:i}=this.body.translation(),{x:E,y:t,z:e}=this.body.rotation();this.mesh.position.set(C,B,i),this.mesh.rotation.set(E,t,e);const s=g??{moveUp:!1,moveDown:!1};this._update!==void 0&&this._update(I,{inputs:s,entity:this})}createMesh(I=new K(1,1,1)){this.size=I;const g=new xg(I.x,I.y,I.z),C=new QQ({color:16777215,emissiveIntensity:.5,lightMapIntensity:.5,fog:!0});return this.mesh=new FI(g,C),this.mesh.position.set(0,0,0),this.mesh.castShadow=!0,this.mesh.receiveShadow=!0,this.mesh}createBodyDescription(){return new Cg(zI.Dynamic).setTranslation(0,0,0).setGravityScale(1).setCanSleep(!1).setCcdEnabled(!1)}createCollider(I=!1){const g=this.size||new K(1,1,1),C={x:g.x/2,y:g.y/2,z:g.z/2};let B=hI.cuboid(C.x,C.y,C.z);return B.setSensor(I),I&&(B.activeCollisionTypes=KC.KINEMATIC_FIXED),B}}class vM extends ua{constructor(I){super();aA(this,"_type");aA(this,"mesh");aA(this,"body");aA(this,"bodyDescription");aA(this,"radius");aA(this,"_update");aA(this,"_setup");this._type="Sphere",this.mesh=this.createMesh(I.radius),this.bodyDescription=this.createBodyDescription(),this._update=I.update,this._setup=I.setup}setup(){this._setup(this)}destroy(){}update(I,{inputs:g}){if(!this.body)return;const{x:C,y:B,z:i}=this.body.translation(),{x:E,y:t,z:e}=this.body.rotation();this.mesh.position.set(C,B,i),this.mesh.rotation.set(E,t,e);const s=g??{moveUp:!1,moveDown:!1};this._update!==void 0&&this._update(I,{inputs:s,entity:this})}createMesh(I=1){this.radius=I;const g=new tB(I),C=new QQ({color:16777215,emissiveIntensity:.5,lightMapIntensity:.5,fog:!0});return this.mesh=new FI(g,C),this.mesh.position.set(0,0,0),this.mesh.castShadow=!0,this.mesh.receiveShadow=!0,this.mesh}createBodyDescription(){return new Cg(zI.Dynamic).setGravityScale(1).setCanSleep(!1).setCcdEnabled(!1)}createCollider(I=!1){const C=(this.radius||1)/2;let B=hI.ball(C);return B.setSensor(I),I&&(B.activeCollisionTypes=KC.KINEMATIC_FIXED),B}}class ZM extends ua{constructor(I){super();aA(this,"mesh");aA(this,"body");aA(this,"bodyDescription");aA(this,"constraintBodies");aA(this,"_update");aA(this,"_setup");aA(this,"_type");aA(this,"_collision");aA(this,"_destroy");aA(this,"name");aA(this,"tag");aA(this,"images");aA(this,"spriteIndex",0);aA(this,"sprites",[]);aA(this,"size",new K(1,1,1));this._type="Sprite",this.images=I.images,this.mesh=this.createMesh(I.size),this.bodyDescription=this.createBodyDescription(),this._update=I.update,this._setup=I.setup}setup(){this._setup(this)}update(I,{inputs:g}){}destroy(){}createBodyDescription(){return new Cg(zI.Dynamic).setTranslation(0,0,0).setGravityScale(1).setCanSleep(!1).setCcdEnabled(!1)}createMesh(I=new K(1,1,1)){this.createSpritesFromImages(),this.size=I;const g=new xg(I.x,I.y,I.z),C=new QQ({transparent:!0,opacity:0});return this.mesh=new FI(g,C),this.sprites.forEach((B,i)=>{this.spriteIndex===i?B.visible=!0:B.visible=!1,this.mesh.add(B)}),this.mesh.position.set(0,0,0),this.mesh}createSpritesFromImages(){var g;const I=new sh;(g=this.images)==null||g.forEach(C=>{const B=I.load(C),i=new Qi({map:B,transparent:!0}),E=new Qo(i);E.position.normalize(),this.sprites.push(E)})}createCollider(I=!1){const{x:g,y:C,z:B}=this.size,i=new K(g,C,B),E={x:i.x/2,y:i.y/2,z:i.z/2};let t=hI.cuboid(E.x,E.y,E.z);return t.setSensor(I),I&&(t.activeCollisionTypes=KC.KINEMATIC_FIXED),t}}function WM(Q){return class extends Q{moveX(I){this.body.setLinvel(new K(I,0,0))}moveY(I){this.body.setLinvel(new K(0,I,0))}moveZ(I){this.body.setLinvel(new K(0,0,I))}moveXY(I,g){this.body.setLinvel(new K(I,g,0))}setPosition(I,g,C){this.body.setTranslation({x:I,y:g,z:C})}getPosition(){return this.body.translation()}getVelocity(){return this.body.linvel()}}}function PM(Q){return class extends Q{setup(){this._setup!==void 0&&this._setup(this)}destroy(){this._destroy!==void 0&&this._destroy(AB)}update(I,{inputs:g,globals:C}){if(!this.body||!this.mesh)return;const{x:B,y:i,z:E}=this.body.translation(),{x:t,y:e,z:s}=this.body.rotation();this.mesh.position.set(B,i,E),this.mesh.rotation.set(t,e,s);const o=g??{moveUp:!1,moveDown:!1};this._update!==void 0&&this._update(I,{inputs:o,entity:this,globals:C})}spawn(I,g){const C=this.stageRef;C==null||C.spawnEntity(I(g))}}}class _M{constructor(){aA(this,"_type","Stage");aA(this,"world");aA(this,"scene");aA(this,"conditions",[]);aA(this,"children",[]);aA(this,"blueprints",[]);this.world=null,this.scene=null}async buildStage(A,I){aM("backgroundColor",A.backgroundColor),this.scene=new bM(I),this.scene._setup=A.setup;const g=await cD.loadPhysics();this.world=new cD(g),this.blueprints=A.children({gameState:AB,setGameState:sE})||[],this.conditions=A.conditions,await this.setup()}async setup(){if(!this.scene||!this.world){this.logMissingEntities();return}this.scene.setup();for(let A of this.blueprints)this.spawnEntity(A,{})}spawnEntity(A,I){if(!this.scene||!this.world)return;const g=jM[A.type],C=WM(g),B=PM(C),i=new B(A);if(i.name=A.name,i.mesh&&this.scene.scene.add(i.mesh),A.props)for(let E in A.props)i[E]=A.props[E];if(i.stageRef=this,this.world.addEntity(i),this.children.push(i),A.collision&&(i._collision=A.collision),A.destroy&&(i._destroy=A.destroy),typeof A.update!="function"&&console.warn(`Entity ${A.name} is missing an update function.`),typeof A.setup!="function"){console.warn(`Entity ${A.name} is missing a setup function.`);return}A.setup(i)}destroy(){var A,I;(A=this.world)==null||A.destroy(),(I=this.scene)==null||I.destroy()}update(A,I){if(!this.scene||!this.world){this.logMissingEntities();return}this.world.update(A);for(let g of this.children)g.update(A,{inputs:I.inputs,entity:g,globals:AB.globals});this.scene.update(A)}logMissingEntities(){console.warn("Zylem world or scene is null")}resize(A,I){var g;(g=this.scene)==null||g.updateRenderer(A,I)}}const jM={Box:OM,Sphere:vM,Sprite:ZM};class VM{constructor(A){aA(this,"id");aA(this,"perspective",pg.ThirdPerson);aA(this,"globals");aA(this,"_initialGlobals");aA(this,"stage");aA(this,"stages",{});aA(this,"blueprintOptions");aA(this,"currentStage","");aA(this,"clock");aA(this,"gamePad");aA(this,"_canvasWrapper");aA(this,"previousTimeStamp",0);aA(this,"startTimeStamp",0);sE("perspective",A.perspective),sE("globals",A.globals),this._initialGlobals={...A.globals},this.id=A.id,this.gamePad=new $h,this.clock=new so,this.blueprintOptions=A,this._canvasWrapper=null,this.createCanvas(),this.stage=A.stage,this.loadStage(this.stage),this.currentStage=this.id}async loadStage(A){const I=new _M;I.buildStage(A,this.id),this.stages[this.id]=I}async gameLoop(A){const I=this.gamePad.getInputs(),g=this.clock.getDelta();if(this.previousTimeStamp!==A){const C=this.stages[this.currentStage],B={inputs:I,entity:C};C.update(g,B),C.conditions.forEach(i=>{i(AB.globals,this)})}this.previousTimeStamp=A,requestAnimationFrame(C=>{this.gameLoop(C)})}start(){requestAnimationFrame(async A=>{this.gameLoop(A)})}reset(A=!0){A&&sE("globals",{...this._initialGlobals}),this.loadStage(this.stage),this.delayedResize()}createStage(A){if(!this.id){console.error("No id provided for canvas");return}}handleResize(){var i,E,t;const A=((i=this._canvasWrapper)==null?void 0:i.clientWidth)||window.innerWidth,I=((E=this._canvasWrapper)==null?void 0:E.clientHeight)||window.innerHeight,g=`${A}px`,C=`${I}px`,B=(t=this._canvasWrapper)==null?void 0:t.querySelector("canvas");B==null||B.style.setProperty("width",g),B==null||B.style.setProperty("height",C),this.stages[this.id].resize(A,I)}delayedResize(){setTimeout(()=>{this.handleResize()},0)}createCanvas(){if(!this.id){console.error("No id provided for canvas");return}const A=document.createElementNS("http://www.w3.org/1999/xhtml","canvas");A.style.margin="0",A.style.padding="0",A.style.backgroundColor="#0c2461";let I=document.querySelector(`#${this.id}`);return I||(I=document.createElement("main"),I.setAttribute("id",this.id),document.body.appendChild(I)),A.style.setProperty("width",`${I.clientWidth}px`),A.style.setProperty("height",`${I.clientHeight}px`),I.appendChild(A),this._canvasWrapper=I,this.delayedResize(),window.addEventListener("resize",()=>{this.handleResize()}),A}}class fh extends HTMLElement{constructor(){super(),this.style.position="fixed",this.style.top="0",this.style.left="0",this.style.background="rgba(255, 255, 255, 0.7)",this.style.padding="10px",this.style.fontFamily="monospace",this.style.fontSize="12px",window.addEventListener("resize",()=>{this.style.width=window.innerWidth+"px",this.style.height=window.innerHeight+"px"})}connectedCallback(){const A=document.createElement("div");A.textContent="This is a debug overlay!",this.appendChild(A),this.style.width=window.innerWidth+"px",this.style.height=window.innerHeight+"px"}addInfo(A){const I=document.createElement("p");I.textContent=A,this.appendChild(I),this.children.length>5&&this.removeChild(this.children[0])}appendToDOM(){document.body.appendChild(this)}}customElements.define("zylem-debug",fh);var yQ=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},uh={};/*!
 *  howler.js v2.2.3
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */(function(Q){(function(){var A=function(){this.init()};A.prototype={init:function(){var o=this||I;return o._counter=1e3,o._html5AudioPool=[],o.html5PoolSize=10,o._codecs={},o._howls=[],o._muted=!1,o._volume=1,o._canPlayEvent="canplaythrough",o._navigator=typeof window<"u"&&window.navigator?window.navigator:null,o.masterGain=null,o.noAudio=!1,o.usingWebAudio=!0,o.autoSuspend=!0,o.ctx=null,o.autoUnlock=!0,o._setup(),o},volume:function(o){var a=this||I;if(o=parseFloat(o),a.ctx||s(),typeof o<"u"&&o>=0&&o<=1){if(a._volume=o,a._muted)return a;a.usingWebAudio&&a.masterGain.gain.setValueAtTime(o,I.ctx.currentTime);for(var D=0;D<a._howls.length;D++)if(!a._howls[D]._webAudio)for(var h=a._howls[D]._getSoundIds(),c=0;c<h.length;c++){var r=a._howls[D]._soundById(h[c]);r&&r._node&&(r._node.volume=r._volume*o)}return a}return a._volume},mute:function(o){var a=this||I;a.ctx||s(),a._muted=o,a.usingWebAudio&&a.masterGain.gain.setValueAtTime(o?0:a._volume,I.ctx.currentTime);for(var D=0;D<a._howls.length;D++)if(!a._howls[D]._webAudio)for(var h=a._howls[D]._getSoundIds(),c=0;c<h.length;c++){var r=a._howls[D]._soundById(h[c]);r&&r._node&&(r._node.muted=o?!0:r._muted)}return a},stop:function(){for(var o=this||I,a=0;a<o._howls.length;a++)o._howls[a].stop();return o},unload:function(){for(var o=this||I,a=o._howls.length-1;a>=0;a--)o._howls[a].unload();return o.usingWebAudio&&o.ctx&&typeof o.ctx.close<"u"&&(o.ctx.close(),o.ctx=null,s()),o},codecs:function(o){return(this||I)._codecs[o.replace(/^x-/,"")]},_setup:function(){var o=this||I;if(o.state=o.ctx&&o.ctx.state||"suspended",o._autoSuspend(),!o.usingWebAudio)if(typeof Audio<"u")try{var a=new Audio;typeof a.oncanplaythrough>"u"&&(o._canPlayEvent="canplay")}catch{o.noAudio=!0}else o.noAudio=!0;try{var a=new Audio;a.muted&&(o.noAudio=!0)}catch{}return o.noAudio||o._setupCodecs(),o},_setupCodecs:function(){var o=this||I,a=null;try{a=typeof Audio<"u"?new Audio:null}catch{return o}if(!a||typeof a.canPlayType!="function")return o;var D=a.canPlayType("audio/mpeg;").replace(/^no$/,""),h=o._navigator?o._navigator.userAgent:"",c=h.match(/OPR\/([0-6].)/g),r=c&&parseInt(c[0].split("/")[1],10)<33,n=h.indexOf("Safari")!==-1&&h.indexOf("Chrome")===-1,S=h.match(/Version\/(.*?) /),G=n&&S&&parseInt(S[1],10)<15;return o._codecs={mp3:!!(!r&&(D||a.canPlayType("audio/mp3;").replace(/^no$/,""))),mpeg:!!D,opus:!!a.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!a.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!(a.canPlayType('audio/wav; codecs="1"')||a.canPlayType("audio/wav")).replace(/^no$/,""),aac:!!a.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!a.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(a.canPlayType("audio/x-m4a;")||a.canPlayType("audio/m4a;")||a.canPlayType("audio/aac;")).replace(/^no$/,""),m4b:!!(a.canPlayType("audio/x-m4b;")||a.canPlayType("audio/m4b;")||a.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(a.canPlayType("audio/x-mp4;")||a.canPlayType("audio/mp4;")||a.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!!(!G&&a.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),webm:!!(!G&&a.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),dolby:!!a.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(a.canPlayType("audio/x-flac;")||a.canPlayType("audio/flac;")).replace(/^no$/,"")},o},_unlockAudio:function(){var o=this||I;if(!(o._audioUnlocked||!o.ctx)){o._audioUnlocked=!1,o.autoUnlock=!1,!o._mobileUnloaded&&o.ctx.sampleRate!==44100&&(o._mobileUnloaded=!0,o.unload()),o._scratchBuffer=o.ctx.createBuffer(1,1,22050);var a=function(D){for(;o._html5AudioPool.length<o.html5PoolSize;)try{var h=new Audio;h._unlocked=!0,o._releaseHtml5Audio(h)}catch{o.noAudio=!0;break}for(var c=0;c<o._howls.length;c++)if(!o._howls[c]._webAudio)for(var r=o._howls[c]._getSoundIds(),n=0;n<r.length;n++){var S=o._howls[c]._soundById(r[n]);S&&S._node&&!S._node._unlocked&&(S._node._unlocked=!0,S._node.load())}o._autoResume();var G=o.ctx.createBufferSource();G.buffer=o._scratchBuffer,G.connect(o.ctx.destination),typeof G.start>"u"?G.noteOn(0):G.start(0),typeof o.ctx.resume=="function"&&o.ctx.resume(),G.onended=function(){G.disconnect(0),o._audioUnlocked=!0,document.removeEventListener("touchstart",a,!0),document.removeEventListener("touchend",a,!0),document.removeEventListener("click",a,!0),document.removeEventListener("keydown",a,!0);for(var l=0;l<o._howls.length;l++)o._howls[l]._emit("unlock")}};return document.addEventListener("touchstart",a,!0),document.addEventListener("touchend",a,!0),document.addEventListener("click",a,!0),document.addEventListener("keydown",a,!0),o}},_obtainHtml5Audio:function(){var o=this||I;if(o._html5AudioPool.length)return o._html5AudioPool.pop();var a=new Audio().play();return a&&typeof Promise<"u"&&(a instanceof Promise||typeof a.then=="function")&&a.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(o){var a=this||I;return o._unlocked&&a._html5AudioPool.push(o),a},_autoSuspend:function(){var o=this;if(!(!o.autoSuspend||!o.ctx||typeof o.ctx.suspend>"u"||!I.usingWebAudio)){for(var a=0;a<o._howls.length;a++)if(o._howls[a]._webAudio){for(var D=0;D<o._howls[a]._sounds.length;D++)if(!o._howls[a]._sounds[D]._paused)return o}return o._suspendTimer&&clearTimeout(o._suspendTimer),o._suspendTimer=setTimeout(function(){if(o.autoSuspend){o._suspendTimer=null,o.state="suspending";var h=function(){o.state="suspended",o._resumeAfterSuspend&&(delete o._resumeAfterSuspend,o._autoResume())};o.ctx.suspend().then(h,h)}},3e4),o}},_autoResume:function(){var o=this;if(!(!o.ctx||typeof o.ctx.resume>"u"||!I.usingWebAudio))return o.state==="running"&&o.ctx.state!=="interrupted"&&o._suspendTimer?(clearTimeout(o._suspendTimer),o._suspendTimer=null):o.state==="suspended"||o.state==="running"&&o.ctx.state==="interrupted"?(o.ctx.resume().then(function(){o.state="running";for(var a=0;a<o._howls.length;a++)o._howls[a]._emit("resume")}),o._suspendTimer&&(clearTimeout(o._suspendTimer),o._suspendTimer=null)):o.state==="suspending"&&(o._resumeAfterSuspend=!0),o}};var I=new A,g=function(o){var a=this;if(!o.src||o.src.length===0){console.error("An array of source files must be passed with any new Howl.");return}a.init(o)};g.prototype={init:function(o){var a=this;return I.ctx||s(),a._autoplay=o.autoplay||!1,a._format=typeof o.format!="string"?o.format:[o.format],a._html5=o.html5||!1,a._muted=o.mute||!1,a._loop=o.loop||!1,a._pool=o.pool||5,a._preload=typeof o.preload=="boolean"||o.preload==="metadata"?o.preload:!0,a._rate=o.rate||1,a._sprite=o.sprite||{},a._src=typeof o.src!="string"?o.src:[o.src],a._volume=o.volume!==void 0?o.volume:1,a._xhr={method:o.xhr&&o.xhr.method?o.xhr.method:"GET",headers:o.xhr&&o.xhr.headers?o.xhr.headers:null,withCredentials:o.xhr&&o.xhr.withCredentials?o.xhr.withCredentials:!1},a._duration=0,a._state="unloaded",a._sounds=[],a._endTimers={},a._queue=[],a._playLock=!1,a._onend=o.onend?[{fn:o.onend}]:[],a._onfade=o.onfade?[{fn:o.onfade}]:[],a._onload=o.onload?[{fn:o.onload}]:[],a._onloaderror=o.onloaderror?[{fn:o.onloaderror}]:[],a._onplayerror=o.onplayerror?[{fn:o.onplayerror}]:[],a._onpause=o.onpause?[{fn:o.onpause}]:[],a._onplay=o.onplay?[{fn:o.onplay}]:[],a._onstop=o.onstop?[{fn:o.onstop}]:[],a._onmute=o.onmute?[{fn:o.onmute}]:[],a._onvolume=o.onvolume?[{fn:o.onvolume}]:[],a._onrate=o.onrate?[{fn:o.onrate}]:[],a._onseek=o.onseek?[{fn:o.onseek}]:[],a._onunlock=o.onunlock?[{fn:o.onunlock}]:[],a._onresume=[],a._webAudio=I.usingWebAudio&&!a._html5,typeof I.ctx<"u"&&I.ctx&&I.autoUnlock&&I._unlockAudio(),I._howls.push(a),a._autoplay&&a._queue.push({event:"play",action:function(){a.play()}}),a._preload&&a._preload!=="none"&&a.load(),a},load:function(){var o=this,a=null;if(I.noAudio){o._emit("loaderror",null,"No audio support.");return}typeof o._src=="string"&&(o._src=[o._src]);for(var D=0;D<o._src.length;D++){var h,c;if(o._format&&o._format[D])h=o._format[D];else{if(c=o._src[D],typeof c!="string"){o._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}h=/^data:audio\/([^;,]+);/i.exec(c),h||(h=/\.([^.]+)$/.exec(c.split("?",1)[0])),h&&(h=h[1].toLowerCase())}if(h||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),h&&I.codecs(h)){a=o._src[D];break}}if(!a){o._emit("loaderror",null,"No codec support for selected audio sources.");return}return o._src=a,o._state="loading",window.location.protocol==="https:"&&a.slice(0,5)==="http:"&&(o._html5=!0,o._webAudio=!1),new C(o),o._webAudio&&i(o),o},play:function(o,a){var D=this,h=null;if(typeof o=="number")h=o,o=null;else{if(typeof o=="string"&&D._state==="loaded"&&!D._sprite[o])return null;if(typeof o>"u"&&(o="__default",!D._playLock)){for(var c=0,r=0;r<D._sounds.length;r++)D._sounds[r]._paused&&!D._sounds[r]._ended&&(c++,h=D._sounds[r]._id);c===1?o=null:h=null}}var n=h?D._soundById(h):D._inactiveSound();if(!n)return null;if(h&&!o&&(o=n._sprite||"__default"),D._state!=="loaded"){n._sprite=o,n._ended=!1;var S=n._id;return D._queue.push({event:"play",action:function(){D.play(S)}}),S}if(h&&!n._paused)return a||D._loadQueue("play"),n._id;D._webAudio&&I._autoResume();var G=Math.max(0,n._seek>0?n._seek:D._sprite[o][0]/1e3),l=Math.max(0,(D._sprite[o][0]+D._sprite[o][1])/1e3-G),k=l*1e3/Math.abs(n._rate),N=D._sprite[o][0]/1e3,p=(D._sprite[o][0]+D._sprite[o][1])/1e3;n._sprite=o,n._ended=!1;var F=function(){n._paused=!1,n._seek=G,n._start=N,n._stop=p,n._loop=!!(n._loop||D._sprite[o][2])};if(G>=p){D._ended(n);return}var y=n._node;if(D._webAudio){var U=function(){D._playLock=!1,F(),D._refreshBuffer(n);var Y=n._muted||D._muted?0:n._volume;y.gain.setValueAtTime(Y,I.ctx.currentTime),n._playStart=I.ctx.currentTime,typeof y.bufferSource.start>"u"?n._loop?y.bufferSource.noteGrainOn(0,G,86400):y.bufferSource.noteGrainOn(0,G,l):n._loop?y.bufferSource.start(0,G,86400):y.bufferSource.start(0,G,l),k!==1/0&&(D._endTimers[n._id]=setTimeout(D._ended.bind(D,n),k)),a||setTimeout(function(){D._emit("play",n._id),D._loadQueue()},0)};I.state==="running"&&I.ctx.state!=="interrupted"?U():(D._playLock=!0,D.once("resume",U),D._clearTimer(n._id))}else{var m=function(){y.currentTime=G,y.muted=n._muted||D._muted||I._muted||y.muted,y.volume=n._volume*I.volume(),y.playbackRate=n._rate;try{var Y=y.play();if(Y&&typeof Promise<"u"&&(Y instanceof Promise||typeof Y.then=="function")?(D._playLock=!0,F(),Y.then(function(){D._playLock=!1,y._unlocked=!0,a?D._loadQueue():D._emit("play",n._id)}).catch(function(){D._playLock=!1,D._emit("playerror",n._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),n._ended=!0,n._paused=!0})):a||(D._playLock=!1,F(),D._emit("play",n._id)),y.playbackRate=n._rate,y.paused){D._emit("playerror",n._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");return}o!=="__default"||n._loop?D._endTimers[n._id]=setTimeout(D._ended.bind(D,n),k):(D._endTimers[n._id]=function(){D._ended(n),y.removeEventListener("ended",D._endTimers[n._id],!1)},y.addEventListener("ended",D._endTimers[n._id],!1))}catch(b){D._emit("playerror",n._id,b)}};y.src==="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"&&(y.src=D._src,y.load());var v=window&&window.ejecta||!y.readyState&&I._navigator.isCocoonJS;if(y.readyState>=3||v)m();else{D._playLock=!0,D._state="loading";var u=function(){D._state="loaded",m(),y.removeEventListener(I._canPlayEvent,u,!1)};y.addEventListener(I._canPlayEvent,u,!1),D._clearTimer(n._id)}}return n._id},pause:function(o){var a=this;if(a._state!=="loaded"||a._playLock)return a._queue.push({event:"pause",action:function(){a.pause(o)}}),a;for(var D=a._getSoundIds(o),h=0;h<D.length;h++){a._clearTimer(D[h]);var c=a._soundById(D[h]);if(c&&!c._paused&&(c._seek=a.seek(D[h]),c._rateSeek=0,c._paused=!0,a._stopFade(D[h]),c._node))if(a._webAudio){if(!c._node.bufferSource)continue;typeof c._node.bufferSource.stop>"u"?c._node.bufferSource.noteOff(0):c._node.bufferSource.stop(0),a._cleanBuffer(c._node)}else(!isNaN(c._node.duration)||c._node.duration===1/0)&&c._node.pause();arguments[1]||a._emit("pause",c?c._id:null)}return a},stop:function(o,a){var D=this;if(D._state!=="loaded"||D._playLock)return D._queue.push({event:"stop",action:function(){D.stop(o)}}),D;for(var h=D._getSoundIds(o),c=0;c<h.length;c++){D._clearTimer(h[c]);var r=D._soundById(h[c]);r&&(r._seek=r._start||0,r._rateSeek=0,r._paused=!0,r._ended=!0,D._stopFade(h[c]),r._node&&(D._webAudio?r._node.bufferSource&&(typeof r._node.bufferSource.stop>"u"?r._node.bufferSource.noteOff(0):r._node.bufferSource.stop(0),D._cleanBuffer(r._node)):(!isNaN(r._node.duration)||r._node.duration===1/0)&&(r._node.currentTime=r._start||0,r._node.pause(),r._node.duration===1/0&&D._clearSound(r._node))),a||D._emit("stop",r._id))}return D},mute:function(o,a){var D=this;if(D._state!=="loaded"||D._playLock)return D._queue.push({event:"mute",action:function(){D.mute(o,a)}}),D;if(typeof a>"u")if(typeof o=="boolean")D._muted=o;else return D._muted;for(var h=D._getSoundIds(a),c=0;c<h.length;c++){var r=D._soundById(h[c]);r&&(r._muted=o,r._interval&&D._stopFade(r._id),D._webAudio&&r._node?r._node.gain.setValueAtTime(o?0:r._volume,I.ctx.currentTime):r._node&&(r._node.muted=I._muted?!0:o),D._emit("mute",r._id))}return D},volume:function(){var o=this,a=arguments,D,h;if(a.length===0)return o._volume;if(a.length===1||a.length===2&&typeof a[1]>"u"){var c=o._getSoundIds(),r=c.indexOf(a[0]);r>=0?h=parseInt(a[0],10):D=parseFloat(a[0])}else a.length>=2&&(D=parseFloat(a[0]),h=parseInt(a[1],10));var n;if(typeof D<"u"&&D>=0&&D<=1){if(o._state!=="loaded"||o._playLock)return o._queue.push({event:"volume",action:function(){o.volume.apply(o,a)}}),o;typeof h>"u"&&(o._volume=D),h=o._getSoundIds(h);for(var S=0;S<h.length;S++)n=o._soundById(h[S]),n&&(n._volume=D,a[2]||o._stopFade(h[S]),o._webAudio&&n._node&&!n._muted?n._node.gain.setValueAtTime(D,I.ctx.currentTime):n._node&&!n._muted&&(n._node.volume=D*I.volume()),o._emit("volume",n._id))}else return n=h?o._soundById(h):o._sounds[0],n?n._volume:0;return o},fade:function(o,a,D,h){var c=this;if(c._state!=="loaded"||c._playLock)return c._queue.push({event:"fade",action:function(){c.fade(o,a,D,h)}}),c;o=Math.min(Math.max(0,parseFloat(o)),1),a=Math.min(Math.max(0,parseFloat(a)),1),D=parseFloat(D),c.volume(o,h);for(var r=c._getSoundIds(h),n=0;n<r.length;n++){var S=c._soundById(r[n]);if(S){if(h||c._stopFade(r[n]),c._webAudio&&!S._muted){var G=I.ctx.currentTime,l=G+D/1e3;S._volume=o,S._node.gain.setValueAtTime(o,G),S._node.gain.linearRampToValueAtTime(a,l)}c._startFadeInterval(S,o,a,D,r[n],typeof h>"u")}}return c},_startFadeInterval:function(o,a,D,h,c,r){var n=this,S=a,G=D-a,l=Math.abs(G/.01),k=Math.max(4,l>0?h/l:h),N=Date.now();o._fadeTo=D,o._interval=setInterval(function(){var p=(Date.now()-N)/h;N=Date.now(),S+=G*p,S=Math.round(S*100)/100,G<0?S=Math.max(D,S):S=Math.min(D,S),n._webAudio?o._volume=S:n.volume(S,o._id,!0),r&&(n._volume=S),(D<a&&S<=D||D>a&&S>=D)&&(clearInterval(o._interval),o._interval=null,o._fadeTo=null,n.volume(D,o._id),n._emit("fade",o._id))},k)},_stopFade:function(o){var a=this,D=a._soundById(o);return D&&D._interval&&(a._webAudio&&D._node.gain.cancelScheduledValues(I.ctx.currentTime),clearInterval(D._interval),D._interval=null,a.volume(D._fadeTo,o),D._fadeTo=null,a._emit("fade",o)),a},loop:function(){var o=this,a=arguments,D,h,c;if(a.length===0)return o._loop;if(a.length===1)if(typeof a[0]=="boolean")D=a[0],o._loop=D;else return c=o._soundById(parseInt(a[0],10)),c?c._loop:!1;else a.length===2&&(D=a[0],h=parseInt(a[1],10));for(var r=o._getSoundIds(h),n=0;n<r.length;n++)c=o._soundById(r[n]),c&&(c._loop=D,o._webAudio&&c._node&&c._node.bufferSource&&(c._node.bufferSource.loop=D,D&&(c._node.bufferSource.loopStart=c._start||0,c._node.bufferSource.loopEnd=c._stop,o.playing(r[n])&&(o.pause(r[n],!0),o.play(r[n],!0)))));return o},rate:function(){var o=this,a=arguments,D,h;if(a.length===0)h=o._sounds[0]._id;else if(a.length===1){var c=o._getSoundIds(),r=c.indexOf(a[0]);r>=0?h=parseInt(a[0],10):D=parseFloat(a[0])}else a.length===2&&(D=parseFloat(a[0]),h=parseInt(a[1],10));var n;if(typeof D=="number"){if(o._state!=="loaded"||o._playLock)return o._queue.push({event:"rate",action:function(){o.rate.apply(o,a)}}),o;typeof h>"u"&&(o._rate=D),h=o._getSoundIds(h);for(var S=0;S<h.length;S++)if(n=o._soundById(h[S]),n){o.playing(h[S])&&(n._rateSeek=o.seek(h[S]),n._playStart=o._webAudio?I.ctx.currentTime:n._playStart),n._rate=D,o._webAudio&&n._node&&n._node.bufferSource?n._node.bufferSource.playbackRate.setValueAtTime(D,I.ctx.currentTime):n._node&&(n._node.playbackRate=D);var G=o.seek(h[S]),l=(o._sprite[n._sprite][0]+o._sprite[n._sprite][1])/1e3-G,k=l*1e3/Math.abs(n._rate);(o._endTimers[h[S]]||!n._paused)&&(o._clearTimer(h[S]),o._endTimers[h[S]]=setTimeout(o._ended.bind(o,n),k)),o._emit("rate",n._id)}}else return n=o._soundById(h),n?n._rate:o._rate;return o},seek:function(){var o=this,a=arguments,D,h;if(a.length===0)o._sounds.length&&(h=o._sounds[0]._id);else if(a.length===1){var c=o._getSoundIds(),r=c.indexOf(a[0]);r>=0?h=parseInt(a[0],10):o._sounds.length&&(h=o._sounds[0]._id,D=parseFloat(a[0]))}else a.length===2&&(D=parseFloat(a[0]),h=parseInt(a[1],10));if(typeof h>"u")return 0;if(typeof D=="number"&&(o._state!=="loaded"||o._playLock))return o._queue.push({event:"seek",action:function(){o.seek.apply(o,a)}}),o;var n=o._soundById(h);if(n)if(typeof D=="number"&&D>=0){var S=o.playing(h);S&&o.pause(h,!0),n._seek=D,n._ended=!1,o._clearTimer(h),!o._webAudio&&n._node&&!isNaN(n._node.duration)&&(n._node.currentTime=D);var G=function(){S&&o.play(h,!0),o._emit("seek",h)};if(S&&!o._webAudio){var l=function(){o._playLock?setTimeout(l,0):G()};setTimeout(l,0)}else G()}else if(o._webAudio){var k=o.playing(h)?I.ctx.currentTime-n._playStart:0,N=n._rateSeek?n._rateSeek-n._seek:0;return n._seek+(N+k*Math.abs(n._rate))}else return n._node.currentTime;return o},playing:function(o){var a=this;if(typeof o=="number"){var D=a._soundById(o);return D?!D._paused:!1}for(var h=0;h<a._sounds.length;h++)if(!a._sounds[h]._paused)return!0;return!1},duration:function(o){var a=this,D=a._duration,h=a._soundById(o);return h&&(D=a._sprite[h._sprite][1]/1e3),D},state:function(){return this._state},unload:function(){for(var o=this,a=o._sounds,D=0;D<a.length;D++)a[D]._paused||o.stop(a[D]._id),o._webAudio||(o._clearSound(a[D]._node),a[D]._node.removeEventListener("error",a[D]._errorFn,!1),a[D]._node.removeEventListener(I._canPlayEvent,a[D]._loadFn,!1),a[D]._node.removeEventListener("ended",a[D]._endFn,!1),I._releaseHtml5Audio(a[D]._node)),delete a[D]._node,o._clearTimer(a[D]._id);var h=I._howls.indexOf(o);h>=0&&I._howls.splice(h,1);var c=!0;for(D=0;D<I._howls.length;D++)if(I._howls[D]._src===o._src||o._src.indexOf(I._howls[D]._src)>=0){c=!1;break}return B&&c&&delete B[o._src],I.noAudio=!1,o._state="unloaded",o._sounds=[],o=null,null},on:function(o,a,D,h){var c=this,r=c["_on"+o];return typeof a=="function"&&r.push(h?{id:D,fn:a,once:h}:{id:D,fn:a}),c},off:function(o,a,D){var h=this,c=h["_on"+o],r=0;if(typeof a=="number"&&(D=a,a=null),a||D)for(r=0;r<c.length;r++){var n=D===c[r].id;if(a===c[r].fn&&n||!a&&n){c.splice(r,1);break}}else if(o)h["_on"+o]=[];else{var S=Object.keys(h);for(r=0;r<S.length;r++)S[r].indexOf("_on")===0&&Array.isArray(h[S[r]])&&(h[S[r]]=[])}return h},once:function(o,a,D){var h=this;return h.on(o,a,D,1),h},_emit:function(o,a,D){for(var h=this,c=h["_on"+o],r=c.length-1;r>=0;r--)(!c[r].id||c[r].id===a||o==="load")&&(setTimeout(function(n){n.call(this,a,D)}.bind(h,c[r].fn),0),c[r].once&&h.off(o,c[r].fn,c[r].id));return h._loadQueue(o),h},_loadQueue:function(o){var a=this;if(a._queue.length>0){var D=a._queue[0];D.event===o&&(a._queue.shift(),a._loadQueue()),o||D.action()}return a},_ended:function(o){var a=this,D=o._sprite;if(!a._webAudio&&o._node&&!o._node.paused&&!o._node.ended&&o._node.currentTime<o._stop)return setTimeout(a._ended.bind(a,o),100),a;var h=!!(o._loop||a._sprite[D][2]);if(a._emit("end",o._id),!a._webAudio&&h&&a.stop(o._id,!0).play(o._id),a._webAudio&&h){a._emit("play",o._id),o._seek=o._start||0,o._rateSeek=0,o._playStart=I.ctx.currentTime;var c=(o._stop-o._start)*1e3/Math.abs(o._rate);a._endTimers[o._id]=setTimeout(a._ended.bind(a,o),c)}return a._webAudio&&!h&&(o._paused=!0,o._ended=!0,o._seek=o._start||0,o._rateSeek=0,a._clearTimer(o._id),a._cleanBuffer(o._node),I._autoSuspend()),!a._webAudio&&!h&&a.stop(o._id,!0),a},_clearTimer:function(o){var a=this;if(a._endTimers[o]){if(typeof a._endTimers[o]!="function")clearTimeout(a._endTimers[o]);else{var D=a._soundById(o);D&&D._node&&D._node.removeEventListener("ended",a._endTimers[o],!1)}delete a._endTimers[o]}return a},_soundById:function(o){for(var a=this,D=0;D<a._sounds.length;D++)if(o===a._sounds[D]._id)return a._sounds[D];return null},_inactiveSound:function(){var o=this;o._drain();for(var a=0;a<o._sounds.length;a++)if(o._sounds[a]._ended)return o._sounds[a].reset();return new C(o)},_drain:function(){var o=this,a=o._pool,D=0,h=0;if(!(o._sounds.length<a)){for(h=0;h<o._sounds.length;h++)o._sounds[h]._ended&&D++;for(h=o._sounds.length-1;h>=0;h--){if(D<=a)return;o._sounds[h]._ended&&(o._webAudio&&o._sounds[h]._node&&o._sounds[h]._node.disconnect(0),o._sounds.splice(h,1),D--)}}},_getSoundIds:function(o){var a=this;if(typeof o>"u"){for(var D=[],h=0;h<a._sounds.length;h++)D.push(a._sounds[h]._id);return D}else return[o]},_refreshBuffer:function(o){var a=this;return o._node.bufferSource=I.ctx.createBufferSource(),o._node.bufferSource.buffer=B[a._src],o._panner?o._node.bufferSource.connect(o._panner):o._node.bufferSource.connect(o._node),o._node.bufferSource.loop=o._loop,o._loop&&(o._node.bufferSource.loopStart=o._start||0,o._node.bufferSource.loopEnd=o._stop||0),o._node.bufferSource.playbackRate.setValueAtTime(o._rate,I.ctx.currentTime),a},_cleanBuffer:function(o){var a=this,D=I._navigator&&I._navigator.vendor.indexOf("Apple")>=0;if(I._scratchBuffer&&o.bufferSource&&(o.bufferSource.onended=null,o.bufferSource.disconnect(0),D))try{o.bufferSource.buffer=I._scratchBuffer}catch{}return o.bufferSource=null,a},_clearSound:function(o){var a=/MSIE |Trident\//.test(I._navigator&&I._navigator.userAgent);a||(o.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var C=function(o){this._parent=o,this.init()};C.prototype={init:function(){var o=this,a=o._parent;return o._muted=a._muted,o._loop=a._loop,o._volume=a._volume,o._rate=a._rate,o._seek=0,o._paused=!0,o._ended=!0,o._sprite="__default",o._id=++I._counter,a._sounds.push(o),o.create(),o},create:function(){var o=this,a=o._parent,D=I._muted||o._muted||o._parent._muted?0:o._volume;return a._webAudio?(o._node=typeof I.ctx.createGain>"u"?I.ctx.createGainNode():I.ctx.createGain(),o._node.gain.setValueAtTime(D,I.ctx.currentTime),o._node.paused=!0,o._node.connect(I.masterGain)):I.noAudio||(o._node=I._obtainHtml5Audio(),o._errorFn=o._errorListener.bind(o),o._node.addEventListener("error",o._errorFn,!1),o._loadFn=o._loadListener.bind(o),o._node.addEventListener(I._canPlayEvent,o._loadFn,!1),o._endFn=o._endListener.bind(o),o._node.addEventListener("ended",o._endFn,!1),o._node.src=a._src,o._node.preload=a._preload===!0?"auto":a._preload,o._node.volume=D*I.volume(),o._node.load()),o},reset:function(){var o=this,a=o._parent;return o._muted=a._muted,o._loop=a._loop,o._volume=a._volume,o._rate=a._rate,o._seek=0,o._rateSeek=0,o._paused=!0,o._ended=!0,o._sprite="__default",o._id=++I._counter,o},_errorListener:function(){var o=this;o._parent._emit("loaderror",o._id,o._node.error?o._node.error.code:0),o._node.removeEventListener("error",o._errorFn,!1)},_loadListener:function(){var o=this,a=o._parent;a._duration=Math.ceil(o._node.duration*10)/10,Object.keys(a._sprite).length===0&&(a._sprite={__default:[0,a._duration*1e3]}),a._state!=="loaded"&&(a._state="loaded",a._emit("load"),a._loadQueue()),o._node.removeEventListener(I._canPlayEvent,o._loadFn,!1)},_endListener:function(){var o=this,a=o._parent;a._duration===1/0&&(a._duration=Math.ceil(o._node.duration*10)/10,a._sprite.__default[1]===1/0&&(a._sprite.__default[1]=a._duration*1e3),a._ended(o)),o._node.removeEventListener("ended",o._endFn,!1)}};var B={},i=function(o){var a=o._src;if(B[a]){o._duration=B[a].duration,e(o);return}if(/^data:[^;]+;base64,/.test(a)){for(var D=atob(a.split(",")[1]),h=new Uint8Array(D.length),c=0;c<D.length;++c)h[c]=D.charCodeAt(c);t(h.buffer,o)}else{var r=new XMLHttpRequest;r.open(o._xhr.method,a,!0),r.withCredentials=o._xhr.withCredentials,r.responseType="arraybuffer",o._xhr.headers&&Object.keys(o._xhr.headers).forEach(function(n){r.setRequestHeader(n,o._xhr.headers[n])}),r.onload=function(){var n=(r.status+"")[0];if(n!=="0"&&n!=="2"&&n!=="3"){o._emit("loaderror",null,"Failed loading audio file with status: "+r.status+".");return}t(r.response,o)},r.onerror=function(){o._webAudio&&(o._html5=!0,o._webAudio=!1,o._sounds=[],delete B[a],o.load())},E(r)}},E=function(o){try{o.send()}catch{o.onerror()}},t=function(o,a){var D=function(){a._emit("loaderror",null,"Decoding audio data failed.")},h=function(c){c&&a._sounds.length>0?(B[a._src]=c,e(a,c)):D()};typeof Promise<"u"&&I.ctx.decodeAudioData.length===1?I.ctx.decodeAudioData(o).then(h).catch(D):I.ctx.decodeAudioData(o,h,D)},e=function(o,a){a&&!o._duration&&(o._duration=a.duration),Object.keys(o._sprite).length===0&&(o._sprite={__default:[0,o._duration*1e3]}),o._state!=="loaded"&&(o._state="loaded",o._emit("load"),o._loadQueue())},s=function(){if(I.usingWebAudio){try{typeof AudioContext<"u"?I.ctx=new AudioContext:typeof webkitAudioContext<"u"?I.ctx=new webkitAudioContext:I.usingWebAudio=!1}catch{I.usingWebAudio=!1}I.ctx||(I.usingWebAudio=!1);var o=/iP(hone|od|ad)/.test(I._navigator&&I._navigator.platform),a=I._navigator&&I._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),D=a?parseInt(a[1],10):null;if(o&&D&&D<9){var h=/safari/.test(I._navigator&&I._navigator.userAgent.toLowerCase());I._navigator&&!h&&(I.usingWebAudio=!1)}I.usingWebAudio&&(I.masterGain=typeof I.ctx.createGain>"u"?I.ctx.createGainNode():I.ctx.createGain(),I.masterGain.gain.setValueAtTime(I._muted?0:I._volume,I.ctx.currentTime),I.masterGain.connect(I.ctx.destination)),I._setup()}};Q.Howler=I,Q.Howl=g,typeof yQ<"u"?(yQ.HowlerGlobal=A,yQ.Howler=I,yQ.Howl=g,yQ.Sound=C):typeof window<"u"&&(window.HowlerGlobal=A,window.Howler=I,window.Howl=g,window.Sound=C)})();/*!
 *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
 *  
 *  howler.js v2.2.3
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */(function(){HowlerGlobal.prototype._pos=[0,0,0],HowlerGlobal.prototype._orientation=[0,0,-1,0,1,0],HowlerGlobal.prototype.stereo=function(I){var g=this;if(!g.ctx||!g.ctx.listener)return g;for(var C=g._howls.length-1;C>=0;C--)g._howls[C].stereo(I);return g},HowlerGlobal.prototype.pos=function(I,g,C){var B=this;if(!B.ctx||!B.ctx.listener)return B;if(g=typeof g!="number"?B._pos[1]:g,C=typeof C!="number"?B._pos[2]:C,typeof I=="number")B._pos=[I,g,C],typeof B.ctx.listener.positionX<"u"?(B.ctx.listener.positionX.setTargetAtTime(B._pos[0],Howler.ctx.currentTime,.1),B.ctx.listener.positionY.setTargetAtTime(B._pos[1],Howler.ctx.currentTime,.1),B.ctx.listener.positionZ.setTargetAtTime(B._pos[2],Howler.ctx.currentTime,.1)):B.ctx.listener.setPosition(B._pos[0],B._pos[1],B._pos[2]);else return B._pos;return B},HowlerGlobal.prototype.orientation=function(I,g,C,B,i,E){var t=this;if(!t.ctx||!t.ctx.listener)return t;var e=t._orientation;if(g=typeof g!="number"?e[1]:g,C=typeof C!="number"?e[2]:C,B=typeof B!="number"?e[3]:B,i=typeof i!="number"?e[4]:i,E=typeof E!="number"?e[5]:E,typeof I=="number")t._orientation=[I,g,C,B,i,E],typeof t.ctx.listener.forwardX<"u"?(t.ctx.listener.forwardX.setTargetAtTime(I,Howler.ctx.currentTime,.1),t.ctx.listener.forwardY.setTargetAtTime(g,Howler.ctx.currentTime,.1),t.ctx.listener.forwardZ.setTargetAtTime(C,Howler.ctx.currentTime,.1),t.ctx.listener.upX.setTargetAtTime(B,Howler.ctx.currentTime,.1),t.ctx.listener.upY.setTargetAtTime(i,Howler.ctx.currentTime,.1),t.ctx.listener.upZ.setTargetAtTime(E,Howler.ctx.currentTime,.1)):t.ctx.listener.setOrientation(I,g,C,B,i,E);else return e;return t},Howl.prototype.init=function(I){return function(g){var C=this;return C._orientation=g.orientation||[1,0,0],C._stereo=g.stereo||null,C._pos=g.pos||null,C._pannerAttr={coneInnerAngle:typeof g.coneInnerAngle<"u"?g.coneInnerAngle:360,coneOuterAngle:typeof g.coneOuterAngle<"u"?g.coneOuterAngle:360,coneOuterGain:typeof g.coneOuterGain<"u"?g.coneOuterGain:0,distanceModel:typeof g.distanceModel<"u"?g.distanceModel:"inverse",maxDistance:typeof g.maxDistance<"u"?g.maxDistance:1e4,panningModel:typeof g.panningModel<"u"?g.panningModel:"HRTF",refDistance:typeof g.refDistance<"u"?g.refDistance:1,rolloffFactor:typeof g.rolloffFactor<"u"?g.rolloffFactor:1},C._onstereo=g.onstereo?[{fn:g.onstereo}]:[],C._onpos=g.onpos?[{fn:g.onpos}]:[],C._onorientation=g.onorientation?[{fn:g.onorientation}]:[],I.call(this,g)}}(Howl.prototype.init),Howl.prototype.stereo=function(I,g){var C=this;if(!C._webAudio)return C;if(C._state!=="loaded")return C._queue.push({event:"stereo",action:function(){C.stereo(I,g)}}),C;var B=typeof Howler.ctx.createStereoPanner>"u"?"spatial":"stereo";if(typeof g>"u")if(typeof I=="number")C._stereo=I,C._pos=[I,0,0];else return C._stereo;for(var i=C._getSoundIds(g),E=0;E<i.length;E++){var t=C._soundById(i[E]);if(t)if(typeof I=="number")t._stereo=I,t._pos=[I,0,0],t._node&&(t._pannerAttr.panningModel="equalpower",(!t._panner||!t._panner.pan)&&A(t,B),B==="spatial"?typeof t._panner.positionX<"u"?(t._panner.positionX.setValueAtTime(I,Howler.ctx.currentTime),t._panner.positionY.setValueAtTime(0,Howler.ctx.currentTime),t._panner.positionZ.setValueAtTime(0,Howler.ctx.currentTime)):t._panner.setPosition(I,0,0):t._panner.pan.setValueAtTime(I,Howler.ctx.currentTime)),C._emit("stereo",t._id);else return t._stereo}return C},Howl.prototype.pos=function(I,g,C,B){var i=this;if(!i._webAudio)return i;if(i._state!=="loaded")return i._queue.push({event:"pos",action:function(){i.pos(I,g,C,B)}}),i;if(g=typeof g!="number"?0:g,C=typeof C!="number"?-.5:C,typeof B>"u")if(typeof I=="number")i._pos=[I,g,C];else return i._pos;for(var E=i._getSoundIds(B),t=0;t<E.length;t++){var e=i._soundById(E[t]);if(e)if(typeof I=="number")e._pos=[I,g,C],e._node&&((!e._panner||e._panner.pan)&&A(e,"spatial"),typeof e._panner.positionX<"u"?(e._panner.positionX.setValueAtTime(I,Howler.ctx.currentTime),e._panner.positionY.setValueAtTime(g,Howler.ctx.currentTime),e._panner.positionZ.setValueAtTime(C,Howler.ctx.currentTime)):e._panner.setPosition(I,g,C)),i._emit("pos",e._id);else return e._pos}return i},Howl.prototype.orientation=function(I,g,C,B){var i=this;if(!i._webAudio)return i;if(i._state!=="loaded")return i._queue.push({event:"orientation",action:function(){i.orientation(I,g,C,B)}}),i;if(g=typeof g!="number"?i._orientation[1]:g,C=typeof C!="number"?i._orientation[2]:C,typeof B>"u")if(typeof I=="number")i._orientation=[I,g,C];else return i._orientation;for(var E=i._getSoundIds(B),t=0;t<E.length;t++){var e=i._soundById(E[t]);if(e)if(typeof I=="number")e._orientation=[I,g,C],e._node&&(e._panner||(e._pos||(e._pos=i._pos||[0,0,-.5]),A(e,"spatial")),typeof e._panner.orientationX<"u"?(e._panner.orientationX.setValueAtTime(I,Howler.ctx.currentTime),e._panner.orientationY.setValueAtTime(g,Howler.ctx.currentTime),e._panner.orientationZ.setValueAtTime(C,Howler.ctx.currentTime)):e._panner.setOrientation(I,g,C)),i._emit("orientation",e._id);else return e._orientation}return i},Howl.prototype.pannerAttr=function(){var I=this,g=arguments,C,B,i;if(!I._webAudio)return I;if(g.length===0)return I._pannerAttr;if(g.length===1)if(typeof g[0]=="object")C=g[0],typeof B>"u"&&(C.pannerAttr||(C.pannerAttr={coneInnerAngle:C.coneInnerAngle,coneOuterAngle:C.coneOuterAngle,coneOuterGain:C.coneOuterGain,distanceModel:C.distanceModel,maxDistance:C.maxDistance,refDistance:C.refDistance,rolloffFactor:C.rolloffFactor,panningModel:C.panningModel}),I._pannerAttr={coneInnerAngle:typeof C.pannerAttr.coneInnerAngle<"u"?C.pannerAttr.coneInnerAngle:I._coneInnerAngle,coneOuterAngle:typeof C.pannerAttr.coneOuterAngle<"u"?C.pannerAttr.coneOuterAngle:I._coneOuterAngle,coneOuterGain:typeof C.pannerAttr.coneOuterGain<"u"?C.pannerAttr.coneOuterGain:I._coneOuterGain,distanceModel:typeof C.pannerAttr.distanceModel<"u"?C.pannerAttr.distanceModel:I._distanceModel,maxDistance:typeof C.pannerAttr.maxDistance<"u"?C.pannerAttr.maxDistance:I._maxDistance,refDistance:typeof C.pannerAttr.refDistance<"u"?C.pannerAttr.refDistance:I._refDistance,rolloffFactor:typeof C.pannerAttr.rolloffFactor<"u"?C.pannerAttr.rolloffFactor:I._rolloffFactor,panningModel:typeof C.pannerAttr.panningModel<"u"?C.pannerAttr.panningModel:I._panningModel});else return i=I._soundById(parseInt(g[0],10)),i?i._pannerAttr:I._pannerAttr;else g.length===2&&(C=g[0],B=parseInt(g[1],10));for(var E=I._getSoundIds(B),t=0;t<E.length;t++)if(i=I._soundById(E[t]),i){var e=i._pannerAttr;e={coneInnerAngle:typeof C.coneInnerAngle<"u"?C.coneInnerAngle:e.coneInnerAngle,coneOuterAngle:typeof C.coneOuterAngle<"u"?C.coneOuterAngle:e.coneOuterAngle,coneOuterGain:typeof C.coneOuterGain<"u"?C.coneOuterGain:e.coneOuterGain,distanceModel:typeof C.distanceModel<"u"?C.distanceModel:e.distanceModel,maxDistance:typeof C.maxDistance<"u"?C.maxDistance:e.maxDistance,refDistance:typeof C.refDistance<"u"?C.refDistance:e.refDistance,rolloffFactor:typeof C.rolloffFactor<"u"?C.rolloffFactor:e.rolloffFactor,panningModel:typeof C.panningModel<"u"?C.panningModel:e.panningModel};var s=i._panner;s?(s.coneInnerAngle=e.coneInnerAngle,s.coneOuterAngle=e.coneOuterAngle,s.coneOuterGain=e.coneOuterGain,s.distanceModel=e.distanceModel,s.maxDistance=e.maxDistance,s.refDistance=e.refDistance,s.rolloffFactor=e.rolloffFactor,s.panningModel=e.panningModel):(i._pos||(i._pos=I._pos||[0,0,-.5]),A(i,"spatial"))}return I},Sound.prototype.init=function(I){return function(){var g=this,C=g._parent;g._orientation=C._orientation,g._stereo=C._stereo,g._pos=C._pos,g._pannerAttr=C._pannerAttr,I.call(this),g._stereo?C.stereo(g._stereo):g._pos&&C.pos(g._pos[0],g._pos[1],g._pos[2],g._id)}}(Sound.prototype.init),Sound.prototype.reset=function(I){return function(){var g=this,C=g._parent;return g._orientation=C._orientation,g._stereo=C._stereo,g._pos=C._pos,g._pannerAttr=C._pannerAttr,g._stereo?C.stereo(g._stereo):g._pos?C.pos(g._pos[0],g._pos[1],g._pos[2],g._id):g._panner&&(g._panner.disconnect(0),g._panner=void 0,C._refreshBuffer(g)),I.call(this)}}(Sound.prototype.reset);var A=function(I,g){g=g||"spatial",g==="spatial"?(I._panner=Howler.ctx.createPanner(),I._panner.coneInnerAngle=I._pannerAttr.coneInnerAngle,I._panner.coneOuterAngle=I._pannerAttr.coneOuterAngle,I._panner.coneOuterGain=I._pannerAttr.coneOuterGain,I._panner.distanceModel=I._pannerAttr.distanceModel,I._panner.maxDistance=I._pannerAttr.maxDistance,I._panner.refDistance=I._pannerAttr.refDistance,I._panner.rolloffFactor=I._pannerAttr.rolloffFactor,I._panner.panningModel=I._pannerAttr.panningModel,typeof I._panner.positionX<"u"?(I._panner.positionX.setValueAtTime(I._pos[0],Howler.ctx.currentTime),I._panner.positionY.setValueAtTime(I._pos[1],Howler.ctx.currentTime),I._panner.positionZ.setValueAtTime(I._pos[2],Howler.ctx.currentTime)):I._panner.setPosition(I._pos[0],I._pos[1],I._pos[2]),typeof I._panner.orientationX<"u"?(I._panner.orientationX.setValueAtTime(I._orientation[0],Howler.ctx.currentTime),I._panner.orientationY.setValueAtTime(I._orientation[1],Howler.ctx.currentTime),I._panner.orientationZ.setValueAtTime(I._orientation[2],Howler.ctx.currentTime)):I._panner.setOrientation(I._orientation[0],I._orientation[1],I._orientation[2])):(I._panner=Howler.ctx.createStereoPanner(),I._panner.pan.setValueAtTime(I._stereo,Howler.ctx.currentTime)),I._panner.connect(I._node),I._paused||I._parent.pause(I._id,!0).play(I._id,!0)}})()})(uh);const XM=new fh;function zM(Q){return Q.debug=XM,new VM(Q)}function $M(Q){Q.destroy(),Q.mesh.parent.remove(Q.mesh),Q.mesh.geometry.dispose(),Q.mesh.material.dispose(),Q.mesh=void 0,Q.body.setEnabled(!1)}const AU={create:zM,destroy:$M,GameEntityType:De,Howl:uh.Howl,THREE:oM,RAPIER:cM};exports.Zylem=AU;