import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'DataDoctor — Evidence Intelligence',description:'Investigate the sources behind a report. See what connects, what is missing, and what deserves a second look.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
