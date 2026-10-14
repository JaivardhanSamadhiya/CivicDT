"use client";
import type { Assumptions } from "@/lib/schema";
export const assumptionFields: {key:keyof Assumptions;label:string;unit:string;max:number;min:number}[]=[
  {key:"capitalPerUnit",label:"Proposed construction unit cost",unit:"USD / unit",max:1e9,min:1},
  {key:"alternativeCapitalPerUnit",label:"Alternative construction unit cost",unit:"USD / unit",max:1e9,min:1},
  {key:"annualMaintenancePerUnit",label:"Proposed annual maintenance",unit:"USD / unit / year",max:1e8,min:0},
  {key:"alternativeAnnualMaintenancePerUnit",label:"Alternative annual maintenance",unit:"USD / unit / year",max:1e8,min:0},
  {key:"designPercent",label:"Design & engineering",unit:"% of construction",max:100,min:0},
  {key:"contingencyPercent",label:"Contingency",unit:"% of construction + design",max:100,min:0},
  {key:"sensitivityPercent",label:"Unit-cost sensitivity",unit:"± percent",max:90,min:0},
  {key:"horizonYears",label:"Comparison horizon",unit:"years, undiscounted",max:50,min:1}
];
export function AssumptionsEditor({value,onChange,unit="corridor mile"}:{value:Assumptions;onChange:(value:Assumptions)=>void;unit?:string}){return <div className="form-grid assumption-grid">{assumptionFields.map(f=><label className="field" key={f.key}><span>{f.label}</span><div className="input-unit"><input aria-label={f.label} type="number" min={f.min} max={f.max} step={f.key==="horizonYears"?1:"any"} value={Number.isNaN(value[f.key])?"":value[f.key]} onChange={e=>onChange({...value,[f.key]:e.target.value===""?NaN:Number(e.target.value)})}/></div><small>{f.unit.replace("unit",unit)}</small></label>)}</div>;}
