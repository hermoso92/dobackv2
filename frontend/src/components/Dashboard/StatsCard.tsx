import React from 'react';
import { IconType } from 'react-icons';
import {
  FaTruck,
  FaClock,
  FaChartBar,
  FaExclamation,
  FaExclamationTriangle,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

interface StatsCardProps {
  title: string;
  value: number;
  icon: 'truck' | 'clock' | 'chart-bar' | 'exclamation' | 'exclamation-triangle' | 'check-circle' | 'exclamation-circle';
}

const iconMap: Record<StatsCardProps['icon'], IconType> = {
  truck: FaTruck,
  clock: FaClock,
  'chart-bar': FaChartBar,
  exclamation: FaExclamation,
  'exclamation-triangle': FaExclamationTriangle,
  'check-circle': FaCheckCircle,
  'exclamation-circle': FaExclamationCircle,
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  const Icon = iconMap[icon];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
};
