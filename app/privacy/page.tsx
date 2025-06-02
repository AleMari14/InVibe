export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Informativa sulla Privacy</h1>

      <div className="prose max-w-none">
        <p className="mb-4">
          La tua privacy è importante per noi. Questa informativa sulla privacy spiega come raccogliamo, utilizziamo e
          proteggiamo i tuoi dati personali.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Raccolta dei Dati</h2>
        <p className="mb-4">
          Raccogliamo informazioni quando ti registri sul nostro sito, effettui un login, prenoti un evento o compili un
          modulo. Le informazioni raccolte includono il tuo nome, indirizzo email, numero di telefono e preferenze.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Utilizzo dei Dati</h2>
        <p className="mb-4">Utilizziamo i dati raccolti per:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Personalizzare la tua esperienza</li>
          <li>Migliorare il nostro sito web</li>
          <li>Elaborare transazioni</li>
          <li>Inviare email periodiche</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Protezione dei Dati</h2>
        <p className="mb-4">
          Implementiamo una varietà di misure di sicurezza per mantenere la sicurezza delle tue informazioni personali.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Cookie</h2>
        <p className="mb-4">
          Utilizziamo i cookie per migliorare l'accesso al nostro sito e identificare i visitatori di ritorno.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Divulgazione a Terzi</h2>
        <p className="mb-4">
          Non vendiamo, scambiamo o trasferiamo in altro modo a terzi le tue informazioni personali identificabili.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Consenso</h2>
        <p className="mb-4">Utilizzando il nostro sito, acconsenti alla nostra informativa sulla privacy.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Modifiche all'Informativa sulla Privacy</h2>
        <p className="mb-4">
          Eventuali modifiche alla nostra informativa sulla privacy saranno pubblicate su questa pagina.
        </p>
      </div>
    </div>
  )
}
