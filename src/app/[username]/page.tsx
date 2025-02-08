'use client'

import { useEffect, useState, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Tag, Artist, Album, UserInfo, ArtistInfoResponse } from '../../models/tag'
import Image from 'next/image';
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { setTags } from "../../store/tagSlice";
import { setArtists } from "@/store/artistSlice";
import { setImages } from "@/store/imageSlice";

export default function UserPage() {
    const dispatch = useDispatch();
    const router = useRouter();
  
    const tags = useSelector((state: RootState) => state.tags.tags);
    const artists = useSelector((state: RootState) => state.artists.artists);
    const images = useSelector((state: RootState) => state.images.images)

    const searchParams = useSearchParams();
    const timeRange = searchParams.get("timeRange") || "overall";
    const params = useParams() as { username?: string };
    const username = params.username ?? ""; 
    const [userInfo, setUserInfo] = useState<UserInfo>()
    const [iterations, setIterations] = useState<number>();
    
    const getUserInfos = async () => {
        const userResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json`)
        const userData = await userResponse.json();

        setUserInfo({username: userData.user.name, photo: userData.user.image[3]["#text"]});
    }
    
    const getArtistTags = async () => {
        const artistList: Artist[] = [];
        const tagList: Record<string, Tag> = {};
        let countIterations = 0;
        try {
            const artistResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&limit=300&period=${timeRange}`); // overall | 7day | 1month | 3month | 6month | 12month
            const artistData = await artistResponse.json();
            
            for (let i = 0; i < artistData.topartists.artist.length; i++) {
                const artist = artistData.topartists.artist[i]
                artistList.push({name: artist.name, count: artist.playcount, tags: []});
            }
                        
            const tagPromises = artistList.map(artist =>
                fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&artist=${encodeURIComponent(artist.name)}`)
                    .then(res => res.json())
                    .then(data => {
                        const tags = data.toptags.tag.splice(0, Math.min(3, data.toptags.tag.length)) || [];
                        tags.forEach((tag: {count:number, name:string, url:string}) => {
                            const key = tag.name;

                            if (key !== 'seen live') {
                                if (!tagList[key]) {
                                    tagList[key] = {
                                        count: 0,
                                        artists: [],
                                        name: key,
                                        albums: []
                                    };
                                }

                                tagList[key].count += Number(artist.count);
                                if (!tagList[key].artists.includes(artist.name)) {
                                    tagList[key].artists.push(artist.name);
                                }

                                artist.tags.push(key)
                            }
                        });
                        countIterations++;
                    })
                    .catch(error => {
                        console.error(`Error fetching tags for ${artist}:`, error);
                        return [];
                    })
            );
            
            await Promise.all(tagPromises);
            
            const tagsResponse = sortTagsByArtistCount(artistList, Object.values(tagList).sort((a, b) => b.count - a.count));

            getArtistInfos(artistList[0].name, tagsResponse[0].artists.slice(0, 3))
            
            setIterations(countIterations);
            getTopAlbumsPerTag(tagsResponse);            
            dispatch(setArtists(artistList)); 
        } catch (error) {
            console.error("Main error:", error);
        }
    }

    const getTopAlbumsPerTag = async (tagList: Tag[]) => {
        const tagResponseList: Tag[] = []

        const albumResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&limit=700&period=${timeRange}`)
        const albumData = await albumResponse.json();

        const albumList: Album[] = []

        for (let i = 0; i < albumData.topalbums.album.length; i++) {
            const album = albumData.topalbums.album[i]
            albumList.push({name: album.name, artist: album.artist.name, image: album.image[2]["#text"]})
        }

        tagList.forEach((tag) => {
            const filteredAlbums = albumList.filter((album) => tag.artists.includes(album.artist));
            tagResponseList.push({...tag, albums: filteredAlbums })
          });

        dispatch(setTags(tagResponseList)); 

    }
    
    const getArtistInfos = async (artist: string, mainTagArtists: string[]) => {

        const tagArtistList: string[] = []
        
        for(let i = 0; i < mainTagArtists.length; i++){
            tagArtistList.push(mainTagArtists[i].toLowerCase())
        }

        const response: ArtistInfoResponse = {tag: null, artist: null}

        const api = SpotifyApi.withClientCredentials(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT!,
            process.env.NEXT_PUBLIC_SPOTIFY_SECRET!
        );

        try {
            const artistResponse = await api.search(artist, ["artist"], 'US', 50);    
            for(let i = 0; i < 50; i++){
                const item = artistResponse.artists.items[i];
                if(item.name.toLowerCase() === artist.toLowerCase()){
                    response.artist = {photo: item.images[0].url, name: item.name}
                    break;
                }
            }

            const tagResponse = await api.search(`${tagArtistList.join(',')}}`, ["artist"], 'US', 50);
            for(let i = 0; i < tagResponse.artists.items.length; i++){
                const item = tagResponse.artists.items[i];
                if((tagArtistList.indexOf(item.name.toLowerCase()) !== -1 && !response.tag) || (response.tag && tagArtistList.indexOf(item.name.toLowerCase()) !== -1 && tagArtistList.indexOf(item.name.toLowerCase()) < tagArtistList.indexOf(response.tag.name.toLowerCase()))){
                    response.tag = {photo: item.images[0].url, name: item.name}
                }
            }

            if(!response.artist?.photo) response.artist = {photo: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: artist}
            if(!response.tag?.photo) response.tag = {photo: 'https://images.unsplash.com/photo-1530288782965-fbad40327074?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: mainTagArtists[0]}
        }
        catch {
            if(!response.artist?.photo) response.artist = {photo: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: artist}
            if(!response.tag?.photo) response.tag = {photo: 'https://images.unsplash.com/photo-1530288782965-fbad40327074?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', name: mainTagArtists[0]}
        }

        dispatch(setImages(response))
    }

    const sortTagsByArtistCount = (artists: Artist[], tags: Tag[]) => {
        const artistMap = new Map(artists.map(artist => [artist.name, artist.count]));
      
        return tags.map(tag => ({
          ...tag,
          artists: [...tag.artists].sort((a, b) => 
            (artistMap.get(b) ?? 0) - (artistMap.get(a) ?? 0)
          ),
        }));
      }
    
    useEffect(() => {
        if (!username) return;
        getArtistTags();
        getUserInfos();
    }, [])

    const timeLabels = {
        'overall': "All time",
        '7day': 'Last 7 days',
        '1month': 'Last month',
        '3month': 'Last 3 months',
        '6month': 'Last 6 months',
        '12month': 'Last year'
    }


    return (
      <div className="user-wrapper">
        {(tags.length > 0 && userInfo && (
            <div className="user-div">
                <div className="user-profile">
                    <div className="report-headline-border"/>
                    <Image src={userInfo.photo} className="profile-pic" alt='Profile pic' width={1000} height={1000} />
                    <div className="user-texts">
                        <h2>{userInfo.username}</h2>
                        <span>{timeLabels[timeRange as keyof typeof timeLabels] || 'All time'}</span>
                        {iterations && <span>{iterations} most listened artists</span>}
                    </div>
                </div>
                <div className="most-listened-div">
                    <div className="tags">
                        <h2>Most listened tags</h2>

                        {images && images.tag && (
                            <div className="main-tag" onClick={() => { router.push(`/${username}/${tags[0].name}?timeRange=${timeRange}`) }}>
                                <Image src={images.tag.photo} className='main-tag-img' alt='main tag image' width={1000} height={1000}/>
                                <div className="shadow"/>
                                <h3>{tags[0].name}</h3>
                                <span className="identifier" >Top tag</span>
                            </div>
                        )}

                        { tags.slice(1, Math.min(50, tags.length)).map((tag: Tag): ReactNode => (
                            <div key={tag.name} className="tag-div" onClick={() => { router.push(`/${username}/${tag.name}?timeRange=${timeRange}`) }}>
                                <h3>{tag.name}</h3>
                            </div>
                        ))}
                    </div>
                    <div className="artists">
                        <h2>Most listened artists</h2>

                        {images && images.artist && (
                            <a href={`https://www.last.fm/music/${artists[0].name.split(" ").join("+")}`}>
                                <div className="main-artist">
                                    <Image src={images.artist.photo} className='main-artist-img' alt='main tag image' width={1000} height={1000}/>
                                    <div className="shadow"/>
                                    <h3>{artists[0].name}</h3>
                                    <span className="identifier" style={{backgroundColor: "#469DF8"}}>Top artist</span>
                                    <span className="main-tag">{artists[0].tags[0]}</span>
                                </div>                            
                            </a>
                        )}

                        { artists.slice(1, Math.min(50, artists.length)).map((artist: Artist): ReactNode => (
                            <a key={artist.name} href={`https://www.last.fm/music/${artist.name.split(" ").join("+")}`}>
                                <div className="tag-div">
                                    <h3>{artist.name}</h3>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        )) || (
            <div className="loading-div">
                <h3>Loading...</h3>
            </div>
        )}
      </div>
    );
  }