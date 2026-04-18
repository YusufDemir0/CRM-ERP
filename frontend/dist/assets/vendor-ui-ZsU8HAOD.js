import{r as c,R as O}from"./vendor-react-CjPko7if.js";let J={data:""},X=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||J},ee=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,te=/\/\*[^]*?\*\/|  +/g,R=/\n+/g,x=(e,t)=>{let r="",a="",s="";for(let o in e){let i=e[o];o[0]=="@"?o[1]=="i"?r=o+" "+i+";":a+=o[1]=="f"?x(i,o):o+"{"+x(i,o[1]=="k"?"":t)+"}":typeof i=="object"?a+=x(i,t?t.replace(/([^,])+/g,n=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):o):i!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=x.p?x.p(o,i):o+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+a},h={},W=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+W(e[r]);return t}return e},re=(e,t,r,a,s)=>{let o=W(e),i=h[o]||(h[o]=(l=>{let d=0,p=11;for(;d<l.length;)p=101*p+l.charCodeAt(d++)>>>0;return"go"+p})(o));if(!h[i]){let l=o!==e?e:(d=>{let p,u,m=[{}];for(;p=ee.exec(d.replace(te,""));)p[4]?m.shift():p[3]?(u=p[3].replace(R," ").trim(),m.unshift(m[0][u]=m[0][u]||{})):m[0][p[1]]=p[2].replace(R," ").trim();return m[0]})(e);h[i]=x(s?{["@keyframes "+i]:l}:l,r?"":"."+i)}let n=r&&h.g?h.g:null;return r&&(h.g=h[i]),((l,d,p,u)=>{u?d.data=d.data.replace(u,l):d.data.indexOf(l)===-1&&(d.data=p?l+d.data:d.data+l)})(h[i],t,a,n),i},ae=(e,t,r)=>e.reduce((a,s,o)=>{let i=t[o];if(i&&i.call){let n=i(r),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;i=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return a+s+(i??"")},"");function N(e){let t=this||{},r=e.call?e(t.p):e;return re(r.unshift?r.raw?ae(r,[].slice.call(arguments,1),t.p):r.reduce((a,s)=>Object.assign(a,s&&s.call?s(t.p):s),{}):r,X(t.target),t.g,t.o,t.k)}let B,S,A;N.bind({g:1});let v=N.bind({k:1});function ie(e,t,r,a){x.p=t,B=e,S=r,A=a}function w(e,t){let r=this||{};return function(){let a=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;r.p=Object.assign({theme:S&&S()},n),r.o=/ *go\d+/.test(l),n.className=N.apply(r,a)+(l?" "+l:"");let d=e;return e[0]&&(d=n.as||e,delete n.as),A&&d[0]&&A(n),B(d,n)}return s}}var oe=e=>typeof e=="function",C=(e,t)=>oe(e)?e(t):e,se=(()=>{let e=0;return()=>(++e).toString()})(),K=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ne=20,T="default",G=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===t.toast.id?{...i,...t.toast}:i)};case 2:let{toast:a}=t;return G(e,{type:e.toasts.find(i=>i.id===a.id)?1:0,toast:a});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(i=>i.id===s||s===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+o}))}}},k=[],U={toasts:[],pausedAt:void 0,settings:{toastLimit:ne}},b={},Y=(e,t=T)=>{b[t]=G(b[t]||U,e),k.forEach(([r,a])=>{r===t&&a(b[t])})},Z=e=>Object.keys(b).forEach(t=>Y(e,t)),le=e=>Object.keys(b).find(t=>b[t].toasts.some(r=>r.id===e)),z=(e=T)=>t=>{Y(t,e)},ce={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ue=(e={},t=T)=>{let[r,a]=c.useState(b[t]||U),s=c.useRef(b[t]);c.useEffect(()=>(s.current!==b[t]&&a(b[t]),k.push([t,a]),()=>{let i=k.findIndex(([n])=>n===t);i>-1&&k.splice(i,1)}),[t]);let o=r.toasts.map(i=>{var n,l,d;return{...e,...e[i.type],...i,removeDelay:i.removeDelay||((n=e[i.type])==null?void 0:n.removeDelay)||e?.removeDelay,duration:i.duration||((l=e[i.type])==null?void 0:l.duration)||e?.duration||ce[i.type],style:{...e.style,...(d=e[i.type])==null?void 0:d.style,...i.style}}});return{...r,toasts:o}},de=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:r?.id||se()}),E=e=>(t,r)=>{let a=de(t,e,r);return z(a.toasterId||le(a.id))({type:2,toast:a}),a.id},f=(e,t)=>E("blank")(e,t);f.error=E("error");f.success=E("success");f.loading=E("loading");f.custom=E("custom");f.dismiss=(e,t)=>{let r={type:3,toastId:e};t?z(t)(r):Z(r)};f.dismissAll=e=>f.dismiss(void 0,e);f.remove=(e,t)=>{let r={type:4,toastId:e};t?z(t)(r):Z(r)};f.removeAll=e=>f.remove(void 0,e);f.promise=(e,t,r)=>{let a=f.loading(t.loading,{...r,...r?.loading});return typeof e=="function"&&(e=e()),e.then(s=>{let o=t.success?C(t.success,s):void 0;return o?f.success(o,{id:a,...r,...r?.success}):f.dismiss(a),s}).catch(s=>{let o=t.error?C(t.error,s):void 0;o?f.error(o,{id:a,...r,...r?.error}):f.dismiss(a)}),e};var pe=1e3,me=(e,t="default")=>{let{toasts:r,pausedAt:a}=ue(e,t),s=c.useRef(new Map).current,o=c.useCallback((u,m=pe)=>{if(s.has(u))return;let g=setTimeout(()=>{s.delete(u),i({type:4,toastId:u})},m);s.set(u,g)},[]);c.useEffect(()=>{if(a)return;let u=Date.now(),m=r.map(g=>{if(g.duration===1/0)return;let j=(g.duration||0)+g.pauseDuration-(u-g.createdAt);if(j<0){g.visible&&f.dismiss(g.id);return}return setTimeout(()=>f.dismiss(g.id,t),j)});return()=>{m.forEach(g=>g&&clearTimeout(g))}},[r,a,t]);let i=c.useCallback(z(t),[t]),n=c.useCallback(()=>{i({type:5,time:Date.now()})},[i]),l=c.useCallback((u,m)=>{i({type:1,toast:{id:u,height:m}})},[i]),d=c.useCallback(()=>{a&&i({type:6,time:Date.now()})},[a,i]),p=c.useCallback((u,m)=>{let{reverseOrder:g=!1,gutter:j=8,defaultPosition:F}=m||{},I=r.filter(y=>(y.position||F)===(u.position||F)&&y.height),V=I.findIndex(y=>y.id===u.id),L=I.filter((y,_)=>_<V&&y.visible).length;return I.filter(y=>y.visible).slice(...g?[L+1]:[0,L]).reduce((y,_)=>y+(_.height||0)+j,0)},[r]);return c.useEffect(()=>{r.forEach(u=>{if(u.dismissed)o(u.id,u.removeDelay);else{let m=s.get(u.id);m&&(clearTimeout(m),s.delete(u.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:l,startPause:n,endPause:d,calculateOffset:p}}},fe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ge=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ye=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,be=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ge} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ye} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,he=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ve=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${he} 1s linear infinite;
`,xe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,we=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Oe=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${xe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${we} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Ee=w("div")`
  position: absolute;
`,je=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Pe=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ke=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Pe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ce=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return t!==void 0?typeof t=="string"?c.createElement(ke,null,t):t:r==="blank"?null:c.createElement(je,null,c.createElement(ve,{...a}),r!=="loading"&&c.createElement(Ee,null,r==="error"?c.createElement(be,{...a}):c.createElement(Oe,{...a})))},$e=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,De=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ne="0%{opacity:0;} 100%{opacity:1;}",ze="0%{opacity:1;} 100%{opacity:0;}",Ie=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,_e=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Se=(e,t)=>{let r=e.includes("top")?1:-1,[a,s]=K()?[Ne,ze]:[$e(r),De(r)];return{animation:t?`${v(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ae=c.memo(({toast:e,position:t,style:r,children:a})=>{let s=e.height?Se(e.position||t||"top-center",e.visible):{opacity:0},o=c.createElement(Ce,{toast:e}),i=c.createElement(_e,{...e.ariaProps},C(e.message,e));return c.createElement(Ie,{className:e.className,style:{...s,...r,...e.style}},typeof a=="function"?a({icon:o,message:i}):c.createElement(c.Fragment,null,o,i))});ie(c.createElement);var Te=({id:e,className:t,style:r,onHeightUpdate:a,children:s})=>{let o=c.useCallback(i=>{if(i){let n=()=>{let l=i.getBoundingClientRect().height;a(e,l)};n(),new MutationObserver(n).observe(i,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return c.createElement("div",{ref:o,className:t,style:r},s)},Fe=(e,t)=>{let r=e.includes("top"),a=r?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:K()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...a,...s}},Le=N`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,P=16,Ye=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:s,toasterId:o,containerStyle:i,containerClassName:n})=>{let{toasts:l,handlers:d}=me(r,o);return c.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:P,left:P,right:P,bottom:P,pointerEvents:"none",...i},className:n,onMouseEnter:d.startPause,onMouseLeave:d.endPause},l.map(p=>{let u=p.position||t,m=d.calculateOffset(p,{reverseOrder:e,gutter:a,defaultPosition:t}),g=Fe(u,m);return c.createElement(Te,{id:p.id,key:p.id,onHeightUpdate:d.updateHeight,className:p.visible?Le:"",style:g},p.type==="custom"?C(p.message,p):s?s(p):c.createElement(Ae,{toast:p,position:u}))}))},Ze=f,q={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},M=O.createContext&&O.createContext(q),Re=["attr","size","title"];function Me(e,t){if(e==null)return{};var r,a,s=He(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)r=o[a],t.indexOf(r)===-1&&{}.propertyIsEnumerable.call(e,r)&&(s[r]=e[r])}return s}function He(e,t){if(e==null)return{};var r={};for(var a in e)if({}.hasOwnProperty.call(e,a)){if(t.indexOf(a)!==-1)continue;r[a]=e[a]}return r}function $(){return $=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var a in r)({}).hasOwnProperty.call(r,a)&&(e[a]=r[a])}return e},$.apply(null,arguments)}function H(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),r.push.apply(r,a)}return r}function D(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?H(Object(r),!0).forEach(function(a){We(e,a,r[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):H(Object(r)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(r,a))})}return e}function We(e,t,r){return(t=Be(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function Be(e){var t=Ke(e,"string");return typeof t=="symbol"?t:t+""}function Ke(e,t){if(typeof e!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var a=r.call(e,t);if(typeof a!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Q(e){return e&&e.map((t,r)=>O.createElement(t.tag,D({key:r},t.attr),Q(t.child)))}function qe(e){return t=>O.createElement(Ge,$({attr:D({},e.attr)},t),Q(e.child))}function Ge(e){var t=r=>{var{attr:a,size:s,title:o}=e,i=Me(e,Re),n=s||r.size||"1em",l;return r.className&&(l=r.className),e.className&&(l=(l?l+" ":"")+e.className),O.createElement("svg",$({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},r.attr,a,i,{className:l,style:D(D({color:e.color||r.color},r.style),e.style),height:n,width:n,xmlns:"http://www.w3.org/2000/svg"}),o&&O.createElement("title",null,o),e.children)};return M!==void 0?O.createElement(M.Consumer,null,r=>t(r)):t(q)}export{Ye as F,qe as G,Ze as z};
