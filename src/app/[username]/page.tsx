'use client'

import { useEffect, useState, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setTags } from "../../store/tagSlice";
import { useSearchParams, useRouter } from "next/navigation";
import { Tag, Artist, Album, UserInfo } from '../../models/tag'
import Image from 'next/image';
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


export default function UserPage({ params }: { params: { username: string } }) {

    const dispatch = useDispatch();
    const router = useRouter();
  
    const tags = useSelector((state: RootState) => state.tags.tags);

    const searchParams = useSearchParams();
    const timeRange = searchParams.get("timeRange") || "overall";
    const { username } = params;
    const [userInfo, setUserInfo] = useState<UserInfo>()

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
            
            const tagsResponse = Object.values(tagList).sort((a, b) => b.count - a.count);

            console.log(artistList)
            getArtistInfos(artistList.slice(0, 3), tagsResponse[0].artists.slice(0, 3))
            console.log(`Analyzed top ${countIterations} artists for that period`)

            getTopAlbumsPerTag(tagsResponse);            
        } catch (error) {
            console.error("Main error:", error);
        }
    }

    const getTopAlbumsPerTag = async (tagList: Tag[]) => {
        const tagResponseList: Tag[] = []

        const albumResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=hugofolloni&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&limit=700&period=${timeRange}`)
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
    
    const getArtistInfos = async (artists: Artist[], mainTagArtists: string[]) => {
        type ArtistInfoResponse = {
            tag: {
                photo: string,
                name: string
            } | null, 
            artist: {
                photo: string,
                name: string
            } | null,
        }

        const artistList: string[] = []
        const tagArtistList: string[] = []

        for(let i = 0; i < artists.length; i++){
            artistList.push(artists[i].name.toLowerCase());
        }

        for(let i = 0; i < mainTagArtists.length; i++){
            tagArtistList.push(mainTagArtists[i].toLowerCase())
        }

        console.log(artistList, tagArtistList)

        const response: ArtistInfoResponse = {tag: null, artist: null}

        const api = SpotifyApi.withClientCredentials(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT!,
            process.env.NEXT_PUBLIC_SPOTIFY_SECRET!
        );

        const items = await api.search(`${artistList.join(`,`)},${tagArtistList.join(`,`)}`, ["artist"]);

        console.log(items.artists)
        for(let i = 0; i < items.artists.items.length; i++){
            const item = items.artists.items[i];
            if((artistList.indexOf(item.name.toLowerCase()) !== -1 && !response.artist) || (response.artist && artistList.indexOf(item.name.toLowerCase()) < artistList.indexOf(response.artist.name.toLowerCase()))){
                response.artist = {photo: item.images[0].url, name: item.name}
            }

            if((tagArtistList.indexOf(item.name.toLowerCase()) !== -1 && !response.tag) || (response.tag && tagArtistList.indexOf(item.name.toLowerCase()) < tagArtistList.indexOf(response.tag.name.toLowerCase()))){
                response.tag = {photo: item.images[0].url, name: item.name}
            }
        }
    }
    
    useEffect(() => {
        getArtistTags();
        getUserInfos();
    }, [])


    return (
      <div className="user-wrapper">
        {(tags.length > 0 && userInfo && (
            <div className="tags-div">
                <Image src={userInfo.photo} alt="" width={256} height={256} />
                <h2>{userInfo.username}</h2>
                <p>{timeRange === "overall" ? "All time" : `Last ${timeRange}`}</p>
                <h2>Most listened tags</h2>
                { tags.map((tag: Tag): ReactNode => (
                    <div key={tag.name} className="tag-div" onClick={() => { router.push(`/${username}/${tag.name}?timeRange=${timeRange}`) }}>
                        <h3>{tag.name}</h3>
                    </div>
                ))}
            </div>
        )) || <h3>Loading...</h3>}
      </div>
    );
  }