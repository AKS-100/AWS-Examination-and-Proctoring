/**
 * Real-Time Automatic Computer Vision Proctoring Service
 * 
 * Uses TensorFlow.js and COCO-SSD to detect:
 * 1. Mobile phones / cell phones in camera viewport
 * 2. Multiple persons in room
 * 3. Candidate absence (0 persons detected)
 * 4. Secondary devices (laptops, books)
 * 
 * Works 100% automatically in real-time right in the browser on live webcam stream.
 */

let cachedModel = null;
let isModelLoading = false;
let modelLoadPromise = null;

/**
 * Load COCO-SSD Object Detection Model
 * Tries window.cocoSsd first (from CDN script), then dynamic import from node_modules.
 */
export const loadVisionModel = async () => {
  if (cachedModel) return cachedModel;
  if (isModelLoading && modelLoadPromise) return modelLoadPromise;

  isModelLoading = true;
  modelLoadPromise = (async () => {
    try {
      // 1. Try window.cocoSsd if preloaded via script tag
      if (typeof window !== 'undefined' && window.cocoSsd) {
        console.log('[AI Vision] Loading COCO-SSD from global window...');
        cachedModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        console.log('[AI Vision] COCO-SSD Model Loaded Successfully (Global).');
        return cachedModel;
      }

      // 2. Wait up to 2 seconds for script tag to finish executing if still loading
      for (let i = 0; i < 10; i++) {
        if (typeof window !== 'undefined' && window.cocoSsd) {
          cachedModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
          console.log('[AI Vision] COCO-SSD Model Loaded Successfully after wait.');
          return cachedModel;
        }
        await new Promise((r) => setTimeout(r, 200));
      }

      // 3. Fallback: dynamically inject script tag if not yet present
      if (typeof window !== 'undefined' && !window.cocoSsd && typeof document !== 'undefined') {
        if (!window.tf) {
          await new Promise((resolve) => {
            const tfScript = document.createElement('script');
            tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
            tfScript.onload = resolve;
            tfScript.onerror = resolve;
            document.head.appendChild(tfScript);
          });
        }

        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
          script.onload = resolve;
          script.onerror = resolve;
          document.head.appendChild(script);
        });
        if (window.cocoSsd) {
          cachedModel = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
          return cachedModel;
        }
      }
      return null;
    } catch (err) {
      console.warn('[AI Vision Model Load Notice]', err.message);
      return null;
    } finally {
      isModelLoading = false;
    }
  })();

  return modelLoadPromise;
};

/**
 * Scan a single video frame for objects, mobile phones, and persons
 * @param {HTMLVideoElement} videoElement 
 * @returns {Promise<{
 *   isReady: boolean,
 *   isPhoneDetected: boolean,
 *   phoneConfidence: number,
 *   phoneBox: number[] | null,
 *   personCount: number,
 *   isMultiplePersons: boolean,
 *   isCandidateAbsent: boolean,
 *   suspiciousObjects: Array,
 *   rawDetections: Array
 * }>}
 */
export const detectObjectsInVideo = async (videoElement) => {
  if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
    return {
      isReady: false,
      isPhoneDetected: false,
      phoneConfidence: 0,
      phoneBox: null,
      personCount: 1,
      isMultiplePersons: false,
      isCandidateAbsent: false,
      suspiciousObjects: [],
      rawDetections: [],
    };
  }

  try {
    const model = await loadVisionModel();
    if (!model) {
      return {
        isReady: false,
        isPhoneDetected: false,
        phoneConfidence: 0,
        phoneBox: null,
        personCount: 1,
        isMultiplePersons: false,
        isCandidateAbsent: false,
        suspiciousObjects: [],
        rawDetections: [],
      };
    }

    const predictions = await model.detect(videoElement);
    const rawDetections = predictions || [];

    // 1. Mobile Phone Detection
    const phoneKeywords = ['cell phone', 'remote', 'telephone', 'smartphone', 'phone', 'cellphone', 'mobile phone'];
    const phonePredictions = rawDetections.filter(
      (p) => phoneKeywords.some((k) => p.class?.toLowerCase().includes(k)) && p.score >= 0.40
    );
    const isPhoneDetected = phonePredictions.length > 0;
    const topPhone = isPhoneDetected ? phonePredictions[0] : null;
    const phoneConfidence = topPhone ? Math.round(topPhone.score * 100) : 0;
    const phoneBox = topPhone ? topPhone.bbox : null;

    // 2. Person Count Detection
    const personPredictions = rawDetections.filter(
      (p) => p.class?.toLowerCase() === 'person' && p.score >= 0.40
    );
    const personCount = personPredictions.length;
    const isMultiplePersons = personCount > 1;
    const isCandidateAbsent = personCount === 0;

    // 3. Other suspicious unauthorized materials (e.g. secondary laptops or books)
    const otherSuspicious = rawDetections.filter(
      (p) =>
        ['laptop', 'book'].includes(p.class?.toLowerCase()) &&
        p.score >= 0.60
    );

    return {
      isReady: true,
      isPhoneDetected,
      phoneConfidence,
      phoneBox,
      personCount,
      isMultiplePersons,
      isCandidateAbsent,
      suspiciousObjects: [...phonePredictions, ...otherSuspicious],
      rawDetections,
    };
  } catch (err) {
    console.warn('[AI Vision Detection Error]', err.message);
    return {
      isReady: false,
      isPhoneDetected: false,
      phoneConfidence: 0,
      phoneBox: null,
      personCount: 1,
      isMultiplePersons: false,
      isCandidateAbsent: false,
      suspiciousObjects: [],
      rawDetections: [],
    };
  }
};

/**
 * Capture High-Resolution Video Snapshot as Base64 JPEG
 */
export const captureVideoSnapshot = (videoElement, width = 640, height = 480) => {
  if (!videoElement || videoElement.videoWidth === 0) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.75);
  } catch (err) {
    console.warn('[AI Vision Snapshot Notice]', err.message);
    return null;
  }
};

export default {
  loadVisionModel,
  detectObjectsInVideo,
  captureVideoSnapshot,
};
