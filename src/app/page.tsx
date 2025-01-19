'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles/main.scss';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleRedirect = () => {
    if (username.trim()) {
      router.push(`/user/${username}`);
    }
  };

  return (
    <div className="container">
      <div className="box">
        <h1>Enter Last.fm Username</h1>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={() => handleRedirect()}>Search</button>
      </div>
    </div>
  );
}