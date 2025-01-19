'use client'

import { useEffect, useState, ReactNode } from "react";

export default function UserPage({ params }: { params: { username: string } }) {
    type Artist = {
        name: string,
        count: number
    }

    type Tag = {
        name: string,
        count: number,
        artists: string[]
    }

    const [tags, setTags] = useState<Tag[]>([])
    const [iterationCount, setIterationCount] = useState(0)

    const { username } = params;
    
    const getArtistTags = async () => {
        const artistList: Artist[] = [];
        const tagList: Record<string, Tag> = {};
        let countIterations = 0;
        try {
            const artistResponse = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=db71a72bd8840bf1b346579cc1ed4e71&format=json&limit=300&period=7day` // overall | 7day | 1month | 3month | 6month | 12month
            );
            const artistData = await artistResponse.json();
            
            for (let i = 0; i < artistData.topartists.artist.length; i++) {
                const artist = artistData.topartists.artist[i]
                artistList.push({name: artist.name, count: artist.playcount});
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
                                        name: key
                                    };
                                }

                                tagList[key].count += Number(artist.count);
                                if (!tagList[key].artists.includes(artist.name)) {
                                    tagList[key].artists.push(artist.name);
                                }
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
            
            console.log(tags)

            setTags(Object.values(tagList).sort((a, b) => b.count - a.count))
            setIterationCount(countIterations)
            
        } catch (error) {
            console.error("Main error:", error);
        }
    }
    
    useEffect(() => {
        getArtistTags();
    }, [])


    return (
      <div className="user-wrapper">
        {(tags.length > 0 && (
            <div className="tags-div">
                <span>{iterationCount} artists.</span>        
                { tags.map((tag: Tag): ReactNode => (
                    <div key={tag.name} className="tag-div">
                        <h3>{tag.name}</h3>
                        <span>{tag.count}</span>
                    </div>
                ))}
            </div>
        )) || <h3>Loading...</h3>}
      </div>
    );
  }