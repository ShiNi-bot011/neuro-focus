import os
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class KuaKuaMachine:
    MODEL = "gemini-3.5-flash"
    FALLBACK_MODEL = "gemini-3.1-flash-lite"

    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def generate_task_completion_praise(
        self,
        task_name: str,
        actual_min: float,
        focus_rate: float,
        xp_earned: int,
        is_pr_broken: bool = False
    ) -> str:
        system_instruction = (
            "你是 Andrew Huberman 神经科学 + Carol Dweck 成长型思维 + 积极心理学 的 AI 神经教练。\n"
            "用户刚刚完成了一个专注任务。\n"
            "请生成 50-90 字的鼓励语，必须满足:\n"
            "1. Growth Mindset: 强调'努力过程与认知策略'而非天资\n"
            "2. 神经科学具体性: 提到具体的脑机制 (如 PFC 前额叶皮层、突触可塑性 LTP、去甲肾上腺素 LC-NE、髓鞘化 Myelination)\n"
            "3. 只与用户自己的过去对比，严禁与他人比较\n"
            "4. 科学严谨、富有力量，严禁使用'你真棒'等空洞陈词"
        )
        prompt = (
            f"用户刚刚完成了任务: '{task_name}'。\n"
            f"专注耗时: {actual_min:.1f} 分钟\n"
            f"心流专注率: {focus_rate:.1f}%\n"
            f"获得 XP: {xp_earned}\n"
            f"是否打破个人记录: {'是' if is_pr_broken else '否'}\n"
            "请给出一小段 Growth Mindset + Neuroscience 的鼓励与神经反馈。"
        )

        if self.client:
            for model_name in [self.MODEL, self.FALLBACK_MODEL]:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.7,
                        )
                    )
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    logger.warning(f"KuaKua generation failed on {model_name}: {e}")
                    continue

        # 离线或 API 受限时的确定性神经科学备用语
        if is_pr_broken:
            return (
                f"突破个人历史最佳！你在「{task_name}」中保持了 {focus_rate:.0f}% 的专注对齐。"
                f"这种刻意对抗阻力的过程正在驱动去甲肾上腺素(LC-NE)与乙酰胆碱释放，"
                f"为你锁定了长时程增强(LTP)神经重塑！"
            )
        else:
            return (
                f"出色完成「{task_name}」！持续 {actual_min:.1f} 分钟的高质量前额叶(PFC)激活，"
                f"正在为相关回路进行髓鞘化(Myelination)强化。专注不是天生能力，"
                f"你每一次拉回注意力的动作都在物理层面重塑大脑！"
            )

