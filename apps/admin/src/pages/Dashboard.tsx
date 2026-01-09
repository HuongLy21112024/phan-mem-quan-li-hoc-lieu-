import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatNumber } from '@smartlearn/shared';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Users, BookOpen, FileText, Download, Eye, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalMaterials: number;
  totalDownloads: number;
  totalViews: number;
  usersByCampus: Record<string, number>;
  materialsByType: Record<string, number>;
}

interface DailyStats {
  date: string;
  downloads: number;
  views: number;
  uploads: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, dailyRes] = await Promise.all([
          api.get('/stats/overview'),
          api.get('/stats/daily', { params: { days: 7 } }),
        ]);
        setStats(overviewRes.data.data);
        setDailyStats(dailyRes.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: Users, color: 'border-blue-500', bg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'Khóa học', value: stats?.totalCourses || 0, icon: BookOpen, color: 'border-green-500', bg: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Học liệu', value: stats?.totalMaterials || 0, icon: FileText, color: 'border-purple-500', bg: 'bg-purple-50', iconColor: 'text-purple-500' },
    { label: 'Lượt tải xuống', value: stats?.totalDownloads || 0, icon: Download, color: 'border-orange-500', bg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Lượt xem', value: stats?.totalViews || 0, icon: Eye, color: 'border-pink-500', bg: 'bg-pink-50', iconColor: 'text-pink-500' },
  ];

  const lineChartData = {
    labels: dailyStats.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Lượt xem',
        data: dailyStats.map((d) => d.views),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Lượt tải',
        data: dailyStats.map((d) => d.downloads),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(stats?.materialsByType || {}),
    datasets: [
      {
        data: Object.values(stats?.materialsByType || {}),
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(236, 72, 153)',
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="stat-card border-gray-200 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hệ thống học liệu SmartLearn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stat.value)}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Hoạt động 7 ngày qua
          </h2>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Phân loại học liệu
          </h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
