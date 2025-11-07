/**
 * Google Maps Example Component
 * 
 * Componente de ejemplo que muestra cómo usar los servicios de Google Maps
 * Puede servir como referencia o para testing
 */

import React, { useState } from 'react';
import {
    useGeocodingReverse,
    useRoute,
    useSnapToRoads,
    useElevationProfile,
    useNearbyPlaces,
} from '../../hooks/useGoogleMaps';
import { googleMaps } from '../../services/googleMaps/googleMapsService';
import { logger } from '../../utils/logger';

const GoogleMapsExample: React.FC = () => {
    // Estado para coordenadas de ejemplo
    const [lat] = useState(40.4168);
    const [lng] = useState(-3.7038);
    
    // 1. Geocoding Reverse
    const { result: geocoding, loading: geocodingLoading } = useGeocodingReverse(lat, lng);
    
    // 2. Route entre dos puntos
    const { route, loading: routeLoading } = useRoute(
        40.4168, -3.7038,  // Madrid - Plaza Mayor
        40.4200, -3.7000   // Madrid - Puerta del Sol
    );
    
    // 3. Snap-to-road
    const examplePath = [
        { lat: 40.4168, lng: -3.7038 },
        { lat: 40.4170, lng: -3.7040 },
        { lat: 40.4172, lng: -3.7042 },
    ];
    const { snappedPoints, loading: snapLoading } = useSnapToRoads(examplePath, true);
    
    // 4. Elevation Profile
    const { profile, loading: elevationLoading } = useElevationProfile(examplePath);
    
    // 5. Nearby Places
    const { places, loading: placesLoading } = useNearbyPlaces(
        lat,
        lng,
        1000,
        ['restaurant', 'cafe']
    );
    
    // Función para testear servicios directamente
    const testServices = async () => {
        logger.info('🧪 Testing Google Maps Services...');
        
        // Test Geocoding
        const address = await googleMaps.geocoding.getStreetName(40.4168, -3.7038);
        logger.info('✅ Geocoding:', { address });
        
        // Test Routes
        const testRoute = await googleMaps.routes.getDistanceAndDuration(
            { lat: 40.4168, lng: -3.7038 },
            { lat: 40.4200, lng: -3.7000 },
            'DRIVE'
        );
        logger.info('✅ Routes:', { testRoute });
        
        // Test Roads
        const snapped = await googleMaps.roads.snapToRoads(examplePath);
        logger.info('✅ Roads:', { snappedCount: snapped.length });
        
        // Test Elevation
        const elevation = await googleMaps.elevation.getSingleElevation(40.4168, -3.7038);
        logger.info('✅ Elevation:', { elevation });
        
        // Test Places
        const nearbyParking = await googleMaps.places.findNearbyParkings(
            { lat: 40.4168, lng: -3.7038 },
            1000
        );
        logger.info('✅ Places:', { parkingsFound: nearbyParking.length });
    };
    
    return (
        <div className="p-6 space-y-6 bg-white rounded-lg shadow-lg">
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    🗺️ Google Maps Platform - Ejemplos
                </h1>
                <p className="text-gray-600 mt-2">
                    Ejemplos de uso de los servicios de Google Maps integrados
                </p>
            </div>
            
            {/* 1. Geocoding */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-700">
                    1. Geocoding Reverse
                </h2>
                {geocodingLoading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : geocoding ? (
                    <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-600">
                            <strong>Coordenadas:</strong> {lat.toFixed(4)}, {lng.toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Dirección:</strong> {geocoding.formattedAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Calle:</strong> {geocoding.street || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Ciudad:</strong> {geocoding.city || 'N/A'}
                        </p>
                    </div>
                ) : (
                    <p className="text-red-500">No se pudo obtener la dirección</p>
                )}
            </div>
            
            {/* 2. Routes */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-700">2. Routes API</h2>
                {routeLoading ? (
                    <p className="text-gray-500">Calculando ruta...</p>
                ) : route ? (
                    <div className="bg-green-50 p-4 rounded">
                        <p className="text-sm text-gray-600">
                            <strong>Distancia:</strong> {(route.distanceMeters / 1000).toFixed(2)} km
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Duración:</strong> {Math.round(route.durationSeconds / 60)} minutos
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Legs:</strong> {route.legs.length}
                        </p>
                    </div>
                ) : (
                    <p className="text-red-500">No se pudo calcular la ruta</p>
                )}
            </div>
            
            {/* 3. Roads API */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-700">
                    3. Roads API (Snap-to-road)
                </h2>
                {snapLoading ? (
                    <p className="text-gray-500">Ajustando puntos GPS...</p>
                ) : snappedPoints.length > 0 ? (
                    <div className="bg-yellow-50 p-4 rounded">
                        <p className="text-sm text-gray-600">
                            <strong>Puntos originales:</strong> {examplePath.length}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Puntos ajustados:</strong> {snappedPoints.length}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Primer punto:</strong>{' '}
                            {snappedPoints[0].location.lat.toFixed(6)},{' '}
                            {snappedPoints[0].location.lng.toFixed(6)}
                        </p>
                    </div>
                ) : (
                    <p className="text-red-500">No se pudieron ajustar los puntos</p>
                )}
            </div>
            
            {/* 4. Elevation */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-700">
                    4. Elevation API
                </h2>
                {elevationLoading ? (
                    <p className="text-gray-500">Obteniendo perfil de elevación...</p>
                ) : profile ? (
                    <div className="bg-purple-50 p-4 rounded">
                        <p className="text-sm text-gray-600">
                            <strong>Elevación mín:</strong> {profile.minElevation.toFixed(1)} m
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Elevación máx:</strong> {profile.maxElevation.toFixed(1)} m
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Desnivel positivo:</strong> {profile.totalGain.toFixed(1)} m
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Pendiente máxima:</strong> {profile.maxGrade.toFixed(1)}%
                        </p>
                    </div>
                ) : (
                    <p className="text-red-500">No se pudo obtener el perfil de elevación</p>
                )}
            </div>
            
            {/* 5. Places */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-700">
                    5. Places API (Nearby)
                </h2>
                {placesLoading ? (
                    <p className="text-gray-500">Buscando lugares cercanos...</p>
                ) : places.length > 0 ? (
                    <div className="bg-pink-50 p-4 rounded space-y-2">
                        <p className="text-sm text-gray-600">
                            <strong>Lugares encontrados:</strong> {places.length}
                        </p>
                        <div className="space-y-1">
                            {places.slice(0, 3).map((place, i) => (
                                <div key={place.id} className="text-sm text-gray-600 pl-4">
                                    {i + 1}. {place.displayName}
                                    {place.rating && ` - ⭐ ${place.rating}`}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-red-500">No se encontraron lugares cercanos</p>
                )}
            </div>
            
            {/* Botón de test */}
            <div className="pt-4 border-t">
                <button
                    onClick={testServices}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    🧪 Testear Servicios (ver consola)
                </button>
            </div>
        </div>
    );
};

export default GoogleMapsExample;

