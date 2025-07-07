# Configurazione Indice Geospaziale MongoDB (Obbligatorio)

Per far funzionare correttamente la ricerca di eventi in base alla posizione (filtro per raggio), è **assolutamente necessario** creare un indice geospaziale `2dsphere` sulla collezione `events` del tuo database MongoDB.

Senza questo indice, qualsiasi query di ricerca geografica fallirà con un errore simile a `unable to find index for $geoNear query`.

## Come Creare l'Indice

Puoi creare l'indice in due modi: tramite la **Mongo Shell** o l'interfaccia grafica di **MongoDB Atlas**.

### Metodo 1: Usando la Mongo Shell

1.  Connettiti al tuo database usando `mongosh` o il vecchio `mongo` shell.

2.  Seleziona il tuo database (il nome di default nel nostro progetto è `invibe`):
    \`\`\`sh
    use invibe
    \`\`\`

3.  Esegui il seguente comando per creare l'indice sul campo `locationCoords`:
    \`\`\`javascript
    db.events.createIndex({ "locationCoords": "2dsphere" })
    \`\`\`

    Dovresti ricevere un output di conferma come questo:
    \`\`\`json
    {
        "createdCollectionAutomatically": false,
        "numIndexesBefore": 1,
        "numIndexesAfter": 2,
        "ok": 1
    }
    \`\`\`

### Metodo 2: Usando MongoDB Atlas (Interfaccia Web)

1.  Accedi al tuo account MongoDB Atlas e vai al tuo Cluster.
2.  Clicca su **"Collections"** per vedere le tue collezioni di dati.
3.  Seleziona il database `invibe` e poi la collezione `events`.
4.  Vai alla tab **"Indexes"**.
5.  Clicca sul pulsante **"Create Index"**.
6.  Si aprirà una finestra di dialogo. Configura l'indice come segue:
    *   **Field**: Inserisci `locationCoords`.
    *   **Type**: Seleziona `2dsphere` dal menu a tendina.
7.  Lascia le altre opzioni ai loro valori di default e clicca su **"Create Index"**.

L'indice verrà creato in background. Una volta completato, la ricerca per raggio nella tua applicazione funzionerà correttamente.

**IMPORTANTE**: Questa operazione va eseguita **una sola volta**. Non è necessario ripeterla.
