'use client';

import { useState } from 'react';
import { birthDateLabels, type Birth } from '@/lib/birth';
import { tw } from '@/lib/studio';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { getChartSihuaLayers, movingPalaceName } from '@/lib/chart-sihua';
import { getYearBranchIndex, getYearStemIndex } from '@/lib/ziwei/sihua';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const chartDisplayDefaults = { palaceInfo: true, brightness: false, relations: 'selected' as 'selected' | 'ming' | 'off' };

const positions = [[4,3],[4,2],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4]];
const zodiac = '鼠牛虎兔龍蛇馬羊猴雞狗豬';
const supportedYears = Array.from({ length: 201 }, (_, index) => 1900 + index);

export function Chart({ chart, birth, name, year: reportYear, mode = 'natal', display = chartDisplayDefaults }: {
  chart: ZiweiChart; birth: Birth; name: string; year: number; mode?: string; display?: typeof chartDisplayDefaults;
}) {
  const [yearOverride, setYearOverride] = useState<number>();
  const [selection, setSelection] = useState<{ view: string; branch: number }>();
  const validReportYear = Number.isInteger(reportYear) && reportYear >= 1900 && reportYear <= 2100;
  const year = mode === 'year' ? yearOverride ?? (validReportYear ? reportYear : new Date().getFullYear()) : reportYear;
  const { layers, decadeBranch, annualBranch } = getChartSihuaLayers(chart, birth, year, mode);
  const view = mode + ':' + year;
  const selectedBranch = selection?.view === view ? selection.branch : undefined;
  const anchor = display.relations === 'ming'
    ? chart.mingGongBranch
    : selectedBranch ?? annualBranch ?? decadeBranch ?? chart.mingGongBranch;
  const related = new Set([4, 6, 8].map(offset => (anchor + offset) % 12));
  const dates = birthDateLabels(birth);
  const annualName = STEMS[getYearStemIndex(year)] + BRANCHES[getYearBranchIndex(year)];
  const annualAge = year - chart.lunarInfo.lunarYear + 1;

  return <div className="chart-scroll"><div className="chart-grid">
    <div className="chart-center">
      {mode === 'year' ? <>
        <div className="chart-year-controls">
          <button type="button" onClick={() => setYearOverride(year - 1)} disabled={year <= 1900} aria-label="上一個流年">‹</button>
          <select aria-label="流年年份" value={year} onChange={event => setYearOverride(Number(event.target.value))}>
            {supportedYears.map(value => <option value={value} key={value}>{value} 年</option>)}
          </select>
          <button type="button" onClick={() => setYearOverride(year + 1)} disabled={year >= 2100} aria-label="下一個流年">›</button>
        </div>
        <p className="chart-annual-summary">{annualName}流年{annualAge > 0 && ` · 虛歲 ${annualAge}`}</p>
      </> : <span className="chart-mode">{mode === 'natal' ? '本命盤' : `${year} 年・大限四化`}</span>}
      <h2>{name}</h2>
      <p>{tw(chart.yinYangGender || (birth.gender === 'female' ? '女命' : '男命'))} · {tw(chart.wuxingJuName)} · 生肖{zodiac[chart.lunarInfo.yearBranch]}</p>
      <dl className="chart-dates">
        <dt>陽曆</dt><dd>{dates.solar}</dd>
        <dt>陰曆</dt><dd>{dates.lunar}</dd>
      </dl>
      {birth.city && <p>出生地 {birth.city}</p>}
      {chart.lunarInfo.fourPillars && <p className="chart-pillars">節氣四柱 <b>{chart.lunarInfo.fourPillars.join('　')}</b></p>}
      {(chart.mingZhu || chart.shenZhu) && <p>命主 {tw(chart.mingZhu || '—')}　身主 {tw(chart.shenZhu || '—')}</p>}
      <div className="chart-legend">{layers.map(layer => <span key={layer.kind} className={layer.kind + '-mark'}>{layer.label}</span>)}</div>
    </div>
    {chart.palaces.map(palace => {
      const focused = display.relations !== 'off' && palace.branch === anchor;
      const linked = display.relations !== 'off' && related.has(palace.branch);
      const interactive = display.relations === 'selected';
      const tag = <><b>{tw(palace.name)}{!tw(palace.name).endsWith('宮') ? '宮' : ''}</b>{palace.isShenGong && <span className="body-tag">身宮</span>}</>;
      return <div key={palace.branch} className={`palace ${focused ? 'focus-palace' : linked ? 'related-palace' : ''}`}
        style={{ gridRow: positions[palace.branch][0], gridColumn: positions[palace.branch][1] }}>
        <div className="palace-stars">
          {[...palace.stars].sort((a,b) => Number(b.type === 'major') - Number(a.type === 'major')).map((star,i) =>
            <span className={'chart-star star-' + star.type} key={star.name + i}>
              <span className="chart-star-name">{tw(star.name)}</span>
              {display.brightness && star.brightnessRaw && <small className="star-brightness">{tw(star.brightnessRaw)}</small>}
              {layers.flatMap(layer => Object.entries(layer.transforms)
                .filter(([, target]) => target === star.name)
                .map(([mark]) => <span key={layer.kind + mark} className={'chart-mark ' + layer.kind + '-mark'}
                  title={layer.label + ' · 化' + tw(mark)} aria-label={layer.label + ' · 化' + tw(mark)}>{tw(mark)}</span>))}
            </span>)}
        </div>
        <div className="palace-footer">
          {display.palaceInfo && <div className="palace-detail">
            {palace.daXianAge && <strong>{palace.daXianAge.join('–')} 歲</strong>}
            {decadeBranch === palace.branch && <span className="decade-mark">大限命宮</span>}
            {annualBranch === palace.branch && <span className="year-mark">流年命宮</span>}
            {palace.isEmpty && <small>空宮</small>}
          </div>}
          <div className="palace-title">
            {interactive ? <button type="button" className="palace-tag" aria-pressed={focused} onClick={() => setSelection({ view, branch: palace.branch })}>{tag}</button> : <span className="palace-tag">{tag}</span>}
            {decadeBranch !== undefined && <span className="moving-palace decade-mark" title="大限宮位">大{movingPalaceName(decadeBranch, palace.branch)}</span>}
            {annualBranch !== undefined && <span className="moving-palace year-mark" title="流年宮位">年{movingPalaceName(annualBranch, palace.branch)}</span>}
            <span className="palace-branch">{STEMS[palace.stem]}{BRANCHES[palace.branch]}</span>
          </div>
        </div>
      </div>;
    })}
  </div></div>;
}
