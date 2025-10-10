import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppDispatch, useAppSelector } from '../hooks';
import { acknowledgeAlert, resolveAlert } from '../store/slices/alertSlice';
import { Alert } from '../types';
import { t } from "../i18n";

const Alerts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { alerts, isLoading } = useAppSelector((state) => state.alerts);

  const handleAcknowledge = (id: number) => {
    dispatch(acknowledgeAlert(id));
  };

  const handleResolve = (id: number) => {
    dispatch(resolveAlert(id));
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t('alertas_1')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        alert.status
                      )}`}
                    >
                      {alert.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {alert.message}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 space-x-2">
                  {alert.status === 'active' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      {t('reconocer')}</Button>
                  )}
                  {alert.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      onClick={() => handleResolve(alert.id)}
                    >
                      {t('resolver')}</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">
              {t('no_hay_alertas_activas')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('todas_las_alertas_han_sido_resueltas')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts; 