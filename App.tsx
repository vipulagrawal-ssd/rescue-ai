
import React, { useState, useEffect, useRef } from 'react';
import { 
  RequestStatus, 
  AssistanceRequest, 
  Location, 
  IssueType, 
  ExtractionResult,
  Mechanic
} from './types';
import { MOCK_MECHANICS, ISSUE_CONFIG } from './constants';
import { geminiService } from './services/geminiService';
import VoiceInput from './components/VoiceInput';
import AssistanceForm from './components/AssistanceForm';
import TrackingView from './components/TrackingView';
import { playAudio, playBeep } from './utils/audioUtils';

const App: React.FC = () => {
  const [status, setStatus] = useState<RequestStatus>(RequestStatus.IDLE);
  const [currentRequest, setCurrentRequest] = useState<AssistanceRequest | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isRefiningLocation, setIsRefiningLocation] = useState(false);
  const [refinedAddressInput, setRefinedAddressInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVoiceAssistEnabled, setIsVoiceAssistEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'GPS: ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4)
          });
        },
        (err) => {
          console.error("Location error", err);
          setError("Location access denied. Using fallback location.");
          setLocation({ lat: 34.0522, lng: -118.2437, address: 'Downtown Los Angeles' });
        }
      );
    }
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const speak = async (text: string) => {
    if (!isVoiceAssistEnabled) return;
    initAudio();
    try {
      const base64Audio = await geminiService.generateSpeech(text);
      if (base64Audio && audioContextRef.current) {
        await playAudio(base64Audio, audioContextRef.current);
      }
    } catch (err) {
      console.error("Voice Assist error", err);
    }
  };

  const handleRequestSubmission = async (userInput: string, isSOS: boolean = false) => {
    initAudio();
    if (audioContextRef.current) playBeep(audioContextRef.current, 'start');

    try {
      setStatus(RequestStatus.PROCESSING);
      setError(null);
      setIsRefiningLocation(false);

      const analysis: ExtractionResult = await geminiService.extractRequestDetails(userInput);
      
      if (isSOS) {
        analysis.issueType = IssueType.ACCIDENT;
        analysis.urgency = 'CRITICAL';
        analysis.isAccident = true;
      }

      await new Promise(resolve => setTimeout(resolve, 1200));

      const finalLocation = {
        ...(location || { lat: 0, lng: 0 }),
        address: analysis.locationText || location?.address || 'Current Location'
      };

      const newRequest: AssistanceRequest = {
        id: `req_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'u1',
        status: RequestStatus.REQUESTED,
        issue: analysis,
        userLocation: finalLocation,
        createdAt: Date.now()
      };

      setCurrentRequest(newRequest);
      setStatus(RequestStatus.CONFIRMING);

      const issueLabel = ISSUE_CONFIG[analysis.issueType].label;
      
      let message = isSOS 
        ? "Emergency SOS detected. Dispatching immediate assistance to your location."
        : `I've detected a ${issueLabel}. Searching for help now.`;

      if (analysis.isAccident) {
        message = "Accident confirmed. Help is being dispatched urgently.";
      }
      
      await speak(message);

      setTimeout(() => simulateDispatch(newRequest), 2500);

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
      setStatus(RequestStatus.IDLE);
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location) => {
    const dy = loc1.lat - loc2.lat;
    const dx = loc1.lng - loc2.lng;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMechanicMatchScore = (mechanic: Mechanic, issueType: IssueType) => {
    const vehicle = mechanic.vehicle.toLowerCase();
    switch (issueType) {
      case IssueType.ENGINE_FAILURE:
      case IssueType.ACCIDENT:
        return vehicle.includes('tow') ? 100 : 10;
      case IssueType.TYRE_PUNCTURE:
      case IssueType.BATTERY_ISSUE:
        return vehicle.includes('van') ? 100 : 50;
      case IssueType.GENERAL_ASSISTANCE:
        return vehicle.includes('rapid') ? 100 : 80;
      default:
        return 50;
    }
  };

  const simulateDispatch = async (req: AssistanceRequest) => {
    const availableMechanics = MOCK_MECHANICS.filter(m => m.isAvailable);

    if (!availableMechanics || availableMechanics.length === 0) {
      const failMessage = 'Sorry, no mechanics are available right now. Please try again later or call emergency services.';
      setStatus(RequestStatus.FAILED);
      setError(failMessage);
      speak(failMessage);
      setCurrentRequest(null); 
      return;
    }

    const scoredMechanics = availableMechanics.map(m => {
      const suitability = getMechanicMatchScore(m, req.issue.issueType);
      const distance = calculateDistance(req.userLocation, m.location);
      return { mechanic: m, suitability, distance };
    });

    scoredMechanics.sort((a, b) => {
      if (b.suitability !== a.suitability) {
        return b.suitability - a.suitability;
      }
      return a.distance - b.distance;
    });

    const bestMatch = scoredMechanics[0].mechanic;
    
    setStatus(RequestStatus.ASSIGNED);
    setCurrentRequest(prev => prev ? { 
      ...prev, 
      status: RequestStatus.ASSIGNED, 
      mechanic: bestMatch 
    } : null);

    await speak(`${bestMatch.name} is on the way.`);

    setTimeout(() => {
      setStatus(RequestStatus.ON_THE_WAY);
      setCurrentRequest(prev => prev ? { 
        ...prev, 
        status: RequestStatus.ON_THE_WAY 
      } : null);
    }, 4500);
  };

  const handleRefineLocation = (landmark: string) => {
    if (location) {
      setLocation({ ...location, address: landmark });
      setIsRefiningLocation(false);
      setRefinedAddressInput('');
    }
  };

  const nearbyLandmarks = [
    "Starbucks on 7th St",
    "Shell Gas Station",
    "Near Central Mall Entrance",
    "Intersection of Main & Broadway"
  ];

  const renderHeader = () => (
    <header className={`px-6 py-6 flex items-center justify-between sticky top-0 backdrop-blur-xl z-40 border-b transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white ios-shadow transition-colors ${
          isDarkMode ? 'bg-blue-600' : 'bg-slate-900'
        }`}>
          <i className="fas fa-bolt-lightning text-lg"></i>
        </div>
        <div>
          <h1 className={`text-xl font-black tracking-tighter uppercase transition-colors ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            Rescue<span className="text-blue-600">AI</span>
          </h1>
          <p className={`text-[8px] font-extrabold tracking-widest uppercase transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Safe & Swift</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ios-shadow ${
            isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
        </button>
        <button 
          onClick={() => setIsVoiceAssistEnabled(!isVoiceAssistEnabled)}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ios-shadow ${
            isVoiceAssistEnabled ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <i className={`fas ${isVoiceAssistEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} text-xs`}></i>
        </button>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${
          isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          <i className="fas fa-user-circle text-xl"></i>
        </div>
      </div>
    </header>
  );

  const renderLocationBanner = () => (
    <div className="px-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div 
        onClick={() => setIsRefiningLocation(!isRefiningLocation)}
        className={`p-4 rounded-[24px] ios-shadow flex items-center justify-between group cursor-pointer active:scale-95 transition-all border ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <i className="fas fa-location-dot"></i>
          </div>
          <div className="max-w-[180px]">
            <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Your Location</p>
            <p className={`text-xs font-bold truncate transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{location?.address || 'Detecting GPS...'}</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 px-3 py-1.5 rounded-full transition-all">
          {isRefiningLocation ? 'Cancel' : 'Refine'}
        </div>
      </div>

      {isRefiningLocation && (
        <div className={`mt-3 p-5 rounded-[28px] ios-shadow animate-in zoom-in-95 duration-300 border ${
          isDarkMode ? 'bg-slate-900 border-blue-900/50' : 'bg-white border-blue-100'
        }`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Refine with nearby landmark</p>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {nearbyLandmarks.map((landmark) => (
              <button
                key={landmark}
                onClick={() => handleRefineLocation(landmark)}
                className={`shrink-0 px-4 py-2 text-[10px] font-bold rounded-full border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-blue-600 hover:text-white' 
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-blue-600 hover:text-white'
                }`}
              >
                {landmark}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text" 
              value={refinedAddressInput}
              onChange={(e) => setRefinedAddressInput(e.target.value)}
              placeholder="Or enter street/landmark..."
              className={`w-full pl-5 pr-14 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-xs font-bold transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-100 text-slate-800 placeholder-slate-400'
              }`}
            />
            <button 
              onClick={() => handleRefineLocation(refinedAddressInput)}
              disabled={!refinedAddressInput.trim()}
              className="absolute right-2 top-1.5 h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-20 transition-all"
            >
              <i className="fas fa-check text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
      {renderHeader()}

      <main className="flex-1 flex flex-col relative z-10">
        {(status === RequestStatus.IDLE || status === RequestStatus.PROCESSING || status === RequestStatus.FAILED) && (
          <>
            {renderLocationBanner()}
            <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
              <div className="w-full max-w-sm space-y-6">
                <VoiceInput 
                  onTranscript={handleRequestSubmission} 
                  isProcessing={status === RequestStatus.PROCESSING}
                  isDarkMode={isDarkMode}
                />
                <AssistanceForm 
                  onSubmit={handleRequestSubmission} 
                  isProcessing={status === RequestStatus.PROCESSING}
                  isDarkMode={isDarkMode}
                />
                
                {status === RequestStatus.PROCESSING && (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                      isDarkMode ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      <i className="fas fa-microchip animate-pulse"></i>
                      <span>Optimizing response</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ios-shadow animate-in slide-in-from-top-4 border ${
                    isDarkMode ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'
                  }`}>
                    <i className="fas fa-circle-exclamation text-base"></i>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="mt-16 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 px-1 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Common Services</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleRequestSubmission("I have a flat tyre.")}
                    className={`p-5 border rounded-[28px] ios-shadow transition-all cursor-pointer active:scale-95 flex flex-col gap-3 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-50 hover:bg-slate-50'
                    }`}
                  >
                     <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                       isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'
                     }`}>
                       <i className="fas fa-tire text-lg"></i>
                     </div>
                     <p className={`text-sm font-extrabold transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Flat Tyre</p>
                  </div>
                  <div 
                    onClick={() => handleRequestSubmission("My battery is dead.")}
                    className={`p-5 border rounded-[28px] ios-shadow transition-all cursor-pointer active:scale-95 flex flex-col gap-3 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-50 hover:bg-slate-50'
                    }`}
                  >
                     <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                       isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                     }`}>
                       <i className="fas fa-battery-bolt text-lg"></i>
                     </div>
                     <p className={`text-sm font-extrabold transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Dead Battery</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {currentRequest && status !== RequestStatus.IDLE && status !== RequestStatus.FAILED && status !== RequestStatus.PROCESSING && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-700">
             {status === RequestStatus.CONFIRMING && (
               <div className="px-8 py-6">
                 <div className={`rounded-[32px] p-8 ios-shadow border transition-colors ${
                   isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-900 border-white/10'
                 }`}>
                    <div className="flex items-start gap-5 mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 ios-shadow">
                        <i className="fas fa-shield-heart text-xl"></i>
                      </div>
                      <div className="text-white">
                        <h3 className="font-black text-lg tracking-tight leading-none mb-1">Emergency Logged</h3>
                        <p className="text-sm text-slate-400 font-medium">Verified: <strong>{ISSUE_CONFIG[currentRequest.issue.issueType].label}</strong>.</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-[11px] italic text-slate-300 leading-relaxed border border-white/5">
                      "{currentRequest.issue.description}" 
                      {currentRequest.userLocation.address && (
                        <span className="block mt-2 font-bold text-blue-400 not-italic">
                          Location: {currentRequest.userLocation.address}
                        </span>
                      )}
                    </div>
                 </div>
               </div>
             )}
             
             <div className="flex-1 flex flex-col">
                <TrackingView request={currentRequest} isDarkMode={isDarkMode} />
             </div>
          </div>
        )}
      </main>

      {(status === RequestStatus.IDLE || status === RequestStatus.FAILED) && (
        <div className="fixed bottom-10 left-0 right-0 px-8 z-50 flex justify-center pointer-events-none">
          <button 
            onClick={() => handleRequestSubmission("Emergency SOS! Collision detected.", true)}
            className="pointer-events-auto h-20 w-20 bg-red-600 text-white rounded-[30px] ios-shadow-lg flex flex-col items-center justify-center pulse-animation hover:bg-red-700 transition-all active:scale-90 border-4 border-white/20"
          >
            <i className="fas fa-car-burst text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-tighter mt-1">SOS</span>
          </button>
        </div>
      )}

      <footer className={`py-8 text-center text-[9px] font-black tracking-[0.3em] uppercase opacity-40 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`}>
        &copy; 2024 RESCUEAI &bull; SECURED DISPATCH
      </footer>
    </div>
  );
};

export default App;
