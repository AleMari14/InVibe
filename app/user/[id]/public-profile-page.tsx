import type { Metadata } from "next"

/**
 * Optional: dynamic metadata so the username appears in the tab title
 * (feel free to remove or adjust).
 */
export const metadata: Metadata = {
  title: "Profilo pubblico",
}

type PublicProfilePageProps = {
  params: { id: string }
}

/**
 * Public profile page for the user with the dynamic `[id]` param.
 * NOTE: This is a basic placeholder.  Replace the mocked data / UI with
 *       a real fetch to your user-profile API when ready.
 */
export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = params

  /* ------------------------------------------------------------------
   * TODO: Replace the mocked profile below with real data, e.g.
   * const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-profile/public-profile-route?id=${id}`);
   * if (!res.ok) notFound();
   * const profile = await res.json();
   * ------------------------------------------------------------------ */

  const mockedProfile = {
    name: "Nome Cognome",
    bio: "Questa è la bio dell’utente. Aggiorna questa sezione con dati reali.",
    avatar: "/placeholder-user.jpg",
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <section className="flex flex-col items-center gap-4 text-center">
        <img
          src={mockedProfile.avatar || "/placeholder.svg"}
          alt={`Avatar di ${mockedProfile.name}`}
          className="h-32 w-32 rounded-full object-cover shadow"
        />
        <h1 className="text-3xl font-semibold">{mockedProfile.name}</h1>
        <p className="text-muted-foreground">{mockedProfile.bio}</p>
      </section>

      <hr className="my-10" />

      <section>
        <h2 className="mb-4 text-2xl font-medium">Eventi pubblici</h2>
        {/* TODO: Render the user’s public events here */}
        <p className="text-muted-foreground">Nessun evento pubblico disponibile.</p>
      </section>
    </main>
  )
}
