'use client'

import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useEffect, useState } from 'react';

export default function TagPage({ params }: { params: { username: string, tag: string} }) {

  type Tag = {
    name: string,
    count: number,
    artists: string[]
}

  const { username, tag } = params;
  const tags = useSelector((state: RootState) => state.tags.tags);

  const [tagInfo, setTagInfo] = useState<Tag>()
  
  useEffect(() => {
    console.log(tags)
    const selectedTag = tags.find(currentTag => currentTag.name.toLowerCase() === tag.toLowerCase());
    setTagInfo(selectedTag)
  })

  return (
    <div>
      {tagInfo && (
        <div>
          <h1>{tagInfo.name}</h1>
          <p>Count: {tagInfo.count}</p>
          <p>Artists: {tagInfo.artists.join(', ')}</p>
        </div>
      )}
    </div>
  );
};