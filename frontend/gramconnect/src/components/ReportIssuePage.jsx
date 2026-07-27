import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Image as ImageIcon, Trash2, Send, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import './ReportIssuePage.css';

const locationData = {
  Thiruvananthapuram: {
    Taluks: {
      Thiruvananthapuram: ['Thiruvananthapuram Corporation', 'Vattiyoorkavu Panchayat', 'Kazhakkoottam Panchayat'],
      Neyyattinkara: ['Neyyattinkara Municipality', 'Balaramapuram Panchayat', 'Parassala Panchayat'],
      Nedumangad: ['Nedumangad Municipality', 'Aruvikkara Panchayat', 'Vellanad Panchayat'],
      Chirayinkeezhu: ['Attingal Municipality', 'Chirayinkeezhu Panchayat', 'Kadakkavoor Panchayat'],
      Varkala: ['Varkala Municipality', 'Edava Panchayat', 'Elakamon Panchayat'],
      Kattakada: ['Kattakada Panchayat', 'Malayinkeezhu Panchayat', 'Maranalloor Panchayat']
    }
  },
  Kollam: {
    Taluks: {
      Kollam: ['Kollam Corporation', 'Eravipuram Panchayat', 'Chathannoor Panchayat'],
      Karunagappally: ['Karunagappally Municipality', 'Oachira Panchayat', 'Clappana Panchayat'],
      Kunnathur: ['Sasthamcotta Panchayat', 'Sooranad Panchayat', 'Kunnathur Panchayat'],
      Pathanapuram: ['Pathanapuram Panchayat', 'Piravanthoor Panchayat', 'Vilakkudy Panchayat'],
      Punalur: ['Punalur Municipality', 'Anchal Panchayat', 'Yerur Panchayat'],
      Kottarakkara: ['Kottarakkara Municipality', 'Veliyam Panchayat', 'Ummannur Panchayat']
    }
  },
  Pathanamthitta: {
    Taluks: {
      Adoor: ['Adoor Municipality', 'Pandalam Municipality', 'Kadampanad Panchayat'],
      Konni: ['Konni Panchayat', 'Pramadom Panchayat', 'Kalanjoor Panchayat'],
      Kozhencherry: ['Pathanamthitta Municipality', 'Aranmula Panchayat', 'Kozhencherry Panchayat'],
      Ranni: ['Ranni Panchayat', 'Vadasserikkara Panchayat', 'Angadi Panchayat'],
      Mallappally: ['Mallappally Panchayat', 'Anicadu Panchayat', 'Kottanadu Panchayat'],
      Thiruvalla: ['Thiruvalla Municipality', 'Koipuram Panchayat', 'Kaviyoor Panchayat']
    }
  },
  Alappuzha: {
    Taluks: {
      Chengannur: ['Chengannur Municipality', 'Mannar Panchayat', 'Budhanoor Panchayat'],
      Mavelikkara: ['Mavelikkara Municipality', 'Chennithala Panchayat', 'Vallikunnam Panchayat'],
      Karthikappally: ['Kayamkulam Municipality', 'Haripad Municipality', 'Karthikappally Panchayat'],
      Kuttanad: ['Pulincunnoo Panchayat', 'Nedumudi Panchayat', 'Champakulam Panchayat'],
      Ambalappuzha: ['Alappuzha Municipality', 'Ambalappuzha Panchayat', 'Punnapra Panchayat'],
      Cherthala: ['Cherthala Municipality', 'Aroor Panchayat', 'Pattanakkad Panchayat']
    }
  },
  Kottayam: {
    Taluks: {
      Changanasserry: ['Changanasserry Municipality', 'Kurichy Panchayat', 'Madappally Panchayat'],
      Kottayam: ['Kottayam Municipality', 'Ettumanoor Municipality', 'Vijayapuram Panchayat'],
      Vaikom: ['Vaikom Municipality', 'Thalayolaparambu Panchayat', 'Kaduthuruthy Panchayat'],
      Meenachil: ['Pala Municipality', 'Erattupetta Municipality', 'Bharananganam Panchayat'],
      Kanjirappally: ['Kanjirappally Panchayat', 'Erumely Panchayat', 'Mundakayam Panchayat']
    }
  },
  Idukki: {
    Taluks: {
      Peermade: ['Peermade Panchayat', 'Vandiperiyar Panchayat', 'Kumily Panchayat'],
      Udumbanchola: ['Kattappana Municipality', 'Nedumkandam Panchayat', 'Udumbanchola Panchayat'],
      Devikulam: ['Munnar Panchayat', 'Devikulam Panchayat', 'Marayoor Panchayat'],
      Thodupuzha: ['Thodupuzha Municipality', 'Muttom Panchayat', 'Karimannoor Panchayat'],
      Idukki: ['Vazhathope Panchayat', 'Kanjikuzhy Panchayat', 'Mariapuram Panchayat']
    }
  },
  Ernakulam: {
    Taluks: {
      Kothamangalam: ['Kothamangalam Municipality', 'Varappetty Panchayat', 'Pindimana Panchayat'],
      Muvattupuzha: ['Muvattupuzha Municipality', 'Piravom Municipality', 'Valakom Panchayat'],
      Kunnathunad: ['Perumbavoor Municipality', 'Kunnathunad Panchayat', 'Pattimattom Panchayat'],
      Kanayannur: ['Kochi Corporation', 'Tripunithura Municipality', 'Kalamassery Municipality'],
      Kochi: ['Kochi Corporation (West)', 'Chellanam Panchayat', 'Kumbalangi Panchayat'],
      'North Paravur': ['North Paravur Municipality', 'Eloor Municipality', 'Varapuzha Panchayat'],
      Aluva: ['Aluva Municipality', 'Angamaly Municipality', 'Nedumbassery Panchayat']
    }
  },
  Thrissur: {
    Taluks: {
      Chalakkudy: ['Chalakkudy Municipality', 'Athirappilly Panchayat', 'Kodakara Panchayat'],
      Mukundapuram: ['Irinjalakuda Municipality', 'Pudukkad Panchayat', 'Aloor Panchayat'],
      Kodungallur: ['Kodungallur Municipality', 'Mathilakam Panchayat', 'Eriyad Panchayat'],
      Thrissur: ['Thrissur Corporation', 'Ollur Panchayat', 'Amballur Panchayat'],
      Chavakkad: ['Chavakkad Municipality', 'Guruvayur Municipality', 'Vadakkekad Panchayat'],
      Kunnamkulam: ['Kunnamkulam Municipality', 'Porkulam Panchayat', 'Choondal Panchayat'],
      Thalapilly: ['Wadakkanchery Municipality', 'Chelakkara Panchayat', 'Pazhayannur Panchayat']
    }
  },
  Palakkad: {
    Taluks: {
      Alathur: ['Alathur Panchayat', 'Kuzhalmannam Panchayat', 'Tarur Panchayat'],
      Chittur: ['Chittur-Thathamangalam Municipality', 'Nelliampathy Panchayat', 'Kozhinjampara Panchayat'],
      Palakkad: ['Palakkad Municipality', 'Malampuzha Panchayat', 'Elappully Panchayat'],
      Mannarkkad: ['Mannarkkad Municipality', 'Attappady Panchayat', 'Alanallur Panchayat'],
      Ottappalam: ['Ottappalam Municipality', 'Shoranur Municipality', 'Cherpulassery Municipality'],
      Pattambi: ['Pattambi Municipality', 'Koppam Panchayat', 'Thrithala Panchayat']
    }
  },
  Malappuram: {
    Taluks: {
      Nilambur: ['Nilambur Municipality', 'Edakkara Panchayat', 'Vazhikkadavu Panchayat'],
      Eranad: ['Manjeri Municipality', 'Areacode Panchayat', 'Edavanna Panchayat'],
      Kondotty: ['Kondotty Municipality', 'Nediyiruppu Panchayat', 'Pulikkal Panchayat'],
      Tirurangadi: ['Tirurangadi Municipality', 'Parappanangadi Municipality', 'Chelari Panchayat'],
      Tirur: ['Tirur Municipality', 'Tanur Municipality', 'Valanchery Municipality'],
      Ponnani: ['Ponnani Municipality', 'Edappal Panchayat', 'Tavanur Panchayat'],
      Perinthalmanna: ['Perinthalmanna Municipality', 'Kottakkal Municipality', 'Angadipuram Panchayat']
    }
  },
  Kozhikode: {
    Taluks: {
      Vadakara: ['Vadakara Municipality', 'Chorode Panchayat', 'Onchiyam Panchayat'],
      Koyilandy: ['Koyilandy Municipality', 'Payyoli Municipality', 'Atholi Panchayat'],
      Kozhikode: ['Kozhikode Corporation', 'Ramanattukara Municipality', 'Feroke Municipality'],
      Thamarassery: ['Thamarassery Panchayat', 'Koduvally Municipality', 'Thiruvambady Panchayat']
    }
  },
  Wayanad: {
    Taluks: {
      Mananthavady: ['Mananthavady Municipality', 'Thirunelly Panchayat', 'Vellamunda Panchayat'],
      'Sulthan Bathery': ['Sulthan Bathery Municipality', 'Ambalavayal Panchayat', 'Noolpuzha Panchayat'],
      Vythiri: ['Kalpetta Municipality', 'Vythiri Panchayat', 'Meppadi Panchayat']
    }
  },
  Kannur: {
    Taluks: {
      Payyannur: ['Payyannur Municipality', 'Cherupuzha Panchayat', 'Karivellur Panchayat'],
      Taliparamba: ['Taliparamba Municipality', 'Alakode Panchayat', 'Sreekandapuram Municipality'],
      Kannur: ['Kannur Corporation', 'Pappinisseri Panchayat', 'Valapattanam Panchayat'],
      Thalassery: ['Thalassery Municipality', 'Mattannur Municipality', 'Kuthuparamba Municipality'],
      Iritty: ['Iritty Municipality', 'Peravoor Panchayat', 'Ulikkal Panchayat']
    }
  },
  Kasaragod: {
    Taluks: {
      Hosdurg: ['Kanhangad Municipality', 'Nileshwaram Municipality', 'Cheruvathur Panchayat'],
      Kasaragod: ['Kasaragod Municipality', 'Badiadka Panchayat', 'Mogral Puthur Panchayat'],
      Manjeshwaram: ['Manjeshwar Panchayat', 'Uppala Panchayat', 'Kumbla Panchayat'],
      Vellarikundu: ['Vellarikundu Panchayat', 'West Eleri Panchayat', 'Balal Panchayat']
    }
  }
};

export default function ReportIssuePage({ onNavigate }) {
  const { t } = useTranslation();

  const autofillFromAddress = (address) => {
    if (!address) return;

    // 1. Extract State
    const extractedState = address.state || '';
    if (extractedState) {
      setState(extractedState);
    }

    // 2. Extract PIN Code
    const extractedPincode = address.postcode || '';
    if (extractedPincode) {
      const cleanPincode = String(extractedPincode).replace(/\s+/g, '').trim();
      setPincode(cleanPincode);
    }

    // 3. Extract District
    const rawDistrict = address.district || address.state_district || address.county || '';
    const cleanDistrict = String(rawDistrict).replace(/\s*district\s*/gi, '').trim();
    
    let matchedDistrict = '';
    if (cleanDistrict) {
      matchedDistrict = districts.find(d => 
        d.toLowerCase() === cleanDistrict.toLowerCase() || 
        cleanDistrict.toLowerCase().includes(d.toLowerCase()) ||
        d.toLowerCase().includes(cleanDistrict.toLowerCase())
      );
    }

    const finalDistrict = matchedDistrict || cleanDistrict || '';
    if (finalDistrict) {
      setDistrict(finalDistrict);
      setDistrictSearch(finalDistrict);
    }

    // 4. Extract Taluk / Subdistrict
    const rawTaluk = address.subdistrict || address.taluk || address.county || '';
    const cleanTaluk = String(rawTaluk).replace(/\s*taluk\s*/gi, '').trim();
    
    let matchedTaluk = '';
    if (matchedDistrict && locationData[matchedDistrict]) {
      const taluksList = Object.keys(locationData[matchedDistrict].Taluks);
      matchedTaluk = taluksList.find(t => 
        t.toLowerCase() === cleanTaluk.toLowerCase() ||
        cleanTaluk.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(cleanTaluk.toLowerCase())
      );
    }

    const finalTaluk = matchedTaluk || cleanTaluk || address.city_district || '';
    if (finalTaluk) {
      setTaluk(finalTaluk);
      setTalukSearch(finalTaluk);
    }

    // 5. Extract Locality / Local Body
    const extractedLocality = address.locality || address.sublocality || address.neighbourhood || address.neighborhood || address.suburb || address.city_district || address.quarter || '';
    
    let matchedLocalBody = '';
    let localBodiesList = [];
    if (matchedDistrict && matchedTaluk && locationData[matchedDistrict] && locationData[matchedDistrict].Taluks[matchedTaluk]) {
      localBodiesList = locationData[matchedDistrict].Taluks[matchedTaluk] || [];
      const addressValues = Object.values(address).map(v => String(v).toLowerCase());
      matchedLocalBody = localBodiesList.find(lb => {
        const lbClean = lb.toLowerCase().replace(/\s*(corporation|municipality|panchayat)\s*/gi, '').trim();
        return addressValues.some(val => val.includes(lbClean) || lbClean.includes(val));
      });
    }

    const finalLocalBody = matchedLocalBody || extractedLocality || (localBodiesList.length > 0 ? localBodiesList[0] : '');
    if (finalLocalBody) {
      setLocalBody(finalLocalBody);
      setLocalBodySearch(finalLocalBody);
    }

    // 6. Extract City/Village (Fallback Chain: Village -> Hamlet -> City -> Town -> Municipality -> Suburb)
    const potentialVillage = address.village || address.hamlet || '';
    const potentialCity = address.city || address.town || address.municipality || '';
    const potentialSuburb = address.suburb || address.neighbourhood || address.neighborhood || address.locality || '';
    
    const finalCity = potentialVillage || potentialCity || potentialSuburb || '';
    if (finalCity) {
      setCity(finalCity);
    }

    // 7. Extract Landmark / Road Name
    const roadName = address.road || address.neighbourhood || address.suburb || address.amenity || '';
    if (roadName) {
      setLandmark(roadName);
    }
  };
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const urlCat = params.get('category');
    if (urlCat) return urlCat;

    const savedCat = localStorage.getItem('selectedCategory');
    if (savedCat) {
      localStorage.removeItem('selectedCategory');
      return savedCat;
    }
    return '';
  });

  useEffect(() => {
    const handleHashCheck = () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const urlCat = params.get('category');
      if (urlCat) {
        setCategory(urlCat);
      } else {
        const savedCat = localStorage.getItem('selectedCategory');
        if (savedCat) {
          setCategory(savedCat);
          localStorage.removeItem('selectedCategory');
        }
      }
    };
    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  const [state, setState] = useState('Kerala'); // Prefill default state
  const [district, setDistrict] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  const districts = [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod'
  ];
  const [city, setCity] = useState('');
  const [taluk, setTaluk] = useState('');
  const [talukSearch, setTalukSearch] = useState('');
  const [talukDropdownOpen, setTalukDropdownOpen] = useState(false);
  const [localBody, setLocalBody] = useState('');
  const [localBodySearch, setLocalBodySearch] = useState('');
  const [localBodyDropdownOpen, setLocalBodyDropdownOpen] = useState(false);
  const [ward, setWard] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');

  // Location Geolocation fields
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Map Integration fields (Requirement 1, 2, 3, 4)
  const [locationMethod, setLocationMethod] = useState('gps'); // 'gps' or 'map'
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const mapRef = useRef(null);

  // Dynamic Leaflet CDN Loader
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Append Stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Append JavaScript
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Map Initializer and Event Bindings
  useEffect(() => {
    if (locationMethod !== 'map' || !leafletLoaded) return;

    // Default to Kerala coordinates if not set yet
    const initialLat = latitude ? parseFloat(latitude) : 10.8505;
    const initialLng = longitude ? parseFloat(longitude) : 76.2711;
    const initialZoom = latitude ? 15 : 9;

    const mapElement = document.getElementById('issue-map');
    if (!mapElement) return;

    const map = window.L.map('issue-map').setView([initialLat, initialLng], initialZoom);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = window.L.marker([initialLat, initialLng], {
      draggable: true
    }).addTo(map);

    const updateCoords = async (lat, lng) => {
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));

      // Reverse geocode via Nominatim API to get Full Address
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          setLandmark(data.display_name);
          if (data.address) {
            autofillFromAddress(data.address);
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding error:', err);
      }
    };

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      updateCoords(position.lat, position.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateCoords(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = { map, marker, updateCoords };

    return () => {
      map.remove();
    };
  }, [locationMethod, leafletLoaded]);

  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery.trim() || !mapRef.current) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery.trim())}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        const { map, marker, updateCoords } = mapRef.current;
        map.setView([newLat, newLng], 15);
        marker.setLatLng([newLat, newLng]);
        updateCoords(newLat, newLng);
      } else {
        showToast('Address query not found.', 'error');
      }
    } catch (err) {
      console.warn('Map place lookup error:', err);
      showToast('Map lookup failed.', 'error');
    }
  };

  // Uploaded images lists
  const [images, setImages] = useState([]); // Array of raw File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of base64 preview urls

  const [anonymous, setAnonymous] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const categories = [
    'Road Damage',
    'Garbage',
    'Water Supply',
    'Drainage',
    'Street Light',
    'Electricity',
    'Public Safety',
    'Traffic',
    'Environment',
    'Other'
  ];

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      showToast('Browser Geolocation is not supported by your device.', 'error');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        
        // Fetch address for current location and autofill (Requirement 4)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            if (data) {
              if (data.display_name) setLandmark(data.display_name);
              if (data.address) autofillFromAddress(data.address);
            }
          })
          .catch(err => console.warn('GPS reverse geocode error:', err));

        setLocationLoading(false);
        showToast('Coordinates successfully fetched!', 'success');
      },
      (error) => {
        console.warn('Geolocation access failed:', error.message);
        setLocationLoading(false);
        showToast('Location permission denied. Please enter coordinates manually.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check up to 5 total images limit
    if (images.length + files.length > 5) {
      showToast('You can upload a maximum of 5 images.', 'error');
      return;
    }

    files.forEach((file) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Image ${file.name} exceeds 5MB size limit.`, 'error');
        return;
      }
      
      // Validate file format
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showToast(`${file.name} is not an allowed format (Only JPG/PNG/WebP).`, 'error');
        return;
      }

      setImages((prev) => [...prev, file]);

      // Create base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !category || !state.trim() || !district.trim() || !taluk.trim() || !localBody.trim() || !city.trim() || !pincode.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (description.trim().length < 20) {
      showToast('Description must be at least 20 characters long.', 'error');
      return;
    }

    setFormSubmitting(true);
    
    // Build multipart/form-data payload (Requirement 13)
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('state', state.trim());
    formData.append('district', district.trim());
    const formattedCity = `${city.trim()} (${localBody.trim()}, ${taluk.trim()} Taluk)`;
    formData.append('city', formattedCity);
    formData.append('ward', ward.trim());
    formData.append('landmark', landmark.trim());
    formData.append('pincode', pincode.trim());
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('anonymous', anonymous);
    formData.append('urgent', urgent);

    images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await api.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        showToast('Issue Reported Successfully!', 'success');
        // Clear fields
        setTitle('');
        setDescription('');
        setCategory('');
        setDistrict('');
        setDistrictSearch('');
        setTaluk('');
        setTalukSearch('');
        setLocalBody('');
        setLocalBodySearch('');
        setCity('');
        setWard('');
        setLandmark('');
        setPincode('');
        setLatitude('');
        setLongitude('');
        setImages([]);
        setImagePreviews([]);
        setAnonymous(false);
        setUrgent(false);

        // Redirect to My Complaints Page after 1.5 seconds
        setTimeout(() => {
          onNavigate('complaints');
        }, 1500);
      }
      setFormSubmitting(false);
    } catch (err) {
      console.error('Failed to report issue:', err);
      showToast(err.message || 'Failed to submit report.', 'error');
      setFormSubmitting(false);
    }
  };

  return (
    <div className="report-issue-container">
      {/* Toast Alert List */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="report-header-card glass-card">
        <h2 className="report-header-title">Report a Civic Issue</h2>
        <p className="report-header-desc">
          Help improve your local village. Report damages, issues, hazards, or public requests directly to the panchayat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="report-form-grid" noValidate>
        {/* Left Column: Input Forms */}
        <div className="report-form-inputs glass-card">
          <h3 className="form-card-title">Basic Information</h3>
          
          <div className="input-field-group">
            <label className="input-label" htmlFor="issue-title">Issue Title <span className="req">*</span></label>
            <input
              type="text"
              id="issue-title"
              className="report-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              required
            />
          </div>

          <div className="input-field-group">
            <label className="input-label" htmlFor="issue-category">Category <span className="req">*</span></label>
            <select
              id="issue-category"
              className="report-input select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="input-field-group">
            <label className="input-label" htmlFor="issue-description">Description <span className="req">*</span></label>
            <textarea
              id="issue-description"
              className="report-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail (minimum 20 characters)"
              rows={4}
              required
            />
            {description.length > 0 && description.length < 20 && (
              <span className="form-error-inline">
                <AlertTriangle size={12} /> Minimum 20 characters required. (Current: {description.length})
              </span>
            )}
          </div>

          <hr className="form-divider" />
          <h3 className="form-card-title">Location Details</h3>

          <div className="form-row-2col">
            <div className="input-field-group">
              <label className="input-label" htmlFor="loc-state">State <span className="req">*</span></label>
              <input
                type="text"
                id="loc-state"
                className="report-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
            <div className="input-field-group" style={{ position: 'relative' }}>
              <label className="input-label" htmlFor="loc-district">District <span className="req">*</span></label>
              <input
                type="text"
                id="loc-district"
                className="report-input"
                value={districtSearch}
                onChange={(e) => {
                  setDistrictSearch(e.target.value);
                  setDistrict(e.target.value);
                  setDistrictDropdownOpen(true);
                  setTaluk('');
                  setTalukSearch('');
                  setLocalBody('');
                  setLocalBodySearch('');
                }}
                onFocus={() => {
                  setDistrictDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    const matched = districts.find(d => d.toLowerCase() === districtSearch.toLowerCase());
                    if (matched) {
                      setDistrict(matched);
                      setDistrictSearch(matched);
                    } else {
                      setDistrict(districtSearch);
                    }
                    setDistrictDropdownOpen(false);
                  }, 250);
                }}
                placeholder="Select District"
                autoComplete="off"
                required
              />
              {districtDropdownOpen && (
                <div 
                  className="district-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    zIndex: 100,
                    marginTop: '4px'
                  }}
                >
                  {districts
                    .filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
                    .map((d) => (
                      <div
                        key={d}
                        onMouseDown={() => {
                          setDistrict(d);
                          setDistrictSearch(d);
                          setDistrictDropdownOpen(false);
                          setTaluk('');
                          setTalukSearch('');
                          setLocalBody('');
                          setLocalBodySearch('');
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: '#1f2937',
                          backgroundColor: district === d ? '#f0fdf4' : 'transparent',
                          fontWeight: district === d ? 'bold' : 'normal',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (district !== d) e.target.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(e) => {
                          if (district !== d) e.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  {districts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                      No matching districts
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-row-2col">
            {/* Taluk Dropdown (Requirement 1 & 3) */}
            <div className="input-field-group" style={{ position: 'relative' }}>
              <label className="input-label" htmlFor="loc-taluk">Taluk <span className="req">*</span></label>
              <input
                type="text"
                id="loc-taluk"
                className="report-input"
                value={talukSearch}
                onChange={(e) => {
                  setTalukSearch(e.target.value);
                  setTaluk(e.target.value);
                  setTalukDropdownOpen(true);
                  setLocalBody('');
                  setLocalBodySearch('');
                }}
                onFocus={() => {
                  if (district) setTalukDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    const taluksList = district && locationData[district] ? Object.keys(locationData[district].Taluks) : [];
                    const matched = taluksList.find(t => t.toLowerCase() === talukSearch.toLowerCase());
                    if (matched) {
                      setTaluk(matched);
                      setTalukSearch(matched);
                    } else {
                      setTaluk(talukSearch);
                    }
                    setTalukDropdownOpen(false);
                  }, 250);
                }}
                placeholder="Select Taluk"
                autoComplete="off"
                disabled={!district}
                required
              />
              {district && locationData[district] && talukDropdownOpen && (
                <div 
                  className="district-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    zIndex: 100,
                    marginTop: '4px'
                  }}
                >
                  {Object.keys(locationData[district].Taluks)
                    .filter(t => t.toLowerCase().includes(talukSearch.toLowerCase()))
                    .map((t) => (
                      <div
                        key={t}
                        onMouseDown={() => {
                          setTaluk(t);
                          setTalukSearch(t);
                          setTalukDropdownOpen(false);
                          setLocalBody('');
                          setLocalBodySearch('');
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: '#1f2937',
                          backgroundColor: taluk === t ? '#f0fdf4' : 'transparent',
                          fontWeight: taluk === t ? 'bold' : 'normal',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(ev) => {
                          if (taluk !== t) ev.target.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(ev) => {
                          if (taluk !== t) ev.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  {Object.keys(locationData[district].Taluks).filter(t => t.toLowerCase().includes(talukSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                      No matching taluks
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Local Body Dropdown (Requirement 2 & 3) */}
            <div className="input-field-group" style={{ position: 'relative' }}>
              <label className="input-label" htmlFor="loc-localbody">Local Body <span className="req">*</span></label>
              <input
                type="text"
                id="loc-localbody"
                className="report-input"
                value={localBodySearch}
                onChange={(e) => {
                  setLocalBodySearch(e.target.value);
                  setLocalBody(e.target.value);
                  setLocalBodyDropdownOpen(true);
                }}
                onFocus={() => {
                  if (taluk) setLocalBodyDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    const localBodiesList = district && taluk && locationData[district] && locationData[district].Taluks[taluk] ? locationData[district].Taluks[taluk] : [];
                    const matched = localBodiesList.find(lb => lb.toLowerCase() === localBodySearch.toLowerCase());
                    if (matched) {
                      setLocalBody(matched);
                      setLocalBodySearch(matched);
                    } else {
                      setLocalBody(localBodySearch);
                    }
                    setLocalBodyDropdownOpen(false);
                  }, 250);
                }}
                placeholder="Select Local Body"
                autoComplete="off"
                disabled={!taluk}
                required
              />
              {district && taluk && locationData[district] && locationData[district].Taluks[taluk] && localBodyDropdownOpen && (
                <div 
                  className="district-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    zIndex: 100,
                    marginTop: '4px'
                  }}
                >
                  {locationData[district].Taluks[taluk]
                    .filter(lb => lb.toLowerCase().includes(localBodySearch.toLowerCase()))
                    .map((lb) => (
                      <div
                        key={lb}
                        onMouseDown={() => {
                          setLocalBody(lb);
                          setLocalBodySearch(lb);
                          setLocalBodyDropdownOpen(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: '#1f2937',
                          backgroundColor: localBody === lb ? '#f0fdf4' : 'transparent',
                          fontWeight: localBody === lb ? 'bold' : 'normal',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(ev) => {
                          if (localBody !== lb) ev.target.style.backgroundColor = '#f1f5f9';
                        }}
                        onMouseLeave={(ev) => {
                          if (localBody !== lb) ev.target.style.backgroundColor = 'transparent';
                        }}
                      >
                        {lb}
                      </div>
                    ))}
                  {locationData[district].Taluks[taluk].filter(lb => lb.toLowerCase().includes(localBodySearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                      No matching local bodies
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-row-2col">
            <div className="input-field-group">
              <label className="input-label" htmlFor="loc-city">City / Village <span className="req">*</span></label>
              <input
                type="text"
                id="loc-city"
                className="report-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City/Village name"
                required
              />
            </div>
            <div className="input-field-group">
              <label className="input-label" htmlFor="loc-pincode">PIN Code <span className="req">*</span></label>
              <input
                type="text"
                id="loc-pincode"
                className="report-input"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit postal code"
                required
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="input-field-group">
              <label className="input-label" htmlFor="loc-ward">Ward / Block No. (Optional)</label>
              <input
                type="text"
                id="loc-ward"
                className="report-input"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Ward number"
              />
            </div>
            <div className="input-field-group">
              <label className="input-label" htmlFor="loc-landmark">Landmark (Optional)</label>
              <input
                type="text"
                id="loc-landmark"
                className="report-input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby shop or school"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Files & Geolocation */}
        <div className="report-form-aside">
          
          {/* Coordinates & Map Preview (Requirement 1, 2, 3, 4, 5) */}
          <div className="report-aside-card glass-card">
            <h3 className="form-card-title">Issue Location</h3>
            <p className="aside-card-subtitle" style={{ marginBottom: '12px' }}>
              Select your preferred method to pin the location coordinates.
            </p>

            {/* Location Method Selection Buttons (Requirement 2) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={() => setLocationMethod('gps')} 
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid ' + (locationMethod === 'gps' ? 'var(--primary)' : '#cbd5e1'), 
                  background: locationMethod === 'gps' ? 'var(--primary-light)' : 'transparent', 
                  color: locationMethod === 'gps' ? 'var(--primary)' : 'var(--text-dark)', 
                  fontWeight: 600, 
                  fontSize: '0.75rem', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Use Current Location (GPS)
              </button>
              <button 
                type="button" 
                onClick={() => setLocationMethod('map')} 
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid ' + (locationMethod === 'map' ? 'var(--primary)' : '#cbd5e1'), 
                  background: locationMethod === 'map' ? 'var(--primary-light)' : 'transparent', 
                  color: locationMethod === 'map' ? 'var(--primary)' : 'var(--text-dark)', 
                  fontWeight: 600, 
                  fontSize: '0.75rem', 
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Select Location on Map
              </button>
            </div>

            {locationMethod === 'gps' ? (
              <button type="button" className="btn-fetch-gps" onClick={handleFetchLocation} disabled={locationLoading} style={{ width: '100%', marginBottom: '16px' }}>
                {locationLoading ? (
                  <Loader2 className="spinner-gps" />
                ) : (
                  <Navigation size={15} />
                )}
                <span>Use Current Location</span>
              </button>
            ) : (
              /* Search box and leaflet map container */
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    className="report-input" 
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    placeholder="Search place, road, landmark..." 
                    value={mapSearchQuery} 
                    onChange={(e) => setMapSearchQuery(e.target.value)} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleMapSearch(e);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleMapSearch}
                    style={{ 
                      padding: '8px 16px', 
                      background: 'var(--primary)', 
                      color: '#ffffff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontWeight: 600, 
                      fontSize: '0.8rem', 
                      cursor: 'pointer' 
                    }}
                  >
                    Search
                  </button>
                </div>
                <div id="issue-map" style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }} />
              </div>
            )}

            <div className="form-row-2col">
              <div className="input-field-group">
                <label className="input-label" htmlFor="gps-lat">Latitude <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.000001"
                  id="gps-lat"
                  className="report-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 10.8505"
                  required
                />
              </div>
              <div className="input-field-group">
                <label className="input-label" htmlFor="gps-lng">Longitude <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.000001"
                  id="gps-lng"
                  className="report-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 76.2711"
                  required
                />
              </div>
            </div>

            {landmark && (
              <div className="input-field-group" style={{ marginTop: '12px' }}>
                <label className="input-label">Full Address</label>
                <textarea 
                  className="report-textarea" 
                  style={{ minHeight: '60px', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#4b5563', padding: '8px 12px' }} 
                  value={landmark} 
                  readOnly 
                />
              </div>
            )}
          </div>

          {/* Image Upload list */}
          <div className="report-aside-card glass-card">
            <h3 className="form-card-title">Image Uploads</h3>
            <p className="aside-card-subtitle">
              Attach up to 5 pictures of the issue (Max 5MB each).
            </p>

            <label className="images-upload-dropzone" htmlFor="images-selector">
              <ImageIcon size={24} />
              <span>Select Pictures</span>
              <input
                type="file"
                id="images-selector"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                multiple
                onChange={handleImageChange}
                disabled={images.length >= 5}
                style={{ display: 'none' }}
              />
            </label>

            {imagePreviews.length > 0 && (
              <div className="previews-list">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="preview-thumbnail">
                    <img src={preview} alt={`Upload preview ${index + 1}`} className="thumbnail-img" />
                    <button type="button" className="btn-remove-thumbnail" onClick={() => handleRemoveImage(index)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent & Anonymous Settings */}
          <div className="report-aside-card glass-card checkboxes-card">
            <label className="checkbox-label-row">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="report-checkbox"
              />
              <div className="checkbox-meta">
                <span className="checkbox-title">Report Anonymously</span>
                <span className="checkbox-desc">Your profile name and email will be hidden.</span>
              </div>
            </label>

            <label className="checkbox-label-row">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="report-checkbox"
              />
              <div className="checkbox-meta">
                <span className="checkbox-title">Urgent Issue</span>
                <span className="checkbox-desc">Flag this as high priority for immediate support.</span>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="form-action-buttons">
            <button 
              type="button" 
              className="btn-cancel-report" 
              onClick={() => onNavigate('dashboard')}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit-report" disabled={formSubmitting}>
              {formSubmitting ? (
                <Loader2 className="spinner-gps" />
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Issue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
