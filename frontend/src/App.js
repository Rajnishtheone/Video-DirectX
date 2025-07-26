import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import TimelineBar from './components/TimelineBar';
import VideoPreview from './components/VideoPreview';
import Dropzone from './components/Dropzone';
import { getTheme } from './theme';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Modal from '@mui/material/Modal';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import SpeedIcon from '@mui/icons-material/Speed';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import TrimPanel from './components/TrimPanel';
import TextPanel from './components/TextPanel';
import EffectsPanel from './components/EffectsPanel';
import ImagePanel from './components/ImagePanel';
import AudioPanel from './components/AudioPanel';
import SpeedPanel from './components/SpeedPanel';
import MergePanel from './components/MergePanel';

function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const [sidebarSelected, setSidebarSelected] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState('');
  const [timelineClips, setTimelineClips] = useState([]); // [{file, name, start, end, ...}]
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 10]);
  const [effectParams, setEffectParams] = useState({ filterType: '', brightness: 0, contrast: 1, saturation: 1 });
  const [feedback, setFeedback] = useState({ message: '', severity: 'success' });
  const [overlayText, setOverlayText] = useState('');
  const [overlayImage, setOverlayImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const videoRef = useRef();
  const [videoImported, setVideoImported] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportResolution, setExportResolution] = useState('original');
  const [exportStatus, setExportStatus] = useState('');
  const [exportURL, setExportURL] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('vdx_onboarded'));
  const [filterPreviewParams, setFilterPreviewParams] = useState(null);
  const [filterPreviewURL, setFilterPreviewURL] = useState('');
  const [filterApplying, setFilterApplying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [trimPreviewURL, setTrimPreviewURL] = useState('');
  const [trimApplying, setTrimApplying] = useState(false);
  const [trimStatus, setTrimStatus] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [songPreviewURL, setSongPreviewURL] = useState('');
  const [songStart, setSongStart] = useState(0);
  const [songStatus, setSongStatus] = useState('');
  const [songApplying, setSongApplying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteStatus, setMuteStatus] = useState('');
  const [muteApplying, setMuteApplying] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewURL, setPhotoPreviewURL] = useState('');
  const [photoOverlay, setPhotoOverlay] = useState({ x: 50, y: 50, width: 120, height: 80, start: 0, end: 10 });
  const [photoStatus, setPhotoStatus] = useState('');
  const [photoApplying, setPhotoApplying] = useState(false);
  const [textOverlay, setTextOverlay] = useState({ text: '', font: 'Arial', size: 36, color: '#ffffff', x: 50, y: 80, start: 0, end: 10, animation: 'none' });
  const [textStatus, setTextStatus] = useState('');
  const [textApplying, setTextApplying] = useState(false);
  const [selectedTool, setSelectedTool] = useState('trim');

  // Handle file drop/upload
  const handleDropzoneFiles = files => {
    if (videoImported) return; // Block if video already imported
    setTimelineClips(files.map(f => ({ file: f, name: f.name, start: 0, end: null })));
    setVideoFile(files[0]);
    setVideoURL(URL.createObjectURL(files[0]));
    setCurrentTime(0);
    setVideoImported(true);
  };

  // Discard handler
  const handleDiscard = () => {
    setTimelineClips([]);
    setVideoFile(null);
    setVideoURL('');
    setCurrentTime(0);
    setTrimRange([0, 10]);
    setEffectParams({ filterType: '', brightness: 0, contrast: 1, saturation: 1 });
    setOverlayText('');
    setOverlayImage(null);
    setAudioFile(null);
    setVideoImported(false);
  };

  // Sync playhead with video preview
  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Handler for updating video after backend action
  const handleVideoUpdate = (url) => {
    setVideoURL(url);
    setCurrentTime(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };
  // Handler for showing feedback
  const handleFeedback = (message, severity = 'success') => {
    setFeedback({ message, severity });
  };
  // Handler for trim slider in TimelineBar
  const handleTrimRangeChange = (range) => {
    setTrimRange(range);
  };
  // Handler for effect param changes (to be wired to UI later)
  const handleEffectParamsChange = (params) => {
    setEffectParams(params);
  };

  // Export handler
  const handleExport = async () => {
    if (!timelineClips.length) {
      setExportStatus('No clips to export.');
      return;
    }
    setExportStatus('Exporting...');
    setExportURL('');
    const formData = new FormData();
    timelineClips.forEach((clip, idx) => {
      formData.append('videos', clip.file);
      formData.append(`start_${idx}`, clip.start || 0);
      formData.append(`end_${idx}`, clip.end || '');
      formData.append(`fadeIn_${idx}`, clip.fadeIn || false);
      formData.append(`fadeOut_${idx}`, clip.fadeOut || false);
      formData.append(`speed_${idx}`, clip.speed || 1);
    });
    formData.append('order', JSON.stringify(timelineClips.map((_, i) => i)));
    formData.append('exportFormat', exportFormat);
    formData.append('exportResolution', exportResolution);
    try {
      const res = await fetch('http://localhost:5000/api/merge', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setExportURL(url);
      setExportStatus('Export successful!');
    } catch (err) {
      setExportStatus(err.message || 'Export failed');
    }
  };

  // Real-time filter preview handler
  const handleFilterPreview = async (params) => {
    setFilterPreviewParams(params);
    if (!videoFile) return;
    setFilterApplying(true);
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('filterType', params.filterType);
    formData.append('brightness', params.brightness);
    formData.append('contrast', params.contrast);
    formData.append('saturation', params.saturation);
    try {
      const res = await fetch('http://localhost:5000/api/filter', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Preview failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFilterPreviewURL(url);
    } catch {
      setFilterPreviewURL('');
    }
    setFilterApplying(false);
  };

  // Trim preview handler
  const handleTrimPreview = async () => {
    if (!videoFile) return;
    setTrimApplying(true);
    setTrimStatus('Previewing...');
    const formData = new FormData();
    formData.append('videos', videoFile);
    formData.append('start_0', trimStart);
    formData.append('end_0', trimEnd);
    formData.append('order', JSON.stringify([0]));
    formData.append('exportFormat', 'mp4');
    formData.append('exportResolution', 'original');
    try {
      const res = await fetch('http://localhost:5000/api/merge', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Trim preview failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setTrimPreviewURL(url);
      setTrimStatus('Preview ready. Click Apply to save.');
    } catch (err) {
      setTrimStatus(err.message || 'Trim preview failed');
      setTrimPreviewURL('');
    }
    setTrimApplying(false);
  };
  const handleTrimApply = () => {
    setVideoURL(trimPreviewURL);
    setTrimPreviewURL('');
    setTrimStatus('Trim applied!');
  };

  const handleSongSelect = (e) => {
    const file = e.target.files[0];
    setSongFile(file);
    setSongPreviewURL(file ? URL.createObjectURL(file) : '');
  };
  const handleSongApply = async () => {
    if (!videoFile || !songFile) return;
    setSongApplying(true);
    setSongStatus('Applying song...');
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('audio', songFile);
    // Optionally, send songStart to backend if supported
    try {
      const res = await fetch('http://localhost:5000/api/audio/replace', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Add song failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setSongStatus('Song added!');
    } catch (err) {
      setSongStatus(err.message || 'Add song failed');
    }
    setSongApplying(false);
  };

  const handleMuteApply = async () => {
    if (!videoFile) return;
    setMuteApplying(true);
    setMuteStatus('Muting audio...');
    const formData = new FormData();
    formData.append('video', videoFile);
    try {
      const res = await fetch('http://localhost:5000/api/audio/mute', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Mute failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setIsMuted(true);
      setMuteStatus('Audio muted!');
    } catch (err) {
      setMuteStatus(err.message || 'Mute failed');
    }
    setMuteApplying(false);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
    setPhotoPreviewURL(file ? URL.createObjectURL(file) : '');
  };
  const handlePhotoApply = async () => {
    if (!videoFile || !photoFile) return;
    setPhotoApplying(true);
    setPhotoStatus('Applying photo overlay...');
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('image', photoFile);
    // Optionally, send overlay position, size, and duration if backend supports
    try {
      const res = await fetch('http://localhost:5000/api/overlay/image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Photo overlay failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setPhotoStatus('Photo overlay applied!');
    } catch (err) {
      setPhotoStatus(err.message || 'Photo overlay failed');
    }
    setPhotoApplying(false);
  };

  const handleTextApply = async () => {
    if (!videoFile || !textOverlay.text) return;
    setTextApplying(true);
    setTextStatus('Applying text overlay...');
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('text', textOverlay.text);
    formData.append('fontSize', textOverlay.size);
    formData.append('fontColor', textOverlay.color);
    formData.append("x", textOverlay.x);
    formData.append("y", textOverlay.y);
    // Optionally, send x, y, font, start, end, animation if backend supports
    try {
      const res = await fetch('http://localhost:5000/api/overlay/text', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Text overlay failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setTextStatus('Text overlay applied!');
    } catch (err) {
      setTextStatus(err.message || 'Text overlay failed');
    }
    setTextApplying(false);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('vdx_onboarded', '1');
  };

  // Panels for sidebar navigation
  const renderPanel = () => {
    switch (sidebarSelected) {
      case 0: // Import
        return videoImported ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Alert severity="success" sx={{ mb: 2 }}>Video imported!</Alert>
            <VideoPreview videoURL={videoURL} currentTime={currentTime} videoRef={videoRef} />
            <Box sx={{ mt: 2 }}>
              <button onClick={handleDiscard} style={{ padding: '8px 24px', borderRadius: 6, background: '#f44336', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Discard</button>
            </Box>
          </Box>
        ) : (
          <Dropzone onFiles={handleDropzoneFiles} />
        );
      case 1: // Tools (was Trim)
        return (
          <>
            <VideoPreview videoURL={trimPreviewURL || filterPreviewURL || videoURL} currentTime={currentTime} videoRef={videoRef} isMuted={isMuted} />
            {/* Toolbar with feature icons */}
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2, my: 2 }}>
              <Tooltip title="Trim"><span><IconButton color={selectedTool === 'trim' ? 'primary' : 'default'} onClick={() => setSelectedTool('trim')}><ContentCutIcon /></IconButton></span></Tooltip>
              <Tooltip title="Text"><span><IconButton color={selectedTool === 'text' ? 'primary' : 'default'} onClick={() => setSelectedTool('text')}><TextFieldsIcon /></IconButton></span></Tooltip>
              <Tooltip title="Effects"><span><IconButton color={selectedTool === 'effects' ? 'primary' : 'default'} onClick={() => setSelectedTool('effects')}><AutoAwesomeIcon /></IconButton></span></Tooltip>
              <Tooltip title="Image"><span><IconButton color={selectedTool === 'image' ? 'primary' : 'default'} onClick={() => setSelectedTool('image')}><ImageIcon /></IconButton></span></Tooltip>
              <Tooltip title="Audio"><span><IconButton color={selectedTool === 'audio' ? 'primary' : 'default'} onClick={() => setSelectedTool('audio')}><AudiotrackIcon /></IconButton></span></Tooltip>
              <Tooltip title="Speed"><span><IconButton color={selectedTool === 'speed' ? 'primary' : 'default'} onClick={() => setSelectedTool('speed')}><SpeedIcon /></IconButton></span></Tooltip>
              <Tooltip title="Merge"><span><IconButton color={selectedTool === 'merge' ? 'primary' : 'default'} onClick={() => setSelectedTool('merge')}><MergeTypeIcon /></IconButton></span></Tooltip>
            </Box>
            {/* Feature panels (show only selected) */}
            {selectedTool === 'trim' && <TrimPanel videoFile={videoFile} videoURL={videoURL} trimStart={trimStart} setTrimStart={setTrimStart} trimEnd={trimEnd} setTrimEnd={setTrimEnd} trimApplying={trimApplying} trimPreviewURL={trimPreviewURL} handleTrimPreview={handleTrimPreview} handleTrimApply={handleTrimApply} trimStatus={trimStatus} />}
            {selectedTool === 'text' && <TextPanel videoFile={videoFile} videoURL={videoURL} textOverlay={textOverlay} setTextOverlay={setTextOverlay} textApplying={textApplying} textStatus={textStatus} handleTextApply={handleTextApply} />}
            {selectedTool === 'effects' && <EffectsPanel videoFile={videoFile} videoURL={videoURL} effectParams={effectParams} setEffectParams={setEffectParams} filterPreviewParams={filterPreviewParams} setFilterPreviewParams={setFilterPreviewParams} filterApplying={filterApplying} filterPreviewURL={filterPreviewURL} handleFilterPreview={handleFilterPreview} />}
            {selectedTool === 'image' && <ImagePanel videoFile={videoFile} videoURL={videoURL} photoFile={photoFile} setPhotoFile={setPhotoFile} photoPreviewURL={photoPreviewURL} photoOverlay={photoOverlay} setPhotoOverlay={setPhotoOverlay} photoApplying={photoApplying} photoStatus={photoStatus} handlePhotoApply={handlePhotoApply} />}
            {selectedTool === 'audio' && <AudioPanel videoFile={videoFile} videoURL={videoURL} songFile={songFile} setSongFile={setSongFile} songPreviewURL={songPreviewURL} songStart={songStart} setSongStart={setSongStart} songApplying={songApplying} songStatus={songStatus} handleSongApply={handleSongApply} />}
            {selectedTool === 'speed' && <SpeedPanel videoFile={videoFile} videoURL={videoURL} isMuted={isMuted} setIsMuted={setIsMuted} muteApplying={muteApplying} muteStatus={muteStatus} handleMuteApply={handleMuteApply} />}
            {selectedTool === 'merge' && <MergePanel timelineClips={timelineClips} exportFormat={exportFormat} setExportFormat={setExportFormat} exportResolution={exportResolution} setExportResolution={setExportResolution} handleExport={handleExport} exportStatus={exportStatus} exportURL={exportURL} />}
            <Toolbar
              videoFile={videoFile}
              trimRange={trimRange}
              effectParams={effectParams}
              overlayText={overlayText}
              overlayImage={overlayImage}
              audioFile={audioFile}
              onVideoUpdate={handleVideoUpdate}
              onFeedback={handleFeedback}
            />
            <TimelineBar
              clips={timelineClips}
              videoURL={videoURL}
              onSeek={handleSeek}
              onTrimRangeChange={handleTrimRangeChange}
            />
          </>
        );
      case 2: // Export
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <h2>Export</h2>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ height: 36, borderRadius: 6, padding: '0 8px' }}>
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
              </select>
              <select value={exportResolution} onChange={e => setExportResolution(e.target.value)} style={{ height: 36, borderRadius: 6, padding: '0 8px' }}>
                <option value="original">Original</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
              <button onClick={handleExport} style={{ padding: '8px 24px', borderRadius: 6, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Export & Download</button>
            </Box>
            {exportStatus && <Alert severity={exportStatus.includes('successful') ? 'success' : 'info'} sx={{ mb: 2 }}>{exportStatus}</Alert>}
            {exportURL && (
              <a href={exportURL} download={`exported-video.${exportFormat}`} style={{ display: 'inline-block', marginTop: 16 }}>
                <button style={{ padding: '8px 24px', borderRadius: 6, background: '#4caf50', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Download Video</button>
              </a>
            )}
          </Box>
        );
      default:
        return <Dropzone onFiles={handleDropzoneFiles} />;
    }
  };

  // Sidebar nav items (update for sidebar)
  const sidebarNav = [
    { label: 'Import', icon: <CloudUploadIcon /> },
    { label: 'Tools', icon: <ContentCutIcon /> },
    { label: 'Export', icon: <FileDownloadIcon /> },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: 'fixed', top: 16, right: 24, zIndex: 2000 }}>
        <IconButton onClick={() => setThemeMode(m => (m === 'dark' ? 'light' : 'dark'))} color="inherit">
          {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
        <Sidebar selected={sidebarSelected} onSelect={setSidebarSelected} navItems={sidebarNav} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', pb: '160px' }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 2, minHeight: '100vh' }}>
            {renderPanel()}
          </Box>
        </Box>
      </Box>
      <Modal open={showOnboarding} onClose={handleCloseOnboarding} closeAfterTransition>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: { xs: 2, sm: 4 }, borderRadius: 3, minWidth: { xs: 260, sm: 340 }, maxWidth: 480, boxShadow: 24, textAlign: 'center', transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}>
          <h2>Welcome to VideoDirectX!</h2>
          <p>Import a video, use the Tools to trim, add effects, overlays, and music, then export your masterpiece.</p>
          <ul style={{ textAlign: 'left', margin: '16px auto', maxWidth: 320 }}>
            <li>Import: Upload your video to start editing.</li>
            <li>Tools: Trim, add effects, overlays, and music.</li>
            <li>Export: Download your final video.</li>
          </ul>
          <button onClick={handleCloseOnboarding} style={{ padding: '8px 24px', borderRadius: 6, background: '#2196f3', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 16 }}>Get Started</button>
        </Box>
      </Modal>
      <Snackbar open={!!feedback.message} autoHideDuration={4000} onClose={() => setFeedback({ ...feedback, message: '' })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={feedback.severity} sx={{ width: '100%' }}>{feedback.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;