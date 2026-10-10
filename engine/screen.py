"""
屏幕截图模块 - 纯内存操作，绝不写盘
Privacy-first: 图像仅存在于 RAM io.BytesIO，调用完毕即销毁
"""
import io
import mss
import mss.tools
from PIL import Image


def capture_screen_bytes(max_edge: int = 1024, jpeg_quality: int = 70) -> bytes:
    """
    抓取主显示器截图，缩放并压缩为 JPEG 字节流。

    Args:
        max_edge: 最大边长（像素），等比缩放
        jpeg_quality: JPEG 压缩质量 (1-95)

    Returns:
        JPEG 压缩后的字节数据（内存中，不写盘）

    Privacy contract:
        - 绝不写入任何文件
        - 返回的 bytes 由调用方负责销毁
        - 单次调用完成后原始截图对象立即超出作用域被 GC
    """
    with mss.mss() as sct:
        # 主显示器（index 1，index 0 是虚拟全屏）
        monitor = sct.monitors[1]
        screenshot = sct.grab(monitor)

        # 转换为 PIL Image（内存中）
        img = Image.frombytes(
            "RGB",
            screenshot.size,
            screenshot.bgra,
            "raw",
            "BGRX",
        )

    # 等比例缩放至 max_edge
    w, h = img.size
    if max(w, h) > max_edge:
        ratio = max_edge / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # 压缩为 JPEG 字节流（纯内存，不写盘）
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=jpeg_quality, optimize=True)
    buffer.seek(0)
    data = buffer.read()

    # 显式释放
    buffer.close()
    img.close()

    return data


def estimate_size_kb(data: bytes) -> float:
    """返回字节数据的 KB 大小"""
    return len(data) / 1024
