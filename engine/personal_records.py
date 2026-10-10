import json
from pathlib import Path
from typing import Dict, Any, List

class PersonalRecords:
    def __init__(self, data: Dict[str, Any] = None):
        data = data or {}
        self.pr_longest_flow_min = data.get("pr_longest_flow_min", 0.0)
        self.pr_session_focus_rate = data.get("pr_session_focus_rate", 0.0)
        self.pr_daily_focus_min = data.get("pr_daily_focus_min", 0.0)
        self.pr_session_xp = data.get("pr_session_xp", 0)
        self.pr_task_completion_speed = data.get("pr_task_completion_speed", {})
        self.pr_streak_days = data.get("pr_streak_days", 0)

    def to_dict(self):
        return self.__dict__

    def check_and_update_longest_flow(self, flow_min: float) -> bool:
        if flow_min > self.pr_longest_flow_min:
            self.pr_longest_flow_min = flow_min
            return True
        return False

    def check_and_update_session_focus_rate(self, rate: float) -> bool:
        if rate > self.pr_session_focus_rate:
            self.pr_session_focus_rate = rate
            return True
        return False

    def check_and_update_daily_focus_min(self, focus_min: float) -> bool:
        if focus_min > self.pr_daily_focus_min:
            self.pr_daily_focus_min = focus_min
            return True
        return False

    def check_and_update_session_xp(self, xp: int) -> bool:
        if xp > self.pr_session_xp:
            self.pr_session_xp = xp
            return True
        return False

    def check_and_update_streak(self, streak: int) -> bool:
        if streak > self.pr_streak_days:
            self.pr_streak_days = streak
            return True
        return False
