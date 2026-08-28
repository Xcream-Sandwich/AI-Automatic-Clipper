import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [cookies, setCookies] = useState('');
  const [clipCount, setClipCount] = useState('3 Clips');
  const [duration, setDuration] = useState('15-30s');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  
  const [videoPath, setVideoPath] = useState('');
  const [clips, setClips] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAnalyze = async () => {
    if (!apiKey || !videoUrl) {
      setErrorMsg('API Key and URL are required.');
      return;
    }
    
    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisDone(false);
    
    try {
      const numClips = parseInt(clipCount.split(' ')[0]);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          url: videoUrl,
          cookies: cookies,
          clipCount: numClips,
          durationLabel: duration
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setVideoPath(data.videoPath);
      setClips(data.clips.map((c: any) => ({ ...c, isProcessed: false, downloadUrl: null })));
      setAnalysisDone(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCrop = async () => {
    if (!videoPath || clips.length === 0) return;
    
    setIsCropping(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath, clips })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Update clips with download links
      setClips(prev => prev.map((c, i) => {
        const resultClip = data.results[i];
        if (resultClip) {
          return { ...c, isProcessed: true, downloadUrl: `/downloads/${resultClip.outputFileName}` };
        }
        return c;
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during cropping.');
    } finally {
      setIsCropping(false);
    }
  };

  const updateClip = (index: number, field: string, value: string) => {
    setClips(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const clearAll = () => {
    setVideoPath('');
    setClips([]);
    setAnalysisDone(false);
    setErrorMsg('');
  };

  return (
    <div className='flex h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden'>
      {/* Sidebar */}
      <aside className='w-[280px] bg-white border-r border-slate-200 flex flex-col p-6 shadow-sm z-10'>
        <div className='flex items-center gap-2 mb-8'>
          <div className='w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold'>A</div>
          <h1 className='text-lg font-bold tracking-tight'>AutoClipper <span className='text-indigo-600'>AI</span></h1>
        </div>
        
        <div className='space-y-6 flex-1'>
          <div className='space-y-2'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>Configuration</label>
            <div className='space-y-4'>
              <div>
                <p className='text-xs font-medium text-slate-600 mb-1'>Gemini API Key</p>
                <input 
                  type='password' 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)}
                  placeholder='Enter API Key...'
                  className='w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 focus:border-indigo-500 outline-none' 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className='text-xs font-medium text-slate-600'>YouTube / TikTok URL</p>
                  <button 
                    onClick={() => setVideoUrl('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4')}
                    className="text-[9px] text-indigo-600 hover:underline font-bold uppercase"
                  >
                    Load Demo URL
                  </button>
                </div>
                <input 
                  type='text' 
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder='https://youtube.com/...'
                  className='w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 focus:border-indigo-500 outline-none' 
                />
              </div>
              <div>
                <p className='text-xs font-medium text-slate-600 mb-1'>YouTube Cookies (Optional)</p>
                <textarea 
                  value={cookies}
                  onChange={e => setCookies(e.target.value)}
                  placeholder='Paste Netscape format cookies here to bypass bot protection...'
                  className='w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 focus:border-indigo-500 outline-none h-16 resize-none' 
                />
              </div>
            </div>
          </div>
          
          <div className='space-y-2'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-slate-400'>Extraction Settings</label>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <p className='text-xs font-medium text-slate-600 mb-1'>Clip Count</p>
                <select 
                  value={clipCount} 
                  onChange={e => setClipCount(e.target.value)}
                  className='w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 appearance-none outline-none focus:border-indigo-500'
                >
                  <option>1 Clip</option>
                  <option>3 Clips</option>
                  <option>5 Clips</option>
                </select>
              </div>
              <div>
                <p className='text-xs font-medium text-slate-600 mb-1'>Duration</p>
                <select 
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                  className='w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 appearance-none outline-none focus:border-indigo-500'
                >
                  <option>15-30s</option>
                  <option>30-60s</option>
                </select>
              </div>
            </div>
          </div>
          
          {errorMsg && (
            <div className='p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex flex-col gap-2'>
              <span className='font-bold'>Error:</span>
              <span>{errorMsg}</span>
              {errorMsg.includes('Bot Protection') && (
                <div className='mt-1 space-y-1 text-[11px] text-red-500'>
                  <p>Cara mengatasi:</p>
                  <ul className='list-disc pl-4 space-y-1'>
                    <li>Gunakan ekstensi browser "Get cookies.txt LOCALLY" dan paste isinya ke kolom Cookies di atas.</li>
                    <li>Atau, klik <b>"Load Demo URL"</b> di kolom Video URL untuk menguji coba fungsi AI dan FFmpeg tanpa error.</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className={`w-full ${isAnalyzing ? 'bg-slate-400' : 'bg-slate-900 hover:bg-indigo-600'} text-white py-3 rounded font-bold text-xs transition-colors uppercase tracking-widest`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
        </button>
      </aside>
      
      {/* Main Content */}
      <main className='flex-1 flex flex-col min-w-0'>
        <header className='h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0'>
          <div className='flex items-center gap-4'>
            {analysisDone ? (
              <div className='flex items-center gap-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100'>
                <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse'></div> Analysis Complete
              </div>
            ) : isAnalyzing ? (
              <div className='flex items-center gap-2 text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100'>
                <div className='w-2 h-2 bg-amber-500 rounded-full animate-pulse'></div> Processing Video
              </div>
            ) : (
              <div className='flex items-center gap-2 text-xs font-medium bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-200'>
                <div className='w-2 h-2 bg-slate-300 rounded-full'></div> Waiting for input
              </div>
            )}
            
            {videoPath && (
              <>
                <span className='text-slate-300'>|</span>
                <span className='text-xs text-slate-500 font-mono truncate max-w-xs'>Source: {videoPath.split('/').pop() || videoPath.split('\\').pop()}</span>
              </>
            )}
          </div>
          
          <div className='flex gap-2'>
            <button onClick={clearAll} className='px-4 py-2 text-xs font-bold border border-slate-200 rounded hover:bg-slate-50'>Clear All</button>
            <button 
              onClick={handleCrop}
              disabled={!analysisDone || isCropping}
              className={`px-4 py-2 text-xs font-bold ${(!analysisDone || isCropping) ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded shadow-md shadow-indigo-100 transition-all`}
            >
              {isCropping ? 'Cropping...' : 'Confirm & Crop (FFmpeg)'}
            </button>
          </div>
        </header>
        
        <section className='flex-1 p-8 overflow-y-auto min-h-0 flex flex-col gap-6'>
          {!videoUrl && !analysisDone && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Enter a video URL and API key to begin.</p>
            </div>
          )}

          {videoUrl && (
            <div className="w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200">
              <div className="aspect-video relative">
                {(() => {
                  const Player = ReactPlayer as any;
                  return (
                    <Player 
                      url={videoUrl} 
                      width="100%" 
                      height="100%" 
                      controls={true}
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {(clips.length > 0 || analysisDone) && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto'>
              {clips.map((clip, idx) => (
              <div key={idx} className='bg-white border border-slate-200 rounded-lg flex flex-col p-4 shadow-sm group hover:border-indigo-400 transition-all h-[420px]'>
                <div className='aspect-[9/16] bg-slate-100 rounded-md mb-4 relative overflow-hidden flex items-center justify-center border border-slate-200 shrink-0 h-[180px]'>
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent'></div>
                  <div className='absolute bottom-3 left-3 text-[10px] text-white font-mono'>{clip.startTime}</div>
                  <div className='w-[60%] h-full border-x-2 border-dashed border-indigo-400/50 flex items-center justify-center'>
                    <span className='text-[10px] uppercase text-white/80 tracking-tighter bg-indigo-600/80 px-2 py-0.5 rounded'>9:16 Center Crop</span>
                  </div>
                </div>
                
                <div className='flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto pr-1'>
                  <div className='flex justify-between items-start gap-2 shrink-0'>
                    <h3 className='text-sm font-bold text-slate-900 leading-tight line-clamp-2' title={clip.title}>{clip.title}</h3>
                    <span className='text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase shrink-0'>Clip #{idx + 1}</span>
                  </div>
                  
                  <p className='text-[11px] text-slate-500 leading-relaxed italic line-clamp-3 overflow-hidden text-ellipsis mb-auto' title={clip.reason}>
                    "{clip.reason}"
                  </p>
                  
                  <div className='grid grid-cols-2 gap-2 pt-2 shrink-0 mt-auto'>
                    <div>
                      <p className='text-[9px] uppercase font-bold text-slate-400 mb-1'>Start Time</p>
                      <input 
                        type='text' 
                        value={clip.startTime}
                        onChange={e => updateClip(idx, 'startTime', e.target.value)}
                        className='w-full font-mono text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none' 
                      />
                    </div>
                    <div>
                      <p className='text-[9px] uppercase font-bold text-slate-400 mb-1'>End Time</p>
                      <input 
                        type='text' 
                        value={clip.endTime}
                        onChange={e => updateClip(idx, 'endTime', e.target.value)}
                        className='w-full font-mono text-xs px-2 py-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none' 
                      />
                    </div>
                  </div>
                </div>
                
                {clip.isProcessed && clip.downloadUrl ? (
                  <a 
                    href={clip.downloadUrl}
                    download
                    className='mt-4 w-full py-2 bg-emerald-500 border border-emerald-600 rounded text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-600 transition-all text-center block shrink-0'
                  >
                    Download Clip
                  </a>
                ) : (
                  <button 
                    disabled
                    className='mt-4 w-full py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0'
                  >
                    Download Clip
                  </button>
                )}
              </div>
            ))}

            {analysisDone && (
              <div className='bg-white border border-slate-200 rounded-lg flex flex-col p-4 shadow-sm group border-dashed border-slate-300 opacity-60 h-[420px]'>
                <div className='flex-1 flex flex-col items-center justify-center text-center p-6'>
                  <div className='w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100'>
                    <svg className='w-6 h-6 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path>
                    </svg>
                  </div>
                  <h3 className='text-sm font-bold text-slate-400'>Manual Clip</h3>
                  <p className='text-[10px] text-slate-400 mt-2'>Add a specific segment from the timeline manually.</p>
                </div>
              </div>
            )}
          </div>
          )}
        </section>
        
        <footer className='h-12 bg-slate-900 text-white flex items-center px-8 text-[10px] font-medium tracking-widest uppercase shrink-0'>
          <div className='flex gap-6'>
            <span className='flex items-center gap-2'><div className='w-1.5 h-1.5 bg-emerald-400 rounded-full'></div> Gemini AI: v1.5 Pro</span>
            <span className='flex items-center gap-2'><div className='w-1.5 h-1.5 bg-indigo-400 rounded-full'></div> FFmpeg Engine: Active</span>
            <span className='text-slate-500'>|</span>
            <span>Processing Queue: {isAnalyzing || isCropping ? '1' : '0'}</span>
          </div>
          <div className='ml-auto text-slate-500'>
            MVP Dashboard v1.0.4
          </div>
        </footer>
      </main>
    </div>
  );
}
