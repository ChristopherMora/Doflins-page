import Link from "next/link";

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-[#d3debb] bg-gradient-to-br from-[#f9faf5] to-[#f5f8e8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div>
            <h3 className="mb-4 font-title text-lg font-bold text-[#1f2a1a]">
              DOFLINS
            </h3>
            <p className="text-sm text-[#3d5230]">
              Colección oficial de figuras con rareza verificada. 
              Dos universos, infinitas posibilidades.
            </p>
            <p className="mt-4 text-xs text-[#3d5230]">
              🛠️ Creado por <strong>DOFER</strong>
            </p>
            <p className="text-xs text-[#3d5230]">
              🇲🇽 Hecho con pasión en México
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="mb-4 font-semibold text-[#1f2a1a]">Tienda</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/shop" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link 
                  href="/reveal" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Revelar Pack
                </Link>
              </li>
              <li>
                <Link 
                  href="/coleccion" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Mi Colección
                </Link>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div>
            <h4 className="mb-4 font-semibold text-[#1f2a1a]">Información</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/acerca" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Acerca de DOFLINS
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link 
                  href="/envios" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Envíos
                </Link>
              </li>
              <li>
                <Link 
                  href="/devoluciones" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-[#1f2a1a]">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/terminos" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacidad" 
                  className="text-[#3d5230] transition-colors hover:text-[#4e6f2a] hover:underline"
                >
                  Aviso de Privacidad
                </Link>
              </li>
            </ul>

            {/* Redes sociales */}
            <div className="mt-6">
              <h5 className="mb-3 text-sm font-semibold text-[#1f2a1a]">Síguenos</h5>
              <div className="flex gap-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/doferworkshop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram DOFER Workshop"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f2d0] text-[#4e6f2a] transition-colors hover:bg-[#4e6f2a] hover:text-white"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/profile.php?id=61554032801394"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook DOFER"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f2d0] text-[#4e6f2a] transition-colors hover:bg-[#4e6f2a] hover:text-white"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@dofershop"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok DOFER Shop"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f2d0] text-[#4e6f2a] transition-colors hover:bg-[#4e6f2a] hover:text-white"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-[#d3debb] pt-8 text-center">
          <p className="text-xs text-[#3d5230]">
            © {new Date().getFullYear()} DOFLINS. Todos los derechos reservados.
          </p>
          <p className="mt-1 text-xs text-[#3d5230]">
            Desarrollado en México 🇲🇽 • <Link href="https://doflins.dofer.mx" className="hover:underline">doflins.dofer.mx</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
