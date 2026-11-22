"""
심야 편의점 블록아웃 (Blender 4.3+)

실행:
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P build_store.py -- [photo|pano|all]

좌표계 (단위 m)
  x: 오른쪽 +   y: 정면(매장 안쪽) +   z: 위 +
  카메라 = 계산대 뒤 직원 눈 (0, 0, 1.6)

치수는 view-center-v2.webp 에서 역산(눈높이 160cm, 계산대 95cm 가정).
"""
import bpy, math, sys, os, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "renders")
os.makedirs(OUT, exist_ok=True)
MODE = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv and len(sys.argv) > sys.argv.index("--") + 1 else "all")
random.seed(7)

# ------------------------------------------------------------------ 치수
EYE = 1.6
CEIL = 3.0
WALL_L = -3.5           # 왼쪽 정면 유리벽
WALL_R = 3.6            # 오른쪽 벽
WALL_BACK = -1.0        # 직원 뒤 담배 진열장 벽
BACK_MAIN = 11.5        # 음료 냉장고 벽
BACK_R_X = 1.3          # 오른쪽 안쪽은 벽이 앞으로 나와 있음(유제품 냉장대)
BACK_R = 7.6
DOOR_Y = (2.0, 3.8)     # 자동문
COUNTER_TOP = 0.95
CNT_FRONT = (0.4, 1.0)  # 계산대 상판 y 범위
CNT_X = (-1.9, 2.4)     # 계산대 일자 부분 x 범위 (왼쪽 끝 = 직원 출입 통로)
WING_X = (2.4, 3.0)     # 오른쪽 날개(직원 쪽으로 꺾임)
WING_Y = (-0.5, 1.0)
COR_Y = (1.2, 2.2)      # 화장실 통로 입구(오른쪽 벽에 뚫림)
COR_END = 6.2           # 통로 끝(화장실 문)

# ------------------------------------------------------------------ 초기화
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col_cache = {}


def collection(name):
    if name not in col_cache:
        c = bpy.data.collections.new(name)
        scene.collection.children.link(c)
        col_cache[name] = c
    return col_cache[name]


# ------------------------------------------------------------------ 재질
def mat(name, color, rough=0.5, metal=0.0, emit=None, emit_strength=0.0, transmission=0.0, alpha=1.0, tex=None):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    if transmission:
        b.inputs["Transmission Weight"].default_value = transmission
        b.inputs["IOR"].default_value = 1.05
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
    m.diffuse_color = (*color, 1)
    if tex == "products":   # 상품 줄: 칸마다 색이 다른 보로노이
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (9, 9, 4)
        vo = nt.nodes.new("ShaderNodeTexVoronoi")
        vo.inputs["Scale"].default_value = 1.0
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], vo.inputs["Vector"])
        nt.links.new(vo.outputs["Color"], b.inputs["Base Color"])
        if emit:
            nt.links.new(vo.outputs["Color"], b.inputs["Emission Color"])
    if tex == "tiles":      # 60cm 타일 + 줄눈
        tc = nt.nodes.new("ShaderNodeTexCoord")
        br = nt.nodes.new("ShaderNodeTexBrick")
        br.offset = 0.0
        br.inputs["Scale"].default_value = 1.0
        br.inputs["Brick Width"].default_value = 0.6
        br.inputs["Row Height"].default_value = 0.6
        br.inputs["Mortar Size"].default_value = 0.006
        br.inputs["Color1"].default_value = (*color, 1)
        br.inputs["Color2"].default_value = (color[0] * 0.95, color[1] * 0.95, color[2] * 0.95, 1)
        br.inputs["Mortar"].default_value = (0.55, 0.55, 0.53, 1)
        nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
        nt.links.new(br.outputs["Color"], b.inputs["Base Color"])
    return m


M = dict(
    floor=mat("floor", (0.66, 0.66, 0.64), rough=0.12, tex="tiles"),
    wall=mat("wall", (0.88, 0.88, 0.86), rough=0.4),
    ceiling=mat("ceiling", (0.85, 0.85, 0.83), rough=0.8),
    teal=mat("teal", (0.0, 0.42, 0.40), rough=0.3),
    lime=mat("lime_counter", (0.55, 0.78, 0.08), rough=0.15),
    counter_base=mat("counter_base", (0.86, 0.86, 0.84), rough=0.5),
    metal=mat("shelf_metal", (0.55, 0.56, 0.58), rough=0.35, metal=0.6),
    frame=mat("alu_frame", (0.62, 0.63, 0.65), rough=0.3, metal=0.9),
    glass=mat("glass", (0.9, 0.95, 0.95), rough=0.0, transmission=1.0),
    products=mat("products", (0.8, 0.5, 0.2), rough=0.5, tex="products"),
    drinks=mat("drinks", (0.8, 0.5, 0.2), rough=0.4, tex="products", emit=(1, 1, 1), emit_strength=0.6),
    light=mat("ceiling_light", (1, 1, 1), emit=(0.92, 0.97, 1.0), emit_strength=10),
    dark=mat("dark_plastic", (0.03, 0.03, 0.035), rough=0.4),
    screen=mat("screen", (0.2, 0.3, 0.4), emit=(0.45, 0.65, 0.85), emit_strength=0.8),
    cctv=mat("cctv_screen", (0.3, 0.35, 0.4), emit=(0.55, 0.6, 0.62), emit_strength=0.8),
    paper=mat("paper", (0.92, 0.92, 0.9), rough=0.8),
    wood=mat("wood", (0.55, 0.38, 0.22), rough=0.5),
    door_white=mat("door_white", (0.9, 0.9, 0.9), rough=0.4),
    door_gray=mat("door_gray", (0.42, 0.43, 0.44), rough=0.4),
    sign_wc=mat("sign_wc", (0.1, 0.25, 0.7), rough=0.4),
    red=mat("pop_red", (0.85, 0.08, 0.12), rough=0.5),
    yellow=mat("pop_yellow", (0.95, 0.8, 0.1), rough=0.5),
    bin=mat("bin_clear", (0.85, 0.88, 0.9), rough=0.25, transmission=0.6),
    mat_dark=mat("door_mat", (0.08, 0.08, 0.08), rough=0.9),
    asphalt=mat("asphalt_wet", (0.04, 0.04, 0.05), rough=0.08),
    building=mat("building", (0.15, 0.16, 0.2), rough=0.8),
    tree=mat("tree", (0.05, 0.12, 0.06), rough=0.8),
    lamp=mat("street_lamp", (1, 0.6, 0.2), emit=(1, 0.55, 0.2), emit_strength=40),
    chrome=mat("chrome", (0.8, 0.8, 0.82), rough=0.1, metal=1.0),
    cig=mat("cigarette_wall", (0.5, 0.45, 0.4), tex="products", emit=(1, 1, 1), emit_strength=0.4),
)


# ------------------------------------------------------------------ 도형
def box(name, x0, x1, y0, y1, z0, z1, material, col="store"):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
         (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    collection(col).objects.link(ob)
    return ob


def cyl(name, x, y, z0, z1, r, material, col="store", seg=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(material)
    for c in ob.users_collection:
        c.objects.unlink(ob)
    collection(col).objects.link(ob)
    return ob


def sphere(name, x, y, z, r, material, col="store"):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(x, y, z), segments=24, ring_count=12)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(material)
    for c in ob.users_collection:
        c.objects.unlink(ob)
    collection(col).objects.link(ob)
    return ob


T = 0.1  # 벽 두께

# ------------------------------------------------------------------ 바닥·천장·벽
box("floor", WALL_L, WALL_R, WALL_BACK, BACK_MAIN, -0.05, 0, M["floor"], "room")
box("floor_corridor", WALL_R, COR_END, COR_Y[0], COR_Y[1], -0.05, 0, M["floor"], "room")
box("ceiling", WALL_L, WALL_R, WALL_BACK, BACK_MAIN, CEIL, CEIL + 0.05, M["ceiling"], "room")
box("ceiling_corridor", WALL_R, COR_END, COR_Y[0], COR_Y[1], 2.4, 2.45, M["ceiling"], "room")

# 오른쪽 벽 (통로 입구 뚫림)
box("wall_R_front", WALL_R, WALL_R + T, WALL_BACK, COR_Y[0], 0, CEIL, M["wall"], "room")
box("wall_R_back", WALL_R, WALL_R + T, COR_Y[1], BACK_R, 0, CEIL, M["wall"], "room")
box("wall_R_lintel", WALL_R, WALL_R + T, COR_Y[0], COR_Y[1], 2.2, CEIL, M["wall"], "room")
# 통로
cw = mat("corridor_wall", (0.62, 0.62, 0.6), rough=0.5)
box("cor_wall_near", WALL_R, COR_END, COR_Y[0] - T, COR_Y[0], 0, 2.45, cw, "room")
box("cor_wall_far", WALL_R, COR_END, COR_Y[1], COR_Y[1] + T, 0, 2.45, cw, "room")
box("cor_wall_end", COR_END, COR_END + T, COR_Y[0], COR_Y[1], 0, 2.45, cw, "room")
box("cor_door_frame", COR_END - 0.04, COR_END, COR_Y[0] + 0.08, COR_Y[1] - 0.08, 0, 2.1, M["frame"], "props")
for nm, a in [("teal_cor_near", (WALL_R, COR_END, COR_Y[0], COR_Y[0] + 0.01)),
              ("teal_cor_far", (WALL_R, COR_END, COR_Y[1] - 0.01, COR_Y[1]))]:
    box(nm, *a, 2.1, 2.25, M["teal"], "room")
box("wc_door", COR_END - 0.03, COR_END, COR_Y[0] + 0.12, COR_Y[1] - 0.12, 0, 2.05, M["door_white"], "props")
box("wc_sign", COR_END - 0.04, COR_END - 0.03, 1.6, 1.8, 1.45, 1.65, M["sign_wc"], "props")
box("wc_handle", COR_END - 0.08, COR_END - 0.03, COR_Y[1] - 0.25, COR_Y[1] - 0.17, 0.95, 1.0, M["chrome"], "props")
box("storage_door", 4.6, 5.4, COR_Y[1] - 0.03, COR_Y[1], 0, 2.05, M["door_gray"], "props")
box("cor_light", 4.6, 5.6, 1.65, 1.75, 2.38, 2.4, M["light"], "lights")

# 안쪽 벽
box("wall_back_main", WALL_L, BACK_R_X, BACK_MAIN, BACK_MAIN + T, 0, CEIL, M["wall"], "room")
box("wall_back_step", BACK_R_X - T, BACK_R_X, BACK_R, BACK_MAIN, 0, CEIL, M["wall"], "room")
box("wall_back_R", BACK_R_X, WALL_R + T, BACK_R, BACK_R + T, 0, CEIL, M["wall"], "room")
box("wall_behind", WALL_L, WALL_R + T, WALL_BACK - T, WALL_BACK, 0, CEIL, M["wall"], "room")

# 청록색 띠
for nm, a in [("teal_R1", (WALL_R - 0.01, WALL_R, WALL_BACK, COR_Y[0])),
              ("teal_R2", (WALL_R - 0.01, WALL_R, COR_Y[1], BACK_R)),
              ("teal_backR", (BACK_R_X, WALL_R, BACK_R - 0.01, BACK_R)),
              ("teal_step", (BACK_R_X - T - 0.01, BACK_R_X - T, BACK_R, BACK_MAIN)),
              ("teal_back", (WALL_L, BACK_R_X - T, BACK_MAIN - 0.01, BACK_MAIN))]:
    box(nm, *a, 2.25, 2.45, M["teal"], "room")

# ------------------------------------------------------------------ 왼쪽 정면 유리벽 + 자동문
box("glass_wall", WALL_L - 0.02, WALL_L, WALL_BACK, BACK_MAIN, 0.05, CEIL, M["glass"], "facade")
box("glass_sill", WALL_L - 0.05, WALL_L + 0.05, WALL_BACK, BACK_MAIN, 0, 0.08, M["frame"], "facade")
box("glass_head", WALL_L - 0.05, WALL_L + 0.05, WALL_BACK, BACK_MAIN, 2.4, 2.5, M["frame"], "facade")
y = WALL_BACK
while y <= BACK_MAIN:
    if not (DOOR_Y[0] + 0.1 < y < DOOR_Y[1] - 0.1):
        box(f"mullion_{y:.1f}", WALL_L - 0.05, WALL_L + 0.05, y - 0.04, y + 0.04, 0, CEIL, M["frame"], "facade")
    y += 1.5
for yy in (DOOR_Y[0], (DOOR_Y[0] + DOOR_Y[1]) / 2, DOOR_Y[1]):
    box(f"door_frame_{yy:.1f}", WALL_L - 0.04, WALL_L + 0.06, yy - 0.05, yy + 0.05, 0, 2.4, M["frame"], "facade")
box("door_sensor", WALL_L + 0.02, WALL_L + 0.1, 2.75, 3.05, 2.5, 2.58, M["dark"], "facade")
box("door_mat", WALL_L + 0.1, WALL_L + 0.9, DOOR_Y[0] + 0.15, DOOR_Y[1] - 0.15, 0, 0.012, M["mat_dark"], "props")

# 바깥(비 오는 밤)
box("street", -30, WALL_L - 0.05, -20, 40, -0.15, -0.1, M["asphalt"], "outside")
for i, (yy, h) in enumerate([(-6, 9), (2, 12), (10, 8), (18, 14), (28, 10)]):
    box(f"building_{i}", -26, -20, yy, yy + 7, 0, h, M["building"], "outside")
for yy in (-2, 6, 14):
    cyl(f"lamp_pole_{yy}", -9, yy, 0, 5, 0.06, M["metal"], "outside")
    sphere(f"lamp_{yy}", -9, yy, 5.1, 0.25, M["lamp"], "outside")
for yy in (0, 4, 9, 12):
    sphere(f"tree_{yy}", -15, yy, 3.5, 1.2, M["tree"], "outside")

# ------------------------------------------------------------------ 진열대
def gondola(name, x0, x1, y0, y1, h, levels=5, double=True):
    box(name + "_base", x0, x1, y0, y1, 0, 0.12, M["metal"])
    box(name + "_spine", (x0 + x1) / 2 - 0.03, (x0 + x1) / 2 + 0.03, y0, y1, 0, h, M["metal"])
    for i in range(levels):
        z = 0.12 + i * (h - 0.15) / levels
        box(f"{name}_shelf{i}", x0, x1, y0, y1, z, z + 0.025, M["metal"])
        zt = z + 0.025 + (h - 0.15) / levels * 0.78
        box(f"{name}_prod{i}", x0 + 0.03, x1 - 0.03, y0 + 0.02, y1 - 0.02, z + 0.025, zt, M["products"])
    # 진열대 끝 매대
    box(name + "_endcap_back", x0, x1, y0 - 0.05, y0, 0, h * 0.9, M["metal"])
    box(name + "_endcap_base", x0, x1, y0 - 0.45, y0, 0, 0.12, M["metal"])
    for i in range(4):
        z = 0.12 + i * 0.34
        box(f"{name}_endshelf{i}", x0, x1, y0 - 0.45, y0 - 0.05, z, z + 0.02, M["metal"])
        box(f"{name}_endprod{i}", x0 + 0.03, x1 - 0.03, y0 - 0.42, y0 - 0.06, z + 0.02, z + 0.27, M["products"])


gondola("gondola_L", -2.55, -1.35, 3.75, 9.4, 1.65)
box("pop_2plus1", -2.45, -2.0, 3.28, 3.3, 1.55, 1.95, M["red"], "props")
box("pop_1plus1", -1.36, -1.34, 3.9, 4.3, 1.1, 1.55, M["red"], "props")
gondola("gondola_M", 0.25, 1.15, 3.55, 8.0, 1.7)

# 오른쪽 벽 과자 진열장 (한쪽 면)
x0, x1 = WALL_R - 0.5, WALL_R
box("wallshelf_back", WALL_R - 0.05, WALL_R, 2.4, 6.9, 0, 2.0, M["metal"])
box("wallshelf_base", x0, x1, 2.4, 6.9, 0, 0.12, M["metal"])
for i in range(6):
    z = 0.12 + i * 0.31
    box(f"wallshelf_{i}", x0, x1, 2.4, 6.9, z, z + 0.02, M["metal"])
    box(f"wallshelf_prod{i}", x0 + 0.04, x1 - 0.06, 2.42, 6.88, z + 0.02, z + 0.26, M["products"])
box("wallshelf_side", x0, x1, 2.38, 2.42, 0, 2.0, M["metal"])

# 유제품 오픈 냉장대 (오른쪽 안쪽 벽)
box("dairy_body", 1.5, WALL_R, BACK_R - 0.75, BACK_R, 0, 0.45, M["metal"])
box("dairy_top", 1.5, WALL_R, BACK_R - 0.5, BACK_R, 1.95, 2.1, M["metal"])
for i in range(4):
    z = 0.6 + i * 0.34
    box(f"dairy_shelf{i}", 1.5, WALL_R, BACK_R - 0.6 + i * 0.03, BACK_R, z - 0.02, z, M["metal"])
    box(f"dairy_prod{i}", 1.55, WALL_R - 0.05, BACK_R - 0.55 + i * 0.03, BACK_R - 0.05, z, z + 0.22, M["drinks"])

# 음료 냉장고 (안쪽 벽)
fx = WALL_L + 0.6
i = 0
while fx + 0.7 <= BACK_R_X - 0.15:
    box(f"fridge_{i}_body", fx, fx + 0.7, BACK_MAIN - 0.8, BACK_MAIN, 0, 2.1, M["metal"])
    box(f"fridge_{i}_drinks", fx + 0.05, fx + 0.65, BACK_MAIN - 0.85, BACK_MAIN - 0.8, 0.15, 1.9, M["drinks"])
    box(f"fridge_{i}_glass", fx + 0.03, fx + 0.67, BACK_MAIN - 0.9, BACK_MAIN - 0.88, 0.1, 1.95, M["glass"])
    box(f"fridge_{i}_handle", fx + 0.6, fx + 0.63, BACK_MAIN - 0.94, BACK_MAIN - 0.9, 0.7, 1.4, M["chrome"])
    fx += 0.72
    i += 1

# ------------------------------------------------------------------ 계산대
ct = COUNTER_TOP
box("counter_top", CNT_X[0], WING_X[1], CNT_FRONT[0], CNT_FRONT[1], ct - 0.04, ct, M["lime"], "counter")
box("counter_base", CNT_X[0] + 0.02, WING_X[1] - 0.02, CNT_FRONT[0] + 0.05, CNT_FRONT[1] - 0.02, 0, ct - 0.04, M["counter_base"], "counter")
box("counter_kick", CNT_X[0] + 0.05, WING_X[1] - 0.05, CNT_FRONT[1] - 0.06, CNT_FRONT[1] - 0.02, 0, 0.1, M["dark"], "counter")
# 오른쪽 날개 (직원 쪽으로 꺾임)
box("wing_top", WING_X[0], WING_X[1], WING_Y[0], CNT_FRONT[0], ct - 0.04, ct, M["lime"], "counter")
box("wing_back", WING_X[1] - 0.04, WING_X[1], WING_Y[0], CNT_FRONT[0], 0, ct - 0.04, M["counter_base"], "counter")
box("wing_end", WING_X[0], WING_X[1], WING_Y[0], WING_Y[0] + 0.03, 0, ct - 0.04, M["counter_base"], "counter")
box("wing_bottom", WING_X[0], WING_X[1], WING_Y[0], CNT_FRONT[0], 0, 0.08, M["counter_base"], "counter")
box("wing_shelf", WING_X[0], WING_X[1], WING_Y[0], CNT_FRONT[0], 0.47, 0.5, M["counter_base"], "counter")
for j, (ya, yb) in enumerate([(-0.45, -0.05), (0.0, 0.38)]):
    box(f"bin_{j}", WING_X[0] + 0.05, WING_X[1] - 0.06, ya, yb, 0.08, 0.4, M["bin"], "props")
    box(f"bin_{j}_lid", WING_X[0] + 0.04, WING_X[1] - 0.05, ya - 0.01, yb + 0.01, 0.4, 0.43, M["bin"], "props")
# 왼쪽 끝 마감 (직원 출입 통로 쪽)
box("counter_end_L", CNT_X[0], CNT_X[0] + 0.03, CNT_FRONT[0], CNT_FRONT[1], 0, ct - 0.04, M["counter_base"], "counter")

# 계산대 위 물건
cam_xy = (0.0, 0.0)
def stand_monitor(name, x, y, w, h, z0, scr, tilt=0.0):
    box(name + "_foot", x - 0.12, x + 0.12, y - 0.08, y + 0.08, z0, z0 + 0.02, M["dark"], "props")
    box(name + "_neck", x - 0.03, x + 0.03, y - 0.01, y + 0.03, z0, z0 + 0.12, M["dark"], "props")
    mon = box(name, -w / 2, w / 2, -0.02, 0.02, 0, h, M["dark"], "props")
    scrn = box(name + "_screen", -w / 2 + 0.015, w / 2 - 0.015, -0.025, -0.02, 0.015, h - 0.015, scr, "props")
    for ob in (mon, scrn):
        ob.parent = None
        ob.location = (x, y, z0 + 0.1)
        ob.rotation_euler = (tilt, 0, math.atan2(cam_xy[0] - x, -(cam_xy[1] - y)))
    return mon


stand_monitor("pos", -1.15, 0.72, 0.36, 0.3, ct + 0.06, M["screen"], tilt=-0.2)
box("keyboard", -1.15, -0.8, 0.45, 0.6, ct, ct + 0.025, M["paper"], "props")
box("memo", -1.45, -1.18, 0.5, 0.75, ct, ct + 0.003, M["paper"], "props")
box("card_terminal", -0.94, -0.74, 0.62, 0.8, ct, ct + 0.07, M["dark"], "props")
box("candy_rack", -1.06, -0.79, 0.85, 0.98, ct, ct + 0.16, M["products"], "props")
cyl("pen_cup", -0.86, 0.9, ct, ct + 0.11, 0.035, M["dark"], "props")
cyl("bell_base", -0.12, 0.87, ct, ct + 0.015, 0.045, M["dark"], "props")
sphere("bell_dome", -0.12, 0.87, ct + 0.015, 0.038, M["chrome"], "props")
stand_monitor("cctv", 2.72, 0.15, 0.48, 0.32, ct, M["cctv"])
cyl("cctv_pen_cup", 2.6, 0.45, ct, ct + 0.11, 0.04, M["chrome"], "props")

# 직원 뒤 담배 진열장
box("cig_wall", CNT_X[0], WING_X[1], WALL_BACK, WALL_BACK + 0.35, 1.0, 2.4, M["cig"], "props")
box("back_counter", CNT_X[0], WING_X[0], WALL_BACK, WALL_BACK + 0.5, 0, 0.85, M["counter_base"], "props")

# ------------------------------------------------------------------ 왼쪽 창가
box("micro_cab", WALL_L + 0.05, WALL_L + 0.65, WALL_BACK + 0.02, WALL_BACK + 0.55, 0, 0.85, M["counter_base"], "props")
box("microwave", WALL_L + 0.1, WALL_L + 0.55, WALL_BACK + 0.05, WALL_BACK + 0.4, 0.85, 1.12, M["paper"], "props")
box("water_disp", WALL_L + 0.12, WALL_L + 0.4, WALL_BACK + 0.42, WALL_BACK + 0.55, 0.85, 1.3, M["paper"], "props")
box("bar_table", WALL_L + 0.02, WALL_L + 0.42, -0.35, 1.9, 1.0, 1.04, M["wood"], "props")
for yy in (-0.3, 1.85):
    box(f"bar_leg_{yy}", WALL_L + 0.2, WALL_L + 0.24, yy - 0.02, yy + 0.02, 0, 1.0, M["metal"], "props")
for k, yy in enumerate((0.1, 0.8, 1.5)):
    cyl(f"stool_{k}_pole", WALL_L + 0.7, yy, 0, 0.68, 0.025, M["metal"], "props")
    cyl(f"stool_{k}_seat", WALL_L + 0.7, yy, 0.68, 0.73, 0.17, M["wood"], "props")
    cyl(f"stool_{k}_ring", WALL_L + 0.7, yy, 0.25, 0.27, 0.14, M["metal"], "props")

# ------------------------------------------------------------------ 천장
for yy in (-0.1, 1.1, 2.3, 3.5, 4.7, 5.9, 7.1, 8.3, 9.5, 10.7):
    for xx in (-2.7, -1.2, 0.3, 1.8, 3.1):
        if yy > BACK_R and xx > BACK_R_X - 0.2:
            continue
        box(f"light_{xx}_{yy}", xx - 0.7, xx + 0.7, yy - 0.05, yy + 0.05, CEIL - 0.03, CEIL, M["light"], "lights")
for (xx, yy) in ((0.5, 6.0), (2.4, 4.0), (-2.0, 9.0)):
    sphere(f"dome_cam_{xx}", xx, yy, CEIL, 0.07, M["dark"], "props")
for (xx, yy) in ((-0.8, 4.5), (2.0, 2.5)):
    box(f"vent_{xx}", xx - 0.3, xx + 0.3, yy - 0.3, yy + 0.3, CEIL - 0.005, CEIL, M["door_gray"], "props")

# 조명 보조 (면광원)
for yy in (1.9, 5.3, 8.7):
    for xx in (-2.0, 0.6, 2.8):
        if yy > BACK_R and xx > BACK_R_X:
            continue
        ld = bpy.data.lights.new(f"area_{xx}_{yy}", "AREA")
        ld.shape = "RECTANGLE"; ld.size = 2.0; ld.size_y = 1.2; ld.energy = 140
        ld.color = (0.93, 0.97, 1.0)
        lo = bpy.data.objects.new(ld.name, ld)
        lo.location = (xx, yy, CEIL - 0.1)
        collection("lights").objects.link(lo)
ld = bpy.data.lights.new("area_corridor", "AREA"); ld.size = 0.8; ld.energy = 35
lo = bpy.data.objects.new("area_corridor", ld); lo.location = (5.0, 1.7, 2.3); collection("lights").objects.link(lo)

# 하늘(밤)
world = bpy.data.worlds.new("night"); scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.015, 0.03, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

# ------------------------------------------------------------------ 카메라
def make_cam(name):
    cd = bpy.data.cameras.new(name)
    co = bpy.data.objects.new(name, cd)
    scene.collection.objects.link(co)
    co.location = (0, 0, EYE)
    co.rotation_euler = (math.radians(90), 0, 0)   # +y 를 바라봄, 수평
    cd.clip_start = 0.05
    cd.clip_end = 200
    return co


# 1) 사진 맞춤: view-center-v2.webp 와 같은 화각
PHOTO_W, PHOTO_H = 1672, 941
F_PX = 580.0                 # 초점거리(px). 사진 역산값
PP = (948.0, 441.0)          # 소실점(=주점) 위치(px)
cam_photo = make_cam("Cam_Photo")
cam_photo.data.sensor_fit = "HORIZONTAL"
cam_photo.data.sensor_width = 36
cam_photo.data.lens = F_PX / PHOTO_W * 36
cam_photo.data.shift_x = -(PP[0] - PHOTO_W / 2) / PHOTO_W
cam_photo.data.shift_y = -(PHOTO_H / 2 - PP[1]) / PHOTO_W

# 2) 원통형 파노라마
PANO_DEG = int(os.environ.get("PANO_DEG", "240"))   # 가로 화각
V_TOP, V_BOT = (PP[1]) / F_PX, (PHOTO_H - PP[1]) / F_PX   # 사진과 같은 세로 범위(tan)
PANO_H = 952
PANO_W = int(round(PANO_H * math.radians(PANO_DEG) / (V_TOP + V_BOT)))
cam_pano = make_cam("Cam_Pano")
cam_pano.data.type = "PANO"
cam_pano.data.panorama_type = "CENTRAL_CYLINDRICAL"
cam_pano.data.central_cylindrical_range_u_min = -math.radians(PANO_DEG) / 2
cam_pano.data.central_cylindrical_range_u_max = math.radians(PANO_DEG) / 2
cam_pano.data.central_cylindrical_range_v_min = -V_BOT
cam_pano.data.central_cylindrical_range_v_max = V_TOP
cam_pano.data.central_cylindrical_radius = 1.0

# ------------------------------------------------------------------ 렌더 설정
scene.render.engine = "CYCLES"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception as e:
    print("GPU 사용 불가, CPU로 렌더:", e)
scene.cycles.samples = int(os.environ.get("SAMPLES", "48"))
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.view_settings.view_transform = "AgX"
scene.view_settings.exposure = -0.6
vl = scene.view_layers[0]
vl.use_pass_z = True
vl.use_pass_normal = True

# 깊이 / 노멀 파일 출력
scene.use_nodes = True
nt = scene.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
rl = nt.nodes.new("CompositorNodeRLayers")
comp = nt.nodes.new("CompositorNodeComposite")
nt.links.new(rl.outputs["Image"], comp.inputs["Image"])
div = nt.nodes.new("CompositorNodeMath"); div.operation = "DIVIDE"; div.inputs[1].default_value = 30.0
nt.links.new(rl.outputs["Depth"], div.inputs[0])
fo_d = nt.nodes.new("CompositorNodeOutputFile")
fo_d.format.file_format = "PNG"; fo_d.format.color_mode = "BW"; fo_d.format.color_depth = "16"
fo_d.file_slots[0].path = "depth_"
nt.links.new(div.outputs[0], fo_d.inputs[0])
mul = nt.nodes.new("CompositorNodeMixRGB"); mul.blend_type = "MULTIPLY"; mul.inputs[0].default_value = 1
mul.inputs[2].default_value = (0.5, 0.5, 0.5, 1)
add = nt.nodes.new("CompositorNodeMixRGB"); add.blend_type = "ADD"; add.inputs[0].default_value = 1
add.inputs[2].default_value = (0.5, 0.5, 0.5, 1)
nt.links.new(rl.outputs["Normal"], mul.inputs[1])
nt.links.new(mul.outputs[0], add.inputs[1])
fo_n = nt.nodes.new("CompositorNodeOutputFile")
fo_n.format.file_format = "PNG"; fo_n.format.color_mode = "RGB"; fo_n.format.color_depth = "16"
fo_n.file_slots[0].path = "normal_"
nt.links.new(add.outputs[0], fo_n.inputs[0])
for fo in (fo_d, fo_n):            # 데이터 패스는 색 보정 없이 그대로 저장
    fo.format.color_management = "OVERRIDE"
    fo.format.view_settings.view_transform = "Raw"
    fo.format.view_settings.look = "None"
    fo.format.view_settings.exposure = 0
    fo.format.view_settings.gamma = 1


def render(cam, w, h, tag):
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.resolution_percentage = 100
    scene.render.filepath = os.path.join(OUT, f"{tag}_color.png")
    fo_d.base_path = OUT
    fo_n.base_path = OUT
    fo_d.file_slots[0].path = f"{tag}_depth_raw_"
    fo_n.file_slots[0].path = f"{tag}_normal_"
    bpy.ops.render.render(write_still=True)
    for kind in ("depth_raw", "normal"):
        src = os.path.join(OUT, f"{tag}_{kind}_0001.png")
        if os.path.exists(src):
            os.replace(src, os.path.join(OUT, f"{tag}_{kind}.png"))


scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "night_store.blend"))
if MODE in ("photo", "all"):
    render(cam_photo, PHOTO_W, PHOTO_H, "photo")
if MODE in ("pano", "all"):
    render(cam_pano, PANO_W, PANO_H, "pano")
print("DONE", PANO_W, PANO_H)
