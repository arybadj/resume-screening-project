/* ── FILE UPLOAD ─────────────────────────────────────────── */
const dropZone   = document.getElementById('dropZone');
const resumeInput = document.getElementById('resumeInput');
const fileList   = document.getElementById('fileList');

dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  setFiles(e.dataTransfer.files);
});

resumeInput.addEventListener('change', () => setFiles(resumeInput.files));

function setFiles(files) {
  renderFileList(files);
}

function renderFileList(files) {
  fileList.innerHTML = '';
  Array.from(files).forEach(f => {
    const size = (f.size / 1024).toFixed(0) + ' KB';
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="fi-icon">📄</span>
      <span class="fi-name">${f.name}</span>
      <span class="fi-size">${size}</span>
    `;
    fileList.appendChild(item);
  });
}

/* ── STATUS HELPERS ──────────────────────────────────────── */
function setStatus(state, text) {
  const dot  = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  dot.className = 'status-dot ' + state;
  label.textContent = text;
}

/* ── FORM SUBMIT ─────────────────────────────────────────── */
let lastResults = [];

document.getElementById('screenForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn     = document.getElementById('runBtn');
  const btnText = document.getElementById('btnText');
  const loader  = document.getElementById('btnLoader');
  const btnIcon = document.getElementById('btnIcon');
  const errBox  = document.getElementById('errorBanner');

  // UI → loading
  btn.disabled = true;
  loader.classList.add('show');
  btnIcon.style.display = 'none';
  btnText.textContent = 'Analyzing...';
  setStatus('loading', 'Processing...');
  errBox.style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';

  try {
    const formData = new FormData(e.target);
    const res = await fetch('/api/screen', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || `Server error ${res.status}`);
    }

    const data = await res.json();
    lastResults = data.candidates || [];
    renderResults(lastResults);
    setStatus('active', `${lastResults.length} candidates screened`);

  } catch (err) {
    errBox.textContent = '❌ ' + err.message;
    errBox.style.display = 'block';
    setStatus('error', 'Error');
  } finally {
    btn.disabled = false;
    loader.classList.remove('show');
    btnIcon.style.display = '';
    btnText.textContent = 'Screen Resumes';
  }
});

/* ── RENDER RESULTS ──────────────────────────────────────── */
function getScoreColor(score) {
  if (score >= 80) return 'var(--accent)';
  if (score >= 55) return 'var(--warn)';
  return 'var(--danger)';
}

function getRecClass(rec) {
  if (rec === 'Strong Fit')   return 'rec-strong';
  if (rec === 'Moderate Fit') return 'rec-moderate';
  return 'rec-not';
}

function renderResults(candidates) {
  // Summary cards
  const strong   = candidates.filter(c => c.recommendation === 'Strong Fit').length;
  const moderate = candidates.filter(c => c.recommendation === 'Moderate Fit').length;
  const notFit   = candidates.filter(c => c.recommendation === 'Not Fit').length;
  const avgScore = Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length);

  const summaryRow = document.getElementById('summaryRow');
  summaryRow.innerHTML = `
    <div class="sum-card" style="animation-delay:0.05s">
      <div class="sum-num" style="color:var(--text)">${candidates.length}</div>
      <div class="sum-label">Total Screened</div>
    </div>
    <div class="sum-card" style="animation-delay:0.10s">
      <div class="sum-num" style="color:var(--accent)">${strong}</div>
      <div class="sum-label">Strong Fit</div>
    </div>
    <div class="sum-card" style="animation-delay:0.15s">
      <div class="sum-num" style="color:var(--warn)">${moderate}</div>
      <div class="sum-label">Moderate Fit</div>
    </div>
    <div class="sum-card" style="animation-delay:0.20s">
      <div class="sum-num" style="color:var(--danger)">${notFit}</div>
      <div class="sum-label">Not Fit</div>
    </div>
    <div class="sum-card" style="animation-delay:0.25s">
      <div class="sum-num" style="color:var(--accent2)">${avgScore}</div>
      <div class="sum-label">Avg Score</div>
    </div>
  `;

  document.getElementById('resultsMeta').textContent =
    `${candidates.length} CANDIDATE${candidates.length !== 1 ? 'S' : ''} · RANKED BY SCORE`;

  // Table body
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  candidates.forEach((c, i) => {
    const color = getScoreColor(c.score);
    const strengths = (c.strengths || []).map(s => `<li>${s}</li>`).join('');
    const gaps      = (c.gaps || []).map(g => `<li>${g}</li>`).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-rank">${i + 1}</td>
      <td>
        <div class="td-name">${c.candidate || c.name || 'Candidate'}</div>
        <div class="td-summary">${c.summary || ''}</div>
      </td>
      <td>
        <div class="score-wrap">
          <div class="score-big" style="color:${color}">${c.score}</div>
          <div class="score-bar-bg">
            <div class="score-bar-fill" style="background:${color}" data-w="${c.score}%"></div>
          </div>
        </div>
      </td>
      <td><ul class="point-list strength-list">${strengths}</ul></td>
      <td><ul class="point-list gap-list">${gaps}</ul></td>
      <td><span class="rec-badge ${getRecClass(c.recommendation)}">${c.recommendation}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Show section
  document.getElementById('resultsSection').style.display = 'block';
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Animate score bars
  setTimeout(() => {
    document.querySelectorAll('.score-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.w;
    });
  }, 120);
}

/* ── CSV EXPORT ──────────────────────────────────────────── */
function exportCSV() {
  if (!lastResults.length) return;

  const headers = ['Rank', 'Candidate', 'Score', 'Strengths', 'Gaps', 'Recommendation', 'Summary'];
  const rows = lastResults.map((c, i) => [
    i + 1,
    `"${(c.candidate || c.name || '').replace(/"/g, '""')}"`,
    c.score,
    `"${(c.strengths || []).join('; ').replace(/"/g, '""')}"`,
    `"${(c.gaps || []).join('; ').replace(/"/g, '""')}"`,
    `"${(c.recommendation || '').replace(/"/g, '""')}"`,
    `"${(c.summary || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `hiresignal_results_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
