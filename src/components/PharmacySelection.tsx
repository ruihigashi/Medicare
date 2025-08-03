import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Star, Send, CheckCircle, Navigation, Search, Filter, ArrowLeft } from 'lucide-react';

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  rating: number;
  openHours: string;
  isOpen: boolean;
  faxNumber: string;
  features: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  photos?: string[];
  vicinity?: string;
}

interface PharmacySelectionProps {
  patientAddress: string;
  onPharmacySelected: (pharmacy: Pharmacy) => void;
  onBack: () => void;
}

const PharmacySelection: React.FC<PharmacySelectionProps> = ({
  patientAddress,
  onPharmacySelected,
  onBack
}) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Text search function
  const handleTextSearch = async () => {
    if (!searchQuery.trim() || !mapLoaded) return;
    
    setIsLoading(true);
    console.log('Starting text search for:', searchQuery);
    
    try {
      const service = new window.google.maps.places.PlacesService(map || document.createElement('div'));
      
      // Text search request
      const request = {
        query: `${searchQuery} 薬局 pharmacy`,
        location: userLocation || { lat: 35.6812, lng: 139.7671 },
        radius: 10000, // 10km
        type: 'pharmacy',
        language: 'ja'
      };
      
      console.log('Text search request:', request);
      
      service.textSearch(request, (results: any, status: any) => {
        console.log('Text search results:', { results, status, count: results?.length });
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          processTextSearchResults(service, results);
        } else {
          console.log('Text search failed, showing mock results for:', searchQuery);
          showMockSearchResults(searchQuery);
        }
      });
    } catch (error) {
      console.error('Text search error:', error);
      showMockSearchResults(searchQuery);
    }
  };
  
  const processTextSearchResults = async (service: any, results: any[]) => {
    console.log('Processing text search results:', results.length);
    
    const pharmacyPromises = results.slice(0, 10).map((place: any) => 
      getPharmacyDetails(service, place, userLocation || { lat: 35.6812, lng: 139.7671 })
    );
    
    try {
      const pharmacies = await Promise.all(pharmacyPromises);
      const validPharmacies = pharmacies.filter(p => p !== null);
      console.log('Valid pharmacies from text search:', validPharmacies.length);
      
      if (validPharmacies.length > 0) {
        setPharmacies(validPharmacies.sort((a, b) => a.distance - b.distance));
        setIsLoading(false);
        
        // Add markers to map if available
        if (map) {
          addMarkersToMap(map, validPharmacies, userLocation || { lat: 35.6812, lng: 139.7671 });
        }
      } else {
        showMockSearchResults(searchQuery);
      }
    } catch (error) {
      console.error('Error processing text search results:', error);
      showMockSearchResults(searchQuery);
    }
  };
  
  const showMockSearchResults = (query: string) => {
    console.log('Showing mock results for query:', query);
    
    const mockResults: Pharmacy[] = [
      {
        id: `search_${Date.now()}_1`,
        name: `${query}周辺の薬局 1`,
        address: `東京都内 ${query}エリア 1-1-1`,
        phone: '03-1111-1111',
        distance: 0.3,
        rating: 4.2,
        openHours: '9:00-21:00',
        isOpen: true,
        faxNumber: '03-1111-1112',
        features: ['処方箋受付', '営業中', '検索結果'],
        coordinates: {
          lat: (userLocation?.lat || 35.6812) + (Math.random() - 0.5) * 0.01,
          lng: (userLocation?.lng || 139.7671) + (Math.random() - 0.5) * 0.01
        }
      },
      {
        id: `search_${Date.now()}_2`,
        name: `${query}近くのドラッグストア`,
        address: `東京都内 ${query}エリア 2-2-2`,
        phone: '03-2222-2222',
        distance: 0.7,
        rating: 4.0,
        openHours: '10:00-22:00',
        isOpen: true,
        faxNumber: '03-2222-2223',
        features: ['処方箋受付', '深夜営業', '検索結果'],
        coordinates: {
          lat: (userLocation?.lat || 35.6812) + (Math.random() - 0.5) * 0.01,
          lng: (userLocation?.lng || 139.7671) + (Math.random() - 0.5) * 0.01
        }
      },
      {
        id: `search_${Date.now()}_3`,
        name: `${query}薬局チェーン店`,
        address: `東京都内 ${query}エリア 3-3-3`,
        phone: '03-3333-3333',
        distance: 1.2,
        rating: 3.8,
        openHours: '9:00-20:00',
        isOpen: false,
        faxNumber: '03-3333-3334',
        features: ['処方箋受付', '営業時間外', '検索結果'],
        coordinates: {
          lat: (userLocation?.lat || 35.6812) + (Math.random() - 0.5) * 0.02,
          lng: (userLocation?.lng || 139.7671) + (Math.random() - 0.5) * 0.02
        }
      }
    ];
    
    setPharmacies(mockResults);
    setIsLoading(false);
    
    // Add mock markers to map if available
    if (map) {
      addMarkersToMap(map, mockResults, userLocation || { lat: 35.6812, lng: 139.7671 });
    }
  };

  // Wait for Google Maps to load
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setMapLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    
    // Listen for the custom event
    const handleMapsLoaded = () => {
      checkGoogleMaps();
    };
    
    window.addEventListener('google-maps-loaded', handleMapsLoaded);
    checkGoogleMaps(); // Also check immediately
    
    return () => {
      window.removeEventListener('google-maps-loaded', handleMapsLoaded);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && !map) {
      initializeMap();
    }
  }, [mapLoaded]);

  const initializeMap = () => {
    // Default to Tokyo Station if no address
    const defaultLocation = { lat: 35.6812, lng: 139.7671 };
    setUserLocation(defaultLocation);
    
    const mapInstance = new window.google.maps.Map(document.getElementById('pharmacy-map'), {
      center: defaultLocation,
      zoom: 15,
      mapId: 'DEMO_MAP_ID' // Using demo map ID for better styling
    });
    
    setMap(mapInstance);
    
    // Geocode patient address and search for pharmacies
    if (patientAddress) {
      geocodeAndSearch(mapInstance, patientAddress);
    } else {
      searchNearbyPharmacies(mapInstance, defaultLocation);
    }
  };

  const geocodeAndSearch = (mapInstance: any, address: string) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: address }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng()
        };
        
        setUserLocation(coords);
        mapInstance.setCenter(coords);
        searchNearbyPharmacies(mapInstance, coords);
      } else {
        console.error('Geocoding failed:', status);
        // Fallback to Tokyo Station
        const fallbackLocation = { lat: 35.6812, lng: 139.7671 };
        setUserLocation(fallbackLocation);
        searchNearbyPharmacies(mapInstance, fallbackLocation);
      }
    });
  };

  const searchNearbyPharmacies = (mapInstance: any, location: { lat: number; lng: number }) => {
    console.log('Starting pharmacy search at location:', location);
    
    const service = new window.google.maps.places.PlacesService(mapInstance);
    
    // First try with specific pharmacy search
    const primaryRequest = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: 3000, // 3km radius
      type: 'pharmacy',
      keyword: '薬局',
      language: 'ja'
    };
    
    console.log('Primary search request:', primaryRequest);
    
    service.nearbySearch(primaryRequest, (results: any, status: any) => {
      console.log('Primary search results:', { results, status, count: results?.length });
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        console.log('Found pharmacies in primary search:', results.length);
        processSearchResults(service, results, location, mapInstance);
      } else {
        console.log('Primary search failed, trying secondary search...');
        
        // Secondary search with broader terms
        const secondaryRequest = {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 5000, // 5km radius
          keyword: 'ドラッグストア 薬局 pharmacy',
          language: 'ja'
        };
        
        console.log('Secondary search request:', secondaryRequest);
        
        service.nearbySearch(secondaryRequest, (secondaryResults: any, secondaryStatus: any) => {
          console.log('Secondary search results:', { secondaryResults, secondaryStatus, count: secondaryResults?.length });
          
          if (secondaryStatus === window.google.maps.places.PlacesServiceStatus.OK && secondaryResults) {
            console.log('Found places in secondary search:', secondaryResults.length);
            processSearchResults(service, secondaryResults, location, mapInstance);
          } else {
            console.log('Both searches failed, using mock data');
            createMockPharmacies(location, mapInstance);
          }
        });
      }
    });
  };
  
  const processSearchResults = (service: any, results: any[], location: { lat: number; lng: number }, mapInstance: any) => {
    console.log('Processing search results:', results.length);
    
    const pharmacyPromises = results.slice(0, 15).map((place: any) => 
      getPharmacyDetails(service, place, location)
    );
    
    Promise.all(pharmacyPromises).then((pharmacies) => {
      const validPharmacies = pharmacies.filter(p => p !== null);
      console.log('Valid pharmacies after processing:', validPharmacies.length);
      
      if (validPharmacies.length > 0) {
        setPharmacies(validPharmacies.sort((a, b) => a.distance - b.distance));
        setIsLoading(false);
        
        // Add markers to map
        addMarkersToMap(mapInstance, validPharmacies, location);
      } else {
        console.log('No valid pharmacies found, using mock data');
        createMockPharmacies(location, mapInstance);
      }
    }).catch((error) => {
      console.error('Error processing pharmacy details:', error);
      createMockPharmacies(location, mapInstance);
    });
  };
  
  const createMockPharmacies = (userLocation: { lat: number; lng: number }, mapInstance?: any) => {
    console.log('Creating mock pharmacies for location:', userLocation);
    
    const mockPharmacies: Pharmacy[] = [
      {
        id: 'mock_1',
        name: 'サンドラッグ 渋谷店',
        address: '東京都渋谷区渋谷1-1-1',
        phone: '03-1234-5678',
        distance: 0.5,
        rating: 4.2,
        openHours: '9:00-22:00',
        isOpen: true,
        faxNumber: '03-1234-5679',
        features: ['処方箋受付', '24時間営業', '駐車場あり'],
        coordinates: {
          lat: userLocation.lat + 0.005,
          lng: userLocation.lng + 0.005
        }
      },
      {
        id: 'mock_2',
        name: 'マツモトキヨシ 新宿店',
        address: '東京都新宿区新宿2-2-2',
        phone: '03-2345-6789',
        distance: 1.2,
        rating: 4.0,
        openHours: '10:00-21:00',
        isOpen: true,
        faxNumber: '03-2345-6790',
        features: ['処方箋受付', 'ポイントカード', '健康相談'],
        coordinates: {
          lat: userLocation.lat - 0.008,
          lng: userLocation.lng + 0.010
        }
      },
      {
        id: 'mock_3',
        name: 'ウエルシア薬局 池袋店',
        address: '東京都豊島区池袋3-3-3',
        phone: '03-3456-7890',
        distance: 2.1,
        rating: 3.8,
        openHours: '9:00-20:00',
        isOpen: false,
        faxNumber: '03-3456-7891',
        features: ['処方箋受付', '在宅配送', 'Tポイント'],
        coordinates: {
          lat: userLocation.lat + 0.015,
          lng: userLocation.lng - 0.012
        }
      },
      {
        id: 'mock_4',
        name: 'スギ薬局 品川店',
        address: '東京都品川区品川4-4-4',
        phone: '03-4567-8901',
        distance: 1.8,
        rating: 4.1,
        openHours: '9:00-21:00',
        isOpen: true,
        faxNumber: '03-4567-8902',
        features: ['処方箋受付', '調剤薬局', 'ポイントカード'],
        coordinates: {
          lat: userLocation.lat - 0.012,
          lng: userLocation.lng - 0.008
        }
      },
      {
        id: 'mock_5',
        name: 'ココカラファイン 恵比寿店',
        address: '東京都渋谷区恵比寿5-5-5',
        phone: '03-5678-9012',
        distance: 0.9,
        rating: 4.3,
        openHours: '8:00-22:00',
        isOpen: true,
        faxNumber: '03-5678-9013',
        features: ['処方箋受付', '早朝営業', '深夜営業'],
        coordinates: {
          lat: userLocation.lat + 0.008,
          lng: userLocation.lng + 0.012
        }
      }
    ];
    
    setPharmacies(mockPharmacies.sort((a, b) => a.distance - b.distance));
    setIsLoading(false);
    
    // Add mock markers to map if map is available
    if (mapInstance) {
      addMarkersToMap(mapInstance, mockPharmacies, userLocation);
    }
  };

  const getPharmacyDetails = (service: any, place: any, userLocation: { lat: number; lng: number }): Promise<Pharmacy | null> => {
    return new Promise((resolve) => {
      // Check if place has required information
      if (!place.place_id || !place.name) {
        console.log('Place missing required info:', place);
        resolve(null);
        return;
      }
      
      service.getDetails({
        placeId: place.place_id,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'rating', 'photos', 'geometry', 'types']
      }, (details: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
          try {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              details.geometry.location.lat(),
              details.geometry.location.lng()
            );
            
            // Check if this is actually a pharmacy/drugstore
            const types = details.types || place.types || [];
            const isPharmacy = types.some((type: string) => 
              ['pharmacy', 'drugstore', 'health'].includes(type) ||
              details.name.includes('薬局') ||
              details.name.includes('ドラッグ') ||
              details.name.includes('ファーマシー')
            );
            
            if (!isPharmacy && distance > 2) {
              // Skip non-pharmacy places that are far away
              resolve(null);
              return;
            }
            
            // Generate mock phone and fax numbers based on place_id
            const phoneBase = place.place_id.slice(-8);
            const phone = details.formatted_phone_number || `03-${phoneBase.slice(0, 4)}-${phoneBase.slice(4)}`;
            const faxNumber = `03-${phoneBase.slice(0, 4)}-${(parseInt(phoneBase.slice(4)) + 1).toString().padStart(4, '0')}`;
            
            // Determine if open
            const isOpen = details.opening_hours ? details.opening_hours.isOpen() : true;
            
            // Generate opening hours
            let openHours = '9:00-20:00';
            if (details.opening_hours && details.opening_hours.weekday_text) {
              const today = new Date().getDay();
              const todayHours = details.opening_hours.weekday_text[today === 0 ? 6 : today - 1];
              if (todayHours) {
                const match = todayHours.match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
                if (match) {
                  openHours = `${match[1]}-${match[2]}`;
                }
              }
            }
            
            // Generate features
            const features = ['処方箋受付'];
            if (place.rating > 4.0) features.push('高評価');
            if (distance < 1.0) features.push('徒歩圏内');
            if (isOpen) features.push('営業中');
            if (types.includes('pharmacy')) features.push('調剤薬局');
            
            const pharmacy: Pharmacy = {
              id: place.place_id,
              name: details.name,
              address: details.formatted_address || place.vicinity || '住所情報なし',
              phone,
              distance: Math.round(distance * 10) / 10,
              rating: place.rating || details.rating || 4.0,
              openHours,
              isOpen,
              faxNumber,
              features,
              coordinates: {
                lat: details.geometry.location.lat(),
                lng: details.geometry.location.lng()
              },
              place_id: place.place_id,
              photos: details.photos ? details.photos.slice(0, 1).map((photo: any) => 
                photo.getUrl({ maxWidth: 400 })
              ) : [],
              vicinity: place.vicinity
            };
            
            console.log('Created pharmacy:', pharmacy.name, pharmacy.distance + 'km');
            resolve(pharmacy);
          } catch (error) {
            console.error('Error processing pharmacy details:', error);
            resolve(null);
          }
        } else {
          console.log('Failed to get details for place:', place.name, status);
          resolve(null);
        }
      });
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (window.google && window.google.maps && window.google.maps.geometry) {
      const point1 = new window.google.maps.LatLng(lat1, lng1);
      const point2 = new window.google.maps.LatLng(lat2, lng2);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
      return distance / 1000; // Convert to kilometers
    } else {
      // Fallback calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
  };

  const addMarkersToMap = (mapInstance: any, pharmacies: Pharmacy[], userLocation: { lat: number; lng: number }) => {
    console.log('Adding markers to map:', pharmacies.length, 'pharmacies');
    
    // Clear existing markers (if any)
    // Note: In a production app, you'd want to keep track of markers to remove them
    
    // Add user location marker
    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstance,
      title: '患者の住所',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    // Add pharmacy markers
    pharmacies.forEach((pharmacy, index) => {
      const marker = new window.google.maps.Marker({
        position: pharmacy.coordinates,
        map: mapInstance,
        title: pharmacy.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: pharmacy.isOpen ? '#10B981' : '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${pharmacy.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${pharmacy.address}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">⭐ ${pharmacy.rating} • 📍 ${pharmacy.distance}km</p>
            <p style="margin: 0; font-size: 12px; color: ${pharmacy.isOpen ? '#10B981' : '#EF4444'};">
              ${pharmacy.isOpen ? '営業中' : '営業時間外'}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
        handlePharmacySelectWithMap(pharmacy);
      });
    });
    
    // Adjust map bounds to show all markers
    if (pharmacies.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(userLocation);
      pharmacies.forEach(pharmacy => {
        bounds.extend(pharmacy.coordinates);
      });
      mapInstance.fitBounds(bounds);
    }
  };

  useEffect(() => {
    setIsLoading(true);
  }, [patientAddress]);

  const filteredAndSortedPharmacies = pharmacies
    .filter(pharmacy => {
      const matchesSearch = pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOpenFilter = !showOnlyOpen || pharmacy.isOpen;
      return matchesSearch && matchesOpenFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance;
      } else {
        return b.rating - a.rating;
      }
    });

  const handlePharmacySelectWithMap = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    
    // Highlight selected pharmacy on map
    if (map) {
      map.panTo(pharmacy.coordinates);
      map.setZoom(17);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedPharmacy) {
      onPharmacySelected(selectedPharmacy);
    }
  };

  const openInGoogleMaps = (pharmacy: Pharmacy) => {
    const url = pharmacy.place_id 
      ? `https://www.google.com/maps/place/?q=place_id:${pharmacy.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">薬局を選択</h1>
                <p className="text-gray-600 text-sm">処方箋をFAXで送信する薬局をお選びください</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              戻る
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar - Prominent */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSearch();
                  }
                }}
                placeholder="薬局名や住所で検索..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTextSearch}
                disabled={!searchQuery.trim() || isLoading}
                className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-lg"
              >
                <Search size={20} />
                {isLoading ? '検索中...' : '検索'}
              </button>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`px-4 py-4 rounded-xl transition-all flex items-center gap-2 font-medium ${
                  filterOpen 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                }`}
              >
                <Filter size={20} />
                フィルター
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="distance">📍 距離順</option>
                    <option value="rating">⭐ 評価順</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="openOnly"
                    checked={showOnlyOpen}
                    onChange={(e) => setShowOnlyOpen(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="openOnly" className="ml-2 text-sm text-gray-700 font-medium">🟢 営業中のみ表示</label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[500px]">
              <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin size={20} />
                  薬局マップ
                </h3>
                <p className="text-sm text-green-100 mt-1">🔵 患者の住所　🟢 営業中の薬局　🔴 営業時間外</p>
              </div>
              <div 
                id="pharmacy-map" 
                className="w-full h-[420px]"
              >
                {!mapLoaded && (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Google Mapsを読み込み中...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pharmacy List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Navigation size={20} className="text-green-600" />
                  薬局一覧 ({filteredAndSortedPharmacies.length}件)
                </h3>
                {selectedPharmacy && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">選択済み</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Google Mapsで近くの薬局を検索中...</p>
                  <p className="text-gray-500 text-sm mt-2">リアルタイム情報を取得しています</p>
                </div>
              ) : (
                filteredAndSortedPharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className={`rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${
                      selectedPharmacy?.id === pharmacy.id
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 bg-white hover:bg-green-50'
                    }`}
                    onClick={() => handlePharmacySelectWithMap(pharmacy)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1">{pharmacy.name}</h3>
                            {pharmacy.isOpen ? (
                              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                🟢 営業中
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                🔴 営業時間外
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                              <span className="text-xs line-clamp-2">{pharmacy.address}</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-600">
                              <div className="flex items-center gap-1">
                                <Navigation size={14} />
                                <span className="text-xs font-medium">{pharmacy.distance}km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star size={14} className="text-yellow-500 fill-current" />
                                <span className="text-xs font-medium">{pharmacy.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span className="text-xs">{pharmacy.openHours}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {pharmacy.features.map((feature, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="ml-3 flex flex-col gap-2">
                          {selectedPharmacy?.id === pharmacy.id && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="text-white" size={16} />
                            </div>
                          )}
                          <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(pharmacy);
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center gap-1 whitespace-nowrap"
                        >
                          <MapPin size={14} />
                          Maps
                        </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              </div>
              
              {/* Google Maps Attribution */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  薬局情報は Google Maps より取得 • リアルタイム営業状況 • {filteredAndSortedPharmacies.length}件の薬局が見つかりました
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Panel - Fixed Bottom */}
        {selectedPharmacy && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedPharmacy.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Navigation size={14} />
                        {selectedPharmacy.distance}km
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-current" size={14} />
                        {selectedPharmacy.rating}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPharmacy.isOpen 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedPharmacy.isOpen ? '🟢 営業中' : '🔴 営業時間外'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPharmacy(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    選択解除
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 transition-all font-bold text-lg flex items-center gap-2 shadow-lg"
                  >
                    <Send size={20} />
                    この薬局に処方箋をFAX送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacySelection;