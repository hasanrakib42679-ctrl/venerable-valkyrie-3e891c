import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const CORS={
 "Content-Type":"application/json; charset=utf-8",
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"Content-Type",
 "Access-Control-Allow-Methods":"GET,POST,OPTIONS"
};
const PASSWORD=process.env.ADMIN_PASSWORD || "ANAMUL";
const STORE_NAME="as-anamul-v1";
const KEY_NAME="state";

function out(status,data){return new Response(JSON.stringify(data),{status,headers:CORS})}
function now(){return Date.now()}
function makeKey(){return "AS_"+crypto.randomBytes(7).toString("hex").toUpperCase()}
function durationMs(n,u){
 n=Number(n); if(!Number.isFinite(n)||n<1) return null;
 const m={minutes:60000,hours:3600000,days:86400000};
 return n*m[u];
}
async function readState(){
 const store=getStore(STORE_NAME);
 return await store.get(KEY_NAME,{type:"json"}) || {key:null,expiresAt:null,shortLink:"https://adsfly.in/uhCA"};
}
async function writeState(s){await getStore(STORE_NAME).setJSON(KEY_NAME,s);return s}

export default async function handler(req){
 if(req.method==="OPTIONS") return new Response("",{status:204,headers:CORS});
 try{
  const url=new URL(req.url);
  const action=url.searchParams.get("action") || "status";
  let body={};
  if(req.method!=="GET"){
    try{body=await req.json()}catch{body={}}
  }
  let state=await readState();

  if(action==="status"){
    if(state.expiresAt && state.expiresAt<=now()){state={...state,key:null,expiresAt:null};await writeState(state)}
    return out(200,{ok:true,active:!!state.key,shortLink:state.shortLink||"",expiresAt:state.expiresAt||null});
  }

  if(action==="validate"){
    const key=String(body.key||"").trim();
    const active=!!state.key && state.expiresAt>now();
    if(active && key===state.key)
      return out(200,{ok:true,valid:true,message:"ACCESS VALID",expiresAt:state.expiresAt});
    return out(401,{ok:false,valid:false,error:"Invalid or expired key"});
  }

  if(!["adminStatus","generate","reset","setShortLink"].includes(action))
    return out(400,{ok:false,error:"Unknown action"});

  if(String(body.password||"")!==PASSWORD)
    return out(401,{ok:false,error:"Wrong admin password"});

  if(action==="adminStatus"){
    if(state.expiresAt && state.expiresAt<=now()){state={...state,key:null,expiresAt:null};await writeState(state)}
    return out(200,{ok:true,active:!!state.key,key:state.key||null,expiresAt:state.expiresAt||null,shortLink:state.shortLink||""});
  }

  if(action==="generate"){
    const ms=durationMs(body.duration,body.unit);
    if(!ms)return out(400,{ok:false,error:"Invalid duration"});
    state={...state,key:makeKey(),expiresAt:now()+ms};
    await writeState(state);
    return out(200,{ok:true,key:state.key,expiresAt:state.expiresAt});
  }

  if(action==="reset"){
    state={...state,key:null,expiresAt:null};
    await writeState(state);
    return out(200,{ok:true,active:false});
  }

  if(action==="setShortLink"){
    const link=String(body.shortLink||"").trim();
    if(!/^https?:\/\//i.test(link))return out(400,{ok:false,error:"Invalid short link"});
    state={...state,shortLink:link};
    await writeState(state);
    return out(200,{ok:true,shortLink:link});
  }
 }catch(e){
  return out(500,{ok:false,error:e?.message||"Server error"});
 }
}
