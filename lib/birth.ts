import { Lunar, LunarMonth, Solar } from 'lunar-javascript';
import { z } from 'zod';

export const fourRules = [
  { key: 'jiaKe', stem: 0, mark: '科', label: '甲年化科', options: ['武曲', '文曲'] },
  { key: 'wuKe', stem: 4, mark: '科', label: '戊年化科', options: ['右弼', '太阳'] },
  { key: 'gengKe', stem: 6, mark: '科', label: '庚年化科', options: ['太阴', '天府', '天同'] },
  { key: 'gengJi', stem: 6, mark: '忌', label: '庚年化忌', options: ['天同', '天相', '太阴'] },
  { key: 'xinKe', stem: 7, mark: '科', label: '辛年化科', options: ['文曲', '武曲'] },
  { key: 'renKe', stem: 8, mark: '科', label: '壬年化科', options: ['左辅', '天府'] },
  { key: 'guiKe', stem: 9, mark: '科', label: '癸年化科', options: ['太阴', '太阳'] },
] as const;

export const birthSchema = z.object({
  date: z.string().max(20),
  time: z.string().max(10),
  city: z.string().max(100),
  gender: z.enum(['male', 'female']),
  late: z.enum(['next-day', 'current-day']),
  leap: z.enum(['split', 'next-month', 'prev-month', 'origin-month']),
  calendar: z.enum(['solar', 'lunar']).optional(),
  lunarLeap: z.boolean().optional(),
  kuiyue: z.enum(['1', '2', '3']).optional(),
  jiekong: z.enum(['double', 'single', 'zhanyan']).optional(),
  tianma: z.enum(['year', 'month']).optional(),
  four: z.object({
    jiaKe: z.enum(fourRules[0].options), wuKe: z.enum(fourRules[1].options),
    gengKe: z.enum(fourRules[2].options), gengJi: z.enum(fourRules[3].options),
    xinKe: z.enum(fourRules[4].options), renKe: z.enum(fourRules[5].options),
    guiKe: z.enum(fourRules[6].options),
  }).partial().optional(),
  verified: z.boolean(),
});
export type Birth = z.infer<typeof birthSchema>;

const pad = (value: number) => String(value).padStart(2, '0');
const clock = (hour: number, minute: number) => pad(hour) + ':' + pad(minute);

export const birthPeriods = ['早子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','晚子'].map((name, index) => {
  const start = index === 0 ? 0 : index * 2 - 1;
  const end = index === 0 || index === 12 ? start : start + 1;
  return { name: name + '時', value: clock(start, 0), range: clock(start, 0) + '–' + clock(end, 59) };
});

export function periodForTime(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return undefined;
  const hour = Number(time.slice(0, 2));
  return birthPeriods[Math.floor((hour + 1) / 2)];
}

export function birthCalendars(birth: Pick<Birth, 'date' | 'calendar' | 'lunarLeap'>) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth.date)) throw Error('請填寫完整的出生年月日。');
  const [year, month, day] = birth.date.split('-').map(Number);
  if (year < 1900 || year > 2100) throw Error('支援 1900–2100 年。');
  if (month < 1 || month > 12 || day < 1 || day > 31) throw Error('出生日期不存在。');
  if (birth.calendar === 'lunar') {
    const lunarMonth = birth.lunarLeap ? -month : month;
    const info = LunarMonth.fromYm(year, lunarMonth);
    if (!info || day > info.getDayCount()) throw Error('此陰曆月份或日期不存在，請核對閏月與日數。');
    const lunar = Lunar.fromYmd(year, lunarMonth, day);
    return { solar: lunar.getSolar(), lunar };
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== birth.date) throw Error('出生日期不存在。');
  const solar = Solar.fromYmd(year, month, day);
  return { solar, lunar: solar.getLunar() };
}

export function birthDateLabels(birth: Birth) {
  const { solar, lunar } = birthCalendars(birth);
  const period = periodForTime(birth.time)?.name || '';
  return {
    solar: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${period}`.trim(),
    lunar: `${lunar.getYear()}${lunar.getYearGan()}${lunar.getYearZhi()}年${lunar.getMonth() < 0 ? '閏' : ''}${Math.abs(lunar.getMonth())}月${lunar.getDay()}日 ${period}`.trim(),
  };
}
