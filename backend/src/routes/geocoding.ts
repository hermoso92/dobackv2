import { Router } from 'express';
import { reverseGeocode } from '../controllers/geocodingController';

const router = Router();

/**
 * POST /api/geocoding/reverse
 * Geocodificación inversa usando Nominatim como proxy
 * 
 * Body: { lat: number, lng: number }
 * Response: { address: string, road?: string, city?: string, success: boolean }
 */
router.post('/reverse', reverseGeocode);

export default router;
