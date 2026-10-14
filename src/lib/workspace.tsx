"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { analyze } from "./engine";
import { analysisInputSchema, type AnalysisInput, type AnalysisResult } from "./schema";
export interface SavedAnalysis {id:string; result:AnalysisResult; mode:"demo"|"ai"; coordinates:[number,number]; route:[number,number][];}
interface Workspace {projects:SavedAnalysis[]; active:SavedAnalysis|undefined; ready:boolean; notice:string; save:(input:AnalysisInput,mode:"demo"|"ai",result?:AnalysisResult)=>string; update:(input:AnalysisInput)=>void; select:(id:string)=>void; remove:(id:string)=>void; setGeography:(coordinates:[number,number],route:[number,number][])=>void;}
const Context=createContext<Workspace|null>(null);
const KEY="civicdt-workspace-v1";
export function WorkspaceProvider({children}:{children:ReactNode}) {
  const [projects,setProjects]=useState<SavedAnalysis[]>([]);const [activeId,setActiveId]=useState("");const [ready,setReady]=useState(false);const [notice,setNotice]=useState("");
  useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const state=JSON.parse(raw);const recovered:SavedAnalysis[]=[];for(const row of Array.isArray(state.projects)?state.projects.slice(0,20):[]){const parsed=analysisInputSchema.safeParse(row.result?.input);if(!parsed.success)continue;try{const result=analyze(parsed.data);result.generatedAt=typeof row.result.generatedAt==="string"&&Number.isFinite(Date.parse(row.result.generatedAt))?row.result.generatedAt:result.generatedAt;const validPoint=(p:unknown):p is [number,number]=>Array.isArray(p)&&p.length===2&&p.every(v=>typeof v==="number"&&Number.isFinite(v))&&Math.abs(p[0])<=85&&Math.abs(p[1])<=180;recovered.push({id:String(row.id),result,mode:row.mode==="ai"?"ai":"demo",coordinates:validPoint(row.coordinates)?row.coordinates:[37.385,-122.114],route:Array.isArray(row.route)?row.route.filter(validPoint).slice(0,100):[]});}catch{}}setProjects(recovered);setActiveId(state.activeId??recovered[0]?.id??"");}}catch{setNotice("Saved browser data could not be read. You can start a new analysis.");}setReady(true);},[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify({projects,activeId}));}catch{setNotice("Browser storage is unavailable or full. This session still works; download your brief to keep it.");}},[projects,activeId,ready]);
  const active=projects.find(p=>p.id===activeId)??projects[0];
  function save(input:AnalysisInput,mode:"demo"|"ai",result?:AnalysisResult){const id=crypto.randomUUID();const item:SavedAnalysis={id,result:result??analyze(input),mode,coordinates:[37.385,-122.114],route:[]};setProjects(prev=>[item,...prev].slice(0,20));setActiveId(id);return id;}
  function update(input:AnalysisInput){if(!active)return;const result=analyze(input);setProjects(prev=>prev.map(p=>p.id===active.id?{...p,result}:p));}
  return <Context.Provider value={{projects,active,ready,notice,save,update,select:setActiveId,remove:(id)=>setProjects(prev=>prev.filter(p=>p.id!==id)),setGeography:(coordinates,route)=>setProjects(prev=>prev.map(p=>p.id===active?.id?{...p,coordinates,route}:p))}}>{children}</Context.Provider>;
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error("Workspace provider is required.");return value;}
