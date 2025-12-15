import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-removebg.png"
            alt="E-Voting Platform"
            width={120}
            height={120}
            priority
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          E-Voting Platform
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Plateforme de vote électronique sécurisée avec chiffrement de bout en bout
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold leading-6"
          >
            Créer un compte <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
