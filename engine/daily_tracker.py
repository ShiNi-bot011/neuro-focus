import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any

DAILY_PROFILES_FILE = Path("logs/daily_profiles.json")

class DailyProfile:
    def __init__(self, date: str, daily_goal_min: int = 180, actual_focus_min: float = 0.0, xp_today: int = 0, tasks_completed: int = 0):
        self.date = date
        self.daily_goal_min = daily_goal_min
        self.actual_focus_min = actual_focus_min
        self.xp_today = xp_today
        self.tasks_completed = tasks_completed

    def to_dict(self):
        return self.__dict__

class DailyTracker:
    def __init__(self):
        self.profiles: Dict[str, DailyProfile] = {}
        self.load()

    def load(self):
        if not DAILY_PROFILES_FILE.exists():
            return
        try:
            with open(DAILY_PROFILES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for date_str, p_data in data.items():
                    self.profiles[date_str] = DailyProfile(**p_data)
        except Exception as e:
            print(f"Error loading daily profiles: {e}")

    def save(self):
        DAILY_PROFILES_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {date: p.to_dict() for date, p in self.profiles.items()}
        with open(DAILY_PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_today_profile(self) -> DailyProfile:
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.profiles:
            self.profiles[today] = DailyProfile(date=today)
            self.save()
        return self.profiles[today]
        
    def get_yesterday_profile(self) -> DailyProfile:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        return self.profiles.get(yesterday)

    def set_daily_goal(self, goal_min: int):
        p = self.get_today_profile()
        p.daily_goal_min = goal_min
        self.save()

    def add_focus_min(self, minutes: float):
        p = self.get_today_profile()
        p.actual_focus_min += minutes
        self.save()

    def add_xp(self, xp: int):
        p = self.get_today_profile()
        p.xp_today += xp
        self.save()

    def increment_tasks_completed(self):
        p = self.get_today_profile()
        p.tasks_completed += 1
        self.save()

    def check_gap_and_warnings(self, current_hour: int) -> str:
        p = self.get_today_profile()
        if p.daily_goal_min == 0: return None
        
        gap_min = p.daily_goal_min - p.actual_focus_min
        if gap_min <= 0: return None
        
        gap_pct = gap_min / p.daily_goal_min
        
        if gap_pct > 0.8 and current_hour > 18:
            return "red"
        if gap_pct > 0.5 and current_hour > 16:
            return "orange"
            
        return None
