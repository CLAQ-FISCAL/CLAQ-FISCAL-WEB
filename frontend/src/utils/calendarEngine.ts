// Dynamic Calendar and Fiscal Date Engine for Mozambique (Real-time)

export interface CalendarDayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export class CalendarEngine {
  /**
   * Generates full calendar grid matrix (35 or 42 cells) for any given month/year
   */
  public static getMonthGrid(year: number, monthIndex: number): CalendarDayInfo[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

    // Monday is first day of week (0 in our grid, Sunday is 6)
    // In JS: 0 is Sunday, 1 is Monday... 6 is Saturday
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes index 6

    const days: CalendarDayInfo[] = [];

    // 1. Fill previous month tail days
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, monthIndex - 1, prevMonthLastDay - i);
      days.push({
        date: prevDate,
        dateString: this.formatDateYMD(prevDate),
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: prevDate.getTime() === today.getTime(),
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6
      });
    }

    // 2. Fill current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currentDate = new Date(year, monthIndex, day);
      days.push({
        date: currentDate,
        dateString: this.formatDateYMD(currentDate),
        dayNumber: day,
        isCurrentMonth: true,
        isToday: currentDate.getTime() === today.getTime(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
      });
    }

    // 3. Fill next month head days to complete 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, monthIndex + 1, day);
      days.push({
        date: nextDate,
        dateString: this.formatDateYMD(nextDate),
        dayNumber: day,
        isCurrentMonth: false,
        isToday: nextDate.getTime() === today.getTime(),
        isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6
      });
    }

    return days;
  }

  /**
   * Computes dynamic days remaining from today
   */
  public static getDaysRemaining(dueDateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDateString.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public static formatDateYMD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public static getMonthNamePt(monthIndex: number, year: number): string {
    const date = new Date(year, monthIndex, 1);
    const raw = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(date);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}
