const STORAGE_KEY = 'voteManagerSavedVotes';

const navButtons = document.querySelectorAll('.nav-btn');
const openButtons = document.querySelectorAll('[data-open]');
const quickVoteForm = document.getElementById('quickVoteForm');
const quickVoteResult = document.getElementById('quickVoteResult');
const savedVotesList = document.getElementById('savedVotesList');
const savedVoteCount = document.getElementById('savedVoteCount');
const newVoteBtn = document.getElementById('newVoteBtn');

const numInput = document.getElementById('numInput');
const setupBtn = document.getElementById('setupBtn');
const fieldsArea = document.getElementById('fieldsArea');
const resultArea = document.getElementById('resultArea');
const rankingVoteName = document.getElementById('rankingVoteName');
const quickVoteName = document.getElementById('quickVoteName');
const saveRankingVoteBtn = document.getElementById('saveRankingVoteBtn');
const saveQuickVoteBtn = document.getElementById('saveQuickVoteBtn');

let fieldsDict = {};
let currentCandidates = [];
let voteRecords = loadSavedVotes();

function setActiveView(viewName) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `${viewName}View`);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewName);
  });
}

function resetRankingEditor() {
  rankingVoteName.value = '';
  numInput.value = 4;
  resultArea.innerHTML = '';
  setupCandidateFields();
}

function resetQuickEditor() {
  quickVoteName.value = '';
  document.getElementById('quickCandidates').value = '候選人 A\n候選人 B\n候選人 C\n候選人 D';
  document.getElementById('quickVotes').value = '120,90,75,55';
  quickVoteResult.className = 'result-panel result-box empty';
  quickVoteResult.innerHTML = '<p>請輸入候選人與票數，系統會立即計算勝出者。</p>';
}

function bindNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveView(button.dataset.view);
    });
  });

  openButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetView = button.dataset.open;
      if (button.dataset.reset === 'ranking') {
        resetRankingEditor();
      }
      if (button.dataset.reset === 'quick') {
        resetQuickEditor();
      }
      setActiveView(targetView);
    });
  });
}

function loadSavedVotes() {
  try {
    const records = localStorage.getItem(STORAGE_KEY);
    return records ? JSON.parse(records) : [];
  } catch (error) {
    return [];
  }
}

function persistSavedVotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(voteRecords));
  renderSavedVotes();
}

function upsertVoteRecord(newRecord) {
  const matchingIndex = voteRecords.findIndex(
    (record) => record.name.trim().toLowerCase() === newRecord.name.trim().toLowerCase(),
  );

  if (matchingIndex >= 0) {
    voteRecords[matchingIndex] = {
      ...voteRecords[matchingIndex],
      ...newRecord,
      id: voteRecords[matchingIndex].id,
      updatedAt: new Date().toISOString(),
    };
    return;
  }

  voteRecords = [newRecord, ...voteRecords];
}

function getUniqueId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `vote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildVoteName(prefix) {
  const baseCount = voteRecords.filter((record) => record.type === prefix).length + 1;
  return prefix === 'ranking' ? `排名投票 ${baseCount}` : `快速計票 ${baseCount}`;
}

function renderSavedVotes() {
  savedVoteCount.textContent = String(voteRecords.length);

  if (!voteRecords.length) {
    savedVotesList.innerHTML = '<div class="empty-state">目前還沒有已保存的投票，點擊上方按鈕新增一份投票吧。</div>';
    return;
  }

  savedVotesList.innerHTML = voteRecords
    .map(
      (record) => `
        <div class="vote-card">
          <div class="vote-card-name">${record.name}</div>
          <div class="vote-card-meta">${record.type === 'ranking' ? '排名投票' : '快速計票'} · ${new Date(record.updatedAt).toLocaleDateString()}</div>
          <div class="vote-card-actions">
            <button class="primary small" type="button" data-load-vote="${record.id}">載入</button>
            <button class="danger small" type="button" data-delete-vote="${record.id}">刪除</button>
          </div>
        </div>
      `,
    )
    .join('');
}

savedVotesList.addEventListener('click', (event) => {
  const loadButton = event.target.closest('[data-load-vote]');
  const deleteButton = event.target.closest('[data-delete-vote]');
  const voteId = loadButton ? loadButton.dataset.loadVote : deleteButton?.dataset.deleteVote;

  if (!voteId) {
    return;
  }

  const targetVote = voteRecords.find((record) => record.id === voteId);
  if (!targetVote) {
    return;
  }

  if (loadButton) {
    if (targetVote.type === 'ranking') {
      loadRankingVote(targetVote);
    } else {
      loadQuickVote(targetVote);
    }
  }

  if (deleteButton) {
    voteRecords = voteRecords.filter((record) => record.id !== voteId);
    persistSavedVotes();
  }
});

function generateCandidateLetters(count) {
  return Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));
}

function setupCandidateFields() {
  const num = Number(numInput.value);
  currentCandidates = generateCandidateLetters(num);
  fieldsDict = {};

  fieldsArea.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'fields-panel';

  const title = document.createElement('h3');
  title.textContent = `2. 請直接填入名次票數（目前有 ${num} 人參選，共生成 ${num} 個名次）：`;
  panel.appendChild(title);

  const helper = document.createElement('p');
  helper.className = 'helper-text';
  helper.textContent = '提示：填完一個數字後，按鍵盤的 Tab 鍵就能順暢跳到下一格/換行。';
  panel.appendChild(helper);

  const ruleText = document.createElement('p');
  ruleText.className = 'rule-text';
  const scoreHint = Array.from({ length: num }, (_, index) => {
    const rankNum = index + 1;
    return `第 ${rankNum} 名 = ${num - index} 分`;
  }).join(' + ');
  ruleText.innerHTML = `目前的計分規則：${scoreHint}`;
  panel.appendChild(ruleText);

  const allRows = document.createElement('div');

  currentCandidates.forEach((candidate) => {
    fieldsDict[candidate] = {};
    const row = document.createElement('div');
    row.className = 'candidate-row';

    const label = document.createElement('div');
    label.className = 'candidate-label';
    label.textContent = `候選人 ${candidate}：`;
    row.appendChild(label);

    for (let rankNum = 1; rankNum <= num; rankNum += 1) {
      const wrap = document.createElement('div');
      wrap.className = 'rank-box';

      const rankLabel = document.createElement('label');
      rankLabel.setAttribute('for', `candidate-${candidate}-rank-${rankNum}`);
      rankLabel.textContent = `第${rankNum}名:`;

      const input = document.createElement('input');
      input.id = `candidate-${candidate}-rank-${rankNum}`;
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.step = '1';
      input.setAttribute('aria-label', `候選人 ${candidate} 第${rankNum}名票數`);

      fieldsDict[candidate][rankNum] = input;

      wrap.appendChild(rankLabel);
      wrap.appendChild(input);
      row.appendChild(wrap);
    }

    allRows.appendChild(row);
  });

  panel.appendChild(allRows);

  if (num === 4) {
    fieldsDict.A[1].value = 8; fieldsDict.A[2].value = 2; fieldsDict.A[3].value = 1; fieldsDict.A[4].value = 8;
    fieldsDict.B[1].value = 5; fieldsDict.B[2].value = 6; fieldsDict.B[3].value = 3; fieldsDict.B[4].value = 5;
    fieldsDict.C[1].value = 4; fieldsDict.C[2].value = 7; fieldsDict.C[3].value = 5; fieldsDict.C[4].value = 3;
    fieldsDict.D[1].value = 3; fieldsDict.D[2].value = 4; fieldsDict.D[3].value = 10; fieldsDict.D[4].value = 3;
  }

  const buttonWrap = document.createElement('div');
  buttonWrap.className = 'calc-button-wrap';

  const calcBtn = document.createElement('button');
  calcBtn.type = 'button';
  calcBtn.className = 'success';
  calcBtn.textContent = '算出統計結果';
  calcBtn.addEventListener('click', calculateFromFields);

  buttonWrap.appendChild(calcBtn);
  panel.appendChild(buttonWrap);
  fieldsArea.appendChild(panel);
  resultArea.innerHTML = '';
}

function getRankingData() {
  const num = Number(numInput.value);
  const values = {};

  currentCandidates.forEach((candidate) => {
    values[candidate] = {};
    for (let rankNum = 1; rankNum <= num; rankNum += 1) {
      values[candidate][rankNum] = Number(fieldsDict[candidate][rankNum].value || 0);
    }
  });

  return values;
}

function calculateFromFields() {
  const num = Number(numInput.value);
  const pluralityVotes = {};
  const bordaScores = {};
  const rankTotals = {};

  for (let rankNum = 1; rankNum <= num; rankNum += 1) {
    rankTotals[rankNum] = 0;
  }

  currentCandidates.forEach((candidate) => {
    pluralityVotes[candidate] = Number(fieldsDict[candidate][1].value || 0);

    let candidateTotalScore = 0;
    for (let rankNum = 1; rankNum <= num; rankNum += 1) {
      const voteCount = Number(fieldsDict[candidate][rankNum].value || 0);
      rankTotals[rankNum] += voteCount;
      const scoreWeight = num - rankNum + 1;
      candidateTotalScore += voteCount * scoreWeight;
    }

    bordaScores[candidate] = candidateTotalScore;
  });

  const verificationText = Array.from({ length: num }, (_, index) => {
    const rankNum = index + 1;
    return `第 ${rankNum} 名：${rankTotals[rankNum]} 票`;
  }).join(' | ');

  const maxPlurality = Math.max(...Object.values(pluralityVotes));
  const winners1 = currentCandidates.filter((candidate) => pluralityVotes[candidate] === maxPlurality);

  const maxBorda = Math.max(...Object.values(bordaScores));
  const winners2 = currentCandidates.filter((candidate) => bordaScores[candidate] === maxBorda);

  resultArea.innerHTML = `
    <div class="result-panel">
      <h3 class="result-header">統計報告</h3>
      <div class="result-block">
        <h4>各名次總數驗證</h4>
        <p>${verificationText}</p>
        ${Object.values(rankTotals).some((value, index, array) => index > 0 && value !== array[0]) ? '<p class="notice">提示：各名次的總票數不相等，代表有格子漏填或多填，請確認。</p>' : ''}
      </div>

      <div class="result-block">
        <h4>【 方法一：傳統一人一票制 】</h4>
        <ul class="result-list">
          ${currentCandidates.map((candidate) => `<li>候選人 ${candidate}: 獲得 ${pluralityVotes[candidate]} 票</li>`).join('')}
        </ul>
        <p>${winners1.length > 1 ? `結果平手！由 候選人 【${winners1.join('、')}】 共同獲勝！ (各獲得 ${maxPlurality} 票)` : `結果：由 候選人 【${winners1[0]}】 獲勝！`}</p>
      </div>

      <div class="result-block">
        <h4>【 方法二：排名計分制 】</h4>
        <ul class="result-list">
          ${currentCandidates.map((candidate) => `<li>候選人 ${candidate}: 獲得 ${bordaScores[candidate]} 分</li>`).join('')}
        </ul>
        <p>${winners2.length > 1 ? `結果平手！由 候選人 【${winners2.join('、')}】 共同獲勝！ (各獲得 ${maxBorda} 分)` : `結果：由 候選人 【${winners2[0]}】 獲勝！`}</p>
      </div>
    </div>
  `;
}

function saveCurrentRankingVote() {
  const name = rankingVoteName.value.trim() || buildVoteName('ranking');
  const voteData = {
    id: getUniqueId(),
    name,
    type: 'ranking',
    updatedAt: new Date().toISOString(),
    payload: {
      candidateCount: Number(numInput.value),
      values: getRankingData(),
    },
  };

  upsertVoteRecord(voteData);
  persistSavedVotes();
  rankingVoteName.value = name;
}

function loadRankingVote(record) {
  rankingVoteName.value = record.name;
  numInput.value = record.payload.candidateCount;
  setupCandidateFields();

  currentCandidates.forEach((candidate) => {
    Object.entries(record.payload.values[candidate] || {}).forEach(([rank, value]) => {
      if (fieldsDict[candidate] && fieldsDict[candidate][Number(rank)]) {
        fieldsDict[candidate][Number(rank)].value = value;
      }
    });
  });

  setActiveView('ranking');
}

function parseQuickVoteData() {
  const rawCandidates = document.getElementById('quickCandidates').value;
  const rawVotes = document.getElementById('quickVotes').value;

  const candidates = rawCandidates
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const votes = rawVotes
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  return { candidates, votes };
}

function renderQuickVoteResult() {
  const { candidates, votes } = parseQuickVoteData();

  if (!candidates.length || votes.length === 0) {
    quickVoteResult.className = 'result-panel result-box empty';
    quickVoteResult.innerHTML = '<p>請至少輸入一個候選人與一個票數。</p>';
    return;
  }

  if (candidates.length !== votes.length) {
    quickVoteResult.className = 'result-panel result-box';
    quickVoteResult.innerHTML = `
      <div class="notice">候選人數與票數數量不一致，請確認。</div>
      <p>候選人：${candidates.length} 個，票數：${votes.length} 個</p>
    `;
    return;
  }

  const totalVotes = votes.reduce((sum, vote) => sum + vote, 0);
  const winnerIndex = votes.indexOf(Math.max(...votes));
  const winner = candidates[winnerIndex];

  quickVoteResult.className = 'result-panel';
  quickVoteResult.innerHTML = `
    <h3 class="result-header">快速計票結果</h3>
    <div class="result-block">
      <h4>各候選人票數</h4>
      <ul class="result-list">
        ${candidates.map((candidate, index) => `<li>${candidate}: ${votes[index]} 票</li>`).join('')}
      </ul>
    </div>
    <div class="result-block">
      <h4>總票數</h4>
      <p>本次投票共 ${totalVotes} 票</p>
      <p>結果：由 <strong>${winner}</strong> 獲勝！</p>
    </div>
  `;
}

function saveCurrentQuickVote() {
  const name = quickVoteName.value.trim() || buildVoteName('quick');
  const { candidates, votes } = parseQuickVoteData();

  if (!candidates.length || !votes.length) {
    quickVoteResult.className = 'result-panel result-box empty';
    quickVoteResult.innerHTML = '<p>請先輸入候選人與票數，才能保存這份投票。</p>';
    return;
  }

  const voteData = {
    id: getUniqueId(),
    name,
    type: 'quick',
    updatedAt: new Date().toISOString(),
    payload: { candidates, votes },
  };

  upsertVoteRecord(voteData);
  persistSavedVotes();
  quickVoteName.value = name;
}

function loadQuickVote(record) {
  quickVoteName.value = record.name;
  document.getElementById('quickCandidates').value = record.payload.candidates.join('\n');
  document.getElementById('quickVotes').value = record.payload.votes.join(', ');
  renderQuickVoteResult();
  setActiveView('quick');
}

quickVoteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderQuickVoteResult();
});

saveRankingVoteBtn.addEventListener('click', saveCurrentRankingVote);
saveQuickVoteBtn.addEventListener('click', saveCurrentQuickVote);
setupBtn.addEventListener('click', setupCandidateFields);
newVoteBtn.addEventListener('click', () => {
  resetRankingEditor();
  setActiveView('ranking');
});

bindNavigation();
resetRankingEditor();
resetQuickEditor();
renderSavedVotes();
setActiveView('home');
