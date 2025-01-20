'use client'

import { useEffect, useState, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setTags } from "../../store/tagSlice";
import { useSearchParams, useRouter } from "next/navigation";
import { Tag, Artist, Album } from '../../models/tag'

export default function UserPage({ params }: { params: { username: string } }) {


    const dispatch = useDispatch();
    const router = useRouter();
  
    const [iterationCount, setIterationCount] = useState(0)
    const tags = useSelector((state: RootState) => state.tags.tags);

    const searchParams = useSearchParams();
    const timeRange = searchParams.get("timeRange") || "overall";
    const { username } = params;
    
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
                        return tags;
                    })
                    .catch(error => {
                        console.error(`Error fetching tags for ${artist}:`, error);
                        return [];
                    })
            );
            
            await Promise.all(tagPromises);
            
            const tagsResponse = Object.values(tagList).sort((a, b) => b.count - a.count);

            setIterationCount(countIterations);
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
    
    useEffect(() => {
        getArtistTags();
    }, [])


    return (
      <div className="user-wrapper">
        {(tags.length > 0 && (
            <div className="tags-div">
                <span>{iterationCount} artists.</span>        
                <p>Selected Time Range: {timeRange}</p>
                { tags.map((tag: Tag): ReactNode => (
                    <div key={tag.name} className="tag-div" onClick={() => { router.push(`/${username}/${tag.name}?timeRange=${timeRange}`) }}>
                        <h3>{tag.name}</h3>
                        <span>{tag.count}</span>
                    </div>
                ))}
            </div>
        )) || <h3>Loading...</h3>}
      </div>
    );
  }