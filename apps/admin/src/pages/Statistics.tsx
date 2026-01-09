import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CAMPUS_LABELS, formatNumber } from '@smartlearn/shared';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, MapPin, FileText, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MaterialStats {
  byType: { _id: string; count: number; totalDownloads: number }[];
  byDepartment: { _id: string; count: number; totalDownloads: number }[];
  topDownloaded: { material_id: string; title: string; download_count: number }[];
}

interface CampusStats {
  campus: string;
  users: number;
  courses: number;
  materials: number;
}

export default function Statistics() {
  const [materialStats, setMaterialStats] = useState<MaterialStats | null>(null);
  const [campusStats, setCampusStats] = useState<CampusStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, hanoiRes, danangRes, hcmRes] = await Promise.all([
          api.get('/stats/materials'),
          api.get('/stats/campus/hanoi'),
          api.get('/stats/campus/danang'),
          api.get('/stats/campus/hcm'),
        ]);

        setMaterialStats(materialsRes.data.data);
        setCampusStats([
          hanoiRes.data.data,
          danangRes.data.data,
          hcmRes.data.data,
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const campusBarData = {
    labels: campusStats.map((c) => CAMPUS_LABELS[c.campus]),
    datasets: [
      {
        label: 'Người dùng',
        data: campusStats.map((c) => c.users),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Khóa học',
        data: campusStats.map((c) => c.courses),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Học liệu',
        data: campusStats.map((c) => c.materials),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
      },
    ],
  };

  const typeData = {
    labels: materialStats?.byType.map((t) => t._id) || [],
    datasets: [
      {
        data: materialStats?.byType.map((t) => t.count) || [],
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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Thống kê chi tiết</h1>
        <p className="text-gray-500">Phân tích dữ liệu hệ thống theo thời gian thực</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Thống kê theo cơ sở
          </h2>
          <div className="h-64">
            <Bar
              data={campusBarData}
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

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Học liệu theo loại
          </h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={typeData}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Top học liệu được tải nhiều nhất
          </h2>
          <div className="space-y-3">
            {materialStats?.topDownloaded.slice(0, 10).map((item, index) => (
              <div
                key={item.material_id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatNumber(item.download_count)} lượt tải
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Học liệu theo khoa
          </h2>
          <div className="space-y-3">
            {materialStats?.byDepartment.slice(0, 10).map((dept) => (
              <div
                key={dept._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{dept._id}</span>
                <div className="text-sm text-gray-500">
                  <span>{formatNumber(dept.count)} học liệu</span>
                  <span className="mx-2">|</span>
                  <span>{formatNumber(dept.totalDownloads)} lượt tải</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
