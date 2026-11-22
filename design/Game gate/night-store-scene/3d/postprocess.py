"""
렌더 결과를 이미지 생성용 가이드로 바꾼다.

  python3 postprocess.py [photo|pano ...]

입력 (renders/)
  <tag>_color.png       색 가이드
  <tag>_depth_raw.png   깊이 (미터 / 30, 16bit)
  <tag>_normal.png      표면 방향 (16bit)
출력 (renders/)
  <tag>_depth.png       가까울수록 흰색 (ControlNet depth / 깊이 참고용)
  <tag>_lines.png       흰 바탕 검은 선 (선화 참고용)
  <tag>_lines_inv.png   검은 바탕 흰 선 (ControlNet lineart / canny 용)
  <tag>_guide.png       색 가이드 위에 선을 얹은 것 (GPT 등 이미지 참고 1장용)
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "renders")


def load16(path):
    a = np.array(Image.open(path))
    return a.astype(np.float32) / (65535.0 if a.dtype == np.uint16 or a.max() > 255 else 255.0)


def run(tag):
    z = load16(os.path.join(R, f"{tag}_depth_raw.png")) * 30.0      # 미터
    if z.ndim == 3:
        z = z[..., 0]
    z = np.clip(z, 0.2, 30.0)

    # 깊이: 역수(시차) 기준, 가까울수록 흰색
    disp = 1.0 / z
    lo, hi = np.percentile(disp, 1), np.percentile(disp, 99.5)
    d = np.clip((disp - lo) / (hi - lo), 0, 1)
    Image.fromarray((d * 255).astype(np.uint8)).save(os.path.join(R, f"{tag}_depth.png"))

    # 선: 노멀이 꺾이는 곳 + 깊이가 끊기는 곳
    n = Image.open(os.path.join(R, f"{tag}_normal.png"))
    n = np.array(n).astype(np.float32)
    n = n / (65535.0 if n.max() > 255 else 255.0)
    n = n[..., :3] * 2 - 1
    edge_n = np.zeros(z.shape, np.float32)
    edge_z = np.zeros(z.shape, np.float32)
    for dy, dx in ((0, 1), (1, 0)):
        nb = np.roll(n, (-dy, -dx), axis=(0, 1))
        dot = (n * nb).sum(-1)
        edge_n = np.maximum(edge_n, (dot < 0.85).astype(np.float32))
        zb = np.roll(z, (-dy, -dx), axis=(0, 1))
        rel = np.abs(z - zb) / np.minimum(z, zb)
        edge_z = np.maximum(edge_z, (rel > 0.04).astype(np.float32))
    e = np.maximum(edge_n, edge_z)
    e[-1, :] = 0
    e[:, -1] = 0
    img = Image.fromarray((e * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
    img.save(os.path.join(R, f"{tag}_lines_inv.png"))
    lines = Image.fromarray(255 - np.array(img))
    lines.save(os.path.join(R, f"{tag}_lines.png"))

    color = Image.open(os.path.join(R, f"{tag}_color.png")).convert("RGB")
    c = np.array(color).astype(np.float32)
    m = (np.array(img) > 0)[..., None]
    g = np.where(m, c * 0.25, c)
    Image.fromarray(g.astype(np.uint8)).save(os.path.join(R, f"{tag}_guide.png"))
    print("ok", tag)


for t in (sys.argv[1:] or ["photo", "pano"]):
    if os.path.exists(os.path.join(R, f"{t}_color.png")):
        run(t)
