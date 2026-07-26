(async function loadAnalytics() {
  try {
    var data = await adminFetchAnalytics();
    renderCharts(data);
  } catch(e) {
    document.getElementById("analyticsContent").innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-circle" style="color:#C62828;"></i></div><p>Error: '+e.message+'</p></div>';
  }
})();

function renderCharts(data) {
  var html = '<div class="charts-grid">';

  // Monthly Sales Chart
  html += '<div class="chart-card"><h3><i class="fas fa-chart-bar"></i> Monthly Sales</h3><canvas id="salesChart"></canvas></div>';

  // Order Status Distribution
  html += '<div class="chart-card"><h3><i class="fas fa-chart-pie"></i> Order Status</h3><canvas id="statusChart"></canvas></div>';

  // Payment Methods
  html += '<div class="chart-card"><h3><i class="fas fa-wallet"></i> Payment Methods</h3><canvas id="paymentChart"></canvas></div>';

  // Top Products
  html += '<div class="chart-card"><h3><i class="fas fa-boxes"></i> Top Products</h3><canvas id="productsChart"></canvas></div>';

  html += '</div>';

  document.getElementById("analyticsContent").innerHTML = html;

  // Create charts
  try {
    // Sales chart
    var months = (data.monthlySales||data.monthlyOrders||[]).map(function(m) {
      var d = new Date(m._id.year, m._id.month-1);
      return d.toLocaleString('en-IN', {month:'short', year:'2-digit'});
    });
    var revenues = (data.monthlySales||data.monthlyOrders||[]).map(function(m){return m.revenue||0;});
    var orderCounts = (data.monthlySales||data.monthlyOrders||[]).map(function(m){return m.orders||m.count||0;});

    new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {label:'Revenue (₹)', data:revenues, backgroundColor:'rgba(76,175,80,0.7)', borderColor:'#4CAF50', borderWidth:1, borderRadius:4},
          {label:'Orders', data:orderCounts, backgroundColor:'rgba(21,101,192,0.7)', borderColor:'#1565C0', borderWidth:1, borderRadius:4}
        ]
      },
      options: {
        responsive:true,
        plugins:{legend:{position:'bottom', labels:{usePointStyle:true, padding:20}}},
        scales:{y:{beginAtZero:true, grid:{color:'rgba(0,0,0,0.05)'}}}
      }
    });

    // Status chart
    var statusLabels = (data.orderStatusDist||data.ordersByStatus||[]).map(function(s){return s._id;});
    var statusCounts = (data.orderStatusDist||data.ordersByStatus||[]).map(function(s){return s.count;});
    if (statusLabels.length) {
      new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{data:statusCounts, backgroundColor:['#E65100','#1565C0','#7B1FA2','#00838F','#2E7D32','#C62828'], borderWidth:2, borderColor:'#fff'}]
        },
        options: {
          responsive:true,
          cutout:'65%',
          plugins:{legend:{position:'bottom', labels:{usePointStyle:true, padding:20}}}
        }
      });
    }

    // Payment methods chart
    var payLabels = (data.paymentMethodDist||[]).map(function(p){return p._id;});
    var payCounts = (data.paymentMethodDist||[]).map(function(p){return p.count;});
    if (payLabels.length) {
      new Chart(document.getElementById('paymentChart'), {
        type: 'pie',
        data: {
          labels: payLabels,
          datasets: [{data:payCounts, backgroundColor:['#4CAF50','#1565C0','#FF9800'], borderWidth:2, borderColor:'#fff'}]
        },
        options: {
          responsive:true,
          plugins:{legend:{position:'bottom', labels:{usePointStyle:true, padding:20}}}
        }
      });
    }

    // Top products chart
    var prodLabels = (data.topProducts||[]).map(function(p){return p._id||p.name;});
    var prodCounts = (data.topProducts||[]).map(function(p){return p.totalSold||p.quantity||p.count||0;});
    if (prodLabels.length) {
      new Chart(document.getElementById('productsChart'), {
        type: 'bar',
        data: {
          labels: prodLabels,
          datasets: [{label:'Units Sold', data:prodCounts, backgroundColor:'rgba(123,31,162,0.7)', borderColor:'#7B1FA2', borderWidth:1, borderRadius:4}]
        },
        options: {
          responsive:true,
          indexAxis:'y',
          plugins:{legend:{display:false}},
          scales:{x:{beginAtZero:true, grid:{color:'rgba(0,0,0,0.05)'}}}
        }
      });
    }
  } catch(e) {
    console.error('Chart error:', e);
  }
}
