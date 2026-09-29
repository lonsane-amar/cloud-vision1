import React, { useState } from 'react';
import { 
  Layers, 
  CloudRain, 
  Car, 
  Droplets, 
  Eye, 
  Users, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Check,
  Navigation
} from 'lucide-react';
import { MapLayerSettings } from '../types';

interface LayerControlsProps {
  layers: MapLayerSettings;
  onToggleLayer: (layerKey: keyof MapLayerSettings) => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ layers, onToggleLayer }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  const layerItems: Array<{
    key: keyof MapLayerSettings;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = [
    {
      key: 'alternateRoutes',
      label: 'Safe Detours & Alternate Paths',
      icon: <Navigation className="w-3.5 h-3.5" />,
      color: 'text-emerald-400',
      description: 'Highway landslide & flood bypass paths with turn-by-turn guidance',
    },
    {
      key: 'highPriorityEvents',
      label: 'High-Priority Events',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-rose-400',
      description: 'Unified fused incident clusters with report count badges',
    },
    {
      key: 'waterlogging',
      label: 'Waterlogging Zones',
      icon: <Droplets className="w-3.5 h-3.5" />,
      color: 'text-cyan-400',
      description: 'Canal basin & underpass flood inundation polygons',
    },
    {
      key: 'traffic',
      label: 'Live Traffic Flow',
      icon: <Car className="w-3.5 h-3.5" />,
      color: 'text-amber-400',
      description: 'Congestion corridors (Sinhagad Rd, Katraj, Baner, Hinjewadi)',
    },
    {
      key: 'rainfall',
      label: 'Rainfall Heatmap',
      icon: <CloudRain className="w-3.5 h-3.5" />,
      color: 'text-sky-400',
      description: 'IMD Doppler precipitation intensity gradients',
    },
    {
      key: 'visibility',
      label: 'Low Visibility & Fog',
      icon: <Eye className="w-3.5 h-3.5" />,
      color: 'text-indigo-400',
      description: 'Katraj ghat and hill slope orographic fog layers',
    },
    {
      key: 'citizenReports',
      label: 'Citizen Report Pins',
      icon: <Users className="w-3.5 h-3.5" />,
      color: 'text-emerald-400',
      description: 'Individual raw citizen submission markers (C) and duplicates (D)',
    },
    {
      key: 'weather',
      label: 'Weather Radar Isobars',
      icon: <Layers className="w-3.5 h-3.5" />,
      color: 'text-purple-400',
      description: 'Doppler radar reflectivity isobars (dBZ)',
    },
  ];

  return (
    <div id="map-layer-controls" className="absolute top-4 right-4 z-[400] flex flex-col items-end">
      {/* Trigger Button */}
      <button
        id="btn-layer-controls-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold shadow-md flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer"
      >
        <Layers className="w-4 h-4 text-blue-600" />
        <span>GIS Map Layers</span>
        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center border border-blue-200">
          {activeLayersCount}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        )}
      </button>

      {/* Expanded Layers Dropdown */}
      {isExpanded && (
        <div className="mt-2 w-72 bg-white border border-slate-300 rounded-2xl shadow-xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5 mb-1">
            <span>Toggle Active GIS Overlays</span>
            <span className="text-blue-700 font-mono font-bold">{activeLayersCount}/8 On</span>
          </div>

          {layerItems.map((item) => {
            const isActive = layers[item.key];
            return (
              <button
                key={item.key}
                onClick={() => onToggleLayer(item.key)}
                className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-slate-900 border border-blue-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${item.color.replace('-400', '-600')}`}>{item.icon}</div>
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
