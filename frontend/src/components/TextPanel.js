import React from 'react';
import { Box, Typography } from '@mui/material';

const textAlignments = {
  "custom": {x: 0, y: 0},
  "top-left": {x: 10, y: 10},
  "top-center": {x: "(w-text_w)/2", y: 10},
  "top-right": {x: "(w-text_w)-10", y: 10},
  "middle-left": {x: 10, y: "(h-text_h)/2"},
  "middle-center": {x: "(w-text_w)/2", y: "(h-text_h)/2"},
  "middle-right": {x: "(w-text_w)-10", y: "(h-text_h)/2"},
  "bottom-left": {x: 10, y: "(h-text_h)-10"},
  "bottom-center": {x: "(w-text_w)/2", y: "(h-text_h)-10"},
  "bottom-right": {x: "(w-text_w)-10", y: "(h-text_h)-10"}
}

export default function TextPanel({ videoFile, videoURL, textOverlay, setTextOverlay, textApplying, textStatus, handleTextApply }) {

  const handleSetAlignment = (alignment) => {
    setTextOverlay({
      ...textOverlay,
      x: textAlignments[alignment].x,
      y: textAlignments[alignment].y,
    });
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mb: 2, mt: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Add Text Overlay</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
        
        <input type="text" placeholder="Enter text" value={textOverlay.text} onChange={e => setTextOverlay({ ...textOverlay, text: e.target.value })} style={{ width: 120 }} />
        <select value={textOverlay.font} onChange={e => setTextOverlay({ ...textOverlay, font: e.target.value })}>
          <option value="Arial">Arial</option>
          <option value="Roboto">Roboto</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
        
        <input type="number" min={10} max={100} value={textOverlay.size} onChange={e => setTextOverlay({ ...textOverlay, size: Number(e.target.value) })} style={{ width: 60 }} />
        <input type="color" value={textOverlay.color} onChange={e => setTextOverlay({ ...textOverlay, color: e.target.value })} />

        <span>Alignment</span>
        <select value={textOverlay.alignment} onChange={e => handleSetAlignment(e.target.value)}>
          {Object.keys(textAlignments).map(alignment => ( 
            <option key={alignment} value={alignment}>{alignment.replace('-', ' ')}</option>
          ))}
        </select>
        <span>X</span>
        <input type="number" min={0} max={300} value={textOverlay.x} onChange={e => setTextOverlay({ ...textOverlay, x: Number(e.target.value) })} style={{ width: 50 }} />
        <span>Y</span>
        <input type="number" min={0} max={200} value={textOverlay.y} onChange={e => setTextOverlay({ ...textOverlay, y: Number(e.target.value) })} style={{ width: 50 }} />
        
        <span>Start (s)</span>
        <input type="number" min={0} value={textOverlay.start} onChange={e => setTextOverlay({ ...textOverlay, start: Number(e.target.value) })} style={{ width: 60 }} />
        <span>End (s)</span>
        <input type="number" min={textOverlay.start} value={textOverlay.end} onChange={e => setTextOverlay({ ...textOverlay, end: Number(e.target.value) })} style={{ width: 60 }} />
        <select value={textOverlay.animation} onChange={e => setTextOverlay({ ...textOverlay, animation: e.target.value })}>
          <option value="none">None</option>
          <option value="fade">Fade In/Out</option>
          <option value="slide">Slide</option>
        </select>
        <button onClick={handleTextApply} disabled={!textOverlay.text || textApplying} style={{ padding: '8px 16px', borderRadius: 6, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
      </Box>
      {textStatus && <Typography variant="body2" color="info.main">{textStatus}</Typography>}
    </Box>
  );
} 