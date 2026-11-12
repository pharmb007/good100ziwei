import { generateChart, setBrightnessSchool } from './ziwei/algorithm';
import { birthCalendars, birthSchema, periodForTime } from './birth';

export function calculate(input: unknown) {
  const birth = birthSchema.parse(input);
  const period = periodForTime(birth.time);
  if (!period) throw Error('請選擇出生時辰。');
  if (!birth.verified) throw Error('請先確認出生日期與時辰。');

  const { solar } = birthCalendars(birth);
  const year = solar.getYear(), month = solar.getMonth(), day = solar.getDay();
  const [hour, minute] = birth.time.split(':').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (period.value === '23:00' && birth.late === 'next-day') date.setUTCDate(date.getUTCDate() + 1);

  setBrightnessSchool('QS');
  return generateChart({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: Math.floor((hour + 1) / 2) % 12,
    gender: birth.gender,
    city: birth.city,
    origInput: { year, month, day, clockHour: hour, clockMinute: minute },
  }, { leapMonth: birth.leap, kuiyue: birth.kuiyue, jiekong: birth.jiekong, tianma: birth.tianma });
}
