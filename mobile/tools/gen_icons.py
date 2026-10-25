"""生成 CookHero 移动端 / 飞牛桌面的应用图标。

用法：
    python tools/gen_icons.py

产物：
    mobile/public/icons/icon-192.png          PWA 小图标
    mobile/public/icons/icon-512.png          PWA 大图标
    mobile/public/icons/icon-maskable-512.png Android 自适应图标（四周留安全区）
    mobile/public/icons/apple-touch-icon.png  iOS 主屏图标（180）
    mobile/public/icons/favicon.png
    fnos/cookhero-fnos.png                    飞牛桌面图标（512）
"""

import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "public", "icons"))
FNOS = os.path.abspath(os.path.join(HERE, "..", "..", "fnos"))

SS = 4  # 超采样倍数，画完再缩小，边缘更平滑
BG_TOP = (255, 158, 80)
BG_BOTTOM = (238, 84, 44)
WHITE = (255, 255, 255, 255)


def base_plate(size: int, radius_ratio: float):
    """竖向渐变圆角底板。"""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(s * radius_ratio)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=255)

    grad = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(s):
        t = y / max(s - 1, 1)
        c = tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3))
        gd.line([(0, y), (s - 1, y)], fill=c + (255,))
    img.paste(grad, (0, 0), mask)
    return img, d, s, mask


def draw_chef_hat(d, cx, cy, w, color):
    """厨师帽：三个云朵 + 帽身 + 帽檐。以 (cx, cy) 为整体几何中心。"""
    h = w * 0.86
    r = w * 0.19
    # 顶部三朵云
    for dx, rr in ((-w * 0.25, r * 0.86), (0.0, r * 1.16), (w * 0.25, r * 0.86)):
        yc = cy - h * 0.30
        d.ellipse([cx + dx - rr, yc - rr, cx + dx + rr, yc + rr], fill=color)
    # 帽身（连接云朵与帽檐）
    d.rectangle([cx - w * 0.34, cy - h * 0.28, cx + w * 0.34, cy + h * 0.28], fill=color)
    # 帽檐
    d.rounded_rectangle(
        [cx - w * 0.46, cy + h * 0.14, cx + w * 0.46, cy + h * 0.44],
        radius=w * 0.075,
        fill=color,
    )
    # 帽檐下沿阴影线（增加层次）
    d.rounded_rectangle(
        [cx - w * 0.46, cy + h * 0.33, cx + w * 0.46, cy + h * 0.44],
        radius=w * 0.06,
        fill=(226, 226, 226, 255) if color == WHITE else color,
    )


def build(size: int, radius_ratio: float, content_scale: float, ring: bool = True):
    img, d, s, mask = base_plate(size, radius_ratio)

    if ring:
        pad = s * 0.075
        d.ellipse([pad, pad, s - pad, s - pad], outline=(255, 255, 255, 64), width=int(s * 0.011))

    cx = cy = s / 2
    w = s * 0.58 * content_scale
    draw_chef_hat(d, cx, cy - s * 0.025, w, WHITE)

    return img.resize((size, size), Image.LANCZOS)


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print("  ->", path, img.size)


def main():
    print("[icons] 生成 CookHero 图标")
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FNOS, exist_ok=True)

    base512 = build(512, 0.22, 1.0)
    save(base512, os.path.join(OUT, "icon-512.png"))
    save(base512.resize((192, 192), Image.LANCZOS), os.path.join(OUT, "icon-192.png"))
    save(base512.resize((180, 180), Image.LANCZOS), os.path.join(OUT, "apple-touch-icon.png"))
    save(base512.resize((64, 64), Image.LANCZOS), os.path.join(OUT, "favicon.png"))

    # maskable：内容缩到 64%，四周留安全区（Android  launcher 会裁掉外圈）
    save(build(512, 0.0, 0.64, ring=False), os.path.join(OUT, "icon-maskable-512.png"))

    # 飞牛桌面图标（512，圆角底板）
    save(base512, os.path.join(FNOS, "cookhero-fnos.png"))
    print("[done]")


if __name__ == "__main__":
    main()
