'use client'

import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useEffect, useState, ReactNode } from "react";
import { Album, Tag } from '../../../models/tag'
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
  const [mainAlbumImage, setMainAlbumImage] = useState<string>()

  const findSongsByArtists = async (artists: string[]) => {
    const artistSongs: Song[] = []

    const songsResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&period=${timeRange}&limit=1000`)
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

      try {
          const songData = await api.search(`${song.title},${song.artist}}`, ["track"], 'US', 10);
    
          for(let i = 0; i < songData.tracks.items.length; i++){
            const item = songData.tracks.items[i];
            if(item.artists[0].name.toLowerCase() === song.artist.toLowerCase() && item.name.toLowerCase() === song.title.toLowerCase()){
              apiImages.song = item.album.images[0].url;
              if (item.album.name.toLowerCase() === tagInfo?.albums[0].name.toLowerCase() && item.artists[0].name.toLowerCase() === tagInfo.albums[0].artist.toLowerCase()) setMainAlbumImage(item.album.images[0].url);
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
      }
      catch {
        if(!apiImages.artist) apiImages.artist = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        if(!apiImages.song) apiImages.song = 'https://images.unsplash.com/photo-1530288782965-fbad40327074?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
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
    if(selectedTag) {
      findSongsByArtists(selectedTag.artists)
      findTagSummary(selectedTag.name)
    }
  }, [tag, tags])

  const timeLabels = {
    'overall': "All time",
    '7day': 'Last 7 days',
    '1month': 'Last month',
    '3month': 'Last 3 months',
    '6month': 'Last 6 months',
    '12month': 'Last year'
}

  return (
    <div className='tag-wrapper'>
      {tagInfo && images && songs && (
        <div className='tags-div'>

            <div className="tags-profile">
                <div className="report-headline-border"/>
                <div className="tags-texts">
                    <h2>{tagInfo.name}</h2>
                    <h4>{tagInfo.count} scrobbles</h4>
                    <h5>{timeLabels[timeRange as keyof typeof timeLabels] || 'All time'}</h5>
                    <span>{summary}</span>
                </div>
            </div>

            <div className="most-listened-div">
              <div className="tag-artists">
                    <h2>artists</h2>
                    { images.artist && (
                        <a href={`https://www.last.fm/music/${tagInfo.artists[0].split(" ").join("+")}`}>
                            <div className="main-artist">
                                <Image src={images.artist} className='main-artist-img' alt='main tag image' width={1000} height={1000}/>
                                <div className="shadow"/>
                                <h3>{tagInfo.artists[0]}</h3>
                                <span className="identifier" style={{backgroundColor: "#FFCACE"}}>Top artist</span>
                            </div>                            
                        </a>
                    )}

                    { tagInfo.artists.slice(1, Math.min(50, tagInfo.artists.length)).map((artist: string): ReactNode => (
                        <a key={artist} href={`https://www.last.fm/music/${artist.split(" ").join("+")}`}>
                            <div className="tag-div">
                                <h3>{artist}</h3>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="tag-albums">
                    <h2>albums</h2>

                    <a href={`https://www.last.fm/music/${tagInfo.albums[0].artist.split(" ").join("+")}/${tagInfo.albums[0].name.split(" ").join("+")}`}>
                        <div className="main-album">
                            <Image src={mainAlbumImage ? mainAlbumImage : tagInfo.albums[0].image} className='main-album-img' alt='main album image' width={1000} height={1000}/>
                            <div className="shadow"/>
                            <h3>{tagInfo.albums[0].name}</h3>
                            <span className='image-add-info'>{tagInfo.albums[0].artist}</span>
                            <span className="identifier" style={{backgroundColor: "#50F0B5"}}>Top album</span>
                        </div>                            
                    </a>
                              
                    { tagInfo.albums.slice(1, Math.min(50, tagInfo.albums.length)).map((album: Album): ReactNode => (
                      <a key={album.name} href={`https://www.last.fm/music/${album.artist.split(" ").join("+")}/${album.name.split(" ").join("+")}`}>
                          <div className="tag-div">
                              <h3>{album.name}</h3>
                              <span>{album.artist}</span>
                          </div>
                      </a>
                  ))}

              </div>

              <div className="tag-songs">
                  <h2>songs</h2>
                  { images.song && (
                      <a href={`https://www.last.fm/music/${songs[0].artist.split(" ").join("+")}/_/${songs[0].title.split(" ").join("+")}`}>
                          <div className="main-artist">
                              <Image src={images.song} className='main-song-img' alt='main song image' width={1000} height={1000}/>
                              <div className="shadow"/>
                              <h3>{songs[0].title}</h3>
                              <span className='image-add-info'>{songs[0].artist}</span>
                              <span className="identifier" style={{backgroundColor: "#469DF8"}}>Top song</span>
                          </div>                            
                      </a>
                   )} 

                  { songs.slice(1, Math.min(50, songs.length)).map((song: Song): ReactNode => (
                      <a key={song.title} href={`https://www.last.fm/music/${song.artist.split(" ").join("+")}/_/${song.title.split(" ").join("+")}`}>
                          <div className="tag-div">
                              <h3>{song.title}</h3>
                              <span>{song.artist}</span>
                          </div>
                      </a>
                  ))}

              </div>
            </div>
        </div>
      ) || (
        <div className="loading-div">
            <h3>Loading...</h3>
        </div>
      )}
    </div>
  );
};