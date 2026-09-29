import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CityLocation, UnifiedEvent, CitizenReport, MapLayerSettings, CityId, DetourCorridor } from '../types';
import { CITIES_CONFIG } from '../data/multiCityData';
import { HIGHWAY_DETOUR_CORRIDORS, getDetourForLocation } from '../data/highwayDetourData';
import { Navigation, AlertTriangle, ShieldCheck, Milestone, ArrowRight, X } from 'lucide-react';

interface MultiCityMapProps {
  locations: CityLocation[];
  events: UnifiedEvent[];
  citizenReports: CitizenReport[];
  selectedLocation: CityLocation | null;
  selectedEvent: UnifiedEvent | null;
  currentCityId: CityId;
  layers: MapLayerSettings;
  activeDetour?: DetourCorridor | null;
  onSelectLocation: (loc: CityLocation) => void;
  onSelectEvent: (event: UnifiedEvent) => void;
  onMapClickCoordinates: (coords: [number, number], defaultLocId?: string) => void;
  onOpenDetourNavigator?: () => void;
  onSelectDetour?: (detour: DetourCorridor) => void;
  onClearActiveDetour?: () => void;
}

// Multi-city road segments
const CITY_ROAD_SEGMENTS: Record<string, Array<{
  id: string;
  name: string;
  points: [number, number][];
  status: 'gridlock' | 'heavy' | 'moderate' | 'free';
  waterlogged: boolean;
}>> = {
  pune: [
    {
      id: 'sinhagad-spine',
      name: 'Sinhagad Road Corridor',
      points: [
        [18.4980, 73.8420],
        [18.4895, 73.8335],
        [18.4862, 73.8293],
        [18.4810, 73.8240],
        [18.4760, 73.8180],
        [18.4680, 73.8050],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'katraj-ghat-road',
      name: 'Katraj Ghat Road',
      points: [
        [18.4620, 73.8560],
        [18.4529, 73.8589],
        [18.4450, 73.8610],
        [18.4350, 73.8630],
      ],
      status: 'heavy',
      waterlogged: false,
    },
    {
      id: 'hinjewadi-spine',
      name: 'Hinjewadi IT Corridor',
      points: [
        [18.5980, 73.7650],
        [18.5950, 73.7530],
        [18.5912, 73.7389],
        [18.5880, 73.7190],
      ],
      status: 'heavy',
      waterlogged: true,
    },
    {
      id: 'baner-road',
      name: 'Baner Main Road',
      points: [
        [18.5520, 73.8050],
        [18.5590, 73.7868],
        [18.5680, 73.7690],
      ],
      status: 'moderate',
      waterlogged: false,
    },
  ],
  delhi: [
    {
      id: 'delhi-minto-corridor',
      name: 'Minto Road Underpass - Connaught Place',
      points: [
        [28.6420, 77.2280],
        [28.6366, 77.2274],
        [28.6320, 77.2260],
        [28.6280, 77.2230],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'delhi-ito-spine',
      name: 'Vikas Marg & ITO Intersection',
      points: [
        [28.6340, 77.2350],
        [28.6297, 77.2425],
        [28.6250, 77.2510],
        [28.6220, 77.2620],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'delhi-ring-dhaula',
      name: 'Ring Road Dhaula Kuan Interchange',
      points: [
        [28.6050, 77.1550],
        [28.5921, 77.1611],
        [28.5820, 77.1690],
      ],
      status: 'heavy',
      waterlogged: false,
    },
  ],
  kolkata: [
    {
      id: 'kolkata-parkst-corridor',
      name: 'Park Street & Camac Street',
      points: [
        [22.5560, 88.3480],
        [22.5516, 88.3524],
        [22.5480, 88.3580],
        [22.5450, 88.3650],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'kolkata-howrah-approach',
      name: 'Strand Road & Howrah Station Ramp',
      points: [
        [22.5920, 88.3520],
        [22.5851, 88.3468],
        [22.5780, 88.3430],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'kolkata-sec5-spine',
      name: 'Sector V Salt Lake IT Avenue',
      points: [
        [22.5800, 88.4280],
        [22.5735, 88.4331],
        [22.5680, 88.4410],
      ],
      status: 'heavy',
      waterlogged: true,
    },
  ],
  bihar: [
    {
      id: 'patna-rajendra-spine',
      name: 'Rajendra Nagar & Kankarbagh Arterial',
      points: [
        [25.6100, 85.1520],
        [25.6025, 85.1612],
        [25.5960, 85.1710],
        [25.5890, 85.1820],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'patna-gandhi-setu-rd',
      name: 'Mahatma Gandhi Setu Ganga Approach',
      points: [
        [25.6150, 85.2150],
        [25.6291, 85.2285],
        [25.6450, 85.2390],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
  ],
  mumbai: [
    {
      id: 'mumbai-milan-corridor',
      name: 'Milan Subway & SV Road',
      points: [
        [19.0920, 72.8410],
        [19.0833, 72.8444],
        [19.0750, 72.8460],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'mumbai-hindmata-dadar',
      name: 'Hindmata Flyover & Dr. BA Road',
      points: [
        [19.0220, 72.8410],
        [19.0144, 72.8423],
        [19.0060, 72.8435],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
  ],
  bengaluru: [
    {
      id: 'blr-orr-bellandur',
      name: 'Outer Ring Road (Bellandur - Ecospace)',
      points: [
        [12.9350, 77.6880],
        [12.9260, 77.6762],
        [12.9180, 77.6620],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
    {
      id: 'blr-silkboard-hosur',
      name: 'Silk Board & Hosur Road Ramp',
      points: [
        [12.9250, 77.6180],
        [12.9176, 77.6238],
        [12.9090, 77.6310],
      ],
      status: 'gridlock',
      waterlogged: true,
    },
  ],
};

export const MultiCityMap: React.FC<MultiCityMapProps> = ({
  locations,
  events,
  citizenReports,
  selectedLocation,
  selectedEvent,
  currentCityId,
  layers,
  activeDetour = null,
  onSelectLocation,
  onSelectEvent,
  onMapClickCoordinates,
  onOpenDetourNavigator = () => {},
  onSelectDetour = () => {},
  onClearActiveDetour = () => {},
 }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const eventMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const citizenMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const locationMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const trafficRoadsLayerRef = useRef<L.LayerGroup | null>(null);
  const waterloggingLayerRef = useRef<L.LayerGroup | null>(null);
  const weatherRadarLayerRef = useRef<L.LayerGroup | null>(null);
  const detourRoutesLayerRef = useRef<L.LayerGroup | null>(null);

  const cityInfo = CITIES_CONFIG[currentCityId] || CITIES_CONFIG['pune'];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = cityInfo.coordinates;
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: cityInfo.zoomLevel || 12,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Light GIS Daylight Base Tiles (Carto Voyager for clear, eye-friendly government GIS navigation)
    L.tileLayer(
    L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
,
      {
        attribution: '&copy; CARTO &copy; OpenStreetMap contributors | Ground Radar & Highway Detour Engine',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Click handler on map to allow reporting incident anywhere
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(4));
      const clickedLng = Number(e.latlng.lng.toFixed(4));

      // Find closest locality name
      let closestLoc = locations[0];
      let minD = 999;
      for (const loc of locations) {
        const d = Math.hypot(loc.coordinates[0] - clickedLat, loc.coordinates[1] - clickedLng);
        if (d < minD) {
          minD = d;
          closestLoc = loc;
        }
      }

      onMapClickCoordinates([clickedLat, clickedLng], closestLoc?.id);
    });

    // Layer Groups
    trafficRoadsLayerRef.current = L.layerGroup().addTo(map);
    waterloggingLayerRef.current = L.layerGroup().addTo(map);
    weatherRadarLayerRef.current = L.layerGroup().addTo(map);
    citizenMarkersLayerRef.current = L.layerGroup().addTo(map);
    locationMarkersLayerRef.current = L.layerGroup().addTo(map);
    eventMarkersLayerRef.current = L.layerGroup().addTo(map);
    detourRoutesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Pan to City when Current City changes (unless an active detour corridor is overriding the viewport)
  useEffect(() => {
    if (!mapInstanceRef.current || activeDetour) return;
    const city = CITIES_CONFIG[currentCityId] || CITIES_CONFIG['pune'];
    mapInstanceRef.current.flyTo(city.coordinates, city.zoomLevel, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [currentCityId, activeDetour]);

  // Update Road Traffic Polylines for Active City
  useEffect(() => {
    const layer = trafficRoadsLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    if (!layers.traffic) return;

    const roads = CITY_ROAD_SEGMENTS[currentCityId] || CITY_ROAD_SEGMENTS['pune'];

    roads.forEach((road) => {
      const isGridlock = road.status === 'gridlock';
      const color = isGridlock ? '#ef4444' : road.status === 'heavy' ? '#f97316' : '#eab308';
      const weight = isGridlock ? 6 : 4;
      const dashArray = isGridlock ? '8, 6' : undefined;

      const polyline = L.polyline(road.points, {
        color,
        weight,
        opacity: 0.85,
        dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.bindTooltip(
        `<div class="text-xs font-medium"><span class="font-bold text-slate-100">${road.name}</span><br/><span class="${isGridlock ? 'text-red-400 font-semibold' : 'text-amber-400'}">${road.status.toUpperCase()}</span> ${road.waterlogged ? '• Waterlogged' : ''}<br/><span class="text-[10px] text-sky-300">Click to inspect corridor</span></div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );

      polyline.on('click', () => {
        const matchedLoc = locations.find((l) => 
          l.name.toLowerCase().includes(road.name.toLowerCase().slice(0, 5)) ||
          road.name.toLowerCase().includes(l.name.toLowerCase().slice(0, 5))
        );
        if (matchedLoc) {
          onSelectLocation(matchedLoc);
          const matchedDetour = getDetourForLocation(matchedLoc.id, matchedLoc.cityId);
          if (matchedDetour && onSelectDetour) {
            onSelectDetour(matchedDetour);
          }
        }
      });

      polyline.addTo(layer);
    });
  }, [currentCityId, layers.traffic, locations, onSelectLocation, onSelectDetour]);

  // Update Waterlogging Inundation Zones & Radar Contours
  useEffect(() => {
    const wLayer = waterloggingLayerRef.current;
    const rLayer = weatherRadarLayerRef.current;
    if (!wLayer || !rLayer || !mapInstanceRef.current) return;
    wLayer.clearLayers();
    rLayer.clearLayers();

    // Render hazard circles and radar rings around the locations of the current city
    locations.forEach((loc) => {
      if (layers.waterlogging && loc.waterlogging.depthInches > 10) {
        const isSelected = selectedLocation?.id === loc.id;
        const matchedDetour = getDetourForLocation(loc.id, loc.cityId);
        const hazardCircle = L.circle(loc.coordinates, {
          radius: Math.min(650, loc.waterlogging.depthInches * 18),
          color: isSelected ? '#38bdf8' : '#06b6d4',
          fillColor: isSelected ? '#0284c7' : '#0891b2',
          fillOpacity: isSelected ? 0.5 : 0.35,
          weight: isSelected ? 3.5 : 2,
          dashArray: isSelected ? undefined : '4, 4',
        });

        hazardCircle.bindTooltip(
          `<div class="text-xs p-1 max-w-[220px]">
            <div class="font-bold text-cyan-300 flex items-center justify-between">
              <span>${loc.name} Affected Basin</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-700">AFFECTED</span>
            </div>
            <div class="text-slate-300 text-[11px] mt-0.5">Water Depth: <strong class="text-white">${loc.waterlogging.depthInches}"</strong></div>
            <div class="text-rose-400 font-medium text-[11px]">${loc.waterlogging.status}</div>
            ${matchedDetour ? `
              <div class="mt-1 pt-1 border-t border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span>🔄 Alternate Path Available:</span>
                <span class="text-emerald-300">${matchedDetour.recommendedDetour.safetyScore}% Safe</span>
              </div>
            ` : ''}
            <div class="text-[10px] text-sky-300 font-semibold mt-1 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
              👉 Click circle to inspect report & alternate path
            </div>
          </div>`,
          { sticky: true, className: 'leaflet-dark-tooltip' }
        );

        hazardCircle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectLocation(loc);
          if (matchedDetour && onSelectDetour) {
            onSelectDetour(matchedDetour);
          }
        });

        hazardCircle.addTo(wLayer);
      }

      if ((layers.weather || layers.rainfall) && loc.weather.rainfallMmH > 25) {
        const radarCircle = L.circle(loc.coordinates, {
          radius: 1800,
          color: loc.weather.rainfallMmH > 50 ? '#ef4444' : '#f59e0b',
          fillColor: loc.weather.rainfallMmH > 50 ? '#dc2626' : '#d97706',
          fillOpacity: 0.22,
          weight: 1.5,
        });

        radarCircle.bindTooltip(
          `<div class="text-xs">
            <span class="font-bold text-amber-300">Doppler Storm Cell: ${loc.weather.rainfallMmH} mm/h</span><br/>
            <span class="text-slate-300">${loc.weather.condition}</span><br/>
            <span class="text-[10px] text-amber-200 mt-1 block font-semibold">👉 Click to inspect ${loc.name} report</span>
          </div>`,
          { sticky: true }
        );

        radarCircle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectLocation(loc);
        });

        radarCircle.addTo(rLayer);
      }
    });
  }, [locations, layers.waterlogging, layers.weather, layers.rainfall, selectedLocation, onSelectLocation, onSelectDetour]);

  // Update Location Station Pins
  useEffect(() => {
    const layer = locationMarkersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const isCritical = loc.waterlogging.depthInches > 15 || loc.traffic.status === 'Gridlock';

      const iconHtml = `
        <div class="location-pulse-marker cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="w-7 h-7 rounded-lg ${isCritical ? 'bg-red-600' : 'bg-blue-600'} border-2 border-white flex items-center justify-center text-white shadow-md">
            <span class="text-[10px] font-black">${Math.round(loc.weather.rainfallMmH)}</span>
          </div>
          <div class="mt-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[9px] font-bold text-slate-800 whitespace-nowrap shadow-xs">
            ${loc.name.split('(')[0].trim()}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-location-div-icon',
        iconSize: [32, 40],
        iconAnchor: [16, 20],
      });

      const marker = L.marker(loc.coordinates, { icon: customIcon });
      marker.on('click', () => {
        onSelectLocation(loc);
      });

      marker.addTo(layer);
    });
  }, [locations, selectedLocation]);

  // Update Citizen Report Pins
  useEffect(() => {
    const layer = citizenMarkersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    if (!layers.citizenReports) return;

    citizenReports.forEach((rep) => {
      const isDup = rep.isDuplicate;
      const pinColor = isDup ? '#f59e0b' : '#10b981';

      const circle = L.circleMarker(rep.coordinates, {
        radius: isDup ? 4 : 6,
        fillColor: pinColor,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      circle.bindTooltip(
        `<div class="text-xs max-w-xs">
          <div class="font-bold ${isDup ? 'text-amber-400' : 'text-emerald-400'}">
            ${isDup ? 'Duplicate Cluster Fused' : 'Citizen Ground Evidence'} (${rep.source})
          </div>
          <div class="text-slate-300 italic mt-0.5">"${rep.rawText.slice(0, 75)}..."</div>
          <div class="text-[10px] text-slate-400 mt-1">${rep.timeAgo} • Evidence: ${rep.evidenceWeight}/5</div>
        </div>`,
        { sticky: true }
      );

      circle.addTo(layer);
    });
  }, [citizenReports, layers.citizenReports]);

  // Update Unified Incident Hotspot Pins
  useEffect(() => {
    const layer = eventMarkersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    if (!layers.highPriorityEvents) return;

    events.forEach((evt) => {
      const isSelected = selectedEvent?.id === evt.id;
      const isCritical = evt.severity === 'Critical';
      const isHigh = evt.severity === 'High';

      const bgColor = isCritical
        ? 'bg-rose-600 border-rose-400 text-white'
        : isHigh
        ? 'bg-amber-600 border-amber-400 text-white'
        : 'bg-sky-600 border-sky-400 text-white';

      const isVerified = evt.verificationStatus === 'verified';

      const iconHtml = `
        <div class="relative cursor-pointer group flex flex-col items-center">
          <div class="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-2xl transition-all duration-300 ${bgColor} ${isCritical ? 'pulse-marker-critical' : ''} ${
            isSelected ? 'ring-4 ring-white scale-125' : 'group-hover:scale-110'
          }">
            <div class="flex flex-col items-center justify-center leading-none">
              <span class="text-[11px] font-black">${evt.reportCount}</span>
              <span class="text-[7px] uppercase font-bold tracking-tighter">REPS</span>
            </div>
          </div>
          <!-- Label pill under marker with Verification Status -->
          <div class="mt-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-semibold text-slate-800 shadow-xs whitespace-nowrap group-hover:border-red-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-600 animate-ping' : 'bg-amber-500'}"></span>
            <span>${evt.title.split('+')[0].trim()}</span>
            <span class="text-red-600 font-bold">${evt.evidenceScore}%</span>
            ${isVerified ? '<span class="text-emerald-600 ml-0.5">✓</span>' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'unified-event-marker',
        iconSize: [44, 56],
        iconAnchor: [22, 28],
      });

      const marker = L.marker(evt.coordinates, { icon: customIcon, zIndexOffset: 1000 });
      marker.on('click', () => {
        onSelectEvent(evt);
        const matchedLoc = locations.find((l) => l.id === evt.locationId);
        if (matchedLoc) onSelectLocation(matchedLoc);
      });

      marker.addTo(layer);
    });
  }, [events, selectedEvent, locations, layers.highPriorityEvents]);

  // RENDER SAFE DETOURS & ALTERNATE ROUTES LAYER
  useEffect(() => {
    const layer = detourRoutesLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;
    layer.clearLayers();

    // Determine which detours to render:
    // If activeDetour is selected, render it; otherwise, if layers.alternateRoutes is enabled, render all matching current city
    const detoursToRender: DetourCorridor[] = [];
    if (activeDetour) {
      detoursToRender.push(activeDetour);
    } else if (layers.alternateRoutes) {
      const cityDetours = HIGHWAY_DETOUR_CORRIDORS.filter((c) => c.cityId === currentCityId);
      detoursToRender.push(...(cityDetours.length > 0 ? cityDetours : [HIGHWAY_DETOUR_CORRIDORS[0]]));
    }

    if (detoursToRender.length === 0) return;

    detoursToRender.forEach((corridor) => {
      // 1. Render Blocked Hazard Segment (Crimson dashed with closure badges)
      const blockedPolyline = L.polyline(corridor.blockedSegment.points, {
        color: '#ef4444',
        weight: 6,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      });

      blockedPolyline.bindTooltip(
        `<div class="text-xs p-1">
          <div class="font-extrabold text-rose-400 flex items-center gap-1">
            <span>⛔ HAZARD BLOCKED</span>
            <span>(${corridor.hazardType.toUpperCase()})</span>
          </div>
          <div class="text-white font-semibold mt-0.5">${corridor.blockedSegment.name}</div>
          <div class="text-slate-300 text-[11px] mt-0.5">${corridor.blockedSegment.hazardNote}</div>
          <div class="text-rose-300 font-mono text-[10px] mt-1">Status: ${corridor.blockedSegment.status}</div>
        </div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );
      blockedPolyline.addTo(layer);

      // Start & End Closure Badges
      const startClosureIcon = L.divIcon({
        html: `
          <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-2xl animate-pulse">
            ⛔
          </div>
        `,
        className: 'closure-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker(corridor.blockedSegment.startCoord, { icon: startClosureIcon })
        .bindTooltip(`<div class="text-xs font-bold text-rose-300">Road Closure / Police Barricade: ${corridor.blockedSegment.name}</div>`, { sticky: true })
        .addTo(layer);

      // 2. Render Recommended Alternate Detour (Glowing emerald outer casing + inner green line)
      // Glow casing
      L.polyline(corridor.recommendedDetour.points, {
        color: '#059669',
        weight: 11,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layer);

      // Core green line
      const detourPolyline = L.polyline(corridor.recommendedDetour.points, {
        color: '#10b981',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      });

      detourPolyline.bindTooltip(
        `<div class="text-xs p-1">
          <div class="font-extrabold text-emerald-300 flex items-center gap-1">
            <span>✅ RECOMMENDED DETOUR</span>
            <span>(${corridor.recommendedDetour.safetyScore}% Safe)</span>
          </div>
          <div class="text-white font-semibold mt-0.5">${corridor.recommendedDetour.name}</div>
          <div class="text-emerald-400 font-mono text-[11px] mt-0.5">
            +${corridor.recommendedDetour.etaDeltaMinutes} mins • ${corridor.recommendedDetour.distanceKm} km • ${corridor.recommendedDetour.avgSpeedKmh} km/h
          </div>
          <div class="text-slate-300 text-[10px] mt-1">${corridor.recommendedDetour.roadCondition}</div>
        </div>`,
        { sticky: true, className: 'leaflet-dark-tooltip' }
      );
      detourPolyline.on('click', () => onSelectDetour(corridor));
      detourPolyline.addTo(layer);

      // Numbered Waypoint Markers along the Detour Path
      corridor.recommendedDetour.points.forEach((pt, idx) => {
        const wpLabel = corridor.recommendedDetour.keyWaypoints[idx] || `Waypoint ${idx + 1}`;
        const wpIcon = L.divIcon({
          html: `
            <div class="flex items-center gap-1 cursor-pointer group">
              <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-black font-mono shadow-xl group-hover:scale-125 transition-transform">
                ${idx + 1}
              </div>
              <div class="px-1.5 py-0.5 rounded bg-white border border-emerald-400 text-[9px] font-bold text-emerald-800 shadow-xs whitespace-nowrap hidden sm:block">
                ${wpLabel.split('(')[0].slice(0, 24)}
              </div>
            </div>
          `,
          className: 'detour-waypoint-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const wpMarker = L.marker(pt, { icon: wpIcon });
        wpMarker.bindTooltip(
          `<div class="text-xs font-bold text-emerald-300">Step 0${idx + 1}: ${wpLabel}</div>`,
          { sticky: true }
        );
        wpMarker.on('click', () => onSelectDetour(corridor));
        wpMarker.addTo(layer);
      });

      // 3. Render Secondary Detour if present (Cyan dashed line)
      if (corridor.alternativeDetour) {
        const altPolyline = L.polyline(corridor.alternativeDetour.points, {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6',
          lineCap: 'round',
        });
        altPolyline.bindTooltip(
          `<div class="text-xs p-1">
            <span class="font-bold text-cyan-300">Heavy Commercial / Alternate Bypass</span><br/>
            <span class="text-slate-200 font-semibold">${corridor.alternativeDetour.name}</span><br/>
            <span class="text-cyan-400 font-mono text-[10px]">+${corridor.alternativeDetour.etaDeltaMinutes}m • ${corridor.alternativeDetour.distanceKm} km</span>
          </div>`,
          { sticky: true }
        );
        altPolyline.addTo(layer);
      }
    });

    // Auto fit map bounds to the focused detour corridor
    if (activeDetour) {
      const allCoords = [
        ...activeDetour.blockedSegment.points,
        ...activeDetour.recommendedDetour.points,
      ];
      const bounds = L.latLngBounds(allCoords);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });
    }
  }, [activeDetour, layers.alternateRoutes, currentCityId]);

  // Smooth Zoom/Pan when Location or Event is Selected
  useEffect(() => {
    if (!mapInstanceRef.current || activeDetour) return;

    if (selectedEvent) {
      mapInstanceRef.current.flyTo(selectedEvent.coordinates, 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } else if (selectedLocation) {
      mapInstanceRef.current.flyTo(selectedLocation.coordinates, selectedLocation.zoomLevel, {
        duration: 1.0,
        easeLinearity: 0.25,
      });
    }
  }, [selectedLocation, selectedEvent, activeDetour]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Top Left Click Prompt / Status */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-white/95 border border-slate-300 px-3 py-1.5 rounded-lg text-xs text-slate-700 shadow-md flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Click any road in {cityInfo.name} to drop an incident report pin</span>
        </div>

        {/* Quick Launch Detour Engine Button */}
        <button
          id="btn-quick-launch-detours"
          onClick={onOpenDetourNavigator}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 border border-emerald-700 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Navigation className="w-4 h-4 text-white" />
          <span>🛣️ Highway & Landslide Alternate Routes</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-800 text-[10px] font-mono text-emerald-100">
            6 Live
          </span>
        </button>
      </div>

      {/* Active Detour On-Map Floating HUD Bar */}
      {activeDetour && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] max-w-xl w-[calc(100vw-32px)] bg-white/95 border border-emerald-400 rounded-2xl shadow-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>{activeDetour.hazardType.toUpperCase()} DETOUR</span>
              </span>
              <span className="text-xs font-bold text-slate-900 line-clamp-1">
                {activeDetour.name}
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeDetour.recommendedDetour.name} (+{activeDetour.recommendedDetour.etaDeltaMinutes}m)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onOpenDetourNavigator}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Waypoints & Steps
            </button>
            <button
              onClick={onClearActiveDetour}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Detour View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
