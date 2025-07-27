window.renderVulnChart = function () {
  const canvas = document.getElementById('vulnChart');
  if (!canvas) {
    console.error("vulnChart not found when trying to render chart");
    return;
  }

  const ctx = canvas.getContext('2d');

  const data = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      data: [3, 2, 5],
      backgroundColor: ['#A1D6E2', '#E3867D', '#962E2A'],
      borderWidth: 0,
      hoverBackgroundColor: ['#A1D6E2', '#E3867D', '#962E2A'],
      hoverBorderColor: [
        'rgba(161, 214, 226, 0.71)', // for Low
        'rgba(227, 134, 125, 0.71)', // for Medium
        'rgba(150, 46, 42, 0.71)'    // for High
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
      ctx.fillText('00', centerX, centerY - 20);

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
        tooltip: { enabled: false }
      }
    },
    plugins: [centerText]
  });
};




