// SUIT Font Swap
// 로고·포스터 제목용 폰트(KEEP_KEYS)를 제외한 모든 텍스트 폰트를 SUIT Variable로 바꾼다.
// 굵기는 원래 폰트의 weight에 가장 가까운 SUIT 스타일로 맞춘다.

// 폰트 이름은 대소문자·공백·하이픈·밑줄을 무시하고 비교한다 ("SUIT Variable" = "SUITVariable").
const TARGET_KEYS = ["suitvariable"]; // 이 이름의 패밀리로 바꾼다 (정확히 일치)
// 이 이름이 포함된 패밀리는 그대로 둔다
const KEEP_KEYS = [
  "gumiromance", "구미로맨스", // 로고
  // 포스터 카드의 테마 제목 폰트 (테스트마다 다름)
  "efwatermelonsalad", "songmyung", "orbit", "bagelfatone", "gowundodum", "gowunbatang",
  "blackhansans", "blackandwhitepicture", "jua",
];

// <core> — 아래 블록은 Figma 밖에서도 그대로 테스트할 수 있게 전역 상태 없이 작성한다.
const norm = (s) => String(s).toLowerCase().replace(/[\s_\-]/g, "");

const WEIGHT_WORDS = [
  ["hairline", 100], ["thin", 100],
  ["extralight", 200], ["ultralight", 200],
  ["light", 300],
  ["demilight", 350], ["semilight", 350],
  ["regular", 400], ["normal", 400], ["book", 400], ["roman", 400],
  ["medium", 500],
  ["semibold", 600], ["demibold", 600],
  ["bold", 700],
  ["extrabold", 800], ["ultrabold", 800],
  ["heavy", 900], ["black", 900],
  ["extrablack", 950], ["ultrablack", 950],
];
const WEIGHT_BY_LENGTH = [...WEIGHT_WORDS].sort((a, b) => b[0].length - a[0].length);

const isItalic = (style) => /italic|oblique/i.test(style);

/** 스타일 이름("Semi Bold Italic", "ExtraBold" …)에서 weight 숫자를 추정한다. */
function styleWeight(style) {
  const s = norm(style).replace(/italic|oblique/g, "");
  if (!s) return 400;
  const exact = WEIGHT_WORDS.find(([k]) => k === s);
  if (exact) return exact[1];
  const hit = WEIGHT_BY_LENGTH.find(([k]) => s.includes(k));
  if (hit) return hit[1];
  const num = s.match(/\d{3}/);
  return num ? Number(num[0]) : 400;
}

/** 사용 가능한 스타일 중 weight가 가장 가까운 것을 고른다. 동률이면 더 굵은 쪽. */
function makeStylePicker(styles) {
  const list = styles.map((s) => ({ s, w: styleWeight(s) }));
  return (weight) => {
    let best = list[0];
    for (const c of list) {
      const d = Math.abs(c.w - weight), bd = Math.abs(best.w - weight);
      if (d < bd || (d === bd && c.w > best.w)) best = c;
    }
    return best.s;
  };
}

async function resolveFamilies(targetKeys, keepKeys) {
  const families = new Map();
  for (const f of await figma.listAvailableFontsAsync()) {
    const { family, style } = f.fontName;
    if (!families.has(family)) families.set(family, []);
    families.get(family).push(style);
  }
  const names = [...families.keys()];
  const target = names.find((f) => targetKeys.includes(norm(f))) || null;
  return {
    target,
    targetStyles: target ? families.get(target).filter((s) => !isItalic(s)) : [],
    similar: names.filter((f) => targetKeys.some((k) => norm(f).includes(k.slice(0, 4)))),
    keepInstalled: names.filter((f) => keepKeys.some((k) => norm(f).includes(k))),
  };
}

async function collectTextNodes(scope) {
  const out = new Set();
  const add = (n) => {
    if (n.type === "TEXT") out.add(n);
    if ("findAllWithCriteria" in n) for (const t of n.findAllWithCriteria({ types: ["TEXT"] })) out.add(t);
  };
  if (scope === "selection") figma.currentPage.selection.forEach(add);
  else if (scope === "page") add(figma.currentPage);
  else for (const page of figma.root.children) { await page.loadAsync(); add(page); }
  return [...out];
}

/** 메인 컴포넌트 안의 텍스트인지 (인스턴스 안이면 false) */
function inMainComponent(node) {
  for (let p = node.parent; p && p.type !== "PAGE"; p = p.parent) {
    if (p.type === "INSTANCE") return false;
    if (p.type === "COMPONENT" || p.type === "COMPONENT_SET") return true;
  }
  return false;
}

/**
 * opts: { scope: "selection"|"page"|"document", updateStyles, includeStyled, dryRun }
 * keys: { target: string[], keep: string[] }
 * hooks: { progress?(done, total), tick?() }
 */
async function swapFonts(opts, keys, hooks = {}) {
  const tick = hooks.tick || (() => new Promise((r) => setTimeout(r, 0)));
  const fams = await resolveFamilies(keys.target, keys.keep);
  const report = {
    target: fams.target, similar: fams.similar, keepInstalled: fams.keepInstalled,
    families: {}, textNodes: 0, nodesChanged: 0, rangesChanged: 0, stylesChanged: 0,
    skippedStyled: 0, skippedVariable: 0, italicDropped: 0, errors: [],
  };
  if (!fams.target || fams.targetStyles.length === 0) return report;

  const pick = makeStylePicker(fams.targetStyles);
  const isKeep = (family) => keys.keep.some((k) => norm(family).includes(k));
  const isTarget = (family) => family === fams.target;
  const tally = (family, status) => {
    const f = (report.families[family] ||= { ranges: 0, status });
    f.ranges++;
  };
  const statusOf = (family) => (isKeep(family) ? "keep" : isTarget(family) ? "done" : "swap");

  if (!opts.dryRun) {
    for (const style of fams.targetStyles) await figma.loadFontAsync({ family: fams.target, style });
  }

  // 1) 로컬 텍스트 스타일: 스타일을 바꾸면 연결된 텍스트가 링크를 유지한 채 따라온다.
  const localStyleIds = new Set();
  if (opts.updateStyles) {
    for (const st of await figma.getLocalTextStylesAsync()) {
      localStyleIds.add(st.id);
      const { family, style } = st.fontName;
      if (isKeep(family) || isTarget(family)) continue;
      if (st.boundVariables && st.boundVariables.fontFamily) { report.skippedVariable++; continue; }
      try {
        if (!opts.dryRun) st.fontName = { family: fams.target, style: pick(styleWeight(style)) };
        report.stylesChanged++;
      } catch (e) {
        report.errors.push(`스타일 "${st.name}": ${e.message}`);
      }
    }
  }

  // 2) 텍스트 노드: 메인 컴포넌트를 먼저 바꿔야 인스턴스가 오버라이드 없이 따라온다.
  const nodes = await collectTextNodes(opts.scope);
  nodes.sort((a, b) => Number(inMainComponent(b)) - Number(inMainComponent(a)));
  report.textNodes = nodes.length;

  for (let i = 0; i < nodes.length; i++) {
    if (i % 150 === 0) { if (hooks.progress) hooks.progress(i, nodes.length); await tick(); }
    const node = nodes[i];
    let segments;
    try {
      segments = node.getStyledTextSegments(["fontName", "fontWeight", "textStyleId"]);
    } catch (e) {
      report.errors.push(`"${node.name}": ${e.message}`);
      continue;
    }
    const fontVar = node.boundVariables && node.boundVariables.fontFamily;
    let changed = false;
    for (const seg of segments) {
      const { family, style } = seg.fontName;
      tally(family, statusOf(family));
      if (isKeep(family) || isTarget(family)) continue;
      if (seg.textStyleId) {
        if (localStyleIds.has(seg.textStyleId)) continue; // 위에서 스타일째 바뀜
        if (!opts.includeStyled) { report.skippedStyled++; continue; }
      }
      if (fontVar) { report.skippedVariable++; continue; }
      const weight = typeof seg.fontWeight === "number" ? seg.fontWeight : styleWeight(style);
      if (isItalic(style)) report.italicDropped++;
      try {
        if (!opts.dryRun) node.setRangeFontName(seg.start, seg.end, { family: fams.target, style: pick(weight) });
        report.rangesChanged++;
        changed = true;
      } catch (e) {
        report.errors.push(`"${node.name}": ${e.message}`);
      }
    }
    if (changed) report.nodesChanged++;
  }
  if (hooks.progress) hooks.progress(nodes.length, nodes.length);
  return report;
}
// </core>

// ---------- 플러그인 UI 연결 ----------
figma.showUI(__html__, { width: 380, height: 560, themeColors: true });

const KEYS = { target: TARGET_KEYS, keep: KEEP_KEYS };
let busy = false;
let lastScope = figma.currentPage.selection.length ? "selection" : "page";

async function handle(msg) {
  if (busy) return;
  busy = true;
  const post = (m) => figma.ui.postMessage(m);
  try {
    lastScope = msg.scope;
    const opts = { scope: msg.scope, updateStyles: msg.updateStyles, includeStyled: msg.includeStyled, dryRun: msg.type === "scan" };
    if (!opts.dryRun) figma.commitUndo();
    const report = await swapFonts(opts, KEYS, { progress: (done, total) => post({ type: "progress", done, total }) });
    if (!opts.dryRun) {
      figma.commitUndo();
      figma.notify(`SUIT Variable로 ${report.rangesChanged}곳 변경 (텍스트 ${report.nodesChanged}개, 스타일 ${report.stylesChanged}개)`);
    }
    post({ type: opts.dryRun ? "scan-result" : "swap-result", report, scope: msg.scope });
  } catch (e) {
    post({ type: "error", message: e.message || String(e) });
  } finally {
    busy = false;
  }
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "scan" || msg.type === "swap") handle(msg);
  if (msg.type === "close") figma.closePlugin();
};

figma.on("selectionchange", () => {
  figma.ui.postMessage({ type: "selection", count: figma.currentPage.selection.length });
});

figma.ui.postMessage({ type: "init", scope: lastScope, selection: figma.currentPage.selection.length });
