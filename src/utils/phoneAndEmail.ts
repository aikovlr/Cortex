/**
 * Utilitários para validação de e-mail e formatação internacional de telefones.
 */

export interface CountryPhoneConfig {
  code: string; // Ex: '+55'
  country: string; // Ex: 'BR'
  name: string; // Ex: 'Brasil (+55)'
  flag: string; // Ex: '🇧🇷'
  placeholder: string;
  maxDigits: number;
}

export const COUNTRIES: CountryPhoneConfig[] = [
  // América do Sul
  { code: '+55', country: 'BR', name: 'Brasil (+55)', flag: '🇧🇷', placeholder: '(11) 98765-4321', maxDigits: 11 },
  { code: '+54', country: 'AR', name: 'Argentina (+54)', flag: '🇦🇷', placeholder: '11 1234-5678', maxDigits: 10 },
  { code: '+56', country: 'CL', name: 'Chile (+56)', flag: '🇨🇱', placeholder: '9 1234 5678', maxDigits: 9 },
  { code: '+57', country: 'CO', name: 'Colômbia (+57)', flag: '🇨🇴', placeholder: '300 123 4567', maxDigits: 10 },
  { code: '+51', country: 'PE', name: 'Peru (+51)', flag: '🇵🇪', placeholder: '912 345 678', maxDigits: 9 },
  { code: '+598', country: 'UY', name: 'Uruguai (+598)', flag: '🇺🇾', placeholder: '99 123 456', maxDigits: 8 },
  { code: '+595', country: 'PY', name: 'Paraguai (+595)', flag: '🇵🇾', placeholder: '981 123 456', maxDigits: 9 },
  { code: '+591', country: 'BO', name: 'Bolívia (+591)', flag: '🇧🇴', placeholder: '7123 4567', maxDigits: 8 },
  { code: '+593', country: 'EC', name: 'Equador (+593)', flag: '🇪🇨', placeholder: '99 123 4567', maxDigits: 9 },
  { code: '+58', country: 'VE', name: 'Venezuela (+58)', flag: '🇻🇪', placeholder: '412 123 4567', maxDigits: 10 },

  // América do Norte & Central
  { code: '+1', country: 'US', name: 'Estados Unidos / Canadá (+1)', flag: '🇺🇸', placeholder: '(202) 555-0143', maxDigits: 10 },
  { code: '+52', country: 'MX', name: 'México (+52)', flag: '🇲🇽', placeholder: '55 1234 5678', maxDigits: 10 },
  { code: '+506', country: 'CR', name: 'Costa Rica (+506)', flag: '🇨🇷', placeholder: '8312 3456', maxDigits: 8 },
  { code: '+507', country: 'PA', name: 'Panamá (+507)', flag: '🇵🇦', placeholder: '6123 4567', maxDigits: 8 },

  // Europa
  { code: '+351', country: 'PT', name: 'Portugal (+351)', flag: '🇵🇹', placeholder: '912 345 678', maxDigits: 9 },
  { code: '+34', country: 'ES', name: 'Espanha (+34)', flag: '🇪🇸', placeholder: '612 34 56 78', maxDigits: 9 },
  { code: '+44', country: 'GB', name: 'Reino Unido (+44)', flag: '🇬🇧', placeholder: '7911 123456', maxDigits: 10 },
  { code: '+33', country: 'FR', name: 'França (+33)', flag: '🇫🇷', placeholder: '6 12 34 56 78', maxDigits: 9 },
  { code: '+49', country: 'DE', name: 'Alemanha (+49)', flag: '🇩🇪', placeholder: '1512 3456789', maxDigits: 11 },
  { code: '+39', country: 'IT', name: 'Itália (+39)', flag: '🇮🇹', placeholder: '312 345 6789', maxDigits: 10 },
  { code: '+41', country: 'CH', name: 'Suíça (+41)', flag: '🇨🇭', placeholder: '78 123 45 67', maxDigits: 9 },
  { code: '+31', country: 'NL', name: 'Holanda (+31)', flag: '🇳🇱', placeholder: '6 12345678', maxDigits: 9 },
  { code: '+32', country: 'BE', name: 'Bélgica (+32)', flag: '🇧🇪', placeholder: '470 12 34 56', maxDigits: 9 },
  { code: '+353', country: 'IE', name: 'Irlanda (+353)', flag: '🇮🇪', placeholder: '83 123 4567', maxDigits: 9 },
  { code: '+46', country: 'SE', name: 'Suécia (+46)', flag: '🇸🇪', placeholder: '70 123 45 67', maxDigits: 9 },
  { code: '+47', country: 'NO', name: 'Noruega (+47)', flag: '🇳🇴', placeholder: '412 34 567', maxDigits: 8 },
  { code: '+45', country: 'DK', name: 'Dinamarca (+45)', flag: '🇩🇰', placeholder: '20 12 34 56', maxDigits: 8 },
  { code: '+48', country: 'PL', name: 'Polônia (+48)', flag: '🇵🇱', placeholder: '512 345 678', maxDigits: 9 },

  // Ásia e Oceania
  { code: '+81', country: 'JP', name: 'Japão (+81)', flag: '🇯🇵', placeholder: '90 1234 5678', maxDigits: 10 },
  { code: '+82', country: 'KR', name: 'Coreia do Sul (+82)', flag: '🇰🇷', placeholder: '10 1234 5678', maxDigits: 10 },
  { code: '+86', country: 'CN', name: 'China (+86)', flag: '🇨🇳', placeholder: '138 1234 5678', maxDigits: 11 },
  { code: '+91', country: 'IN', name: 'Índia (+91)', flag: '🇮🇳', placeholder: '98123 45678', maxDigits: 10 },
  { code: '+61', country: 'AU', name: 'Austrália (+61)', flag: '🇦🇺', placeholder: '412 345 678', maxDigits: 9 },
  { code: '+64', country: 'NZ', name: 'Nova Zelândia (+64)', flag: '🇳🇿', placeholder: '21 123 4567', maxDigits: 9 },
  { code: '+65', country: 'SG', name: 'Singapura (+65)', flag: '🇸🇬', placeholder: '8123 4567', maxDigits: 8 },
  { code: '+971', country: 'AE', name: 'Emirados Árabes (+971)', flag: '🇦🇪', placeholder: '50 123 4567', maxDigits: 9 },
  { code: '+972', country: 'IL', name: 'Israel (+972)', flag: '🇮🇱', placeholder: '50 123 4567', maxDigits: 9 },

  // África
  { code: '+27', country: 'ZA', name: 'África do Sul (+27)', flag: '🇿🇦', placeholder: '71 123 4567', maxDigits: 9 },
  { code: '+244', country: 'AO', name: 'Angola (+244)', flag: '🇦🇴', placeholder: '923 123 456', maxDigits: 9 },
  { code: '+258', country: 'MZ', name: 'Moçambique (+258)', flag: '🇲🇿', placeholder: '84 123 4567', maxDigits: 9 },
  { code: '+238', country: 'CV', name: 'Cabo Verde (+238)', flag: '🇨🇻', placeholder: '991 23 45', maxDigits: 7 },
];

/**
 * Validação estrita de e-mail com TLD real (evita 'usuario@algo' sem domínio completo)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Aplica formatação visual inteligente conforme o DDI selecionado
 */
export function formatPhoneNumber(rawDigits: string, countryCode: string): string {
  const digits = rawDigits.replace(/\D/g, '');

  switch (countryCode) {
    case '+55': {
      // Brasil: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      const d = digits.slice(0, 11);
      if (d.length === 0) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }
    case '+1': {
      // EUA / Canadá: (XXX) XXX-XXXX
      const d = digits.slice(0, 10);
      if (d.length === 0) return '';
      if (d.length <= 3) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    }
    case '+351':
    case '+51':
    case '+595':
    case '+244': {
      // Padrão 3-3-3: 912 345 678
      const d = digits.slice(0, 9);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
    }
    case '+44': {
      // Reino Unido: 7911 123456
      const d = digits.slice(0, 10);
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 10)}`;
    }
    case '+34': {
      // Espanha: 612 34 56 78
      const d = digits.slice(0, 9);
      if (d.length <= 3) return d;
      if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
      if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    }
    case '+54':
    case '+52': {
      // Argentina / México: 11 1234-5678
      const d = digits.slice(0, 10);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6, 10)}`;
    }
    case '+57':
    case '+91': {
      // Colômbia / Índia: 5-5 ou 3-3-4
      const d = digits.slice(0, 10);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
    }
    case '+81':
    case '+82': {
      // Japão / Coreia: 2-4-4 ou 3-4-4
      const d = digits.slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    }
    case '+86': {
      // China: 138 1234 5678 (11 dígitos)
      const d = digits.slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)}`;
    }
    case '+598':
    case '+591':
    case '+65':
    case '+45': {
      // 8 dígitos (4-4): 9912 3456
      const d = digits.slice(0, 8);
      if (d.length <= 4) return d;
      return `${d.slice(0, 4)} ${d.slice(4, 8)}`;
    }
    default: {
      // Formato geral agrupando blocos de 3 ou 4
      const d = digits.slice(0, 12);
      if (d.length <= 4) return d;
      if (d.length <= 8) return `${d.slice(0, 4)} ${d.slice(4)}`;
      return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 12)}`;
    }
  }
}

/**
 * Converte um telefone completo do banco (ex: "+55 (11) 98765-4321") em { countryCode, localNumber }
 * Ordena os códigos por comprimento decrescente para não confundir ex: '+55' com '+5'
 */
export function parseStoredPhone(fullPhone?: string | null): { countryCode: string; localNumber: string } {
  if (!fullPhone) {
    return { countryCode: '+55', localNumber: '' };
  }

  const trimmed = fullPhone.trim();
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  const match = sortedCountries.find((c) => trimmed.startsWith(c.code));

  if (match) {
    const remaining = trimmed.slice(match.code.length).trim();
    return {
      countryCode: match.code,
      localNumber: formatPhoneNumber(remaining, match.code),
    };
  }

  // Se não encontrar prefixo internacional, assume +55 por padrão
  return {
    countryCode: '+55',
    localNumber: formatPhoneNumber(trimmed, '+55'),
  };
}

/**
 * Junta DDI e número local para salvar no banco / enviar na API
 */
export function buildFullPhone(countryCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return '';
  return `${countryCode} ${formatPhoneNumber(digits, countryCode)}`;
}
