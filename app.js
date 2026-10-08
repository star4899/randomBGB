'use strict';

const form = document.getElementById('draw-form');
const roster = document.getElementById('roster');
const selectedCount = document.getElementById('selected-count');
const reserveCount = document.getElementById('reserve-count');
const message = document.getElementById('draw-message');
const resultStatus = document.getElementById('result-status');
const storageStatus = document.getElementById('storage-status');
const storageKey = 'random-bgb-state';
const compareNames = new Intl.Collator('ko', { sensitivity: 'base', numeric: true }).compare;
const drawCounts = Object.create(null);

function readRoster() {
  const entries = roster.value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  const names = [...new Set(entries)];
  return { names, duplicateCount: entries.length - names.length };
}

function getRosterKey() {
  return JSON.stringify(readRoster().names.sort());
}

function updateDrawCount() {
  document.getElementById('draw-count').textContent = `같은 명단으로 총 ${drawCounts[getRosterKey()] || 0}회 추첨`;
}

function renderList(group, names, hasDrawn = false) {
  const list = document.getElementById(`${group}-list`);
  const empty = document.getElementById(`${group}-empty`);
  list.replaceChildren();
  const fragment = document.createDocumentFragment();
  names.forEach((name, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    const text = document.createElement('span');
    number.className = 'person-number';
    number.textContent = String(index + 1).padStart(2, '0');
    text.className = 'person-name';
    text.textContent = name;
    item.append(number, text);
    fragment.append(item);
  });
  list.append(fragment);
  list.hidden = names.length === 0;
  empty.hidden = names.length > 0;
  if (group === 'reserve') {
    empty.querySelector('p').textContent = hasDrawn ? '예비 인원을 설정하지 않았어요.' : '다음 기회를 기다리는 명단';
    empty.querySelector('span:last-child').textContent = hasDrawn ? '선발 명단을 확인해 주세요.' : '선발 명단과 겹치지 않아요.';
  }
  if (group === 'unselected') {
    document.getElementById('unselected-card').hidden = !hasDrawn;
  }
  document.getElementById(`${group}-total`).textContent = `${names.length}명`;
  const downloadButton = document.getElementById(`${group}-download`);
  downloadButton.disabled = names.length === 0 || downloadButton.dataset.downloading === 'true';
}

function clearResults() {
  renderList('selected', []);
  renderList('reserve', []);
  renderList('unselected', []);
  resultStatus.textContent = '추첨 대기 중';
  resultStatus.classList.remove('is-complete');
  message.textContent = '';
  document.getElementById('download-status').textContent = '';
}

function updateRosterSummary() {
  const { names, duplicateCount } = readRoster();
  document.getElementById('roster-count').textContent = `${names.length}명`;
  document.getElementById('roster-summary').textContent = duplicateCount
    ? `총 ${names.length}명 · 중복 ${duplicateCount}건을 제외한 추첨 인원입니다.`
    : `총 ${names.length}명 · 빈 줄과 중복된 이름은 자동으로 제외합니다.`;
  updateDrawCount();
}

function saveState() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      roster: roster.value,
      selectedCount: selectedCount.value,
      reserveCount: reserveCount.value,
      drawCounts
    }));
    storageStatus.textContent = '명단·설정·추첨 횟수가 이 탭에 임시 저장되었습니다.';
  } catch {
    storageStatus.textContent = '임시 저장이 불가능합니다. 새로고침하면 입력 내용이 사라집니다.';
  }
}

function restoreState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (!saved || typeof saved !== 'object') return;
    if (typeof saved.roster === 'string') roster.value = saved.roster;
    for (const [input, value] of [[selectedCount, saved.selectedCount], [reserveCount, saved.reserveCount]]) {
      const count = Number(value);
      if (value !== null && value !== undefined && String(value).trim() !== '' && Number.isInteger(count) && count >= Number(input.min) && count <= Number(input.max)) {
        input.value = String(count);
      }
    }
    if (saved.drawCounts && typeof saved.drawCounts === 'object' && !Array.isArray(saved.drawCounts)) {
      for (const [key, count] of Object.entries(saved.drawCounts)) {
        if (Number.isSafeInteger(count) && count >= 0) drawCounts[key] = count;
      }
    }
    storageStatus.textContent = '이전에 입력한 명단·설정·추첨 횟수를 불러왔습니다.';
  } catch {
    storageStatus.textContent = '임시 저장 내용을 불러올 수 없습니다. 명단을 다시 입력해 주세요.';
  }
}

function randomIndex(range) {
  const buffer = new Uint32Array(1);
  // 나머지 연산으로 생기는 편향을 없애 각 인원의 확률을 동일하게 유지합니다.
  const limit = Math.floor(4294967296 / range) * range;
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % range;
}

function createResultImage(title, names, group, drawCount) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  const font = getComputedStyle(document.body).fontFamily;
  context.font = `24px ${font}`;
  const rows = names.map(name => {
    const lines = [];
    let line = '';
    for (const character of name) {
      if (line && context.measureText(line + character).width > 640) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
    lines.push(line);
    return { lines, height: lines.length * 34 + 24 };
  });
  const height = 180 + rows.reduce((total, row) => total + row.height, 0) + 40;
  canvas.width = 1600;
  canvas.height = height * 2;
  context.scale(2, 2);
  context.textBaseline = 'top';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 800, height);
  const accent = group === 'selected' ? '#16705b' : group === 'reserve' ? '#977441' : '#657585';
  context.fillStyle = accent;
  context.fillRect(0, 0, 800, 8);
  context.font = `700 16px ${font}`;
  context.fillText('Random BGB', 48, 40);
  context.font = `700 38px ${font}`;
  context.fillText(title, 48, 78);
  context.fillStyle = '#6d7c74';
  context.font = `18px ${font}`;
  context.fillText(`총 ${names.length}명 · 이름순 정렬 · 동일 명단 ${drawCount}회 추첨`, 48, 134);
  let y = 180;
  rows.forEach((row, index) => {
    context.fillStyle = group === 'selected' ? '#f2f7f0' : group === 'reserve' ? '#faf6ee' : '#f0f3f6';
    context.fillRect(48, y, 704, row.height - 8);
    context.fillStyle = accent;
    context.font = `18px ${font}`;
    context.fillText(String(index + 1).padStart(2, '0'), 62, y + 13);
    context.fillStyle = '#24362f';
    context.font = `24px ${font}`;
    row.lines.forEach((line, lineIndex) => context.fillText(line, 110, y + 10 + lineIndex * 34));
    y += row.height;
  });
  return canvas;
}

async function downloadResult(group) {
  const names = [...document.querySelectorAll(`#${group}-list .person-name`)].map(item => item.textContent);
  if (!names.length) return;
  const drawCount = drawCounts[getRosterKey()] || 0;
  const button = document.getElementById(`${group}-download`);
  if (button.dataset.downloading === 'true') return;
  const status = document.getElementById('download-status');
  button.dataset.downloading = 'true';
  button.disabled = true;
  status.textContent = '';
  try {
    await document.fonts.ready;
    const title = document.getElementById(`${group}-title`).textContent;
    const canvas = createResultImage(title, names, group, drawCount);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Image export failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-bgb-${group}.png`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    status.textContent = '이미지를 저장하지 못했습니다. 다시 시도해 주세요.';
  } finally {
    delete button.dataset.downloading;
    button.disabled = document.getElementById(`${group}-list`).children.length === 0;
  }
}

for (const group of ['selected', 'reserve', 'unselected']) {
  document.getElementById(`${group}-download`).addEventListener('click', () => downloadResult(group));
}

form.addEventListener('input', () => {
  clearResults();
  updateRosterSummary();
  saveState();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  clearResults();
  for (const input of [selectedCount, reserveCount]) {
    if (!input.checkValidity()) {
      message.textContent = input === selectedCount
        ? '선발 인원은 1~20명 사이의 정수로 입력해 주세요.'
        : '예비 인원은 0~10명 사이의 정수로 입력해 주세요.';
      input.focus();
      return;
    }
  }

  const { names } = readRoster();
  const selected = Number(selectedCount.value);
  const reserve = Number(reserveCount.value);
  const required = selected + reserve;
  if (names.length < required) {
    message.textContent = names.length === 0
      ? '전체 명단을 먼저 입력해 주세요.'
      : `명단이 부족합니다. 총 ${required}명이 필요하며, 현재 ${names.length}명입니다.`;
    roster.focus();
    return;
  }

  // 하나의 명단을 섞은 뒤 나누므로 선발과 예비가 겹치지 않습니다.
  for (let i = names.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [names[i], names[j]] = [names[j], names[i]];
  }
  renderList('selected', names.slice(0, selected).sort(compareNames), true);
  renderList('reserve', names.slice(selected, required).sort(compareNames), true);
  renderList('unselected', names.slice(required).sort(compareNames), true);
  const rosterKey = getRosterKey();
  drawCounts[rosterKey] = Math.min((drawCounts[rosterKey] || 0) + 1, Number.MAX_SAFE_INTEGER);
  updateDrawCount();
  resultStatus.textContent = `선발 ${selected}명 · 예비 ${reserve}명 · 미선발 ${names.length - required}명 완료`;
  resultStatus.classList.add('is-complete');
  saveState();
});

restoreState();
updateRosterSummary();
