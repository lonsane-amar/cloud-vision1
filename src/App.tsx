import React, { useState, useMemo } from 'react';
import { 
  CityLocation, 
  UnifiedEvent, 
  CitizenReport, 
  MapLayerSettings, 
  CityId, 
  FilterSettings, 
  IssueType, 
  VerificationStatus,
  DetourCorridor
} from './types';
import { 
  ALL_MULTI_CITY_LOCALITIES, 
  ALL_MULTI_CITY_EVENTS, 
  ALL_MULTI_CITY_REPORTS,
  CITIES_CONFIG 
} from './data/multiCityData';
import { HIGHWAY_DETOUR_CORRIDORS, getDetourForLocation } from './data/highwayDetourData';
import { processEventFusion } from './utils/slmProcessor';
import { TopNav } from './components/TopNav';
import { MultiCityMap } from './components/MultiCityMap';
import { SideIntelligencePanel } from './components/SideIntelligencePanel';
import { CitizenReportModal } from './components/CitizenReportModal';
import { EventDetailModal } from './components/EventDetailModal';
import { EventFusionVisualizer } from './components/EventFusionVisualizer';
import { AnalyticsView } from './components/AnalyticsView';
import { LayerControls } from './components/LayerControls';
import { LiveEventFeed } from './components/LiveEventFeed';
import { GuidedDemoBar, DEMO_STEPS } from './components/GuidedDemoBar';
import { FilterBar } from './components/FilterBar';
import { HighwayDetourNavigator } from './components/HighwayDetourNavigator';

export default function App() {
  // Current active city (Pune, Delhi, Kolkata, Bihar, Mumbai, Bengaluru)
  const [currentCityId, setCurrentCityId] = useState<CityId>('pune');

  // Master datasets
  const [allLocations, setAllLocations] = useState<CityLocation[]>(ALL_MULTI_CITY_LOCALITIES);
  const [allEvents, setAllEvents] = useState<UnifiedEvent[]>(ALL_MULTI_CITY_EVENTS);
  const [allReports, setAllReports] = useState<CitizenReport[]>(ALL_MULTI_CITY_REPORTS);

  // Highway Landslide & Waterlogging Detour Engine state
  const [activeDetour, setActiveDetour] = useState<DetourCorridor | null>(HIGHWAY_DETOUR_CORRIDORS[0]);
  const [isDetourNavigatorOpen, setIsDetourNavigatorOpen] = useState<boolean>(false);

  // Filter settings state
  const [filters, setFilters] = useState<FilterSettings>({
    dateRange: 'all',
    eventType: 'all',
    locationId: 'all',
    verificationStatus: 'all',
    minEvidenceScore: 0,
  });

  // Locations in active city
  const cityLocations = useMemo(() => {
    return allLocations.filter((l) => l.cityId === currentCityId);
  }, [allLocations, currentCityId]);

  // Selected state: Default to primary location in current city
  const [selectedLocation, setSelectedLocation] = useState<CityLocation | null>(
    cityLocations[0] || ALL_MULTI_CITY_LOCALITIES[0]
  );
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'map' | 'fusion' | 'analytics'>('map');

  // Map layer controls
  const [layers, setLayers] = useState<MapLayerSettings>({
    weather: true,
    rainfall: true,
    traffic: true,
    waterlogging: true,
    visibility: true,
    citizenReports: true,
    highPriorityEvents: true,
    alternateRoutes: true,
  });

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportModalLocationId, setReportModalLocationId] = useState<string>('sinhagad-road');
  const [reportModalCoords, setReportModalCoords] = useState<[number, number] | undefined>(undefined);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState<boolean>(false);

  // Guided Walkthrough State
  const [isGuidedTourActive, setIsGuidedTourActive] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);

  // Multi-dimensional Filter Engine:
  // Evaluates Date-wise, Event-wise, Location-wise, and Verification Status criteria
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      // 1. City constraint
      if (evt.cityId !== currentCityId) return false;

      // 2. Date-wise filtering
      if (filters.dateRange === 'today' && evt.date !== '2026-09-19') return false;
      if (filters.dateRange === 'yesterday' && evt.date !== '2026-09-18') return false;
      if (filters.dateRange === 'past_3d') {
        const d = evt.date;
        if (d !== '2026-09-19' && d !== '2026-09-18' && d !== '2026-09-17') return false;
      }

      // 3. Event-wise filtering
      if (filters.eventType !== 'all' && evt.issueType !== filters.eventType) return false;

      // 4. Location-wise filtering
      if (filters.locationId !== 'all' && evt.locationId !== filters.locationId) return false;

      // 5. Verification status tracking
      if (filters.verificationStatus !== 'all') {
        if (filters.verificationStatus === 'duplicate_suppressed') {
          if (evt.likelyDuplicatesCount === 0) return false;
        } else if (evt.verificationStatus !== filters.verificationStatus) {
          return false;
        }
      }

      // 6. Minimum evidence score
      if (evt.evidenceScore < filters.minEvidenceScore) return false;

      return true;
    });
  }, [allEvents, currentCityId, filters]);

  // Citizen reports for current city
  const cityReports = useMemo(() => {
    return allReports.filter((r) => r.cityId === currentCityId);
  }, [allReports, currentCityId]);

  // City switching handler
  const handleCityChange = (cityId: CityId) => {
    setCurrentCityId(cityId);
    const newCityLocs = allLocations.filter((l) => l.cityId === cityId);
    if (newCityLocs.length > 0) {
      setSelectedLocation(newCityLocs[0]);
      const matchedDetour = getDetourForLocation(newCityLocs[0].id, cityId);
      setActiveDetour(matchedDetour || null);
    }
    // Reset location-specific filter when switching city
    setFilters((prev) => ({ ...prev, locationId: 'all' }));
  };

  // Layer toggling
  const handleToggleLayer = (layerKey: keyof MapLayerSettings) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Location selection (can be from any city via search or map click)
  const handleSelectLocation = (loc: CityLocation) => {
    if (loc.cityId !== currentCityId) {
      setCurrentCityId(loc.cityId as CityId);
    }
    setSelectedLocation(loc);
    setIsSidePanelOpen(true);
    // Find detour for this affected region if required
    const detour = getDetourForLocation(loc.id, loc.cityId);
    if (detour) {
      setActiveDetour(detour);
    }
    if (activeTab !== 'map') {
      setActiveTab('map');
    }
  };

  // Event selection (opens detailed inspection modal)
  const handleSelectEvent = (evt: UnifiedEvent) => {
    setSelectedEvent(evt);
    setIsEventDetailOpen(true);
  };

  // Click on map to report incident
  const handleMapClickCoordinates = (coords: [number, number], defaultLocId?: string) => {
    setReportModalCoords(coords);
    if (defaultLocId) {
      setReportModalLocationId(defaultLocId);
    }
    setIsReportModalOpen(true);
  };

  // Filter updates
  const handleFilterChange = (newFilters: Partial<FilterSettings>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      eventType: 'all',
      locationId: 'all',
      verificationStatus: 'all',
      minEvidenceScore: 0,
    });
  };

  // Submission of new citizen report (triggers SLM & Event Fusion pipeline)
  const handleSubmitReport = (newReport: CitizenReport) => {
    const { updatedEvents, matchedEvent, isDuplicate } = processEventFusion(
      newReport,
      allEvents
    );

    const processedReport: CitizenReport = {
      ...newReport,
      isDuplicate,
      duplicateOfEventId: matchedEvent?.id,
    };

    setAllReports((prev) => [processedReport, ...prev]);
    setAllEvents(updatedEvents);

    // Update location reports count & road congestion
    setAllLocations((prev) =>
      prev.map((l) => {
        if (l.id === newReport.locationId) {
          return {
            ...l,
            citizenReportsCount: l.citizenReportsCount + 1,
            lastUpdated: 'Just now',
            traffic: {
              ...l.traffic,
              congestionPercent: Math.min(99, l.traffic.congestionPercent + 2),
            },
          };
        }
        return l;
      })
    );

    if (matchedEvent) {
      setSelectedEvent(matchedEvent);
    }
  };

  // Guided Walkthrough Next Step Trigger
  const handleNextDemoStep = () => {
    const next = demoStep + 1;
    if (next > DEMO_STEPS.length) {
      setDemoStep(1);
      return;
    }

    setDemoStep(next);

    switch (next) {
      case 2: // Switch to Delhi
        handleCityChange('delhi');
        break;
      case 3: // Side Panel Inspection for Delhi
        setIsSidePanelOpen(true);
        break;
      case 4: // Apply filters: Waterlogging only
        handleFilterChange({ eventType: 'Waterlogging', verificationStatus: 'verified' });
        break;
      case 5: // Open Delhi Minto Road Event Card
        {
          const delhiMintoEvt = allEvents.find((e) => e.locationId === 'delhi-minto');
          if (delhiMintoEvt) handleSelectEvent(delhiMintoEvt);
        }
        break;
      case 6: // Launch Citizen Report Modal
        setIsEventDetailOpen(false);
        setReportModalLocationId('delhi-minto');
        setIsReportModalOpen(true);
        break;
      case 7: // Event Fusion View
        setIsReportModalOpen(false);
        setActiveTab('fusion');
        break;
      case 8: // City Analytics View
        setActiveTab('analytics');
        break;
      case 9: // Highway Detour Engine
        setActiveTab('map');
        handleCityChange('pune');
        setActiveDetour(HIGHWAY_DETOUR_CORRIDORS[0]);
        setIsDetourNavigatorOpen(true);
        break;
      default:
        break;
    }
  };

  // Detour Navigation Handlers
  const handleOpenDetourNavigator = (preferredLocId?: string) => {
    if (preferredLocId) {
      const matched = HIGHWAY_DETOUR_CORRIDORS.find(
        (c) => c.cityId === currentCityId || c.id.includes(preferredLocId)
      );
      if (matched) setActiveDetour(matched);
    }
    setIsDetourNavigatorOpen(true);
  };

  const handleSelectDetour = (detour: DetourCorridor) => {
    setActiveDetour(detour);
    if (detour.cityId !== currentCityId) {
      handleCityChange(detour.cityId);
    }
  };

  const handleFocusDetourOnMap = (detour: DetourCorridor) => {
    setActiveDetour(detour);
    if (detour.cityId !== currentCityId) {
      handleCityChange(detour.cityId);
    }
    setActiveTab('map');
  };

  const handlePrevDemoStep = () => {
    setDemoStep((prev) => Math.max(1, prev - 1));
  };

  const handleResetDemo = () => {
    setDemoStep(1);
    handleCityChange('pune');
    handleResetFilters();
    setActiveTab('map');
  };

  return (
    <div className="w-screen h-screen h-[100dvh] flex flex-col bg-slate-100 text-slate-900 overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <TopNav
        locations={cityLocations}
        allLocations={allLocations}
        currentCityId={currentCityId}
        onCityChange={handleCityChange}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSelectLocation={handleSelectLocation}
        onOpenReportModal={() => {
          setReportModalLocationId(selectedLocation?.id || cityLocations[0]?.id || 'sinhagad-road');
          setReportModalCoords(undefined);
          setIsReportModalOpen(true);
        }}
        onStartGuidedTour={() => {
          setIsGuidedTourActive(true);
          setDemoStep(1);
        }}
        onOpenDetourNavigator={() => handleOpenDetourNavigator()}
        isGuidedTourActive={isGuidedTourActive}
        totalIncidentsCount={filteredEvents.length}
      />

      {/* Guided Walkthrough Banner */}
      {isGuidedTourActive && (
        <GuidedDemoBar
          currentStep={demoStep}
          onNextStep={handleNextDemoStep}
          onPrevStep={handlePrevDemoStep}
          onResetDemo={handleResetDemo}
          onCloseDemo={() => setIsGuidedTourActive(false)}
        />
      )}

      {/* Multi-Dimensional Filter Toolbar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableLocations={cityLocations}
        totalEventsCount={allEvents.filter((e) => e.cityId === currentCityId).length}
        filteredEventsCount={filteredEvents.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Tab 1: GIS Map View */}
        {activeTab === 'map' && (
          <div className="flex-1 relative flex overflow-hidden">
            {/* The GIS Map */}
            <div className="flex-1 relative h-full">
              <MultiCityMap
                locations={cityLocations}
                events={filteredEvents}
                citizenReports={cityReports}
                selectedLocation={selectedLocation}
                selectedEvent={selectedEvent}
                currentCityId={currentCityId}
                layers={layers}
                activeDetour={activeDetour}
                onSelectLocation={handleSelectLocation}
                onSelectEvent={handleSelectEvent}
                onMapClickCoordinates={handleMapClickCoordinates}
                onOpenDetourNavigator={() => handleOpenDetourNavigator()}
                onSelectDetour={handleSelectDetour}
                onClearActiveDetour={() => setActiveDetour(null)}
              />

              {/* Layer Controls Dropdown Pill */}
              <LayerControls layers={layers} onToggleLayer={handleToggleLayer} />

              {/* Bottom Live Ground Stream Feed */}
              <LiveEventFeed
                reports={cityReports}
                onSelectEventById={(id) => {
                  const evt = allEvents.find((e) => e.id === id);
                  if (evt) handleSelectEvent(evt);
                }}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            </div>

            {/* Side Intelligence Panel (dynamic for selected corridor) */}
            {selectedLocation && isSidePanelOpen && (
              <SideIntelligencePanel
                location={selectedLocation}
                events={filteredEvents}
                citizenReports={cityReports}
                onSelectEvent={handleSelectEvent}
                onOpenReportModal={(locId) => {
                  setReportModalLocationId(locId);
                  setIsReportModalOpen(true);
                }}
                onOpenDetour={() => handleOpenDetourNavigator(selectedLocation?.id)}
                onSelectDetour={handleSelectDetour}
                activeDetour={activeDetour}
                onClose={() => setIsSidePanelOpen(false)}
              />
            )}

            {/* Minimized Panel Re-open Pill if closed */}
            {!isSidePanelOpen && selectedLocation && (
              <button
                onClick={() => setIsSidePanelOpen(true)}
                className="absolute top-28 left-3 right-auto md:top-4 md:left-auto md:right-44 z-[400] px-3 py-1.5 rounded-lg bg-white/95 border border-slate-300 text-xs font-semibold text-slate-800 shadow-md hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Show {selectedLocation.name} Telemetry</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Event Fusion Engine Visualizer */}
        {activeTab === 'fusion' && (
          <div className="flex-1 h-full overflow-hidden">
            <EventFusionVisualizer
              events={filteredEvents.length > 0 ? filteredEvents : allEvents}
              onOpenReportModal={(locId) => {
                setReportModalLocationId(locId);
                setIsReportModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: City Analytics & Road Disruption Index */}
        {activeTab === 'analytics' && (
          <div className="flex-1 h-full overflow-hidden">
            <AnalyticsView 
              locations={cityLocations} 
              allLocations={allLocations}
              events={allEvents} 
              currentCityId={currentCityId}
              onSelectCity={handleCityChange}
            />
          </div>
        )}
      </main>

      {/* Highway Landslide & Waterlogging Detour Navigator Modal */}
      <HighwayDetourNavigator
        currentCityId={currentCityId}
        activeDetour={activeDetour}
        onSelectDetour={handleSelectDetour}
        onFocusDetourOnMap={handleFocusDetourOnMap}
        isOpen={isDetourNavigatorOpen}
        onClose={() => setIsDetourNavigatorOpen(false)}
      />

      {/* Citizen Report Modal (with SLM multilingual entity & cause extraction) */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        locations={allLocations}
        initialLocationId={reportModalLocationId}
        initialCoordinates={reportModalCoords}
        onSubmitReport={handleSubmitReport}
      />

      {/* Master Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => {
          setIsEventDetailOpen(false);
          setSelectedEvent(null);
        }}
        onOpenReportModal={(locId) => {
          setIsEventDetailOpen(false);
          setReportModalLocationId(locId);
          setIsReportModalOpen(true);
        }}
        onOpenDetour={() => handleOpenDetourNavigator(selectedEvent?.locationId)}
      />
    </div>
  );
}
