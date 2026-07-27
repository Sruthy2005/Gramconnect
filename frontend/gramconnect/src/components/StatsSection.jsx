import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckSquare, Users, Landmark } from 'lucide-react';

export default function StatsSection() {
  const { t } = useTranslation();

  const statsData = [
    {
      key: 'total',
      number: '12,840',
      growth: t('stats.month_total'),
      icon: FileText,
      colorClass: 'green'
    },
    {
      key: 'resolved',
      number: '11,205',
      growth: t('stats.month_resolved'),
      icon: CheckSquare,
      colorClass: 'blue'
    },
    {
      key: 'citizens',
      number: '45,210',
      growth: t('stats.month_citizens'),
      icon: Users,
      colorClass: 'green'
    },
    {
      key: 'depts',
      number: '18',
      growth: t('stats.all_panchayats'),
      icon: Landmark,
      colorClass: 'blue',
      isDept: true
    }
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {statsData.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.key} className="glass-card stat-card">
                <div className="stat-header">
                  <div className={`stat-icon-box ${stat.colorClass === 'blue' ? 'blue' : ''}`}>
                    <IconComponent size={24} />
                  </div>
                  <span className={`stat-growth ${stat.isDept ? 'blue' : ''}`}>
                    {stat.growth}
                  </span>
                </div>
                <h3 className="stat-number">{stat.number}</h3>
                <p className="stat-label">{t(`stats.${stat.key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
