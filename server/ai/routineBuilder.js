const { clamp, round, toNumber } = require('./nutritionCalculator');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toMinutes(timeText, fallback = '09:00') {
  const [hours, minutes] = String(timeText || fallback).split(':').map((value) => Number(value));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return toMinutes(fallback, fallback);
  return clamp(hours, 0, 23) * 60 + clamp(minutes, 0, 59);
}

function toTimeText(minutes) {
  const safe = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(safe / 60)).padStart(2, '0');
  const mins = String(safe % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

function spreadWorkoutDays(count) {
  const templates = {
    0: [],
    1: ['Wednesday'],
    2: ['Tuesday', 'Friday'],
    3: ['Monday', 'Wednesday', 'Friday'],
    4: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
    5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
    6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    7: DAYS,
  };
  return templates[Math.max(0, Math.min(7, toNumber(count, 3)))] || templates[3];
}

function buildDayPlan(day, { wakeTime, workStart, workEnd, breakfastTime, lunchTime, dinnerTime, snackTime, sleepTime, isWorkoutDay }) {
  const wake = toMinutes(wakeTime, '07:00');
  const workFrom = toMinutes(workStart, '09:00');
  const workTo = toMinutes(workEnd, '18:00');
  const breakfast = Math.max(wake + 30, toMinutes(breakfastTime, '07:30'));
  const snack = toMinutes(snackTime, '17:00');
  const lunch = toMinutes(lunchTime, '13:30');
  const dinner = toMinutes(dinnerTime, '21:00');
  const sleep = toMinutes(sleepTime, '23:00');
  const workout = isWorkoutDay ? Math.min(workTo + 30, dinner - 90) : Math.max(workTo, dinner - 75);

  const items = [
    { time: toTimeText(wake), label: 'Wake up', type: 'recovery' },
    { time: toTimeText(wake + 15), label: 'Hydrate and sunlight', type: 'mindset' },
    { time: toTimeText(breakfast), label: 'Breakfast', type: 'meal' },
    { time: toTimeText(workFrom), label: 'Work focus block', type: 'work' },
    { time: toTimeText(lunch), label: 'Lunch', type: 'meal' },
    { time: toTimeText(workTo), label: 'Work shutdown', type: 'work' },
    { time: toTimeText(workout), label: isWorkoutDay ? 'Workout session' : 'Mobility and walk', type: isWorkoutDay ? 'training' : 'recovery' },
    { time: toTimeText(snack), label: 'Snack and reset', type: 'meal' },
    { time: toTimeText(dinner), label: 'Dinner', type: 'meal' },
    { time: toTimeText(Math.max(wake + 60, sleep - 60)), label: 'Digital shutdown', type: 'discipline' },
    { time: toTimeText(sleep), label: 'Sleep', type: 'recovery' },
  ].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  return { day, isWorkoutDay, items };
}

function buildRoutine({ wakeTime = '07:00', workHours = {}, mealSchedule = {}, workoutDays = [], sleepTime = '23:00' }) {
  const selectedWorkoutDays = workoutDays.length ? workoutDays : spreadWorkoutDays(3);
  const days = DAYS.map((day) => buildDayPlan(day, {
    wakeTime,
    workStart: workHours.start || '09:00',
    workEnd: workHours.end || '18:00',
    breakfastTime: mealSchedule.breakfastTime || '07:30',
    lunchTime: mealSchedule.lunchTime || '13:30',
    dinnerTime: mealSchedule.dinnerTime || '21:00',
    snackTime: mealSchedule.snackTime || mealSchedule.eveningSnackTime || '17:00',
    sleepTime,
    isWorkoutDay: selectedWorkoutDays.includes(day),
  }));

  const todayName = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayPlan = days.find((day) => day.day === todayName) || days[0];
  const nextAction = todayPlan.items[0] || null;
  const sleepWindow = (toMinutes(sleepTime) - toMinutes(wakeTime) + 1440) % 1440;

  return {
    wakeTime,
    sleepTime,
    workHours: { start: workHours.start || '09:00', end: workHours.end || '18:00' },
    selectedWorkoutDays,
    disciplineScore: clamp(Math.round((sleepWindow / 480) * 85 + selectedWorkoutDays.length * 2), 55, 96),
    routineSummary: `Structured ${days.length}-day routine with ${selectedWorkoutDays.length} training days and anchored meal timing.`,
    todayPlan,
    nextAction,
    days,
  };
}

module.exports = {
  buildRoutine,
  spreadWorkoutDays,
};
