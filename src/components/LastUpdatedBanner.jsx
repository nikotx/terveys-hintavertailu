import { AlertCircle } from 'lucide-react'

export default function LastUpdatedBanner({ date }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>
        <strong>Huom:</strong> Hinnat ovat arvioita – ne eivät välttämättä ole ajantasaisia.
        Päivitetty viimeksi {date}. Tarkista hinnat aina suoraan palveluntarjoajalta ennen ajanvarausta.
        Voit päivittää hinnat muokkaamalla tiedostoa <code className="bg-amber-100 px-1 rounded">src/data/prices.json</code>.
      </span>
    </div>
  )
}
