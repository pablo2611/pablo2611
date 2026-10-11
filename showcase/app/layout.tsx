import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import './globals.css';
export const metadata: Metadata = { title: 'Pablo Sánchez — Sistemas que conectan', description: 'Infraestructura, automatización e IA, y experiencias web. Explora las especialidades y proyectos de Pablo Sánchez.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="es"><body>{children}</body></html>; }
