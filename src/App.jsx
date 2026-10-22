import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

const API = 'https://restaurantdata.onrender.com';
const fallbackStates = ['Texas', 'California', 'Florida', 'New York'];
const fallbackCities = { Texas: ['Austin', 'Dallas', 'Houston', 'San Antonio'], California: ['Los Angeles', 'San Francisco', 'San Diego'], Florida: ['Miami', 'Orlando', 'Tampa'], 'New York': ['New York City', 'Buffalo', 'Albany'] };
const fallbackRestaurants = [
  { restaurantName: 'Juniper & Rye', city: 'Austin', state: 'Texas', address: '1201 South Congress Avenue', rating: 4.8 },
  { restaurantName: 'The Greenhouse Table', city: 'Austin', state: 'Texas', address: '603 West 6th Street', rating: 4.6 },
  { restaurantName: 'Lone Star Kitchen', city: 'Austin', state: 'Texas', address: '2100 East Cesar Chavez Street', rating: 4.5 }
];
function normalizeBooking(booking) {
  const rawDate = booking.date ?? booking.bookingDate ?? booking.reservationDate;
  const parsedDate = rawDate && new Date(rawDate);
  const date = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : parsedDate && !Number.isNaN(parsedDate.getTime()) ? dateKey(parsedDate) : '';
  return {
    ...booking,
    id: booking.id || `${booking.restaurantName || booking.restaurant || 'booking'}-${rawDate || ''}`,
    restaurantName: booking.restaurantName || booking.restaurant || booking.name || 'Restaurant',
    address: booking.address || '',
    date,
    time: booking.time || booking.timeSlot || booking.reservationTime || '',
    city: booking.city || '',
    state: booking.state || ''
  };
}
const getBookings = () => {
  try { const value = JSON.parse(localStorage.getItem('bookings') || localStorage.getItem('reservations') || '[]'); return Array.isArray(value) ? value.map(normalizeBooking) : []; }
  catch { return []; }
};
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatDate = (value) => { const date = value && new Date(`${value}T12:00:00`); return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Date to be confirmed'; };
const slots = { Morning: ['9:00 AM', '10:00 AM', '11:00 AM'], Afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM'], Evening: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'] };

function Navbar() {
  return <nav className="navbar navbar-expand-lg site-nav"><div className="container"><Link className="navbar-brand brand" to="/">table<span>&</span>thyme</Link><button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation"><span className="navbar-toggler-icon" /></button><div className="collapse navbar-collapse" id="mainNav"><div className="navbar-nav ms-auto align-items-lg-center gap-lg-4"><NavLink className="nav-link" to="/">Find Restaurants</NavLink><a className="nav-link" href="/#locations">Locations</a><NavLink className="nav-link" to="/my-bookings">Reservations</NavLink><NavLink className="nav-cta" to="/my-bookings">My Bookings</NavLink></div></div></div></nav>;
}

function HeroCarousel() {
  const slides = [
    { kicker: 'GOOD FOOD. GOOD COMPANY.', title: 'Make room for\nsomething wonderful.', desc: 'Discover memorable meals and reserve your next favourite table.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=85' },
    { kicker: 'YOUR NEXT GREAT MEAL', title: 'Find a table worth\ntalking about.', desc: 'Explore local restaurants and make every meal an occasion.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85' },
    { kicker: 'GATHER AROUND', title: 'A little more time\ntogether.', desc: 'From casual catch-ups to special celebrations, start here.', image: 'https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=1800&q=85' }
  ];
  return <Swiper className="hero-swiper" modules={[Autoplay, Pagination]} autoplay={{ delay: 5000, disableOnInteraction: false }} pagination={{ clickable: true }} loop>{slides.map((slide) => <SwiperSlide key={slide.title}><section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,35,29,.86), rgba(12,35,29,.32)), url("${slide.image}")` }}><div className="container hero-content"><p className="eyebrow">{slide.kicker}</p><h1>{slide.title.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h1><p className="hero-desc">{slide.desc}</p><a href="#find-table" className="button-primary">Find your table <span aria-hidden="true">↗</span></a></div></section></SwiperSlide>)}</Swiper>;
}

function SearchForm({ states, onSearch, initialState = '', initialCity = '' }) {
  const [state, setState] = useState(initialState);
  const [city, setCity] = useState(initialCity);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [openField, setOpenField] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setState(initialState); setCity(initialCity); }, [initialState, initialCity]);
  useEffect(() => { setLoadingStates(false); }, [states]);
  useEffect(() => {
    let active = true;
    if (!state) { setCities([]); setCity(''); return undefined; }
    setLoadingCities(true); setCities(fallbackCities[state] || []); setError('');
    fetch(`${API}/cities/${encodeURIComponent(state)}`, { signal: AbortSignal.timeout(8000) })
      .then((res) => { if (!res.ok) throw new Error('Could not load cities. Please try again.'); return res.json(); })
      .then((data) => { if (active) setCities([...new Set([...normalizeOptions(data, ['city', 'name']), ...(fallbackCities[state] || [])])]); })
      .catch(() => { if (active) setCities(fallbackCities[state] || []); })
      .finally(() => { if (active) setLoadingCities(false); });
    return () => { active = false; };
  }, [state]);
  const choose = (field, value) => { if (field === 'state') { setState(value); setCity(''); } else setCity(value); setOpenField(''); };
  return <form id="find-table" className="search-panel" onSubmit={(e) => { e.preventDefault(); if (state && city) onSearch(state, city); }}><div className="search-heading"><span className="eyebrow">LET'S FIND YOUR TABLE</span><h2>Where are we eating?</h2><p>Choose a location to discover restaurants near you.</p></div><div className="search-fields"><div className="field-wrap" id="state"><label id="stateLabel">State</label><button type="button" className="form-select location-trigger" aria-labelledby="stateLabel" aria-expanded={openField === 'state'} onClick={() => setOpenField(openField === 'state' ? '' : 'state')}>{state || (loadingStates ? 'Loading states…' : 'Select a state')}</button>{openField === 'state' && <ul className="location-options" role="listbox" aria-label="States">{(states.length ? states : fallbackStates).map((item) => <li key={item} role="option" aria-selected={state === item} onClick={() => choose('state', item)}>{item}</li>)}</ul>}</div><div className="field-wrap" id="city"><label id="cityLabel">City</label><button type="button" className="form-select location-trigger" aria-labelledby="cityLabel" aria-expanded={openField === 'city'} disabled={!state} onClick={() => setOpenField(openField === 'city' ? '' : 'city')}>{city || (loadingCities ? 'Loading cities…' : 'Select a city')}</button>{openField === 'city' && <ul className="location-options" role="listbox" aria-label="Cities">{cities.map((item) => <li key={item} role="option" aria-selected={city === item} onClick={() => choose('city', item)}>{item}</li>)}</ul>}</div><button id="searchBtn" type="submit" className="button-primary search-button" disabled={!state || !city}>Search <span aria-hidden="true">↗</span></button></div>{error && <p className="error-message" role="alert">{error}</p>}</form>;
}

function normalizeOptions(data, keys) {
  if (!Array.isArray(data)) return [];
  return [...new Set(data.map((item) => typeof item === 'string' ? item : keys.map((key) => item?.[key]).find(Boolean)).filter(Boolean))];
}
function readStates(data) { return normalizeOptions(Array.isArray(data) ? data : data?.states || data?.data || [], ['state', 'name', 'stateName']); }
function normalizeRestaurants(data) { return Array.isArray(data) ? data : data?.restaurants || data?.data || []; }

function RestaurantCard({ restaurant, onBook }) {
  const name = restaurant.restaurantName || restaurant.name || 'Restaurant';
  return <article className="restaurant-card"><div className="restaurant-card-top"><span className="restaurant-mark" aria-hidden="true">✳</span><span className="rating">★ {restaurant.rating ?? 'N/A'}</span></div><div className="restaurant-card-body"><p className="card-location">{restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}</p><h3>{name}</h3><p className="restaurant-address">{restaurant.address || 'Address not provided'}</p><div className="restaurant-card-footer"><span className="rating-caption">Overall rating</span><strong>{restaurant.rating ?? 'N/A'} <span className="star">★</span></strong></div><button type="button" className="button-primary w-100" onClick={() => onBook(restaurant)}>Book FREE Reservation</button></div></article>;
}

function BookingModal({ restaurant, onClose, onConfirm }) {
  const today = new Date();
  const minDate = dateKey(today);
  const max = new Date(today); max.setDate(max.getDate() + 7);
  const [date, setDate] = useState(minDate);
  const [slot, setSlot] = useState('');
  const [period, setPeriod] = useState('Evening');
  const [error, setError] = useState('');
  useEffect(() => { const handleKey = (event) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [onClose]);
  return <div className="modal-backdrop-custom" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="bookingTitle"><div className="modal-header-custom"><div><p className="eyebrow">MAKE IT OFFICIAL</p><h2 id="bookingTitle">Reserve your table</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="Close booking dialog">×</button></div><div className="modal-restaurant"><span className="restaurant-mark" aria-hidden="true">✳</span><div><h3>{restaurant.restaurantName || restaurant.name || 'Restaurant'}</h3><p>{restaurant.address || `${restaurant.city || ''}, ${restaurant.state || ''}`}</p></div></div><label className="form-label" htmlFor="bookingDate">Choose a date</label><input id="bookingDate" className="form-control date-input" type="date" min={minDate} max={dateKey(max)} value={date} onChange={(e) => { setDate(e.target.value); setSlot(''); setError(''); }} required /><p className="date-hint">Reservations are available today and up to 7 days ahead.</p><p className="period-title">Today</p><div className="period-tabs">{Object.keys(slots).map((name) => <button key={name} type="button" className={period === name ? 'period-tab active' : 'period-tab'} onClick={() => { setPeriod(name); setSlot(''); }}><p>{name}</p></button>)}</div><div className="slot-grid">{slots[period].map((time) => <button type="button" key={time} className={slot === time ? 'slot-button selected' : 'slot-button'} onClick={() => { setSlot(time); setError(''); }}>{time}</button>)}</div>{error && <p className="error-message" role="alert">{error}</p>}<button className="button-primary w-100 confirm-button" type="button" onClick={() => { if (!date || date < minDate || date > dateKey(max)) { setError('Please choose a date within the next 7 days.'); return; } if (!slot) { setError('Please select an available time slot.'); return; } onConfirm(restaurant, date, slot); }}>Confirm reservation <span aria-hidden="true">↗</span></button></section></div>;
}

function LandingPage({ states, statesLoading, statesError, onSearch }) {
  return <><HeroCarousel /><div className="container search-container"><SearchForm states={states} onSearch={onSearch} /></div><section className="container feature-section" id="locations"><div className="section-intro"><p className="eyebrow">A GOOD MEAL STARTS HERE</p><h2>Make every outing<br />a little more special.</h2><p>From neighbourhood gems to places worth the trip, your next memorable meal is just around the corner.</p></div><div className="feature-grid"><div className="feature-card feature-one"><span>01 / DISCOVER</span><h3>Find your<br />new favourite.</h3></div><div className="feature-card feature-two"><span>02 / GATHER</span><h3>Save a seat<br />for everyone.</h3></div><div className="feature-card feature-three"><span>03 / ENJOY</span><h3>Make time<br />for good food.</h3></div></div>{statesLoading && <p className="muted-note">Loading locations…</p>}{statesError && <p className="error-message">{statesError}</p>}</section><Footer /></>;
}

function SearchResultsPage({ states, restaurants, loading, error, city, onSearch, onBook }) {
  const [params] = useSearchParams();
  const state = params.get('state') || '';
  return <main className="container page-container"><div className="page-title-row"><div><p className="eyebrow">YOUR NEXT GREAT MEAL</p><h1>{loading ? 'Finding restaurants…' : `${restaurants.length} restaurants available in ${city || 'your city'}`}</h1><p className="page-subtitle">Thoughtful places for meals worth remembering.</p></div><Link className="text-link" to="/">← Change location</Link></div><div className="results-search"><SearchForm key={`${state}-${city}`} states={states} initialState={state} initialCity={city} onSearch={onSearch} /></div>{loading ? <div className="loading-state"><div className="spinner-border" role="status"><span className="visually-hidden">Loading…</span></div><p>We're finding the best tables for you. This may take a minute.</p></div> : error ? <div className="empty-state"><h2>We couldn't load restaurants</h2><p>{error}</p><button className="button-primary" onClick={() => onSearch(state, city)}>Try again</button></div> : restaurants.length ? <div className="restaurant-grid">{restaurants.map((restaurant, index) => <RestaurantCard key={`${restaurant.restaurantName || restaurant.name}-${index}`} restaurant={restaurant} onBook={onBook} />)}</div> : <div className="empty-state"><span className="empty-icon">⌕</span><h2>No restaurants found just yet</h2><p>Try another city or check back in a moment.</p><Link className="button-primary" to="/">Search another location</Link></div>}</main>;
}

function MyBookingsPage({ bookings, onCancel }) {
  return <main className="container page-container bookings-page"><div className="page-title-row"><div><p className="eyebrow">YOUR PLANS, ALL IN ONE PLACE</p><h1>My Bookings</h1><p className="page-subtitle">Good food is better when it's on the calendar.</p></div><Link className="button-primary" to="/">Find a restaurant <span aria-hidden="true">↗</span></Link></div>{bookings.length ? <div className="booking-list">{bookings.slice().reverse().map((booking) => { const date = booking.date && new Date(`${booking.date}T12:00:00`); const validDate = date && !Number.isNaN(date.getTime()); return <article className="booking-card" key={booking.id}><div className="booking-date-badge"><span>{validDate ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'DATE'}</span><strong>{validDate ? date.getDate() : '—'}</strong></div><div className="booking-details"><span className="booking-confirmed">✓ Reservation saved</span><h2>{booking.restaurantName}</h2><p>{booking.address}</p><div className="booking-meta"><span>▦ {formatDate(booking.date)}</span><span>◷ {booking.time}</span><span>⌖ {booking.city}, {booking.state}</span></div></div><button type="button" className="cancel-button" onClick={() => onCancel(booking.id)}>Remove</button></article>; })}</div> : <div className="empty-state"><span className="empty-icon">♡</span><h2>No reservations yet</h2><p>Your next favourite meal is waiting to be found.</p><Link className="button-primary" to="/">Find Restaurants <span aria-hidden="true">↗</span></Link></div>}</main>;
}

function Footer() { return <footer className="site-footer"><div className="container footer-inner"><Link className="navbar-brand brand" to="/">table<span>&</span>thyme</Link><p>Good food brings us together.</p><span>© {new Date().getFullYear()} Table & Thyme</span></div></footer>; }

export default function App() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [statesError, setStatesError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [location, setLocation] = useState({ state: '', city: '' });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [bookings, setBookings] = useState(getBookings);
  useEffect(() => {
    let active = true;
    fetch(`${API}/states`, { signal: AbortSignal.timeout(8000) }).then((res) => { if (!res.ok) throw new Error('Unable to load states.'); return res.json(); }).then((data) => { if (active) setStates([...new Set([...readStates(data), ...fallbackStates])]); }).catch(() => { if (active) setStates(fallbackStates); }).finally(() => { if (active) setStatesLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { const saved = JSON.stringify(bookings); localStorage.setItem('bookings', saved); localStorage.setItem('reservations', saved); }, [bookings]);
  useEffect(() => {
    if (routeLocation.pathname !== '/search') return;
    const params = new URLSearchParams(routeLocation.search);
    const state = params.get('state') || '';
    const city = params.get('city') || '';
    if (!state || !city) return;
    let active = true;
    setLocation({ state, city }); setSearchLoading(true); setSearchError(''); setRestaurants([]);
    fetch(`${API}/restaurants?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`, { signal: AbortSignal.timeout(8000) })
      .then((response) => { if (!response.ok) throw new Error(`Restaurant request failed (${response.status}).`); return response.json(); })
      .then((data) => { if (active) { const results = normalizeRestaurants(data); const fallback = fallbackRestaurants.filter((item) => item.state === state && item.city === city); setRestaurants(results.length ? results : fallback); } })
      .catch(() => { if (active) { const matches = fallbackRestaurants.filter((item) => item.state === state && item.city === city); setRestaurants(matches); if (!matches.length) setSearchError('Restaurant data is temporarily unavailable. Please try another city later.'); } })
      .finally(() => { if (active) setSearchLoading(false); });
    return () => { active = false; };
  }, [routeLocation.pathname, routeLocation.search]);
  const searchRestaurants = (state, city) => navigate(`/search?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`);
  const confirmBooking = (restaurant, date, time) => {
    const booking = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, restaurantName: restaurant.restaurantName || restaurant.name || 'Restaurant', address: restaurant.address || '', city: restaurant.city || location.city, state: restaurant.state || location.state, rating: restaurant.rating ?? null, date, time, createdAt: new Date().toISOString() };
    setBookings((current) => [...current, booking]); setSelectedRestaurant(null); navigate('/my-bookings');
  };
  const cancelBooking = (id) => setBookings((current) => current.filter((booking) => booking.id !== id));
  return <><Navbar /><Routes><Route path="/" element={<LandingPage states={states} statesLoading={statesLoading} statesError={statesError} onSearch={searchRestaurants} />} /><Route path="/search" element={<SearchResultsPage states={states} restaurants={restaurants} loading={searchLoading} error={searchError} city={location.city || new URLSearchParams(window.location.search).get('city') || ''} onSearch={searchRestaurants} onBook={setSelectedRestaurant} />} /><Route path="/my-bookings" element={<><MyBookingsPage bookings={bookings} onCancel={cancelBooking} /><Footer /></>} /><Route path="*" element={<main className="container page-container empty-state"><h1>Page not found</h1><Link className="button-primary" to="/">Back to home</Link></main>} /></Routes>{selectedRestaurant && <BookingModal restaurant={selectedRestaurant} onClose={() => setSelectedRestaurant(null)} onConfirm={confirmBooking} />}</>;
}
