import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const BinaryTimeSeriesChart = ({ nodeId }) => {
  const chartRef = useRef(null);
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    if (nodeId) {
      fetch(`http://localhost:8000/get-active-status?node=${nodeId}`)
        .then((res) => res.json())
        .then((data) => {
          const parsedData = data.map(entry => ({
            timestamp: entry['m2m:cin'].ct,
            status: parseInt(entry['m2m:cin'].con, 10)
          }));
          setStatusData(parsedData);
        })
        .catch((err) => console.error('Error fetching status data:', err));
    }
  }, [nodeId]);

  useEffect(() => {
    if (!statusData.length) return () => {};

    const createChart = () => {
      // Cleanup previous chart if it exists
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }

      const formatTimestamp = (timestamp) => {
        const year = timestamp.slice(0, 4);
        const month = timestamp.slice(4, 6);
        const day = timestamp.slice(6, 8);
        const hour = timestamp.slice(9, 11);
        const minute = timestamp.slice(11, 13);
        return new Date(year, month - 1, day, hour, minute).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const labels = statusData.map(item => formatTimestamp(item.timestamp));
      const data = statusData.map(item => item.status);

      const ctx = chartRef.current.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Status',
            data,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderWidth: 2,
            fill: false,
            stepped: true,
            pointRadius: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return context.parsed.y === 1 ? 'Active' : 'Inactive';
                }
              }
            },
            datalabels: {
              display: false
            }
          },
          scales: {
            y: {
              min: -0.1,
              max: 1.1,
              ticks: {
                stepSize: 1,
                callback(value) {
                  if (value === 0) return 'Inactive';
                  if (value === 1) return 'Active';
                  return '';
                }
              },
              grid: {
                color: '#eeeeee'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 6
              }
            }
          }
        }
      });

      // Store chart instance on the ref itself
      chartRef.current.chart = chart;
    };

    createChart();

    return () => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.destroy();
      }
    };
  }, [statusData]);

  return (
    <div style={{ width: '100%', height: '110px', marginTop: '28px' }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default BinaryTimeSeriesChart;