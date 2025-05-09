'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleGoogleDriveClick = () => {
    router.push('/googleDrive');
  };

  const handleDropboxClick = () => {
    router.push('/dropbox');
  };

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        TEST VECTORIZE-CONNECT-SDK
      </h1>
      
      <div style={{
        display: 'flex',
        gap: '20px'
      }}>
        <button 
          onClick={handleGoogleDriveClick}
          style={{
            backgroundColor: '#4285F4', // Google blue color
            color: 'white',
            padding: '12px 24px',
            fontSize: '1.2rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          GoogleDrive
        </button>

        <button 
          onClick={handleDropboxClick}
          style={{
            backgroundColor: '#0061FF', // Dropbox blue color
            color: 'white',
            padding: '12px 24px',
            fontSize: '1.2rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          Dropbox
        </button>
      </div>
    </main>
  );
}