const cssVars = getComputedStyle(document.documentElement);
const cssColor = name => cssVars.getPropertyValue(name).trim();

const categoryStyles = {
  polarization: { label: 'Polarization', color: cssColor('--category-polarization') },
  motion: { label: 'Motion / Shift', color: cssColor('--category-motion') },
  stereo: { label: 'Stereo', color: cssColor('--category-stereo') },
  general: { label: 'General Multi-image', color: cssColor('--category-general') },
  flash: { label: 'Flash / No-flash', color: cssColor('--category-flash') },
  opposite: { label: 'Opposite-view', color: cssColor('--category-opposite') }
};

const shapeLabels = {
  circle: 'Optimization-based / Survey',
  triangle: 'Single-stream Network Structure',
  diamond: 'Cascaded / Iterative Network Structure'
};

const singleCategoryStyles = {
  gradient: { label: 'Gradient / Edge / Corner', color: cssColor('--single-category-gradient') },
  manual: { label: 'Manual / Language Guided', color: cssColor('--single-category-manual') },
  smooth: { label: 'Blur / Smoothness / DoF', color: cssColor('--single-category-smooth') },
  deep: { label: 'Perceptual / Pretrained / Adversarial', color: cssColor('--single-category-deep') },
  ghosting: { label: 'Ghosting Clues', color: cssColor('--single-category-ghosting') },
  data: { label: 'Dataset Contribution', color: cssColor('--single-category-data') },
  pano: { label: 'Panoramic Images', color: cssColor('--single-category-pano') }
};

const singleShapeLabels = {
  circle: 'Optimization-based Methods / Survey',
  triangle: 'Single-Stream Network Structure',
  diamond: 'Cascaded / Iterative Network Structure',
  rect: 'Dual-Stream Network Structure',
  pentagon: 'Dual-Stream Network Structure with Feature Interactions'
};

function paperCategoryStyle(paper) {
  return paper.roadmap === 'single'
    ? singleCategoryStyles[paper.category]
    : categoryStyles[paper.category];
}

function paperShapeLabel(paper) {
  return paper.roadmap === 'single'
    ? singleShapeLabels[paper.shape]
    : shapeLabels[paper.shape];
}

/* Paper node positions:
   - x controls left/right position on the timeline.
   - row chooses one of the three horizontal axes: 0 top, 1 middle, 2 bottom.
   - side controls whether the label is above or below the axis. */
let papers = [];

/* Vertical axis positions for the three timeline rows. Larger y moves a row downward. */
const rows = [105, 350, 570];

/* Distance from node to paper label. More negative "up" moves upper labels higher; larger "down" moves lower labels lower. */
const labelGap = { up: -78, down: 58 };

/* Vertical connector length from node toward label direction. */
const stemEnd = { up: -28, down: 28 };

/* Year tick positions. Change x here if the year label/tick needs to align with adjusted paper nodes. */
const yearTicks = [
  { year: 1989, x: 50, row: 0 }, { year: 1990, x: 125, row: 0 }, { year: 1991, x: 210, row: 0 }, { year: 1992, x: 260, row: 0 }, { year: 1993, x: 340, row: 0 }, { year: 1997, x: 390, row: 0 }, { year: 1998, x: 470, row: 0 }, { year: 1999, x: 550, row: 0 }, { year: 2000, x: 800, row: 0 }, { year: 2001, x: 900, row: 0 }, { year: 2003, x: 950, row: 0 }, { year: 2004, x: 1040, row: 0 }, { year: 2005, x: 1150, row: 0 },
  { year: 2008, x: 75, row: 1 }, { year: 2009, x: 155, row: 1 }, { year: 2011, x: 245, row: 1 }, { year: 2012, x: 325, row: 1 }, { year: 2013, x: 445, row: 1 }, { year: 2014, x: 585, row: 1 }, { year: 2015, x: 805, row: 1 }, { year: 2016, x: 1015, row: 1 }, { year: 2017, x: 1205, row: 1 },
  { year: 2018, x: 85, row: 2 }, { year: 2019, x: 175, row: 2 }, { year: 2020, x: 450, row: 2 }, { year: 2021, x: 710, row: 2 }, { year: 2022, x: 790, row: 2 }, { year: 2023, x: 880, row: 2 }, { year: 2024, x: 970, row: 2 }, { year: 2025, x: 1060, row: 2 }
];

/* Single-image survey roadmap positions copied from main.tex timeline2. x is the original TikZ coordinate. */
const singleRows = [118, 382, 646];
let singlePapers = [];

const singleYearTicks = [
  { year: 2002, x: -2, row: 0 }, { year: 2004, x: -0.5, row: 0 }, { year: 2005, x: 1.75, row: 0 }, { year: 2014, x: 2.75, row: 0 }, { year: 2015, x: 3.75, row: 0 }, { year: 2016, x: 5, row: 0 }, { year: 2017, x: 6.75, row: 0 }, { year: 2018, x: 9.5, row: 0 },
  { year: 2019, x: -2, row: 1 }, { year: 2020, x: -1, row: 1 }, { year: 2021, x: 2.75, row: 1 }, { year: 2022, x: 12.5, row: 1 },
  { year: 2023, x: -2, row: 2 }, { year: 2024, x: -0.5, row: 2 }, { year: 2025, x: 4.75, row: 2 }, { year: 2026, x: 9.5, row: 2 }
];

const axes = document.getElementById('axes');
const paperLayer = document.getElementById('papers');
const singleAxes = document.getElementById('singleAxes');
const singlePaperLayer = document.getElementById('singlePapers');
const tooltip = document.getElementById('tooltip');
const detailsDrawer = document.getElementById('detailsDrawer');
const drawerContent = document.getElementById('drawerContent');
let pinned = false;
let hideTooltipTimer = null;
let activeTooltipPaper = null;
const tooltipHideDelayMs = 900;
const roadmapMode = new URLSearchParams(window.location.search).get('roadmap');

const svgNS = 'http://www.w3.org/2000/svg';

/* Global horizontal stretch for axes, year ticks, and paper nodes. Larger value spreads everything horizontally. */
const chartScaleX = 1.13;
const timelineX = x => Math.round(x * chartScaleX);

/* Right endpoint of the three horizontal arrows. Should be smaller than viewBox width. */
const axisArrowEndX = 1480;

function el(name, attrs = {}) {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function applyRoadmapMode() {
  if (!['single', 'multiple'].includes(roadmapMode)) return;
  document.body.dataset.roadmapMode = roadmapMode;
  document.querySelectorAll('[data-roadmap-section]').forEach(section => {
    section.hidden = section.dataset.roadmapSection !== roadmapMode;
  });
}

function drawAxes() {
  rows.forEach((y, idx) => {
    if (idx === 0) {
      axes.appendChild(el('line', { x1: timelineX(35), y1: y, x2: timelineX(1210), y2: y, class: 'axis' }));
      axes.appendChild(el('line', { x1: timelineX(1210), y1: y, x2: axisArrowEndX, y2: y, class: 'axis dashed', 'marker-end': 'url(#arrow)' }));
    } else if (idx === 1) {
      axes.appendChild(el('line', { x1: timelineX(35), y1: y, x2: timelineX(75), y2: y, class: 'axis dashed' }));
      axes.appendChild(el('line', { x1: timelineX(75), y1: y, x2: timelineX(1210), y2: y, class: 'axis' }));
      axes.appendChild(el('line', { x1: timelineX(1210), y1: y, x2: axisArrowEndX, y2: y, class: 'axis dashed', 'marker-end': 'url(#arrow)' }));
    } else {
      axes.appendChild(el('line', { x1: timelineX(35), y1: y, x2: timelineX(75), y2: y, class: 'axis dashed' }));
      axes.appendChild(el('line', { x1: timelineX(75), y1: y, x2: axisArrowEndX, y2: y, class: 'axis', 'marker-end': 'url(#arrow)' }));
    }
  });

  yearTicks.forEach(t => {
    const y = rows[t.row];
    const x = timelineX(t.x);
    axes.appendChild(el('line', { x1: x, y1: y - 10, x2: x, y2: y + 10, class: 'tick' }));
    const text = el('text', { x, y: y + 28, class: 'year', 'text-anchor': 'middle' });
    text.textContent = t.year;
    axes.appendChild(text);
  });
}

function drawNode(group, paper, color, x, y) {
  const nodeAttrs = { class: `node-${paper.shape}`, stroke: color };
  if (paper.shape === 'circle') {
    group.appendChild(el('circle', { ...nodeAttrs, cx: x, cy: y, r: 7 }));
  } else if (paper.shape === 'diamond') {
    group.appendChild(el('rect', { ...nodeAttrs, x: x - 7, y: y - 7, width: 14, height: 14, transform: `rotate(45 ${x} ${y})` }));
  } else if (paper.shape === 'triangle') {
    group.appendChild(el('path', { ...nodeAttrs, d: `M ${x} ${y - 10} L ${x + 10} ${y + 8} L ${x - 10} ${y + 8} Z` }));
  } else if (paper.shape === 'rect') {
    group.appendChild(el('rect', { ...nodeAttrs, x: x - 8, y: y - 8, width: 16, height: 16 }));
  } else if (paper.shape === 'pentagon') {
    group.appendChild(el('path', { ...nodeAttrs, d: `M ${x} ${y - 11} L ${x + 10} ${y - 4} L ${x + 6} ${y + 9} L ${x - 6} ${y + 9} L ${x - 10} ${y - 4} Z` }));
  }
}

function appendAuthorLine(textNode, authorLine, x) {
  const etAl = 'et al.';
  const etAlIndex = authorLine.indexOf(etAl);
  const authorText = etAlIndex === -1 ? authorLine : authorLine.slice(0, etAlIndex).trimEnd();

  const authorTspan = el('tspan', { x, dy: 0, class: 'author' });
  authorTspan.textContent = authorText;
  textNode.appendChild(authorTspan);

  if (etAlIndex !== -1) {
    const etAlTspan = el('tspan', { class: 'etal' });
    etAlTspan.textContent = ` ${etAl}`;
    textNode.appendChild(etAlTspan);
  }
}

function wrapSvgText(textNode, lines, x, y, lineHeight = 15) {
  appendAuthorLine(textNode, lines[0], x);

  lines.slice(1).forEach(line => {
    const tspan = el('tspan', { x, dy: lineHeight, class: 'title-line' });
    tspan.textContent = line;
    textNode.appendChild(tspan);
  });
}

function compactTitle(title, maxChars = 42) {
  if (title.length <= maxChars) return title;
  const clipped = title.slice(0, maxChars - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 24 ? lastSpace : clipped.length)}...`;
}

function splitLabelLine(text, maxChars = 22) {
  if (text.length <= maxChars) return [text];
  const lines = [];
  let remaining = text;
  while (remaining.length > maxChars && lines.length < 2) {
    const slice = remaining.slice(0, maxChars + 1);
    const breakAt = slice.lastIndexOf(' ');
    const cut = breakAt > 8 ? breakAt : maxChars;
    lines.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (lines.length < 2 && remaining) lines.push(remaining);
  return lines;
}

function labelLines(paper) {
  return [
    paper.authors,
    ...splitLabelLine(compactTitle(paper.title))
  ];
}

function drawPapers() {
  papers.forEach((paper, index) => {
    const y = rows[paper.row];
    const x = timelineX(paper.x);
    const style = categoryStyles[paper.category];
    const group = el('g', { class: 'paper-group', tabindex: '0', 'data-category': paper.category, 'data-roadmap': 'multiple' });
    group.dataset.index = String(index);

    group.appendChild(el('line', {
      x1: x,
      y1: y,
      x2: x,
      y2: y + stemEnd[paper.side],
      class: 'stem',
      stroke: style.color
    }));

    drawNode(group, paper, style.color, x, y);

    const label = el('text', {
      x,
      y: y + labelGap[paper.side],
      class: 'paper-label'
    });
    wrapSvgText(label, labelLines(paper), x, y + labelGap[paper.side]);
    group.appendChild(label);

    group.addEventListener('mouseenter', evt => {
      clearTooltipHideTimer();
      showTooltip(evt, paper);
    });
    group.addEventListener('mousemove', evt => !pinned && moveTooltip(evt));
    group.addEventListener('mouseleave', () => { if (!pinned) scheduleHideTooltip(); });
    group.addEventListener('click', evt => {
      evt.stopPropagation();
      pinned = false;
      hideTooltip();
      openDetailsDrawer(paper);
    });
    group.addEventListener('focus', evt => {
      clearTooltipHideTimer();
      showTooltip(evt, paper);
    });
    group.addEventListener('blur', () => { if (!pinned) scheduleHideTooltip(); });

    paperLayer.appendChild(group);
  });
}

function singleTimelineX(x) {
  return Math.round((x + 2.5) * 90 + 80);
}

function drawSingleAxes() {
  if (!singleAxes) return;
  const singleAxisEndX = singleTimelineX(14.45);
  const singleSolidEndX = singleTimelineX(13.5);

  singleRows.forEach((y, idx) => {
    if (idx === 0) {
      singleAxes.appendChild(el('line', { x1: singleTimelineX(-2.5), y1: y, x2: singleSolidEndX, y2: y, class: 'axis' }));
      singleAxes.appendChild(el('line', { x1: singleSolidEndX, y1: y, x2: singleAxisEndX, y2: y, class: 'axis dashed', 'marker-end': 'url(#singleArrow)' }));
    } else if (idx === 1) {
      singleAxes.appendChild(el('line', { x1: singleTimelineX(-2.5), y1: y, x2: singleTimelineX(-2), y2: y, class: 'axis dashed' }));
      singleAxes.appendChild(el('line', { x1: singleTimelineX(-2), y1: y, x2: singleSolidEndX, y2: y, class: 'axis' }));
      singleAxes.appendChild(el('line', { x1: singleSolidEndX, y1: y, x2: singleAxisEndX, y2: y, class: 'axis dashed', 'marker-end': 'url(#singleArrow)' }));
    } else {
      singleAxes.appendChild(el('line', { x1: singleTimelineX(-2.5), y1: y, x2: singleTimelineX(-2), y2: y, class: 'axis dashed' }));
      singleAxes.appendChild(el('line', { x1: singleTimelineX(-2), y1: y, x2: singleAxisEndX, y2: y, class: 'axis', 'marker-end': 'url(#singleArrow)' }));
    }
  });

  singleYearTicks.forEach(t => {
    const y = singleRows[t.row];
    const x = singleTimelineX(t.x);
    singleAxes.appendChild(el('line', { x1: x, y1: y - 10, x2: x, y2: y + 10, class: 'tick' }));
    const text = el('text', { x, y: y + 28, class: 'year', 'text-anchor': 'middle' });
    text.textContent = t.year;
    singleAxes.appendChild(text);
  });

  const ellipsis = el('text', { x: singleTimelineX(2.25), y: singleRows[0] + 25, class: 'year', 'text-anchor': 'middle' });
  ellipsis.textContent = '...';
  singleAxes.appendChild(ellipsis);
}

function splitSingleLabelLine(text, maxChars = 25, maxLines = 3) {
  if (text.length <= maxChars) return [text];
  const lines = [];
  let remaining = text;

  while (remaining.length > maxChars && lines.length < maxLines - 1) {
    const slice = remaining.slice(0, maxChars + 1);
    const breakAt = slice.lastIndexOf(' ');
    const cut = breakAt > 9 ? breakAt : maxChars;
    lines.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) lines.push(remaining.length > maxChars + 4 ? `${remaining.slice(0, maxChars).trim()}...` : remaining);
  return lines;
}

function singleLabelLines(paper) {
  return [
    paper.authors,
    ...splitSingleLabelLine(paper.title)
  ];
}

function drawSinglePapers() {
  if (!singlePaperLayer) return;
  const singleLabelGap = { up: -92, down: 48 };
  const singleStemEnd = { up: -30, down: 30 };

  singlePapers.forEach(paper => {
    const interactivePaper = {
      roadmap: 'single',
      venue: '',
      contribution: 'To be added.',
      ...paper
    };
    const y = singleRows[paper.row];
    const x = singleTimelineX(paper.x);
    const style = paperCategoryStyle(interactivePaper);
    const group = el('g', {
      class: 'paper-group single-paper-group',
      tabindex: '0',
      'data-category': paper.category,
      'data-roadmap': 'single'
    });
    const title = el('title');
    title.textContent = `${paper.authors}: ${paper.title} (${paper.year}) - ${paperShapeLabel(interactivePaper)}`;
    group.appendChild(title);

    group.appendChild(el('line', {
      x1: x,
      y1: y,
      x2: x,
      y2: y + singleStemEnd[paper.side],
      class: 'stem',
      stroke: style.color
    }));

    drawNode(group, interactivePaper, style.color, x, y);

    const label = el('text', {
      x,
      y: y + singleLabelGap[paper.side],
      class: 'single-paper-label'
    });
    wrapSvgText(label, singleLabelLines(paper), x, y + singleLabelGap[paper.side], 15);
    group.appendChild(label);

    group.addEventListener('mouseenter', evt => {
      clearTooltipHideTimer();
      showTooltip(evt, interactivePaper);
    });
    group.addEventListener('mousemove', evt => !pinned && moveTooltip(evt));
    group.addEventListener('mouseleave', () => { if (!pinned) scheduleHideTooltip(); });
    group.addEventListener('click', evt => {
      evt.stopPropagation();
      pinned = false;
      hideTooltip();
      openDetailsDrawer(interactivePaper);
    });
    group.addEventListener('focus', evt => {
      clearTooltipHideTimer();
      showTooltip(evt, interactivePaper);
    });
    group.addEventListener('blur', () => { if (!pinned) scheduleHideTooltip(); });

    singlePaperLayer.appendChild(group);
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function paperVenueLabel(paper) {
  const venue = String(paper.venue ?? '');
  const year = String(paper.year ?? '');
  if (!venue) return '';
  if (!year) return venue;
  return venue.includes(year) ? venue : `${venue} · ${year}`;
}

function paperDisplayTitle(paper) {
  return paper.fullTitle || paper.title;
}

function paperDisplayAuthors(paper) {
  return paper.fullAuthors || paper.authors;
}

function tooltipCopyText(paper) {
  const abstract = paper.abstract || 'Abstract to be added.';
  return [
    paperDisplayTitle(paper),
    paperDisplayAuthors(paper),
    paperVenueLabel(paper),
    `Method: ${paperShapeLabel(paper)}`,
    `Abstract: ${abstract}`,
    `Links: ${paperLinksText(paper)}`,
    `Contribution: ${paper.contribution || 'To be added.'}`
  ].filter(Boolean).join('\n');
}

async function copyTooltipInfo() {
  if (!activeTooltipPaper) return;
  const text = tooltipCopyText(activeTooltipPaper);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  const button = tooltip.querySelector('.copy-button');
  if (button) {
    button.textContent = 'Copied';
    window.setTimeout(() => { button.textContent = 'Copy'; }, 1200);
  }
}

function paperLink(url, label) {
  if (!url) return '<span>To be added.</span>';
  const safeUrl = escapeHtml(url);
  return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(label || url)}</a>`;
}

function doiLink(paper) {
  if (paper.doiUrl) return paperLink(paper.doiUrl, paper.doi || 'DOI');
  if (paper.doi) return paperLink(`https://doi.org/${paper.doi}`, paper.doi);
  return '<span>To be added.</span>';
}

function paperLinks(paper) {
  const links = [];
  if (paper.doiUrl || paper.doi) {
    links.push({
      label: paper.doi || 'DOI',
      url: paper.doiUrl || `https://doi.org/${paper.doi}`
    });
  }
  if (paper.arxivUrl || paper.arxiv) {
    links.push({
      label: 'arXiv',
      url: paper.arxivUrl || paper.arxiv
    });
  }
  if (!links.length && paper.publisherUrl) {
    links.push({
      label: 'Publisher',
      url: paper.publisherUrl
    });
  }
  return links;
}

function paperLinksHtml(paper) {
  const links = paperLinks(paper);
  if (!links.length) return '<span>To be added.</span>';
  return `<span>${links.map(link => paperLink(link.url, link.label)).join(' / ')}</span>`;
}

function paperLinksText(paper) {
  const links = paperLinks(paper);
  if (!links.length) return 'To be added.';
  return links.map(link => `${link.label}: ${link.url}`).join(' / ');
}

function drawerRow(label, value) {
  if (!value) return '';
  return `<b>${escapeHtml(label)}</b><span>${escapeHtml(value)}</span>`;
}

function paperTextField(value) {
  return escapeHtml(value || 'To be added.');
}

function openDetailsDrawer(paper) {
  const style = paperCategoryStyle(paper);
  const abstract = paper.abstract || 'To be added.';

  drawerContent.innerHTML = `
    <div class="drawer-top">
      <div class="drawer-title-block">
            <span class="tag" style="background:${escapeHtml(style.color)}">${escapeHtml(style.label)}</span>
            <h2 class="drawer-title">${escapeHtml(paperDisplayTitle(paper))}</h2>
            <p class="drawer-authors">${escapeHtml(paperDisplayAuthors(paper))}</p>
          </div>
      <button class="drawer-close" type="button" aria-label="Close details drawer" data-close-drawer>&times;</button>
    </div>

      <section class="drawer-section">
        <h3>Overview</h3>
        <div class="drawer-grid">
          ${drawerRow('Venue', paperVenueLabel(paper))}
          <b>Year</b><span>${escapeHtml(paper.year)}</span>
          <b>Category</b><span>${escapeHtml(style.label)}</span>
          <b>Method</b><span>${escapeHtml(paperShapeLabel(paper))}</span>
      </div>
    </section>

    <section class="drawer-section">
      <h3>Abstract</h3>
      <p>${escapeHtml(abstract)}</p>
    </section>

    <section class="drawer-section">
      <h3>Links</h3>
      <div class="drawer-grid">
        <b>Links</b>${paperLinksHtml(paper)}
      </div>
    </section>

    <section class="drawer-section">
      <h3>Contribution</h3>
      <p>${paperTextField(paper.contribution)}</p>
    </section>
  `;

  detailsDrawer.classList.add('visible');
  detailsDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
}

function closeDetailsDrawer() {
  detailsDrawer.classList.remove('visible');
  detailsDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
}

function showTooltip(evt, paper) {
  const style = paperCategoryStyle(paper);
  const abstract = paper.abstract || 'Abstract to be added.';

  activeTooltipPaper = paper;
  tooltip.innerHTML = `
    <div class="tooltip-head">
        <div class="tooltip-top">
          <span class="tag" style="background:${escapeHtml(style.color)}">${escapeHtml(style.label)}</span>
        ${paperVenueLabel(paper) ? `<span class="venue">${escapeHtml(paperVenueLabel(paper))}</span>` : ''}
      </div>
      <button class="copy-button" type="button" data-copy-tooltip>Copy</button>
    </div>
    <h2>${escapeHtml(paperDisplayTitle(paper))}</h2>
    <p class="authors">${escapeHtml(paper.authors)}</p>
    <div class="meta-grid">
      <b>Method</b><span>${escapeHtml(paperShapeLabel(paper))}</span>
      <b>Abstract</b><span class="tooltip-abstract">${escapeHtml(abstract)}</span>
      <b>Links</b>${paperLinksHtml(paper)}
      <b>Contribution</b><span>${paperTextField(paper.contribution)}</span>
    </div>
  `;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
  moveTooltip(evt);
}

function moveTooltip(evt) {
  const pad = 18;
  const rect = tooltip.getBoundingClientRect();
  let left = evt.clientX + 18;
  let top = evt.clientY + 18;

  if (left + rect.width + pad > window.innerWidth) left = evt.clientX - rect.width - 18;
  if (top + rect.height + pad > window.innerHeight) top = evt.clientY - rect.height - 18;

  tooltip.style.left = `${Math.max(pad, left)}px`;
  tooltip.style.top = `${Math.max(pad, top)}px`;
}

function hideTooltip() {
  clearTooltipHideTimer();
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

function scheduleHideTooltip() {
  clearTooltipHideTimer();
  hideTooltipTimer = window.setTimeout(hideTooltip, tooltipHideDelayMs);
}

function clearTooltipHideTimer() {
  if (hideTooltipTimer) {
    window.clearTimeout(hideTooltipTimer);
    hideTooltipTimer = null;
  }
}

function setFilter(roadmap, filter) {
  const toolbar = document.querySelector(`[data-roadmap-filter="${roadmap}"]`);
  if (toolbar) {
    toolbar.querySelectorAll('.chip').forEach(chip => chip.classList.toggle('active', chip.dataset.filter === filter));
  }
  document.querySelectorAll(`.paper-group[data-roadmap="${roadmap}"]`).forEach(group => {
    const match = filter === 'all' || group.dataset.category === filter;
    group.classList.toggle('dimmed', !match);
  });
}

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const toolbar = chip.closest('[data-roadmap-filter]');
    setFilter(toolbar?.dataset.roadmapFilter || 'multiple', chip.dataset.filter);
  });
});

tooltip.addEventListener('mouseenter', clearTooltipHideTimer);
tooltip.addEventListener('mouseleave', () => { if (!pinned) scheduleHideTooltip(); });
tooltip.addEventListener('click', evt => {
  if (evt.target.closest('[data-copy-tooltip]')) copyTooltipInfo();
});

detailsDrawer.addEventListener('click', evt => {
  if (evt.target.closest('[data-close-drawer]')) closeDetailsDrawer();
});

document.addEventListener('keydown', evt => {
  if (evt.key === 'Escape') {
    pinned = false;
    hideTooltip();
    closeDetailsDrawer();
  }
});

document.addEventListener('click', evt => {
  const clickedNode = evt.target.closest('.paper-group');
  const clickedTooltip = evt.target.closest('#tooltip');
  if (!clickedNode && !clickedTooltip) {
    pinned = false;
    hideTooltip();
  }
});

async function loadRoadmapData() {
  let data = window.ROADMAP_DATA;
  if (!data) {
    const response = await fetch(new URL('data/roadmaps.json', window.location.href));
    if (!response.ok) throw new Error('Failed to load roadmap data: ' + response.status);
    data = await response.json();
  }
  papers = data.papers || [];
  singlePapers = data.singlePapers || [];
}

async function initRoadmaps() {
  applyRoadmapMode();
  drawAxes();
  drawSingleAxes();
  await loadRoadmapData();
  drawPapers();
  drawSinglePapers();
}

initRoadmaps().catch(error => {
  console.error(error);
  document.body.insertAdjacentHTML('afterbegin', `<div class="load-error">Timeline axes loaded, but paper data failed to load: ${escapeHtml(error.message)}.</div>`);
});
