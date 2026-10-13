import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Zap, Flame, Award, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { FocusSession } from '../../types';
import { DailyDetailModal } from './DailyDetailModal';

interface FocusHeatmapProps {
  sessions: FocusSession[];
}

export const FocusHeatmap: React.FC<FocusHeatmapProps> = ({ sessions }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group sessions by date YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map: Record<string, FocusSession[]> = {};
    sessions.forEach(s => {
      const dateKey = s.date || new Date(s.startTime).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  // Compute daily minutes map
  const minutesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(sessionsByDate).forEach(([d, list]) => {
      map[d] = list.reduce((sum, s) => sum + s.focusMinutes, 0);
    });
    return map;
  }, [sessionsByDate]);

  // Generate 52 weeks (364 days) grid leading up to today
  const { calendarDays, monthsHeader } = useMemo(() => {
    const days: { dateStr: string; dayOfWeek: number; monthName: string; dayOfMonth: number }[] = [];
    const today = new Date();
    
    // Total 52 weeks * 7 days = 364 days
    const totalDays = 52 * 7;
    const start = new Date(today);
    start.setDate(today.getDate() - (totalDays - 1));

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const monthName = current.toLocaleDateString('en-US', { month: 'short' });
      days.push({
        dateStr,
        dayOfWeek: current.getDay(), // 0 = Sun, 1 = Mon ...
        monthName,
        dayOfMonth: current.getDate()
      });
    }

    // Identify month label positions across 52 weeks
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = '';
    for (let week = 0; week < 52; week++) {
      const firstDayOfWeek = days[week * 7];
      if (firstDayOfWeek && firstDayOfWeek.monthName !== lastMonth) {
        months.push({ label: firstDayOfWeek.monthName, weekIndex: week });
        lastMonth = firstDayOfWeek.monthName;
      }
    }

    return { calendarDays: days, monthsHeader: months };
  }, []);

  // Compute Stats
  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => acc + s.focusMinutes, 0);
    const activeDates = Object.keys(minutesByDate);
    const activeDaysCount = activeDates.length;
    const dailyAverage = activeDaysCount > 0 ? Math.round(totalMinutes / activeDaysCount) : 0;
    
    // Find best day
    let bestDayMinutes = 0;
    Object.values(minutesByDate).forEach(m => {
      if (m > bestDayMinutes) bestDayMinutes = m;
    });

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalMinutes,
      activeDaysCount,
      dailyAverage,
      bestDayMinutes
    };
  }, [sessions, minutesByDate]);

  // Heatmap color logic
  const getCellColor = (mins: number) => {
    if (!mins || mins === 0) return 'rgba(255, 255, 255, 0.04)';
    if (mins < 30) return '#4c1d95'; // subtle purple
    if (mins < 60) return '#6d28d9'; // medium purple
    if (mins < 120) return '#8b5cf6'; // electric violet
    return '#06b6d4'; // neon cyan (high flow)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
            <CalendarIcon size={18} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Total Focus</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
            {stats.totalHours} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Hours</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {stats.totalMinutes} recorded minutes
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Active Days</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
            {stats.activeDaysCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Days</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Sessions logged in calendar
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
            <BarChart3 size={18} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Daily Average</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
            {stats.dailyAverage} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Min/Day</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            On active focus days
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Day Record</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
            {stats.bestDayMinutes} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Mins</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Personal single-day peak
          </div>
        </div>
      </div>

      {/* Main Heatmap Card */}
      <div className="glass-panel" style={{ padding: '24px 20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#ffffff' }}>Neural Focus Heatmap (52-Week Rolling)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Color intensity indicates daily minutes invested into deep work. Click any day for session breakdown.
            </p>
          </div>

          {/* Color Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>Less</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.04)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#4c1d95' }} title="1 - 29 min" />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#6d28d9' }} title="30 - 59 min" />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#8b5cf6' }} title="60 - 119 min" />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#06b6d4' }} title="120+ min" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div style={{ minWidth: '760px' }}>
          {/* Month Headers */}
          <div style={{ display: 'flex', marginBottom: '8px', paddingLeft: '28px' }}>
            {monthsHeader.map((m, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: `${(52 / monthsHeader.length) * 14}px`, 
                  fontSize: '0.72rem', 
                  color: 'var(--text-dim)', 
                  fontFamily: 'var(--font-mono)' 
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid with Day of Week labels */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Day Labels (Mon, Wed, Fri) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.68rem', color: 'var(--text-dim)', width: '22px' }}>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Mon</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Wed</div>
              <div style={{ height: '12px' }}></div>
              <div style={{ height: '12px' }}>Fri</div>
              <div style={{ height: '12px' }}></div>
            </div>

            {/* 52 Weeks Columns */}
            <div style={{ display: 'flex', gap: '3.5px' }}>
              {Array.from({ length: 52 }).map((_, weekIdx) => {
                const weekDays = calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7);
                return (
                  <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3.5px' }}>
                    {weekDays.map(day => {
                      const mins = minutesByDate[day.dateStr] || 0;
                      const sessionCount = sessionsByDate[day.dateStr]?.length || 0;
                      const tooltip = `${day.dateStr}: ${mins} minutes focused (${sessionCount} sessions)`;

                      return (
                        <div
                          key={day.dateStr}
                          title={tooltip}
                          onClick={() => setSelectedDate(day.dateStr)}
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2.5px',
                            background: getCellColor(mins),
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            border: mins > 60 ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.35)';
                            e.currentTarget.style.zIndex = '10';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Detail Modal */}
      {selectedDate && (
        <DailyDetailModal
          date={selectedDate}
          sessions={sessionsByDate[selectedDate] || []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
