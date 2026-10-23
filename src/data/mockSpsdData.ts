import { BakalariTimetableResponse } from '../types/bakalari';
import { getRealSpsdTimetable } from './realSpsdData';

export function getMockSpsdTimetable(baseDateStr?: string): BakalariTimetableResponse {
  return getRealSpsdTimetable(baseDateStr);
}
