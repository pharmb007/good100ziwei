import { birthDateLabels, type Birth } from './birth';
import type { ZiweiChart } from './ziwei/types';
export const topics=['本命特質','事業與工作','財務與資源','關係與家庭','年度流年','五行觀點','行動與結語','客戶背景','待分類'] as const;
export type Section={id:string;source:string;text:string;topic:string;confirmed:boolean};
export type Reminder={id:string;month:string;period:string;text:string;approved:boolean};
export type Report={id:string;created:string;consultationDate?:string;reminders?:Reminder[];year:number;name:string;sections:Section[];chart:ZiweiChart;birth:Birth;question:string};
export type { Birth } from './birth';
export type Case={id:string;name:string;date:string;year:number;question:string;birth:Birth;chart:ZiweiChart|null;transcript:string;sections:Section[];reminders:Reminder[];reports:Report[];version:number;updatedAt:string;sample:boolean};
export function blankCase():Case{return {id:crypto.randomUUID(),name:'',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}),year:2026,question:'',birth:{date:'',time:'',city:'台北',gender:'female',late:'next-day',leap:'split',verified:false},chart:null,transcript:'',sections:[],reminders:[],reports:[],version:0,updatedAt:'',sample:false};}
export function draftTranscript(raw:string):Section[]{return raw.split(/\n+/).map(x=>x.trim()).filter(Boolean).map((source,i)=>{
let topic='待分類';
if(/^(客戶|客人|來賓)[：:]/.test(source))topic='客戶背景';
else if(/^(Brian|顧問|老師)[：:]/i.test(source)){
topic=/五行|水二局|金四局/.test(source)?'五行觀點':/今年|明年|流年|月份|月|半年/.test(source)?'年度流年':/工作|事業|合作|職場/.test(source)?'事業與工作':/財務|金錢|付款|收入/.test(source)?'財務與資源':/家人|感情|關係|伴侶/.test(source)?'關係與家庭':/個性|特質|習慣/.test(source)?'本命特質':'行動與結語';
}
return {id:'P'+String(i+1).padStart(3,'0'),source,text:source.replace(/^(Brian|顧問|老師|客戶|客人|來賓)[：:]\s*/i,''),topic,confirmed:false};});}
const chars:Record<string,string>={'宫':'宮','禄':'祿','权':'權','机':'機','阳':'陽','阴':'陰','贪':'貪','门':'門','军':'軍','杀':'殺','贞':'貞','辅':'輔','铃':'鈴','罗':'羅','马':'馬','庙':'廟','迁':'遷','仆':'僕','财':'財','龙':'龍','凤':'鳳','红':'紅','鸾':'鸞','华':'華','盖':'蓋','寿':'壽','伤':'傷','虚':'虛','岁':'歲','将':'將','库':'庫','台':'臺','长':'長','绝':'絕','临':'臨','养':'養','厨':'廚','阁':'閣','贵':'貴','钺':'鉞','诰':'誥'};
export function tw(s:string){return [...s].map(c=>chars[c]||c).join('');}
export function status(c:Case){return c.reports.length?'已有定稿':c.sections.length?'待審閱':c.chart?'待講解':'待排盤';}
export function toReportText(r:Report){return '# '+r.name+'｜'+r.year+' 年紫微諮詢報告\n\n顧問：Brian\n定稿時間：'+r.created+'\n\n'+birthReportText(r.birth)+'\n\n## 本次諮詢問題\n'+(r.question||'未填寫')+'\n\n'+topics.filter(t=>t!=='待分類').map(t=>{const ss=r.sections.filter(s=>s.topic===t);return ss.length?'## '+t+'\n\n'+ss.map(s=>s.text).join('\n\n'):''}).filter(Boolean).join('\n\n')+'\n\n命理內容供文化參考與自我探索，不代表事件必然發生，不取代醫療、法律或財務專業判斷。';}

function birthReportText(birth: Birth) {
  const dates = birthDateLabels(birth);
  return '陽曆：' + dates.solar + '\n陰曆：' + dates.lunar;
}
