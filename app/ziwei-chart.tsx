'use client';

import { useState } from 'react';
import { birthDateLabels, fourRules, type Birth } from '@/lib/birth';
import { tw } from '@/lib/studio';
import { BRANCHES, STEMS } from '@/lib/ziwei/constants';
import { getDaXianSiHua, getLiuNianSiHua } from '@/lib/ziwei/sihua';
import { getDaXianIndexForYear } from '@/lib/ziwei/yunxian-context';
import type { SiHua, ZiweiChart } from '@/lib/ziwei/types';

export const chartDisplayDefaults = { palaceInfo: true, brightness: false, relations: 'selected' as 'selected' | 'ming' | 'off' };

function configuredTransforms(birth: Birth, stem: number, base: Partial<Record<SiHua, string>>) {
  const transforms = { ...base };
  for (const rule of fourRules) {
    const star = birth.four?.[rule.key];
    if (rule.stem === stem && star) transforms[rule.mark] = star;
  }
  return transforms;
}

const positions = [[4,3],[4,2],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4]];
const zodiac = '鼠牛虎兔龍蛇馬羊猴雞狗豬';

export function Chart({ chart, birth, name, year, mode = 'natal', display = chartDisplayDefaults }: {
  chart: ZiweiChart; birth: Birth; name: string; year: number; mode?: string; display?: typeof chartDisplayDefaults;
}) {
  const [selection, setSelection] = useState<number | null>(null);
  const decade = getDaXianIndexForYear(chart, year);
  const decadeBranch = chart.daXians[decade]?.palaceBranch;
  const layer = mode === 'year' ? getLiuNianSiHua(year) : mode === 'decade' ? getDaXianSiHua(chart, decade, year) : null;
  const overlays = layer ? configuredTransforms(birth, layer.stemIndex, layer.transforms) : {};
  const originalMarks: Partial<Record<SiHua, string>> = {};
  for (const palace of chart.palaces) for (const star of palace.stars) {
    if (star.siHua) originalMarks[star.siHua] = star.name;
  }
  const natal = configuredTransforms(birth, chart.lunarInfo.yearStem, originalMarks);
  const anchor = display.relations === 'ming' ? chart.mingGongBranch : selection ?? (mode === 'decade' ? decadeBranch : undefined) ?? chart.mingGongBranch;
  const related = new Set([4, 6, 8].map(offset => (anchor + offset) % 12));
  const dates = birthDateLabels(birth);
  const layerLabel = mode === 'year' ? '流年四化' : '大限四化';

  return <div className="chart-scroll"><div className="chart-grid">
    <div className="chart-center">
      <span className="chart-mode">{mode === 'natal' ? '本命盤' : `${year} 年・${layerLabel}`}</span>
      <h2>{name}</h2>
      <p>{tw(chart.yinYangGender || (birth.gender === 'female' ? '女命' : '男命'))} · {tw(chart.wuxingJuName)} · 生肖{zodiac[chart.lunarInfo.yearBranch]}</p>
      <dl className="chart-dates">
        <dt>陽曆</dt><dd>{dates.solar}</dd>
        <dt>陰曆</dt><dd>{dates.lunar}</dd>
      </dl>
      {birth.city && <p>出生地 {birth.city}</p>}
      {chart.lunarInfo.fourPillars && <p className="chart-pillars">節氣四柱 <b>{chart.lunarInfo.fourPillars.join('　')}</b></p>}
      {(chart.mingZhu || chart.shenZhu) && <p>命主 {tw(chart.mingZhu || '—')}　身主 {tw(chart.shenZhu || '—')}</p>}
      <div className="chart-legend"><span className="natal-mark">生年四化</span>{layer && <span className={mode + '-mark'}>{layerLabel}</span>}</div>
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
              <span>{tw(star.name)}</span>
              {display.brightness && star.brightnessRaw && <small className="star-brightness">{tw(star.brightnessRaw)}</small>}
              {Object.entries(natal).filter(([, target]) => target === star.name).map(([mark]) => <span key={mark} className="chart-mark natal-mark" title="生年四化">{tw(mark)}</span>)}
              {Object.entries(overlays).filter(([, target]) => target === star.name).map(([mark]) => <span key={mark} className={'chart-mark ' + mode + '-mark'} title={layerLabel}>{tw(mark)}</span>)}
            </span>)}
        </div>
        <div className="palace-footer">
          {display.palaceInfo && <div className="palace-detail">
            {palace.daXianAge && <strong>{palace.daXianAge.join('–')} 歲</strong>}
            {mode === 'decade' && decadeBranch === palace.branch && <span className="decade-mark">大限命宮</span>}
            {palace.isEmpty && <small>空宮</small>}
          </div>}
          <div className="palace-title">
            {interactive ? <button type="button" className="palace-tag" aria-pressed={focused} onClick={() => setSelection(palace.branch)}>{tag}</button> : <span className="palace-tag">{tag}</span>}
            <span className="palace-branch">{STEMS[palace.stem]}{BRANCHES[palace.branch]}</span>
          </div>
        </div>
      </div>;
    })}
  </div></div>;
}
