'use client';

import { useEffect, useState } from 'react';
import { birthDateLabels } from '@/lib/birth';
import type { Case, Report } from '@/lib/studio';
import { Chart } from './ziwei-chart';

type Summary = Pick<Case, 'id' | 'name' | 'date' | 'updatedAt' | 'version'>;
type SharedRecord = Pick<Case, 'id' | 'name' | 'date' | 'updatedAt' | 'version' | 'year' | 'question' | 'birth' | 'chart' | 'transcript' | 'sections' | 'reports' | 'reminders'>;

const formatUpdate = (date: string) => new Date(date).toLocaleString('zh-TW', {
  timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'short',
});

async function readShared<T>(query: string, signal: AbortSignal): Promise<T> {
  const response = await fetch('/api/shared-records' + query, { signal, cache: 'no-store' });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw Error(result.error || '暫時無法讀取個案。');
  return result;
}

export function SharedRecords({ openReport }: { openReport: (report: Report) => void }) {
  const [list, setList] = useState<{ linked: boolean; records: Summary[] }>();
  const [selected, setSelected] = useState('');
  const [record, setRecord] = useState<SharedRecord>();
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    readShared<{ linked: boolean; records: Summary[] }>('', controller.signal)
      .then(setList)
      .catch(error => { if (!controller.signal.aborted) setListError(error.message); });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    readShared<{ record: SharedRecord }>('?id=' + encodeURIComponent(selected), controller.signal)
      .then(result => setRecord(result.record))
      .catch(error => { if (!controller.signal.aborted) setDetailError(error.message); });
    return () => controller.abort();
  }, [selected, refresh]);

  function reload() {
    setListError('');
    setDetailError('');
    setList(undefined);
    setRecord(undefined);
    setRefresh(count => count + 1);
  }

  return <>
    <div className="case-heading">
      <div>
        <h2>Jerry 的個案</h2>
        <p>管理員唯讀檢視{list?.linked && ` · 已儲存 ${list.records.length} 筆`}</p>
      </div>
      <button className="btn" onClick={reload}>重新整理</button>
    </div>
    <section className="panel" aria-label="Jerry 的個案清單">
      {listError ? <p className="empty" role="alert">{listError}</p> : !list ? <p className="empty" role="status">讀取個案中…</p> :
        !list.linked ? <p className="empty">還未連結 Jerry 的帳號。請 Jerry 打開「工作室設定 → 登入帳號」，核對受邀帳號，並確認顯示「Jerry 的個案已連結」。</p> :
        !list.records.length ? <p className="empty">Jerry 目前沒有已儲存的個案。</p> :
        list.records.map(item => <button className="client-row" key={item.id} aria-pressed={selected === item.id}
          onClick={() => { if (selected !== item.id) { setRecord(undefined); setDetailError(''); setSelected(item.id); } }}>
          <span className="client-details"><b>{item.name}</b><small>{item.date} · 更新於 {formatUpdate(item.updatedAt)}</small></span>
          <span className="chip">v{item.version}</span>
        </button>)}
    </section>
    {selected && (detailError ? <p className="notice error" role="alert">{detailError}</p> : !record ?
      <p className="empty" role="status">讀取個案內容中…</p> : <SharedDetail record={record} openReport={openReport}/>)}
  </>;
}

function SharedDetail({ record, openReport }: { record: SharedRecord; openReport: (report: Report) => void }) {
  let dates: ReturnType<typeof birthDateLabels> | undefined;
  try { dates = birthDateLabels(record.birth); } catch { /* A saved draft may have an incomplete date. */ }
  return <section className="panel shared-detail" aria-label="唯讀個案內容">
    <h2>{record.name}</h2>
    <p className="muted">{record.year} 年度 · 已儲存 v{record.version} · 最後更新 {formatUpdate(record.updatedAt)}</p>
    {record.question && <><h3>諮詢問題</h3><p>{record.question}</p></>}
    {record.chart ? <Chart chart={record.chart} birth={record.birth} year={record.year} name={record.name}/> :
      <><h3>出生資料</h3><p>{dates ? <>陽曆 {dates.solar}<br/>陰曆 {dates.lunar}</> : '出生日期未填完整'}{record.birth.city && <><br/>出生地 {record.birth.city}</>}</p></>}
    {record.transcript && <details><summary>講解逐字稿</summary><p>{record.transcript}</p></details>}
    {!!record.sections.length && <details><summary>整理後講解（{record.sections.length} 段）</summary>
      {record.sections.map(section => <div key={section.id}><h3>{section.topic} · {section.confirmed ? '已確認' : '待審閱'}</h3><p>{section.text}</p></div>)}
    </details>}
    {!!record.reports.length && <details><summary>已定稿報告（{record.reports.length} 份）</summary>
      {record.reports.map(report => <button className="client-row" key={report.id} onClick={() => openReport(report)}>
        <span className="client-details"><b>{report.year} 年諮詢報告</b><small>{formatUpdate(report.created)}</small></span>
      </button>)}
    </details>}
    {!!record.reminders.length && <details><summary>每月提醒（{record.reminders.length} 則）</summary>
      {record.reminders.map(reminder => <div key={reminder.id}><h3>{reminder.month} · {reminder.approved ? '已確認' : '草稿'}</h3><p>{reminder.text}</p></div>)}
    </details>}
  </section>;
}
