import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
from engine.personal_records import PersonalRecords

PLAYER_PROFILE_FILE = Path("logs/player_profile.json")

def get_level_info(total_xp: int) -> Tuple[int, str, int, int]:
    """
    计算等级信息
    Level 1: 0 XP    "初学者专注者"
    Level 2: 100 XP  "稳定执行者"
    Level 3: 200 XP  "深度工作者"
    Level 4: 300 XP  "PFC 主宰"
    Level 5: 400 XP  "Ultradian 猎手"
    Level 6+: 每级 100 XP
    返回: (当前等级, 称号, 当前级别已获得XP, 升级所需总XP)
    """
    level = (total_xp // 100) + 1
    xp_in_level = total_xp % 100
    next_level_xp = 100
    
    titles = {
        1: "初学者专注者",
        2: "稳定执行者",
        3: "深度工作者",
        4: "PFC 主宰",
        5: "Ultradian 猎手"
    }
    title = titles.get(level, f"Neuro 宗师 Lv.{level}")
    
    return level, title, xp_in_level, next_level_xp

class PlayerProfile:
    def __init__(self):
        self.total_xp = 0
        self.streak_days = 0
        self.longest_streak = 0
        self.milestones_unlocked = []
        self.total_focus_hours = 0.0
        self.total_tasks_done = 0
        self.personal_records = PersonalRecords()
        self.load()

    # ─── Bug Fix 1: expose level/title as properties ─────────────────────────
    @property
    def level(self) -> int:
        return get_level_info(self.total_xp)[0]

    @property
    def level_title(self) -> str:
        return get_level_info(self.total_xp)[1]

    @property
    def xp_in_level(self) -> int:
        return get_level_info(self.total_xp)[2]

    def load(self):
        if not PLAYER_PROFILE_FILE.exists():
            return
        try:
            with open(PLAYER_PROFILE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.total_xp = data.get("total_xp", 0)
                self.streak_days = data.get("streak_days", 0)
                self.longest_streak = data.get("longest_streak", 0)
                self.milestones_unlocked = data.get("milestones_unlocked", [])
                self.total_focus_hours = data.get("total_focus_hours", 0.0)
                self.total_tasks_done = data.get("total_tasks_done", 0)
                self.personal_records = PersonalRecords(data.get("personal_records", {}))
        except Exception as e:
            print(f"Error loading player profile: {e}")

    def save(self):
        PLAYER_PROFILE_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "total_xp": self.total_xp,
            "level": self.level,           # uses property
            "level_title": self.level_title,
            "streak_days": self.streak_days,
            "longest_streak": self.longest_streak,
            "milestones_unlocked": self.milestones_unlocked,
            "total_focus_hours": self.total_focus_hours,
            "total_tasks_done": self.total_tasks_done,
            "personal_records": self.personal_records.to_dict()
        }
        with open(PLAYER_PROFILE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def add_xp(self, xp: int) -> bool:
        """增加 XP，返回是否升级"""
        old_level = self.level
        self.total_xp += xp
        self.personal_records.check_and_update_session_xp(xp)
        self.save()
        return self.level > old_level

    def unlock_milestone(self, milestone: str) -> bool:
        if milestone not in self.milestones_unlocked:
            self.milestones_unlocked.append(milestone)
            self.save()
            return True
        return False

def calculate_xp(actual_focus_min: float, estimated_focus_min: float, l1_count: int, l2_count: int, focus_rate: float, streak_days: int) -> int:
    """计算完成小任务获得的 XP
    
    Bug Fix 2: speed_bonus now uses estimated_min as base_xp so fast completion
    actually earns MORE than slow completion (previously the lower actual_min
    meant speed_bonus 1.15x still didn't compensate for less base XP).
    When speed bonus applies, we use estimated_min as the base instead.
    """
    is_fast = (actual_focus_min > 0 and estimated_focus_min > 0
               and actual_focus_min <= estimated_focus_min * 0.8)

    # Use estimated_min as base when fast — rewarding efficiency
    base_xp = (estimated_focus_min if is_fast else actual_focus_min) * 1.0
    
    intervention_multiplier = max(0.4, 1.0 - (l1_count * 0.05) - (l2_count * 0.15))
    
    if focus_rate >= 80.0:
        focus_rate_bonus = 1.2
    elif focus_rate >= 60.0:
        focus_rate_bonus = 1.0
    else:
        focus_rate_bonus = 0.8
        
    # Variable Ratio Schedule (Skinner) — speed bonus on top of already-full base
    speed_bonus = 1.15 if is_fast else 1.0
    
    streak_bonus = min(1.3, 1.0 + (streak_days * 0.02))
    
    final_xp = int(base_xp * intervention_multiplier * focus_rate_bonus * speed_bonus * streak_bonus)
    return max(0, final_xp)
