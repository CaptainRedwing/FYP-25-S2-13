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

	// Severity order: Critical, High, Medium, Low
	const data = {
		labels: ['Critical', 'High', 'Medium', 'Low'],
		datasets: [{
			data: severityCounts,
			backgroundColor: ['#962E2A', '#E3867D', '#F7CA18', '#A1D6E2'],
			borderWidth: 0,
			hoverBackgroundColor: ['#962E2A', '#E3867D', '#F7CA18', '#A1D6E2'],
			hoverBorderColor: [
				'rgba(150, 46, 42, 0.71)', // Critical
				'rgba(227, 134, 125, 0.71)', // High
				'rgba(247, 202, 24, 0.71)', // Medium
				'rgba(161, 214, 226, 0.71)' // Low
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
			// Show total issues found (sum of all severities)
			const totalIssues = severityCounts.reduce((a, b) => a + b, 0);
			ctx.fillText(totalIssues.toString().padStart(2, '0'), centerX, centerY - 20);

			ctx.font = 'bold 24px "Fira Sans Condensed", sans-serif';
			ctx.fillStyle = '#384247';
			ctx.fillText('issues found', centerX, centerY + 30);

			ctx.restore();
		}
	};


	new Chart(ctx, {
		type: 'doughnut',
		data: data,
		options: {
			cutout: '65%',
			radius: '65%',
			plugins: {
				legend: { display: false },
				tooltip: {
					enabled: true,
					callbacks: {
						label: function (context) {
							const label = context.label || '';
							const value = context.parsed || 0;
							return `${label}: ${value}`;
						}
					}
				}
			}
		},
		plugins: [centerText]
	});
};
