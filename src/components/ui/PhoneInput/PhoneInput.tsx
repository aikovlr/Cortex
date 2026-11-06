'use client';

import React from 'react';
import { COUNTRIES, CountryPhoneConfig, formatPhoneNumber } from '@/utils/phoneAndEmail';
import styles from './phoneInput.module.css';

export type PhoneInputVariant = 'auth' | 'dashboard';

interface PhoneInputProps {
  id?: string;
  countryCode: string;
  localNumber: string;
  onCountryChange: (countryCode: string) => void;
  onNumberChange: (localNumber: string) => void;
  disabled?: boolean;
  variant?: PhoneInputVariant;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  id = 'telefone',
  countryCode,
  localNumber,
  onCountryChange,
  onNumberChange,
  disabled = false,
  variant = 'dashboard',
}) => {
  const currentConfig: CountryPhoneConfig =
    COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    onCountryChange(newCode);
    const rawDigits = localNumber.replace(/\D/g, '');
    onNumberChange(formatPhoneNumber(rawDigits, newCode));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneNumber(rawDigits, countryCode);
    onNumberChange(formatted);
  };

  const isAuth = variant === 'auth';
  const containerClass = `${styles.phoneContainer} ${isAuth ? styles.authContainer : styles.dashboardContainer}`;
  const selectClass = isAuth ? styles.authSelect : styles.dashboardSelect;
  const inputClass = isAuth ? styles.authInput : styles.dashboardInput;

  return (
    <div className={containerClass}>
      <select
        value={countryCode}
        onChange={handleCountrySelect}
        disabled={disabled}
        aria-label="Código do País (DDI)"
        className={selectClass}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        disabled={disabled}
        placeholder={currentConfig.placeholder}
        value={localNumber}
        onChange={handleInputChange}
        className={inputClass}
        autoComplete="tel-national"
      />
    </div>
  );
};
