import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'EvidenceDoctor',description:'Before you trust the evidence, investigate the evidence behind it.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
