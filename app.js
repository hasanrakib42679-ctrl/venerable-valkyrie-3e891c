const $=id=>document.getElementById(id);
const API="/.netlify/functions/api";
const TELEGRAM="https://t.me/AS_ANAMUL_PANEL_BD_bot";

async function request(action, data={}){
 const r=await fetch(API+"?action="+encodeURIComponent(action),{
   method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)
 });
 const raw=await r.text(); let d;
 try{d=JSON.parse(raw)}catch{throw new Error("Server returned non-JSON response ("+r.status+")")}
 if(!r.ok || d.ok===false) throw new Error(d.error||"Request failed");
 return d;
}
$("paste").onclick=async()=>{
 try{$("key").value=await navigator.clipboard.readText()}catch{ $("result").textContent="Clipboard permission denied"; }
};
$("validate").onclick=async()=>{
 const key=$("key").value.trim();
 if(!key)return $("result").textContent="Enter your access key";
 try{
   const d=await request("validate",{key});
   $("result").style.color="#48ff72";
   $("result").textContent=d.message||"ACCESS VALID";
 }catch(e){
   $("result").style.color="#ff5577";
   $("result").textContent=e.message;
 }
};
$("getKey").onclick=async()=>{
 try{
   const d=await request("status");
   if(d.shortLink) location.href=d.shortLink;
   else $("result").textContent="GET KEY link is not configured";
 }catch(e){$("result").textContent=e.message}
};
$("telegram").onclick=()=>location.href=TELEGRAM;
