'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles/main.scss';
import { useDispatch } from "react-redux";
import { setTags } from "../store/tagSlice";


export default function HomePage() {
  const [username, setUsername] = useState('');
  const [timeRange, setTimeRange] = useState("overall");

  const router = useRouter();
  const dispatch = useDispatch();

  const handleSubmit = () => {
    if (username.trim()) {
      // Navigate to the specific page with the username and time range
      router.push(`/${username}?timeRange=${timeRange}`);
    } else {
      alert("Please enter a valid username.");
    }
  };

  const resetTags = () => {
    dispatch(setTags([]));
  }
  
  useEffect(() => {
    resetTags()
  })

  return (
    <div className="container">
      <div className="box">
        <h1>Enter Last.fm Username</h1>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} >
          <option value="overall">All Time</option>
          <option value="7day">7 Days</option>
          <option value="1month">1 Month</option>
          <option value="3month">3 Months</option>
          <option value="6month">6 Months</option>
          <option value="12month">12 Months</option>
        </select>
      <button onClick={() => handleSubmit()}>Search</button>
      </div>
    </div>
  );
}