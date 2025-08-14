window.renderVulnChart = function () {
  const canvas = document.getElementById('vulnChart');
  if (!canvas) {
    console.error("vulnChart not found when trying to render chart");
    return;
  }
  const ctx = canvas.getContext('2d');

  // --- real counts -----------------------------------------------------------
  let severityCounts = [0, 0, 0, 0];
  if (window.lastScanResult && typeof window.getSeverityCounts === 'function') {
    severityCounts = window.getSeverityCounts(window.lastScanResult);
  } else if (typeof getSeverityCounts === 'function' && typeof lastScanResult !== 'undefined') {
    severityCounts = getSeverityCounts(lastScanResult);
  }

  const trueTotal = severityCounts.reduce((a, b) => a + b, 0);
  const zeroState = trueTotal === 0;

  // --- what we feed to Chart.js ---------------------------------------------
  const displayData   = zeroState ? [1] : severityCounts;
  const displayLabels = zeroState ? ['No issues'] : ['Critical', 'High', 'Moderate', 'Low'];

  const backgroundColors = zeroState
    ? ['#689D76']
    : ['#611C19', '#962E2A', '#e3967d', '#A1D6E2'];

  const hoverBackgroundColors = zeroState ? ['rgba(104,157,118,0.50)'] : backgroundColors;
  const hoverBorderColor = zeroState
    ? ['rgba(104,157,118,0.5)']
    : ['rgba(97, 28, 25, 0.71)', 'rgba(150, 46, 42, 0.71)', 'rgba(227, 134, 125, 0.71)', 'rgba(161, 214, 226, 0.71)'];

  const data = {
    labels: displayLabels,
    datasets: [{
      data: displayData,
      backgroundColor: backgroundColors,
      borderWidth: 0,
      hoverBackgroundColor: hoverBackgroundColors,
      hoverBorderColor: hoverBorderColor,
      hoverBorderWidth: 6
    }]
  };

  // --- center text plugin (always shows true total) -------------------------
  const centerText = {
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1.1, 0.9);
      ctx.translate(-cx, -cy);

      ctx.font = 'bold 66px "Fira Sans Condensed", sans-serif';
      ctx.fillStyle = '#962E2A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(trueTotal.toString().padStart(2, '0'), cx, cy - 20);

      ctx.font = 'bold 24px "Fira Sans Condensed", sans-serif';
      ctx.fillStyle = '#384247';
      ctx.fillText('issues found', cx, cy + 30);

      ctx.restore();
    }
  };

  // --- destroy previous instance --------------------------------------------
  if (canvas._vulnChartInstance) {
    try { canvas._vulnChartInstance.destroy(); } catch (_) {}
  }

  // --- create chart ----------------------------------------------------------
  const chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      cutout: '65%',
      radius: '65%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      interaction: { mode: 'nearest', intersect: true }
    },
    plugins: [centerText]
  });
  canvas._vulnChartInstance = chartInstance;

  // --- custom hover label under the chart -----------------------------------
  const labelText = document.querySelector('#chartLabel .label-text');
  const colorBox  = document.querySelector('#chartLabel .color-box');

  const setNeutral = () => {
    labelText.style.color = '#384247';
    labelText.textContent = 'hover to see details';
    colorBox.style.backgroundColor = 'transparent';
  };
  setNeutral();

  canvas.addEventListener('mousemove', (event) => {
    const points = chartInstance.getElementsAtEventForMode(
      event, 'nearest', { intersect: true }, true
    );

    if (!points.length) { setNeutral(); return; }

    const idx = points[0].index;
    colorBox.style.backgroundColor = data.datasets[0].backgroundColor[idx];

    if (zeroState) {
      labelText.textContent = 'No issues found';
      return;
    }

    const label = data.labels[idx];       // e.g., "Moderate"
    const count = severityCounts[idx] || 0;
    const percent = Math.round((count / trueTotal) * 100);

    // >>> Your requested format:
    labelText.textContent = `${label} Severity   ${percent}%`;
  });

  canvas.addEventListener('mouseleave', setNeutral);
};
