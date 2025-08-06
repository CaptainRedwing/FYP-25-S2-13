window.renderVulnChart = function () {
	const canvas = document.getElementById('vulnChart');
	if (!canvas) {
		console.error("vulnChart not found when trying to render chart");
		return;
	}

	const ctx = canvas.getContext('2d');

	// Get severity counts from popup.js (assumes lastScanResult and getSeverityCounts are globally accessible)
	let severityCounts = [0, 0, 0, 0];
	if (window.lastScanResult && typeof window.getSeverityCounts === 'function') {
		severityCounts = window.getSeverityCounts(window.lastScanResult);
	} else if (typeof getSeverityCounts === 'function' && typeof lastScanResult !== 'undefined') {
		severityCounts = getSeverityCounts(lastScanResult);
	}

	// Check if there are no issues
	const totalIssues = severityCounts.reduce((a, b) => a + b, 0);
	let backgroundColors;
	let hoverBackgroundColors;

	if (totalIssues === 0) {
	// Base color: 73% opacity
	backgroundColors = [
		'#689D76',
		'#689D76',
		'#689D76',
		'#689D76'
	];

	// Hover color: 50% opacity
	hoverBackgroundColors = [
		'rgba(104, 157, 118, 0.50)',
		'rgba(104, 157, 118, 0.50)',
		'rgba(104, 157, 118, 0.50)',
		'rgba(104, 157, 118, 0.50)'
	];
	} else {
	// Normal severity colors
	backgroundColors = ['#611C19', '#962E2A', '#e3967d', '#A1D6E2'];
	hoverBackgroundColors = backgroundColors;
	}

	// Severity order: Critical, High, Medium, Low
	const data = {
	labels: ['Critical', 'High', 'Medium', 'Low'],
	datasets: [{
		data: severityCounts,
		backgroundColor: backgroundColors,
		borderWidth: 0,
		hoverBackgroundColor: hoverBackgroundColors,
		hoverBorderColor: [
		'rgba(97, 28, 25, 0.71)',
		'rgba(150, 46, 42, 0.71)',
		'rgba(227, 134, 125, 0.71)',
		'rgba(161, 214, 226, 0.71)'
		],
		hoverBorderWidth: 6
	}]
	};

	const centerText = {
		id: 'centerText',
		beforeDraw(chart) {
			const { ctx, chartArea } = chart;
			const centerX = (chartArea.left + chartArea.right) / 2;
			const centerY = (chartArea.top + chartArea.bottom) / 2;

			ctx.save();

			ctx.translate(centerX, centerY);
			ctx.scale(1.1, 0.9);
			ctx.translate(-centerX, -centerY);

			ctx.font = 'bold 66px "Fira Sans Condensed", sans-serif';
			ctx.fillStyle = '#962E2A';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			
			const totalIssues = severityCounts.reduce((a, b) => a + b, 0);
			ctx.fillText(totalIssues.toString().padStart(2, '0'), centerX, centerY - 20);

			ctx.font = 'bold 24px "Fira Sans Condensed", sans-serif';
			ctx.fillStyle = '#384247';
			ctx.fillText('issues found', centerX, centerY + 30);

			ctx.restore();
		}
	};


  const chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      cutout: '65%',
      radius: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false } 
      },

      interaction: {
        mode: 'nearest',
        intersect: true
      }
    },
    plugins: [centerText]
  });

  const labelText = document.querySelector('#chartLabel .label-text');
  const colorBox = document.querySelector('#chartLabel .color-box');

  canvas.addEventListener('mousemove', function (event) {
    const points = chartInstance.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      true
    );

    if (points.length) {
      const index = points[0].index;
      const label = data.labels[index];
      const value = data.datasets[0].data[index];
      const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
      const percent = total ? Math.round((value / total) * 100) : 0;

      labelText.style.color = '#384247';
      labelText.textContent = `${label} ${percent}%`;

      colorBox.style.backgroundColor = data.datasets[0].backgroundColor[index];
    } else {
      labelText.style.color = '#384247';
      labelText.textContent = 'hover to see details';
      colorBox.style.backgroundColor = 'transparent';
    }
  });
};
