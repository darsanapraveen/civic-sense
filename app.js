window.__civicSenseInitialized = window.__civicSenseInitialized || false;
if (!window.__civicSenseInitialized) {
  window.__civicSenseInitialized = true;

  document.addEventListener('DOMContentLoaded', function () {
    var placeWeights = {
      community: 8,
      market: 14,
      school: 18,
      transport: 20,
      hospital: 30,
      critical: 36,
    };

    var severityLabels = {
      1: 'Low',
      2: 'Mild',
      3: 'Moderate',
      4: 'Severe',
      5: 'Critical',
    };

    var priorityBands = [
      { label: 'Emergency', className: 'priority-emergency', min: 120 },
      { label: 'High', className: 'priority-high', min: 80 },
      { label: 'Medium', className: 'priority-medium', min: 45 },
      { label: 'Monitor', className: 'priority-low', min: 0 },
    ];

    var bandColors = {
      Emergency: '#ff6b8a',
      High: '#f3a83b',
      Medium: '#4ea5ff',
      Monitor: '#77c86b',
    };

    var storageKey = 'civic-sense-complaints';

    var seedComplaints = [
      {
        id: 'CS-001',
        title: 'Backup generator failure at district hospital',
        location: 'East District Hospital',
        category: 'Healthcare',
        affected: 180,
        severity: 5,
        placeImportance: 'hospital',
        description: 'Surgery wing is on limited power and patient monitoring systems are unstable.',
        createdAt: 'Today 08:15',
      },
      {
        id: 'CS-002',
        title: 'Water pipe burst near primary school',
        location: 'Maple Primary School',
        category: 'Education',
        affected: 90,
        severity: 4,
        placeImportance: 'school',
        description: 'Students and staff cannot safely use the main entrance because of flooding.',
        createdAt: 'Today 09:20',
      },
      {
        id: 'CS-003',
        title: 'Traffic lights down at busy transport junction',
        location: 'Central Bus Terminal',
        category: 'Transport',
        affected: 420,
        severity: 4,
        placeImportance: 'transport',
        description: 'The intersection is causing long delays and near misses during rush hour.',
        createdAt: 'Today 07:45',
      },
      {
        id: 'CS-004',
        title: 'Refuse collection missed in apartment block',
        location: 'Riverside Housing',
        category: 'Sanitation',
        affected: 65,
        severity: 2,
        placeImportance: 'community',
        description: 'Bins are overflowing but no immediate health risk has been reported.',
        createdAt: 'Today 10:00',
      },
    ];

    var form = document.getElementById('complaintForm');
    var queue = document.getElementById('queue');
    var metrics = document.getElementById('metrics');
    var pieChart = document.getElementById('pieChart');
    var pieLegend = document.getElementById('pieLegend');
    var severityInput = document.getElementById('severity');
    var severityLabel = document.getElementById('severityLabel');
    var complaints = loadComplaints();

    function loadComplaints() {
      var stored = null;
      try {
        stored = localStorage.getItem(storageKey);
      } catch (error) {
        stored = null;
      }

      if (!stored) {
        return seedComplaints.slice();
      }

      try {
        var parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length ? parsed : seedComplaints.slice();
      } catch (error) {
        return seedComplaints.slice();
      }
    }

    function saveComplaints() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(complaints));
      } catch (error) {
        // Ignore storage failures in restricted file:// contexts.
      }
    }

    function scoreComplaint(complaint) {
      var peopleFactor = complaint.affected * 0.22;
      var locationFactor = placeWeights[complaint.placeImportance] || 8;
      var severityFactor = complaint.severity * 12;
      return Math.round(peopleFactor + locationFactor + severityFactor);
    }

    function priorityForScore(score) {
      var i;
      for (i = 0; i < priorityBands.length; i += 1) {
        if (score >= priorityBands[i].min) {
          return priorityBands[i];
        }
      }
      return priorityBands[priorityBands.length - 1];
    }

    function formatCompactNumber(value) {
      if (value < 1000) {
        return String(value);
      }

      return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    }

    function placeImportanceLabel(value) {
      var labels = {
        community: 'Community area',
        market: 'Market / business district',
        school: 'School / university',
        transport: 'Transport hub',
        hospital: 'Hospital / clinic',
        critical: 'Critical infrastructure',
      };

      return labels[value] || 'Community area';
    }

    function renderMetrics(items) {
      var totalAffected = 0;
      var urgentItems = 0;
      var criticalLocations = 0;
      var highestScore = 0;
      var i;

      for (i = 0; i < items.length; i += 1) {
        var currentScore = scoreComplaint(items[i]);
        totalAffected += items[i].affected;
        if (currentScore >= 80) urgentItems += 1;
        if (items[i].placeImportance === 'hospital' || items[i].placeImportance === 'critical') criticalLocations += 1;
        if (currentScore > highestScore) highestScore = currentScore;
      }

      var blocks = [
        ['Complaints', items.length],
        ['People affected', formatCompactNumber(totalAffected)],
        ['Urgent cases', urgentItems],
        ['Top score', highestScore],
        ['Critical locations', criticalLocations],
        ['Priority rule', 'Visible'],
      ];

      var html = '';
      for (i = 0; i < blocks.length; i += 1) {
        html += '<div class="metric"><span class="metric-label">' + blocks[i][0] + '</span><span class="metric-value">' + blocks[i][1] + '</span></div>';
      }
      metrics.innerHTML = html;
    }

    function renderPieChart(items) {
      var counts = {
        Emergency: 0,
        High: 0,
        Medium: 0,
        Monitor: 0,
      };
      var i;

      for (i = 0; i < items.length; i += 1) {
        counts[priorityForScore(scoreComplaint(items[i])).label] += 1;
      }

      var total = counts.Emergency + counts.High + counts.Medium + counts.Monitor;
      if (!total) {
        pieChart.innerHTML = '';
        pieLegend.innerHTML = '<div class="empty-state">No complaints yet to chart.</div>';
        return;
      }

      var slices = [
        { label: 'Emergency', count: counts.Emergency, color: bandColors.Emergency },
        { label: 'High', count: counts.High, color: bandColors.High },
        { label: 'Medium', count: counts.Medium, color: bandColors.Medium },
        { label: 'Monitor', count: counts.Monitor, color: bandColors.Monitor },
      ];

      var radius = 80;
      var center = 110;
      var currentAngle = -90;
      var segments = '';
      var slice;
      var angle;
      var start;
      var end;

      for (i = 0; i < slices.length; i += 1) {
        slice = slices[i];
        if (slice.count <= 0) {
          continue;
        }
        angle = (slice.count / total) * 360;
        start = currentAngle;
        end = currentAngle + angle;
        currentAngle = end;
        segments += makePieSlice(center, center, radius, start, end, slice.color);
      }

      pieChart.innerHTML = '' +
        '<defs>' +
          '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">' +
            '<feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#445f8a" flood-opacity="0.2" />' +
          '</filter>' +
        '</defs>' +
        '<g filter="url(#shadow)">' + segments + '</g>' +
        '<circle cx="110" cy="110" r="46" fill="#ffffff" stroke="rgba(82, 133, 92, 0.08)" stroke-width="1" />' +
        '<text x="110" y="106" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="700" fill="#17304a">' + total + '</text>' +
        '<text x="110" y="128" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#5f718a">active issues</text>';

      var legendHtml = '';
      for (i = 0; i < priorityBands.length; i += 1) {
        var band = priorityBands[i];
        var count = counts[band.label];
        var percent = Math.round((count / total) * 100);
        legendHtml += '<div class="pie-legend-item"><div class="pie-legend-label"><span class="pie-swatch" style="background:' + bandColors[band.label] + '"></span><span>' + band.label + '</span></div><span class="chart-total">' + count + ' · ' + percent + '%</span></div>';
      }
      pieLegend.innerHTML = legendHtml;
    }

    function makePieSlice(cx, cy, radius, startAngle, endAngle, color) {
      var start = polarToCartesian(cx, cy, radius, endAngle);
      var end = polarToCartesian(cx, cy, radius, startAngle);
      var largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
      return '<path d="M ' + cx + ' ' + cy + ' L ' + start.x + ' ' + start.y + ' A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 0 ' + end.x + ' ' + end.y + ' Z" fill="' + color + '"></path>';
    }

    function polarToCartesian(cx, cy, radius, angle) {
      var radians = ((angle - 90) * Math.PI) / 180;
      return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians),
      };
    }

    function renderQueue(items) {
      var ranked = items.slice().sort(function (left, right) {
        var scoreDifference = scoreComplaint(right) - scoreComplaint(left);
        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        var placeDifference = (placeWeights[right.placeImportance] || 0) - (placeWeights[left.placeImportance] || 0);
        if (placeDifference !== 0) {
          return placeDifference;
        }

        return right.affected - left.affected;
      });

      if (!ranked.length) {
        queue.innerHTML = '<div class="empty-state">No complaints yet. Add the first issue to see the priority queue.</div>';
        return;
      }

      var topScore = scoreComplaint(ranked[0]);
      var scale = Math.max(topScore, 1);
      var queueHtml = '';
      var j;

      for (j = 0; j < ranked.length; j += 1) {
        var complaint = ranked[j];
        var score = scoreComplaint(complaint);
        var band = priorityForScore(score);
        var barWidth = Math.max(8, Math.round((score / scale) * 100));

        queueHtml += '' +
          '<article class="queue-item">' +
            '<div class="queue-top">' +
              '<div class="queue-title">' +
                '<span class="meta-line">#' + (j + 1) + ' ' + complaint.id + ' · ' + complaint.category + '</span>' +
                '<h3>' + complaint.title + '</h3>' +
                '<span class="meta-line">' + complaint.location + ' · ' + complaint.createdAt + '</span>' +
              '</div>' +
              '<span class="priority-tag ' + band.className + '">' + band.label + ' · ' + score + '</span>' +
            '</div>' +
            '<div class="queue-body">' +
              '<div class="score-bar" aria-hidden="true"><span style="width: ' + barWidth + '%"></span></div>' +
              '<div class="score-breakdown">' +
                '<span>' + formatCompactNumber(complaint.affected) + ' people affected</span>' +
                '<span>' + placeImportanceLabel(complaint.placeImportance) + '</span>' +
                '<span>Severity: ' + severityLabels[complaint.severity] + '</span>' +
              '</div>' +
              '<p class="meta-line">' + (complaint.description || 'No extra details provided.') + '</p>' +
            '</div>' +
          '</article>';
      }

      queue.innerHTML = queueHtml;
    }

    function updateSeverityLabel() {
      severityLabel.textContent = (severityLabels[severityInput.value] || 'Moderate') + ' impact';
    }

    function handleSubmit(event) {
      event.preventDefault();

      var newComplaint = {
        id: 'CS-' + String(complaints.length + 1).padStart(3, '0'),
        title: document.getElementById('title').value.trim(),
        location: document.getElementById('location').value.trim(),
        category: document.getElementById('category').value,
        affected: Number(document.getElementById('affected').value),
        severity: Number(severityInput.value),
        placeImportance: document.getElementById('placeImportance').value,
        description: document.getElementById('description').value.trim(),
        createdAt: 'Just now',
      };

      complaints = [newComplaint].concat(complaints);
      saveComplaints();
      render();
      form.reset();
      document.getElementById('affected').value = 50;
      severityInput.value = 3;
      updateSeverityLabel();
    }

    function render() {
      renderMetrics(complaints);
      renderPieChart(complaints);
      renderQueue(complaints);
    }

    severityInput.addEventListener('input', updateSeverityLabel);
    form.addEventListener('submit', handleSubmit);

    updateSeverityLabel();
    render();
  });
}
