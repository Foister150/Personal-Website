import React from 'react';

type Props = {
  postCount: number;
};

export default function StatusBar({postCount}: Props): JSX.Element {
  const postLabel = String(postCount).padStart(3, '0');
  return (
    <div className="status-bar">
      <span className="status-online">EDITORIAL CHANNEL / READY</span>
      <span>RESEARCH NOTES + AFTER-ACTION REPORTS</span>
      <span>POSTS // {postLabel}</span>
    </div>
  );
}
