import { fourRules, type Birth } from './birth';
import { getDaXianSiHua, getLiuNianSiHua, getYearBranchIndex } from './ziwei/sihua';
import { getDaXianIndexForYear } from './ziwei/yunxian-context';
import type { SiHua, ZiweiChart } from './ziwei/types';

function configuredTransforms(birth: Birth, stem: number, base: Partial<Record<SiHua, string>>) {
  const transforms = { ...base };
  for (const rule of fourRules) {
    const star = birth.four?.[rule.key];
    if (rule.stem === stem && star) transforms[rule.mark] = star;
  }
  return transforms;
}

type Layer = {
  kind: 'natal' | 'decade' | 'year';
  label: string;
  transforms: Partial<Record<SiHua, string>>;
};

export function getChartSihuaLayers(chart: ZiweiChart, birth: Birth, year: number, mode: string) {
  const originalMarks: Layer['transforms'] = {};
  for (const palace of chart.palaces) {
    for (const star of palace.stars) {
      if (star.siHua) originalMarks[star.siHua] = star.name;
    }
  }
  const layers: Layer[] = [{
    kind: 'natal',
    label: '生年四化',
    transforms: configuredTransforms(birth, chart.lunarInfo.yearStem, originalMarks),
  }];

  const decadeIndex = getDaXianIndexForYear(chart, year);
  const decadeBranch = chart.daXians[decadeIndex]?.palaceBranch;
  if (mode === 'decade' || mode === 'year') {
    const decade = getDaXianSiHua(chart, decadeIndex, year);
    if (decade) layers.push({
      kind: 'decade',
      label: '大限四化',
      transforms: configuredTransforms(birth, decade.stemIndex, decade.transforms),
    });
  }
  if (mode === 'year') {
    const annual = getLiuNianSiHua(year);
    layers.push({
      kind: 'year',
      label: '流年四化',
      transforms: configuredTransforms(birth, annual.stemIndex, annual.transforms),
    });
  }
  return {
    layers,
    decadeBranch: mode === 'natal' ? undefined : decadeBranch,
    annualBranch: mode === 'year' ? getYearBranchIndex(year) : undefined,
  };
}

const palaceAbbreviations = ['命', '兄', '夫', '子', '財', '疾', '遷', '友', '官', '田', '福', '父'];

export function movingPalaceName(mingBranch: number, palaceBranch: number) {
  return palaceAbbreviations[(mingBranch - palaceBranch + 12) % 12];
}
