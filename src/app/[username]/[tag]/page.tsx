'use client'

import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useEffect, useState } from 'react';
import { Tag } from '../../../models/tag'
import Image from 'next/image';
import { useSearchParams, useRouter } from "next/navigation";


export default function TagPage({ params }: { params: { username: string, tag: string} }) {

  const searchParams = useSearchParams();
  const timeRange = searchParams.get("timeRange") || "overall";
  const { username, tag } = params;
  const tags = useSelector((state: RootState) => state.tags.tags);

  const router = useRouter()

  const [tagInfo, setTagInfo] = useState<Tag>()
  
  useEffect(() => {
    console.log(tags)
    if(tags.length === 0) {
      router.push(`/${username}?timeRange=${timeRange}`);
    }
    const selectedTag = tags.find(currentTag => currentTag.name.toLowerCase() === tag.toLowerCase().replaceAll("%20", " "));
    setTagInfo(selectedTag)
  }, [tag, tags])

  return (
    <div>
      {tagInfo && (
        <div>
          <h1>{tagInfo.name}</h1>
          <p>Count: {tagInfo.count}</p>
          <p>Artists: {tagInfo.artists.join(', ')}</p>
          <p>Albums:</p>
          {tagInfo.albums.map(album => (
            <Image src={album.image} key={album.name} alt="" width={100} height={100}/>
          ))}
        </div>
      )}
    </div>
  );
};