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
    <div className="home-wrapper">
        <div className="title-div">
          <span>Find what you love</span>
          <span>in what you like</span>
        </div>
        <div className="subtitle-div">
          <span>Learn about the tags you most listen on Last.fm.</span>
          <span>hich artists, albums and songs make your love that kind of music.</span>
        </div>
        <div className="input-div">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <div className='underline' />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} >
            <option value="overall">All Time</option>
            <option value="7day">7 Days</option>
            <option value="1month">1 Month</option>
            <option value="3month">3 Months</option>
            <option value="6month">6 Months</option>
            <option value="12month">12 Months</option>
          </select>
          <div className='select-underline' />
          <div className='search-button' onClick={() => handleSubmit()}>Search</div>
          <div className="search-button-background" />
        </div>
    </div>
  );
}