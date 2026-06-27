// Mapa de nomes de países (em português) para códigos ISO usados pelo flagcdn.com
const COUNTRY_CODE: Record<string, string> = {
  'Marrocos': 'ma', 'Haiti': 'ht', 'Escócia': 'gb-sct',
  'Argentina': 'ar', 'Uruguai': 'uy', 'Colômbia': 'co', 'Equador': 'ec',
  'Peru': 'pe', 'Chile': 'cl', 'Venezuela': 've', 'Bolívia': 'bo', 'Paraguai': 'py',
  'EUA': 'us', 'Estados Unidos': 'us', 'México': 'mx', 'Canadá': 'ca',
  'Costa Rica': 'cr', 'Honduras': 'hn', 'El Salvador': 'sv', 'Jamaica': 'jm',
  'Panamá': 'pa', 'Trinidad e Tobago': 'tt', 'Guatemala': 'gt', 'Cuba': 'cu',
  'Alemanha': 'de', 'França': 'fr', 'Espanha': 'es', 'Portugal': 'pt',
  'Inglaterra': 'gb-eng', 'Bélgica': 'be', 'Holanda': 'nl', 'Países Baixos': 'nl',
  'Itália': 'it', 'Croácia': 'hr', 'Sérvia': 'rs', 'Suíça': 'ch',
  'Dinamarca': 'dk', 'Áustria': 'at', 'Ucrânia': 'ua', 'Polônia': 'pl',
  'Turquia': 'tr', 'Romênia': 'ro', 'Hungria': 'hu', 'Eslováquia': 'sk',
  'Eslovênia': 'si', 'República Tcheca': 'cz', 'Grécia': 'gr', 'Albânia': 'al',
  'Geórgia': 'ge', 'Noruega': 'no', 'Suécia': 'se', 'Finlândia': 'fi',
  'País de Gales': 'gb-wls', 'Irlanda': 'ie', 'Rússia': 'ru',
  'Japão': 'jp', 'Coreia do Sul': 'kr', 'Austrália': 'au', 'Irã': 'ir',
  'Arábia Saudita': 'sa', 'Qatar': 'qa', 'China': 'cn', 'Indonésia': 'id',
  'Uzbequistão': 'uz', 'Jordânia': 'jo', 'Iraque': 'iq', 'Emirados Árabes': 'ae',
  'Senegal': 'sn', 'Nigéria': 'ng', 'Gana': 'gh', 'Costa do Marfim': 'ci',
  'Camarões': 'cm', 'Egito': 'eg', 'Argélia': 'dz', 'Tunísia': 'tn',
  'África do Sul': 'za', 'Angola': 'ao', 'Mali': 'ml', 'Tanzânia': 'tz',
  'Congo': 'cg', 'Zâmbia': 'zm', 'Guiné': 'gn', 'Moçambique': 'mz',
  'Burquina Fasso': 'bf', 'Ruanda': 'rw', 'Cabo Verde': 'cv', 'Etiópia': 'et',
}

export function FlagIcon({ country, size = 18 }: { country: string; size?: number }) {
  const code = COUNTRY_CODE[country]
  if (!code) return null
  const w = Math.round(size * 1.5)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${w}x${size}/${code}.png`}
      alt={country}
      width={w}
      height={size}
      style={{ display: 'inline', verticalAlign: 'middle', borderRadius: 2 }}
    />
  )
}
