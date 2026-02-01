
import React from 'react';
import { AssistanceRequest, RequestStatus } from '../types';
import { ISSUE_CONFIG } from '../constants';

interface TrackingViewProps {
  request: AssistanceRequest;
  isDarkMode?: boolean;
}

const TrackingView: React.FC<TrackingViewProps> = ({ request, isDarkMode }) => {
  const { issue, mechanic, status } = request;
  const config = ISSUE_CONFIG[issue.issueType];
  
  const statusSteps = [
    { key: RequestStatus.REQUESTED, label: 'Request Received', icon: 'fa-paper-plane' },
    { key: RequestStatus.ASSIGNED, label: 'Mechanic Assigned', icon: 'fa-user-check' },
    { key: RequestStatus.ON_THE_WAY, label: 'Help is En Route', icon: 'fa-truck-fast' },
    { key: RequestStatus.ARRIVED, label: 'Help has Arrived', icon: 'fa-location-dot' },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const getVehicleIcon = (vehicleStr: string) => {
    const v = vehicleStr.toLowerCase();
    if (v.includes('tow')) return 'fa-truck-pickup';
    if (v.includes('van')) return 'fa-van-shuttle';
    if (v.includes('rapid')) return 'fa-bolt-lightning';
    return 'fa-car-side';
  };

  return (
    <div className={`flex flex-col h-full rounded-t-[32px] shadow-2xl overflow-hidden mt-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-white'
    }`}>
      <div className={`p-6 border-b flex items-center justify-between transition-colors ${
        isDarkMode ? 'border-slate-800' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-50'
          } ${config.color}`}>
            <i className={`fas ${config.icon} text-xl`}></i>
          </div>
          <div>
            <h3 className={`font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{config.label}</h3>
            <p className={`text-sm transition-colors ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Request #{request.id.slice(-4)}</p>
          </div>
        </div>
        <div className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider transition-colors ${
          isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
        }`}>
          {status.replace('_', ' ')}
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="relative">
          <div className={`absolute left-4 top-0 bottom-0 w-0.5 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}></div>
          <div className="space-y-6">
            {statusSteps.map((step, idx) => {
              const isPast = idx < getCurrentStepIndex();
              const isCurrent = idx === getCurrentStepIndex();
              
              return (
                <div key={step.key} className="relative flex items-center gap-6">
                  <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isPast ? 'bg-green-500 text-white' : 
                    isCurrent ? 'bg-yellow-500 text-white pulse-animation' : 
                    isDarkMode ? 'bg-slate-800 border-2 border-slate-700 text-slate-600' : 'bg-white border-2 border-gray-100 text-gray-300'
                  }`}>
                    <i className={`fas ${isPast ? 'fa-check' : step.icon} text-xs`}></i>
                  </div>
                  <div className={`transition-all duration-300 ${
                    isCurrent 
                      ? (isDarkMode ? 'text-slate-100 font-semibold' : 'text-gray-900 font-semibold') 
                      : (isDarkMode ? 'text-slate-600' : 'text-gray-400')
                  }`}>
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {mechanic && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 transition-colors ${
            isDarkMode ? 'bg-slate-800/50 border border-slate-800' : 'bg-gray-50'
          }`}>
            <div className="h-12 w-12 rounded-full bg-slate-700 overflow-hidden shrink-0">
              <img src={`https://picsum.photos/seed/${mechanic.id}/100/100`} alt={mechanic.name} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`font-bold truncate transition-colors ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{mechanic.name}</h4>
                <div className="flex items-center text-yellow-500 text-sm shrink-0">
                  <i className="fas fa-star mr-1"></i>
                  <span>{mechanic.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`flex items-center justify-center w-5 h-5 rounded shrink-0 transition-colors ${
                  isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200/50 text-slate-500'
                }`}>
                   <i className={`fas ${getVehicleIcon(mechanic.vehicle)} text-[10px]`}></i>
                </div>
                <p className={`text-xs font-semibold truncate uppercase tracking-tight transition-colors ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>{mechanic.vehicle}</p>
              </div>
            </div>
            <a 
              href={`tel:${mechanic.phone}`}
              className={`h-10 w-10 border rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 active:bg-slate-700' 
                  : 'bg-white border-gray-200 text-gray-700 active:bg-gray-50'
              }`}
            >
              <i className="fas fa-phone"></i>
            </a>
          </div>
        )}

        <div className={`relative h-48 rounded-2xl overflow-hidden shadow-inner group cursor-pointer border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-transparent'
        }`}>
           <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-s-a+f00(34.05,-118.24),pin-s-b+00f(34.06,-118.25)/-118.245,34.055,13/600x400?access_token=pk.xxx')] bg-cover bg-center">
             <div className={`absolute inset-0 transition-all ${isDarkMode ? 'bg-slate-900/40' : 'bg-blue-500/5'} backdrop-blur-[1px] group-hover:backdrop-blur-0`}></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                   <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping absolute"></div>
                   <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                </div>
             </div>
             {mechanic && (
               <div className="absolute top-1/3 left-1/4 animate-bounce">
                  <div className={`p-2 rounded-full shadow-lg border-2 flex items-center justify-center ${
                    isDarkMode ? 'bg-slate-900 border-yellow-600' : 'bg-white border-yellow-500'
                  }`}>
                    <i className={`fas ${getVehicleIcon(mechanic.vehicle)} text-lg text-yellow-500`}></i>
                  </div>
               </div>
             )}
           </div>
           <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${
             isDarkMode ? 'bg-slate-900/90 text-slate-400' : 'bg-white/90 text-gray-600'
           }`}>
             LIVE TRACKING ACTIVE
           </div>
        </div>
      </div>
      
      <div className="p-6 pt-0">
        <button className={`w-full py-4 font-bold rounded-2xl transition-colors ${
          isDarkMode ? 'bg-red-900/20 text-red-500 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}>
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default TrackingView;
