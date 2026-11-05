'use client';

import React from 'react';
import { AUDIENCE_LIST } from './constants';
import {
  GraduationCapIcon,
  BriefcaseIcon,
  UsersIcon,
  CheckIcon,
} from './LandingIcons';
import styles from './landing.module.css';

export default function Audience() {
  const renderAudienceIcon = (iconName: string) => {
    switch (iconName) {
      case 'students':
        return <GraduationCapIcon size={26} />;
      case 'professionals':
        return <BriefcaseIcon size={26} />;
      case 'teams':
        return <UsersIcon size={26} />;
      default:
        return <UsersIcon size={26} />;
    }
  };

  return (
    <section
      id="beneficios"
      className={`${styles.section} ${styles.sectionLight}`}
      aria-labelledby="audience-heading"
    >
      <div className={styles.landingContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrowLight}>Para Quem É</span>
          <h2 id="audience-heading" className={styles.sectionTitleLight}>
            Feito para quem busca organização sem complicação
          </h2>
          <p className={styles.sectionSubtitleLight}>
            Descubra como o Cortex adapta sua estrutura para atender necessidades individuais e coletivas.
          </p>
        </div>

        <div className={styles.audienceGrid}>
          {AUDIENCE_LIST.map((item) => (
            <div key={item.id} className={styles.audienceCardLight}>
              <div className={styles.audienceIconCircleLight}>
                {renderAudienceIcon(item.iconName)}
              </div>

              <div>
                <h3 className={styles.audienceTitleLight}>{item.title}</h3>
                <p className={styles.audienceSubtitleLight}>{item.subtitle}</p>
              </div>

              <ul className={styles.audienceList}>
                {item.benefits.map((benefit, index) => (
                  <li key={index} className={styles.audienceListItemLight}>
                    <span className={styles.audienceListIconLight} aria-hidden="true">
                      <CheckIcon size={18} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
