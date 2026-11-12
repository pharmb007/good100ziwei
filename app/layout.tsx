import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'紫微・諮詢工作室 | Brian',description:'從命盤到講解，將每一次諮詢整理成值得回顧的報告。'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>;}
