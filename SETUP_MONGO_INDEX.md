### Configurazione Indice Geospaziale su MongoDB

Per abilitare la ricerca di eventi basata sulla posizione (per raggio e vicinanza), è fondamentale creare un indice geospaziale `2dsphere` sulla collezione `events`.

**Come creare l'indice:**

Puoi eseguire questo comando direttamente nella `mongosh` (Mongo Shell) o tramite l'interfaccia utente del tuo provider di database (es. MongoDB Atlas).

1.  **Connettiti al tuo database.**
2.  **Seleziona il database corretto** (es. `use invibe`).
3.  **Esegui il seguente comando sulla collezione `events`**:

\`\`\`javascript
db.events.createIndex({ "locationCoords": "2dsphere" })
\`\`\`

**Cosa fa questo comando?**

Crea un indice speciale sul campo `locationCoords` che permette a MongoDB di eseguire query geospaziali in modo estremamente efficiente, come "trova tutti gli eventi entro un raggio di 10 km da un punto specifico".

**IMPORTANTE**: Senza questo indice, le funzionalità di ricerca per vicinanza e per raggio non funzioneranno e le richieste potrebbero fallire o essere molto lente.
