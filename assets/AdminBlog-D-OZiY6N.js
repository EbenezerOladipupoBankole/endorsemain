import{r as n,j as e,k as s,a4 as I,a5 as F,a6 as L,a7 as z,b as $,q as J,t as E,f as j,a8 as H,v as M,a9 as V,o as S,c as W,B as f,L as N,I as A,a0 as Q,s as D,l as X,e as T,aa as K,a1 as O}from"./index-BHXHQjYw.js";import{T as Y,S as Z}from"./textarea-WGrYqrQy.js";import{C as ee,d as te}from"./card-DVpBgrzH.js";import{L as v}from"./label-BcWqhs_G.js";import{Q as R,i as ae}from"./quill.snow-BS15HguZ.js";import"./editorFonts-BujZu5Lg.js";import{E as re}from"./external-link-DMEja_9q.js";import{P as se,T as oe}from"./trash-2-LiX5wxni.js";import{A as ie}from"./arrow-left-BjxGY8SV.js";import{S as le}from"./send-BLVdY0hZ.js";import{I as ne}from"./image-CTLX8vOG.js";import{U as ce}from"./upload-B_le06gb.js";const C=R.import("formats/font");C.whitelist=["sans-serif","serif","monospace","jakarta","inter","playfair","georgia","times-new-roman","arial","verdana","courier-new"];R.register("formats/font",C,!0);const de=({value:P,onChange:u,placeholder:h})=>{const b=n.useRef(null),y=()=>{const i=document.createElement("input");i.setAttribute("type","file"),i.setAttribute("accept","image/*"),i.click(),i.onchange=async()=>{var p,x;const a=(p=i.files)==null?void 0:p[0];if(!a)return;const o=s.loading("Uploading image...");try{const c=I(F,`blog_content/${Date.now()}_${a.name}`);await L(c,a);const w=await z(c),l=(x=b.current)==null?void 0:x.getEditor(),g=l==null?void 0:l.getSelection();l&&g&&(l.insertEmbed(g.index,"image",w),l.setSelection(g.index+1,0)),s.success("Image uploaded",{id:o})}catch(c){console.error("Error uploading image:",c),s.error("Failed to upload image",{id:o})}}},k=n.useMemo(()=>({toolbar:{container:[[{header:[1,2,3,4,5,6,!1]}],[{font:C.whitelist}],["bold","italic","underline","strike"],[{color:[]},{background:[]}],[{list:"ordered"},{list:"bullet"}],[{align:[]}],["link","image","video","code-block"],["clean"]],handlers:{image:y}}}),[]),q=["header","font","bold","italic","underline","strike","color","background","list","bullet","align","link","image","video","code-block"];return e.jsxs("div",{className:"rich-text-editor",children:[e.jsx("style",{children:`
        /* Font families */
        .ql-font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
        .ql-font-inter { font-family: 'Inter', sans-serif; }
        .ql-font-playfair { font-family: 'Playfair Display', serif; }
        .ql-font-georgia { font-family: Georgia, serif; }
        .ql-font-times-new-roman { font-family: 'Times New Roman', Times, serif; }
        .ql-font-arial { font-family: Arial, Helvetica, sans-serif; }
        .ql-font-verdana { font-family: Verdana, Geneva, sans-serif; }
        .ql-font-courier-new { font-family: 'Courier New', Courier, monospace; }

        /* Toolbar picker labels */
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item::before {
          content: 'Default';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
          content: 'Serif';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
          content: 'Monospace';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="jakarta"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="jakarta"]::before {
          content: 'Jakarta';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="inter"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="inter"]::before {
          content: 'Inter';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="playfair"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="playfair"]::before {
          content: 'Playfair';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before {
          content: 'Georgia';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before {
          content: 'Times New Roman';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
          content: 'Arial';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before {
          content: 'Verdana';
        }
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="courier-new"]::before,
        .rich-text-editor .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="courier-new"]::before {
          content: 'Courier New';
        }

        .rich-text-editor .ql-container {
          min-height: 400px;
          font-size: 20px;
          border: none !important;
          background: transparent;
          font-family: 'Times New Roman', Times, serif;
        }
        .rich-text-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #ffffff;
          position: sticky;
          top: 64px;
          z-index: 40;
          padding: 12px 0 !important;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #b3b3b1;
          font-style: normal;
          left: 0;
        }
        .rich-text-editor .ql-editor {
          line-height: 1.8;
          padding: 1rem 0;
          color: #242424;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }
        .rich-text-editor .ql-editor h1, 
        .rich-text-editor .ql-editor h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
      `}),e.jsx(ae,{ref:b,theme:"snow",value:P,onChange:u,modules:k,formats:q,placeholder:h})]})},ye=()=>{const{user:P,isAdmin:u}=$(),[h,b]=n.useState([]),[y,k]=n.useState(!0),[q,i]=n.useState(!1),[a,o]=n.useState({title:"",excerpt:"",content:"",category:"Product Updates",author:"Endorse Team",image:""}),[p,x]=n.useState(!1),[c,w]=n.useState(!1);n.useEffect(()=>{u&&l()},[u]);const l=async()=>{try{const t=J(E(j,"blogs"),H("createdAt","desc")),d=(await M(t)).docs.map(m=>({id:m.id,...m.data()}));b(d)}catch(t){console.error("Error fetching posts:",t),s.error("Failed to load posts")}finally{k(!1)}},g=async t=>{var d;const r=(d=t.target.files)==null?void 0:d[0];if(r){if(!r.type.startsWith("image/")){s.error("Please upload an image file");return}w(!0);try{const m=I(F,`blog/${Date.now()}_${r.name}`);await L(m,r);const _=await z(m);o({...a,image:_}),s.success("Image uploaded successfully")}catch(m){console.error("Error uploading image:",m),s.error("Failed to upload image")}finally{w(!1)}}},U=async t=>{if(t.preventDefault(),!a.title||!a.content){s.error("Please fill in title and content");return}x(!0);try{const r=a.title.toLowerCase().replace(/ /g,"-").replace(/[^\w-]+/g,""),d={...a,slug:r,updatedAt:D()};a.id?(await X(T(j,"blogs",a.id),d),s.success("Post updated successfully")):(await K(E(j,"blogs"),{...d,createdAt:D()}),s.success("Post created successfully")),i(!1),o({title:"",excerpt:"",content:"",category:"Product Updates",author:"Endorse Team",image:"bg-blue-500/5"}),l()}catch(r){console.error("Error saving post:",r),s.error("Failed to save post")}finally{x(!1)}},B=async t=>{if(window.confirm("Are you sure you want to delete this post?"))try{await O(T(j,"blogs",t)),s.success("Post deleted"),l()}catch(r){console.error("Error deleting post:",r),s.error("Failed to delete post")}},G=t=>{o(t),i(!0),window.scrollTo(0,0)};return u?e.jsxs("div",{className:"min-h-screen bg-background",children:[e.jsx("header",{className:"sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur",children:e.jsxs("div",{className:"container flex h-16 items-center justify-between px-4 md:px-6",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx(S,{to:"/dashboard",children:e.jsx(W,{className:"h-9 md:h-10"})}),e.jsx("h1",{className:"text-sm font-bold uppercase tracking-wider text-muted-foreground",children:"Blog Admin"})]}),e.jsx(f,{variant:"outline",asChild:!0,children:e.jsxs(S,{to:"/blog",target:"_blank",children:[e.jsx(re,{className:"w-4 h-4 mr-2"})," View Public Blog"]})})]})}),e.jsxs("main",{className:"container py-10 px-4 md:px-6 max-w-5xl mx-auto",children:[e.jsxs("div",{className:"flex justify-between items-center mb-8",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-3xl font-bold",children:"Manage Content"}),e.jsx("p",{className:"text-muted-foreground",children:"Create and edit blog posts for Endorse."})]}),!q&&e.jsxs(f,{onClick:()=>i(!0),children:[e.jsx(se,{className:"w-4 h-4 mr-2"})," New Post"]})]}),q&&e.jsxs("div",{className:"fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:"sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(f,{variant:"ghost",size:"sm",onClick:()=>i(!1),children:[e.jsx(ie,{className:"w-4 h-4 mr-2"})," Cancel"]}),e.jsx("span",{className:"text-sm text-muted-foreground font-medium",children:a.id?"Editing Post":"Draft in Progress"})]}),e.jsxs(f,{onClick:U,disabled:p,className:"bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 rounded-full px-6",children:[p?e.jsx(N,{className:"w-4 h-4 mr-2 animate-spin"}):e.jsx(le,{className:"w-4 h-4 mr-2"}),a.id?"Update":"Publish"]})]}),e.jsxs("div",{className:"max-w-3xl mx-auto py-12 px-4 md:px-0",children:[e.jsx("input",{type:"text",value:a.title,onChange:t=>o({...a,title:t.target.value}),placeholder:"Title",className:"w-full text-5xl font-bold border-none outline-none focus:ring-0 bg-transparent placeholder:text-muted-foreground/30 mb-8 font-serif text-foreground"}),e.jsx("div",{className:"prose prose-lg dark:prose-invert max-w-none mb-16",children:e.jsx(de,{value:a.content||"",onChange:t=>o({...a,content:t}),placeholder:"Tell your story..."})}),e.jsxs("div",{className:"border-t pt-8 pb-20",children:[e.jsx("h3",{className:"text-xl font-bold mb-6 font-serif",children:"Post Settings"}),e.jsxs("div",{className:"grid md:grid-cols-2 gap-8",children:[e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{htmlFor:"category",className:"text-muted-foreground text-xs uppercase tracking-wider",children:"Category"}),e.jsx(A,{id:"category",value:a.category,onChange:t=>o({...a,category:t.target.value}),placeholder:"e.g. Product Updates",className:"bg-secondary/50 border-transparent focus:bg-background"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{htmlFor:"author",className:"text-muted-foreground text-xs uppercase tracking-wider",children:"Author"}),e.jsx(A,{id:"author",value:a.author,onChange:t=>o({...a,author:t.target.value}),className:"bg-secondary/50 border-transparent focus:bg-background"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{htmlFor:"excerpt",className:"text-muted-foreground text-xs uppercase tracking-wider",children:"Excerpt"}),e.jsx(Y,{id:"excerpt",value:a.excerpt,onChange:t=>o({...a,excerpt:t.target.value}),placeholder:"Short summary for the grid view...",rows:3,className:"bg-secondary/50 border-transparent focus:bg-background resize-none"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(v,{className:"text-muted-foreground text-xs uppercase tracking-wider mb-2 block",children:"Featured Image"}),e.jsxs("div",{className:"flex flex-col gap-4",children:[a.image?e.jsxs("div",{className:"relative w-full aspect-video rounded-lg overflow-hidden border bg-muted",children:[a.image.startsWith("bg-")?e.jsx("div",{className:`w-full h-full ${a.image}`}):e.jsx("img",{src:a.image,alt:"Preview",className:"w-full h-full object-cover"}),e.jsx(f,{type:"button",variant:"destructive",size:"icon",className:"absolute top-2 right-2 h-8 w-8 rounded-full shadow-sm",onClick:()=>o({...a,image:""}),children:e.jsx(Q,{className:"h-4 w-4"})})]}):e.jsxs("div",{className:"w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground hover:bg-secondary/50 transition-colors",children:[e.jsx(ne,{className:"w-10 h-10 mb-2 opacity-50"}),e.jsx("span",{className:"text-sm font-medium",children:"Add a cover image"})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"cursor-pointer inline-block w-full",children:[e.jsxs("div",{className:"flex justify-center items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors w-full text-sm font-medium",children:[c?e.jsx(N,{className:"w-4 h-4 animate-spin"}):e.jsx(ce,{className:"w-4 h-4"}),a.image?"Change Image":"Upload Image"]}),e.jsx("input",{type:"file",className:"hidden",accept:"image/*",onChange:g,disabled:c})]}),e.jsx("p",{className:"text-[11px] text-center text-muted-foreground mt-2",children:"Recommended: 1200x630px. High-quality WebP, PNG, or JPG."})]})]})]})]})]})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"font-semibold text-lg",children:"Existing Posts"}),y?e.jsx("div",{className:"flex justify-center p-12",children:e.jsx(N,{className:"w-8 h-8 animate-spin text-primary"})}):h.length===0?e.jsx("p",{className:"text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed",children:"No posts found. Create your first one!"}):e.jsx("div",{className:"grid gap-4",children:h.map(t=>{var r;return e.jsx(ee,{className:"hover:border-primary/30 transition-colors",children:e.jsxs(te,{className:"p-4 flex items-center justify-between",children:[e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx("span",{className:"text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded",children:t.category}),e.jsx("span",{className:"text-xs text-muted-foreground",children:(r=t.createdAt)!=null&&r.seconds?new Date(t.createdAt.seconds*1e3).toLocaleDateString():"Draft"})]}),e.jsx("h4",{className:"font-bold",children:t.title}),e.jsx("p",{className:"text-xs text-muted-foreground line-clamp-1",children:t.excerpt})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(f,{variant:"ghost",size:"icon",onClick:()=>G(t),children:e.jsx(Z,{className:"w-4 h-4"})}),e.jsx(f,{variant:"ghost",size:"icon",className:"text-destructive hover:bg-destructive/10",onClick:()=>B(t.id),children:e.jsx(oe,{className:"w-4 h-4"})})]})]})},t.id)})})]})]})]}):e.jsx(V,{to:"/dashboard"})};export{ye as default};
