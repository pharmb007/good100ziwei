import assert from 'node:assert/strict';
import { birthDateLabels, birthPeriods, periodForTime, type Birth } from '../lib/birth';
import { calculate } from '../lib/calculate';
import { draftTranscript } from '../lib/studio';
const b: Birth={date:'1990-06-15',time:'10:30',city:'台北',gender:'female',late:'next-day',leap:'split',verified:true};
const chart=calculate(b);
assert.equal(chart.palaces.length,12);
assert.equal(new Set(chart.palaces.map(p=>p.branch)).size,12);
assert.equal(chart.palaces.flatMap(p=>p.stars).filter(s=>s.type==='major').length,14);
assert.throws(()=>calculate({...b,date:'2026-02-30'}));
assert.throws(()=>calculate({...b,verified:false}));
assert.throws(()=>calculate({...b,time:'24:30'}));
const next=calculate({...b,date:'1990-12-31',time:'23:30'});
assert.equal(next.birthInfo.year,1991);assert.equal(next.birthInfo.month,1);assert.equal(next.birthInfo.day,1);assert.equal(next.birthInfo.hour,0);
const same=calculate({...b,date:'1990-12-31',time:'23:30',late:'current-day'});
assert.equal(same.birthInfo.day,31);assert.equal(same.birthInfo.year,1990);
const text='客戶：我想了解工作。\nBrian：如果明年農曆三月有合作邀約，先確認條件。\n不明講者的話。';
const sections=draftTranscript(text);
assert.equal(sections.length,3);assert.equal(sections[0].topic,'客戶背景');assert.equal(sections[1].text,'如果明年農曆三月有合作邀約，先確認條件。');assert.equal(sections[2].topic,'待分類');assert(sections.every(s=>!s.confirmed));
console.log('PASS: chart integrity, invalid dates, input confirmation, late-zi rollover, transcript provenance.');


const reference: Birth = { ...b, date: '1983-08-04', time: '11:00', gender: 'male' };
assert.equal(birthPeriods.length, 13);
assert.equal(periodForTime('00:59')?.name, '早子時');
assert.equal(periodForTime('12:59')?.name, '午時');
assert.equal(periodForTime('23:00')?.name, '晚子時');
assert.deepEqual(birthDateLabels(reference), { solar: '1983年8月4日 午時', lunar: '1983癸亥年6月26日 午時' });
const lunarReference: Birth = { ...reference, calendar: 'lunar', date: '1983-06-26' };
assert.deepEqual(birthDateLabels(lunarReference), birthDateLabels(reference));
assert.deepEqual(calculate(lunarReference), calculate(reference));
const leapReference: Birth = { ...b, date: '2020-04-01', calendar: 'lunar', lunarLeap: true };
assert.equal(birthDateLabels(leapReference).solar, '2020年5月23日 巳時');
assert.throws(() => calculate({ ...leapReference, date: '2020-05-01' }));
assert.throws(() => calculate({ ...leapReference, date: '2020-04-30' }));
assert.equal(birthDateLabels({ ...b, date: '1990-12-31', time: '23:00' }).solar, '1990年12月31日 晚子時');

const palaceOf = (chart: ReturnType<typeof calculate>, starName: string) =>
  chart.palaces.find(p => p.stars.some(s => s.name === starName))?.branch;
assert.equal(palaceOf(calculate({ ...b, kuiyue: '1' }), '天魁'), 1);
assert.equal(palaceOf(calculate({ ...b, kuiyue: '2' }), '天魁'), 2);
assert.equal(palaceOf(calculate({ ...reference, jiekong: 'single' }), '副截'), undefined);
const horseReference = { ...lunarReference, date: '1983-05-26' };
assert.equal(palaceOf(calculate(horseReference), '天马'), 5);
assert.equal(palaceOf(calculate({ ...horseReference, tianma: 'month' }), '天马'), 8);
console.log('PASS: time periods, dual calendars, leap-month validation and school settings.');

const { recordAccessRole } = await import('../lib/record-access');
const administrator = 'owner@example.test';
const sharedAccount = 'shared@example.test';
assert.equal(recordAccessRole(' OWNER@example.test ', administrator, sharedAccount), 'administrator');
assert.equal(recordAccessRole(sharedAccount, administrator, sharedAccount), 'shared');
assert.equal(recordAccessRole('other@example.test', administrator, sharedAccount), 'personal');
assert.equal(recordAccessRole(administrator, administrator), 'personal');
assert.equal(recordAccessRole(administrator, administrator, administrator), 'personal');
console.log('PASS: shared records restrict the administrator and subject to their configured accounts.');
