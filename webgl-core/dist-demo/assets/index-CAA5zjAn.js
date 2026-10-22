(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const c of r)if(c.type==="childList")for(const _ of c.addedNodes)_.tagName==="LINK"&&_.rel==="modulepreload"&&o(_)}).observe(document,{childList:!0,subtree:!0});function i(r){const c={};return r.integrity&&(c.integrity=r.integrity),r.referrerPolicy&&(c.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?c.credentials="include":r.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function o(r){if(r.ep)return;r.ep=!0;const c=i(r);fetch(r.href,c)}})();function $(e){const n=e.getContext("webgl",{antialias:!1});if(!n)throw new Error("WebGL is not supported in this environment");return M(e,n),n}function M(e,n){const i=window.devicePixelRatio??1,{clientWidth:o,clientHeight:r}=e;e.width=Math.round(o*i),e.height=Math.round(r*i),n.viewport(0,0,e.width,e.height)}function K(){const e=[];let n=null,i=null;function o(r){const c=i!==null?(r-i)/1e3:0;i=r;for(const _ of e)_(c);n=requestAnimationFrame(o)}return{start(){n===null&&(i=null,n=requestAnimationFrame(o))},stop(){n!==null&&(cancelAnimationFrame(n),n=null)},onTick(r){e.push(r)}}}function O(e,n=e.STATIC_DRAW){const i=e.createBuffer();if(!i)throw new Error("Failed to create WebGL buffer");let o=!1;return{buffer:i,upload(r){e.bindBuffer(e.ARRAY_BUFFER,i),o?e.bufferSubData(e.ARRAY_BUFFER,0,r):(e.bufferData(e.ARRAY_BUFFER,r,n),o=!0)},bind(){e.bindBuffer(e.ARRAY_BUFFER,i)},dispose(){e.deleteBuffer(i)}}}function D(e,n,i){const o=e.createShader(n);if(!o)throw new Error("Failed to create shader");if(e.shaderSource(o,i),e.compileShader(o),!e.getShaderParameter(o,e.COMPILE_STATUS)){const r=e.getShaderInfoLog(o)??"unknown error";throw e.deleteShader(o),new Error(`Shader compile error:
${r}`)}return o}function X(e,n,i){var A;const o=D(e,e.VERTEX_SHADER,n.vertSrc),r=D(e,e.FRAGMENT_SHADER,n.fragSrc),c=e.createProgram();if(!c)throw new Error("Failed to create shader program");if(e.attachShader(c,o),e.attachShader(c,r),e.linkProgram(c),e.deleteShader(o),e.deleteShader(r),!e.getProgramParameter(c,e.LINK_STATUS)){const d=e.getProgramInfoLog(c)??"unknown error";throw e.deleteProgram(c),new Error(`Shader link error:
${d}`)}const _={};for(const d of i)_[d]=e.getUniformLocation(c,d);return(A=n.onInit)==null||A.call(n,e,c),{program:c,uniforms:_,use(){e.useProgram(c)},dispose(){e.deleteProgram(c)}}}function N(e,n,i,o){return n.dispose(),X(e,i,o)}const B=80,C=12,Z=320,j=56,J=36,Q=20,ee=22,te=10;function re(e,n){let i=!1,o=0;const r=n.getContext("2d");function c(){return window.devicePixelRatio??1}function _(){const a=c(),s=B*a,u=C*a,l=n.width-s-u,f=u;r.fillStyle="rgba(20, 20, 20, 0.75)",r.beginPath(),r.roundRect(l,f,s,s,6*a),r.fill(),r.fillStyle="#aaaaaa",r.font=`${26*a}px monospace`,r.textBaseline="middle",r.textAlign="center",r.fillText("⋮",l+s/2,f+s/2),r.textAlign="left"}function A(){const a=c(),s=j*a,u=J*a,l=Q*a,f=Z*a,h=l*2+e.items.length*s,m=(n.width-f)/2,v=(n.height-h)/2;return{d:a,itemH:s,padX:u,padY:l,menuW:f,menuH:h,menuX:m,menuY:v}}function d(){const a=n.width,s=n.height;if(r.clearRect(0,0,a,s),!i){_();return}r.fillStyle="rgba(0, 0, 0, 0.6)",r.fillRect(0,0,a,s);const{d:u,itemH:l,padX:f,padY:h,menuW:m,menuH:v,menuX:b,menuY:x}=A();r.fillStyle="rgba(20, 20, 20, 0.92)",r.beginPath(),r.roundRect(b,x,m,v,te*u),r.fill(),r.font=`${ee*u}px monospace`,r.textBaseline="middle",e.items.forEach((R,g)=>{const w=x+h+g*l;g===o?(r.fillStyle="rgba(255, 255, 255, 0.15)",r.fillRect(b+4*u,w,m-8*u,l),r.fillStyle="#ffffff"):r.fillStyle="#aaaaaa",r.fillText(R.label,b+f,w+l/2)})}function z(a,s){const u=c(),l=B*u,f=C*u,h=n.width-l-f,m=f;return a>=h&&a<=h+l&&s>=m&&s<=m+l}return{open(){i=!0,o=0,d()},close(){i=!1,d()},isOpen(){return i},render(){d()},handleInput(a){if(a instanceof KeyboardEvent){if(!i)return!1;if(a.key==="Escape")return i=!1,d(),!0;if(a.key==="ArrowDown")return o=(o+1)%e.items.length,d(),!0;if(a.key==="ArrowUp")return o=(o-1+e.items.length)%e.items.length,d(),!0;if(a.key==="Enter")return e.items[o].onSelect(),d(),!0}if(a instanceof MouseEvent||typeof TouchEvent<"u"&&a instanceof TouchEvent){typeof TouchEvent<"u"&&a instanceof TouchEvent&&a.preventDefault();const s=a instanceof MouseEvent?{x:a.clientX,y:a.clientY}:{x:a.changedTouches[0].clientX,y:a.changedTouches[0].clientY},u=n.getBoundingClientRect(),l=n.width/u.width,f=n.height/u.height,h=(s.x-u.left)*l,m=(s.y-u.top)*f;if(!i)return z(h,m)?(i=!0,o=0,d(),!0):!1;const{itemH:v,padY:b,menuW:x,menuX:R,menuY:g}=A();return e.items.forEach((w,F)=>{const U=g+b+F*v;h>=R&&h<=R+x&&m>=U&&m<=U+v&&(o=F,w.onSelect(),d())}),!0}return!1}}}const T=document.getElementById("c"),S=document.getElementById("overlay"),t=$(T),Y={vertSrc:`
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_uv = a_uv; }
  `,fragSrc:`
    precision mediump float;
    uniform sampler2D u_texture;
    uniform bool u_useTexture;
    varying vec2 v_uv;
    void main() {
      if (u_useTexture) {
        vec4 c = texture2D(u_texture, v_uv);
        if (c.a < 0.1) discard;
        gl_FragColor = c;
      } else {
        gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
      }
    }
  `},ne={vertSrc:`
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_uv = a_uv; }
  `,fragSrc:`
    precision mediump float;
    uniform sampler2D u_texture;
    uniform bool u_useTexture;
    varying vec2 v_uv;
    void main() {
      if (u_useTexture) {
        vec4 c = texture2D(u_texture, v_uv);
        if (c.a < 0.1) discard;
        gl_FragColor = c;
      } else {
        gl_FragColor = vec4(0.2, 0.4, 1.0, 1.0);
      }
    }
  `},P=["u_texture","u_useTexture"],oe=new Float32Array([0,.6,.5,1,-.5,-.4,0,0,.5,-.4,1,0]),ie=new Float32Array([-.5,.5,0,0,.5,.5,1,0,.5,-.5,1,1,-.5,.5,0,0,.5,-.5,1,1,-.5,-.5,0,1]),k=O(t);k.upload(oe);const G=O(t);G.upload(ie);function H(e){return new Promise((n,i)=>{const o=new Image;o.onload=()=>{const r=t.createTexture();t.bindTexture(t.TEXTURE_2D,r),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,o),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),n(r)},o.onerror=i,o.src=e})}let W=null,V=null;H("./assets/Gloin_Icon.png").then(e=>{W=e});H("./assets/Meek_Shock_Icon.png").then(e=>{V=e});let E=X(t,Y,P),y="red",L=!1;function I(){L=!L}S.width=T.width;S.height=T.height;const p=re({items:[{label:"Switch Shader",onSelect(){y==="red"?(E=N(t,E,ne,P),y="blue"):(E=N(t,E,Y,P),y="red"),p.close()}},{label:"Close",onSelect(){p.close()}}]},S);function ae(){S.width=T.width,S.height=T.height,p.render()}window.addEventListener("keydown",e=>{if(e.key==="Escape"&&!p.isOpen()){p.open();return}p.handleInput(e)||e.key==="Enter"&&I()});S.addEventListener("click",e=>{p.handleInput(e)||I()});S.addEventListener("touchend",e=>{e.preventDefault(),!p.handleInput(e)&&I()},{passive:!1});new ResizeObserver(()=>{M(T,t),ae()}).observe(T);const q=K();q.onTick(()=>{t.clearColor(.08,.08,.08,1),t.clear(t.COLOR_BUFFER_BIT),E.use();const e=t.getAttribLocation(E.program,"a_position"),n=t.getAttribLocation(E.program,"a_uv"),i=4*4,o=y==="red"?W:V;L&&o?(t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),G.bind(),t.enableVertexAttribArray(e),t.vertexAttribPointer(e,2,t.FLOAT,!1,i,0),t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,i,2*4),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,o),t.uniform1i(E.uniforms.u_texture,0),t.uniform1i(E.uniforms.u_useTexture,1),t.drawArrays(t.TRIANGLES,0,6),t.disable(t.BLEND)):(k.bind(),t.enableVertexAttribArray(e),t.vertexAttribPointer(e,2,t.FLOAT,!1,i,0),t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,i,2*4),t.uniform1i(E.uniforms.u_useTexture,0),t.drawArrays(t.TRIANGLES,0,3))});q.start();
