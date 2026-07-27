import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, MapPin, Layers, RefreshCw, Bell, Shield } from 'lucide-react';

export default function WhySection() {
  const { t, i18n } = useTranslation();
  const isMl = i18n.language === 'ml';

  const localDescs = {
    en: {
      classification: "Automatically categorizes and routes complaints to corresponding departments using advanced machine learning.",
      gps: "Pins precise coordinates of civic issues automatically, ensuring department dispatch teams know exactly where to go.",
      duplicate: "Groups identical issues reported by multiple citizens under a single thread to save resources and prevent duplicate work.",
      tracking: "Provides complete visual progress from registration, officer assignment, work-in-progress, to resolution.",
      notify: "Keeps you updated at every milestone with automated text, email, and in-app dashboard alerts.",
      governance: "Ensures accountability with public dashboards, open statistics, and verified resolution tracking."
    },
    ml: {
      classification: "അഡ്വാൻസ്ഡ് മെഷീൻ ലേണിംഗ് ഉപയോഗിച്ച് പരാതികൾ തരംതിരിച്ച് ബന്ധപ്പെട്ട വകുപ്പുകളിലേക്ക് വേഗത്തിൽ അയക്കുന്നു.",
      gps: "പ്രശ്നങ്ങളുടെ കൃത്യമായ സ്ഥാനം ജി.പി.എസ് വഴി നിർണ്ണയിക്കുന്നു, ഇത് ജീവനക്കാർക്ക് കൃത്യമായി പ്രശ്ന സ്ഥലത്ത് എത്താൻ സഹായിക്കുന്നു.",
      duplicate: "പലരും ഒരേ വിഷയം പരാതിപ്പെടുമ്പോൾ അത് ഒരു ഗ്രൂപ്പായി തിരിച്ച് ആവർത്തന ജോലികൾ ഒഴിവാക്കുന്നു.",
      tracking: "പരാതി രജിസ്റ്റർ ചെയ്തത് മുതൽ ഉദ്യോഗസ്ഥരെ ചുമതലപ്പെടുത്തുന്നതും പരിഹരിക്കുന്നതു വരെയുള്ള വിവരങ്ങൾ പൂർണ്ണമായി നിരീക്ഷിക്കാം.",
      notify: "പരാതിയുടെ ഓരോ ഘട്ടത്തിലും ഓട്ടോമേറ്റഡ് എസ്.എം.എസ്, ഇമെയിൽ വഴി അറിയിപ്പുകൾ നിങ്ങൾക്ക് ലഭിക്കുന്നു.",
      governance: "സുതാര്യമായ ഡാഷ്‌ബോർഡുകൾ, പൊതുവായ സ്റ്റാറ്റിസ്റ്റിക്‌സ് എന്നിവയിലൂടെ ഭരണത്തിൽ സുതാര്യതയും വിശ്വാസ്യതയും ഉറപ്പാക്കുന്നു."
    }
  };

  const currentDescs = isMl ? localDescs.ml : localDescs.en;

  const features = [
    {
      key: 'classification',
      icon: Cpu,
      color: 'green'
    },
    {
      key: 'gps',
      icon: MapPin,
      color: 'blue'
    },
    {
      key: 'duplicate',
      icon: Layers,
      color: 'green'
    },
    {
      key: 'tracking',
      icon: RefreshCw,
      color: 'blue'
    },
    {
      key: 'notify',
      icon: Bell,
      color: 'green'
    },
    {
      key: 'governance',
      icon: Shield,
      color: 'blue'
    }
  ];

  return (
    <section className="section-padding" id="why-us" style={{ background: '#ffffff' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">{t('why.title')}</span>
          <h2 className="section-title">{t('why.title')}</h2>
          <p className="section-desc">
            GramConnect bridges the communication gap between citizens and local administrative departments, creating a more responsive local government.
          </p>
        </div>

        <div className="why-grid">
          {features.map((feat) => {
            const IconComp = feat.icon;
            return (
              <div key={feat.key} className="why-card">
                <div className={`why-icon-box ${feat.color === 'blue' ? 'blue' : ''}`}>
                  <IconComp size={24} />
                </div>
                <h3 className="why-title">
                  {t(`why.feat_${feat.key}`)}
                </h3>
                <p className="why-desc">
                  {currentDescs[feat.key]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
