/**
 * TaskFlow Pro - Export Utilities
 * Provides 1-click Excel (CSV) file generation and high-fidelity Printable PDF Reports
 */

/**
 * Clean & format a value for CSV output
 */
const formatCSVValue = (val) => {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return `"${val.toISOString().split('T')[0]}"`;
    }
    if (Array.isArray(val)) {
      return `"${val.map((item) => (typeof item === 'object' ? item.name || item.title || JSON.stringify(item) : item)).join('; ').replace(/"/g, '""')}"`;
    }
    return `"${(val.name || val.title || JSON.stringify(val)).replace(/"/g, '""')}"`;
  }
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Export data array to Excel-compatible CSV file
 * @param {string} filename - Base name for the downloaded file (without .csv)
 * @param {Array<Object>} data - Array of record objects
 * @param {Array<{ key: string, label: string, formatter?: Function }>} columns - Column definitions
 */
export const exportToCSV = (filename, data, columns) => {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Header row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = data.map((item, index) => {
    return columns
      .map((col) => {
        if (col.key === '_index') {
          return formatCSVValue(index + 1);
        }
        if (col.formatter && typeof col.formatter === 'function') {
          return formatCSVValue(col.formatter(item[col.key], item, index));
        }
        return formatCSVValue(item[col.key]);
      })
      .join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel renders special characters & UTF-8 correctly
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate and open a high-fidelity printable PDF report with TaskFlow styling
 * @param {string} title - Report title
 * @param {string} subtitle - Report subtitle or organizational scope
 * @param {Array<{ key: string, label: string, formatter?: Function }>} columns - Column definitions
 * @param {Array<Object>} data - Array of record objects
 * @param {Array<{ label: string, value: any, color?: string }>} summaryMetrics - Quick stats badges
 */
export const printPDFReport = (title, subtitle, columns, data, summaryMetrics = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data available to generate report.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (!printWindow) {
    alert('Please allow popups to generate and view the printable report.');
    return;
  }

  const nowFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // Build summary metrics HTML
  let metricsHtml = '';
  if (Array.isArray(summaryMetrics) && summaryMetrics.length > 0) {
    metricsHtml = `
      <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 22px;">
        ${summaryMetrics
          .map(
            (m) => `
          <div style="flex: 1 1 160px; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; border-left: 4px solid ${m.color || '#2563eb'};">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">${m.label}</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${m.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  // Build table headers HTML
  const theadHtml = `
    <thead>
      <tr>
        <th style="width: 45px; text-align: center;">#</th>
        ${columns
          .filter((c) => c.key !== '_index')
          .map(
            (col) => `
          <th style="padding: 10px 12px; font-weight: 700; text-align: left; background: #f1f5f9; color: #334155; font-size: 12px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.3px;">
            ${col.label}
          </th>
        `
          )
          .join('')}
      </tr>
    </thead>
  `;

  // Build table rows HTML
  const tbodyHtml = `
    <tbody>
      ${data
        .map((row, idx) => {
          const cells = columns
            .filter((c) => c.key !== '_index')
            .map((col) => {
              let val = row[col.key];
              if (col.formatter && typeof col.formatter === 'function') {
                val = col.formatter(val, row, idx);
              } else if (val === null || val === undefined) {
                val = '—';
              } else if (typeof val === 'object') {
                val = val.name || val.title || JSON.stringify(val);
              }
              return `<td style="padding: 9px 12px; font-size: 12px; color: #1e293b; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">${val}</td>`;
            })
            .join('');

          return `
            <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 9px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-align: center; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
              ${cells}
            </tr>
          `;
        })
        .join('')}
    </tbody>
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title} - TaskFlow Pro Official Report</title>
      <style>
        @page {
          size: landscape;
          margin: 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background: #ffffff;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-pill {
          background: #2563eb;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
        }
        .report-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #64748b;
          line-height: 1.5;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .footer-note {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 24px;
        }
        .no-print {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 16px;
        }
        .btn-print {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-close {
          background: #e2e8f0;
          color: #334155;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <button class="btn-close" onclick="window.close()">Close</button>
      </div>

      <div class="header-bar">
        <div>
          <h1 class="brand-title">
            <span>${title}</span>
            <span class="brand-pill">TaskFlow Pro</span>
          </h1>
          <p class="report-subtitle">${subtitle || 'Enterprise Workflow & Analytics Summary'}</p>
        </div>
        <div class="meta-box">
          <div><strong>Generated:</strong> ${nowFormatted}</div>
          <div><strong>Records:</strong> ${data.length} Total</div>
          <div><strong>Confidential:</strong> Internal Business Report</div>
        </div>
      </div>

      ${metricsHtml}

      <table>
        ${theadHtml}
        ${tbodyHtml}
      </table>

      <div class="footer-note">
        <span>TaskFlow Pro Unified Operations Platform</span>
        <span>Page 1 of 1 • System Generated Record</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
