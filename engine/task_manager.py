import json
import uuid
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

TASKS_FILE = Path("logs/tasks.json")

class Subtask:
    def __init__(self, id: str, project_id: str, title: str, estimated_focus_min: int, status: str = "pending", completed_at: Optional[str] = None, actual_focus_min: float = 0, xp_earned: int = 0, session_ids: List[str] = None):
        self.id = id
        self.project_id = project_id
        self.title = title
        self.estimated_focus_min = estimated_focus_min
        self.status = status
        self.completed_at = completed_at
        self.actual_focus_min = actual_focus_min
        self.xp_earned = xp_earned
        self.session_ids = session_ids or []

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

class Project:
    def __init__(self, id: str, title: str, status: str = "active", created_at: Optional[str] = None, subtasks: List[str] = None):
        self.id = id
        self.title = title
        self.status = status
        self.created_at = created_at or datetime.now().strftime("%Y-%m-%d")
        self.subtasks = subtasks or []

    def to_dict(self):
        return self.__dict__

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)

class TaskManager:
    def __init__(self):
        self.projects: Dict[str, Project] = {}
        self.subtasks: Dict[str, Subtask] = {}
        self.load()

    def load(self):
        if not TASKS_FILE.exists():
            return
        try:
            with open(TASKS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for p_data in data.get("projects", []):
                    p = Project.from_dict(p_data)
                    self.projects[p.id] = p
                for s_data in data.get("subtasks", []):
                    s = Subtask.from_dict(s_data)
                    self.subtasks[s.id] = s
        except Exception as e:
            print(f"Error loading tasks: {e}")

    def save(self):
        TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "projects": [p.to_dict() for p in self.projects.values()],
            "subtasks": [s.to_dict() for s in self.subtasks.values()]
        }
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def create_project(self, title: str) -> Project:
        proj_id = f"proj_{uuid.uuid4().hex[:8]}"
        p = Project(id=proj_id, title=title)
        self.projects[proj_id] = p
        self.save()
        return p

    def create_subtask(self, project_id: str, title: str, estimated_focus_min: int) -> Subtask:
        sub_id = f"sub_{uuid.uuid4().hex[:8]}"
        s = Subtask(id=sub_id, project_id=project_id, title=title, estimated_focus_min=estimated_focus_min)
        self.subtasks[sub_id] = s
        if project_id in self.projects:
            self.projects[project_id].subtasks.append(sub_id)
        self.save()
        return s

    def update_subtask_progress(self, sub_id: str, added_min: float, session_id: str = None):
        if sub_id in self.subtasks:
            s = self.subtasks[sub_id]
            s.actual_focus_min += added_min
            if session_id and session_id not in s.session_ids:
                s.session_ids.append(session_id)
            if s.status == "pending":
                s.status = "in_progress"
            self.save()

    def mark_subtask_done(self, sub_id: str, xp_earned: int):
        if sub_id in self.subtasks:
            s = self.subtasks[sub_id]
            s.status = "done"
            s.completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            s.xp_earned = xp_earned
            self.save()
            
    def get_active_projects(self) -> List[Project]:
        return [p for p in self.projects.values() if p.status == "active"]
        
    def get_subtasks_for_project(self, project_id: str) -> List[Subtask]:
        if project_id not in self.projects: return []
        return [self.subtasks[sid] for sid in self.projects[project_id].subtasks if sid in self.subtasks]
