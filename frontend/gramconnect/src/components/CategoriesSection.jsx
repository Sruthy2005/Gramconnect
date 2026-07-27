import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { handleCategoryClick } from '../utils/authNavigation';
import { 
  Hammer, 
  Droplets, 
  Trash2, 
  Wrench, 
  Lightbulb, 
  Trees, 
  Landmark, 
  Compass, 
  Map, 
  PawPrint 
} from 'lucide-react';

export default function CategoriesSection() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const categories = [
    { key: 'road', icon: Hammer },
    { key: 'drainage', icon: Droplets },
    { key: 'waste', icon: Trash2 },
    { key: 'water', icon: Wrench },
    { key: 'light', icon: Lightbulb },
    { key: 'vegetation', icon: Trees },
    { key: 'property', icon: Landmark },
    { key: 'pathway', icon: Compass },
    { key: 'land', icon: Map },
    { key: 'animal', icon: PawPrint }
  ];

  return (
    <section className="section-padding" id="report-category">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">{t('overview.categories_title')}</span>
          <h2 className="section-title">
            {t('overview.categories_title')}
          </h2>
          <p className="section-desc">
            Select a category to report a new civic issue. Our AI engine automatically logs, tags, and forwards reports to local authorities.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div 
                key={cat.key} 
                className="category-card"
                onClick={() => handleCategoryClick(cat.key, user)}
              >
                <div className="category-icon-box">
                  <IconComp size={24} />
                </div>
                <h4 className="category-title">
                  {t(`categories.${cat.key}`)}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

