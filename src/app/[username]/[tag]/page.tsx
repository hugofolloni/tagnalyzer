'use client'

import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useEffect, useState } from 'react';
import { Tag } from '../../../models/tag'
import Image from 'next/image';
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export default function TagPage() {

  type Song = {
    title: string,
    artist: string,
    count: number,
    url: string
  }

  type Images = {
    artist: string | undefined,
    song: string | undefined
  } 

  const searchParams = useSearchParams();
  const timeRange = searchParams.get("timeRange") || "overall";
  const params = useParams();
  const username = params.username as string;
  const tag = params.tag as string;
  const tags = useSelector((state: RootState) => state.tags.tags);

  const router = useRouter()

  const [tagInfo, setTagInfo] = useState<Tag>()
  const [summary, setSummary] = useState<string>()
  const [songs, setSongs] = useState<Song[]>([])
  const [images, setImages] = useState<Images>()

  const findSongsByArtists = async (artists: string[]) => {
    const artistSongs: Song[] = []

    const songsResponse = await fetch('https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=hugofolloni&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&period=7day&limit=500')
    const songsData = await songsResponse.json()

    for(let i = 0; i < songsData.toptracks.track.length; i++){
      const item = songsData.toptracks.track[i];
      const tagArtist = verifyArtistInList(item.artist.name, artists)
      if(tagArtist){
        artistSongs.push({title: item.name, artist: tagArtist, count: item.playcount, url: item.url})
      }
    }
    
    setSongs(artistSongs)
    findImages(artistSongs[0], artists[0])
  }

  const verifyArtistInList = (songArtist: string, tagArtists: string[]) => {
    for(let i = 0; i < tagArtists.length; i++){
      if(songArtist.toLowerCase() === tagArtists[i].toLowerCase()){
        return songArtist;
      }
    }
    return null;
  }

  const findImages = async(song: Song, artist: string) => {
      const api = SpotifyApi.withClientCredentials(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT!,
          process.env.NEXT_PUBLIC_SPOTIFY_SECRET!
      );

      const apiImages:Images = {song: undefined, artist: undefined}

      const songData = await api.search(`${song.title},${song.artist}}`, ["track"], 'US', 10);

      for(let i = 0; i < songData.tracks.items.length; i++){
        const item = songData.tracks.items[i];
        if(item.artists[0].name.toLowerCase() === song.artist.toLowerCase() && item.name.toLowerCase() === song.title.toLowerCase()){
          apiImages.song = item.album.images[0].url;
          break;
        }
      }

      const artistData = await api.search(artist, ["artist"], "US", 10); 
      
      for(let i = 0; i < artistData.artists.items.length; i++){
        const item = artistData.artists.items[i];
        if(item.name.toLowerCase() === artist.toLowerCase()){
          apiImages.artist = item.images[0].url;
          break;
        }
      }

      setImages(apiImages)
  }

  const findTagSummary = async(tag: string) => {
    const tagResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.getinfo&tag=${tag}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json`)
    const tagData = await tagResponse.json()
    const tagInfos = tagData.tag.wiki.summary.replace(/<[^>]*>/g, '').replace('Read more on Last.fm.', '');
    setSummary(tagInfos)
  }
  
  useEffect(() => {
    if(tags.length === 0) {
      router.push(`/${username}?timeRange=${timeRange}`);
    }
    const selectedTag = tags.find(currentTag => currentTag.name.toLowerCase() === tag.toLowerCase().replaceAll("%20", " "));
    setTagInfo(selectedTag)
    console.log(selectedTag)
    if(selectedTag) {
      findSongsByArtists(selectedTag.artists)
      findTagSummary(selectedTag.name)
    }
  }, [tag, tags])

  return (
    <div>
      {tagInfo && (
        <div>
          <h1>{tagInfo.name}</h1>
          <span>{summary}</span>
          <p>Count: {tagInfo.count}</p>
          {images && images.artist && <Image src={images.artist} alt="" width={100} height={100}/>}
          <p>Artists: {tagInfo.artists.join(', ')}</p>
          <p>Albums:</p>
          
          {tagInfo.albums.map(album => (
            <Image src={album.image} key={album.name} alt="" width={100} height={100}/>
          ))}

          {images && images.song && <Image src={images.song} alt="" width={100} height={100}/>}
          {songs && songs.map(song => (
            <div className="song-div" key={`${song.title},${song.artist}`}>
              <span>{song.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};