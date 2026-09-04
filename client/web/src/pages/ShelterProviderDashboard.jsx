import API_URL from '@/config';
import React, { useState, useEffect } from 'react';
import { 
  Building2, Home, MapPin, ClipboardList, Calendar, 
  MessageSquare, Star, Settings, Plus, Sparkles, Check, 
  AlertCircle, X, ChevronRight, User, PawPrint, Truck, 
  DollarSign, Clock, ShieldCheck, Heart, AlertTriangle
} from 'lucide-react';
import './ShelterProviderDashboard.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ShelterProviderDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview');

  // Stepper state for profile creation
  const [stepperStep, setStepperStep] = useState(1);
  const [shelterName, setShelterName] = useState('');
  const [nameAvailable, setNameAvailable] = useState(null); // null, true, false
  const [checkingName, setCheckingName] = useState(false);
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [area, setArea] = useState('');
  const [shelterTypes, setShelterTypes] = useState([]);
  const [acceptedSpecies, setAcceptedSpecies] = useState([]);
  const [acceptedBreeds, setAcceptedBreeds] = useState([]);
  const [capacity, setCapacity] = useState(10);
  const [facilities, setFacilities] = useState([]);
  const [providesPickup, setProvidesPickup] = useState(false);
  const [pickupServiceType, setPickupServiceType] = useState('None');
  const [pickupRadius, setPickupRadius] = useState(15);
  const [pickupFee, setPickupFee] = useState(0);
  const [pickupFeeType, setPickupFeeType] = useState('Free');
  const [pickupFeePerKm, setPickupFeePerKm] = useState(0);
  const [dailyRate, setDailyRate] = useState(1000);
  const [weeklyRate, setWeeklyRate] = useState(6000);
  const [monthlyRate, setMonthlyRate] = useState(22000);
  const [dayCareRate, setDayCareRate] = useState(600);
  const [overnightRate, setOvernightRate] = useState(1200);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [daysOpen, setDaysOpen] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [rules, setRules] = useState([]);

  // Shelter operational states
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Dialogs
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceRate, setServiceRate] = useState(1000);
  const [serviceCapacity, setServiceCapacity] = useState(5);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Availability issue');

  const getUserId = () => user?._id || user?.id || '';
  const getAuthHeaders = () => {
    const userId = getUserId();
    const headers = {
      'Content-Type': 'application/json',
      'x-requester-id': userId,
      'x-user-id': userId
    };
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
  };

  // Fetch shelter profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) return;
      const res = await fetch(`${API_URL}/api/shelter/profile`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data) {
          // Pre-populate fields
          setShelterName(data.name || '');
          setLogo(data.logo || '');
          setCoverImage(data.logo || '');
          setDescription(data.description || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setProvince(data.province || '');
          setShelterTypes(data.shelterTypes || []);
          setAcceptedSpecies(data.acceptedSpecies || []);
          setAcceptedBreeds(data.acceptedBreeds || []);
          setCapacity(data.capacity || 10);
          setFacilities(data.facilities || []);
          setProvidesPickup(data.providesPickup || false);
          setPickupServiceType(data.pickupServiceType || 'None');
          setPickupRadius(data.pickupRadius || 15);
          setPickupFee(data.pickupFee || 0);
          setPickupFeeType(data.pickupFeeType || 'Free');
          setPickupFeePerKm(data.pickupFeePerKm || 0);
          setDailyRate(data.dailyRate || 1000);
          setOpeningTime(data.openingTime || '09:00');
          setClosingTime(data.closingTime || '18:00');
          setRules(data.rules || []);
        }
      }
    } catch (err) {
      console.error('Error fetching shelter profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user._id || user.id)) {
      fetchProfile();
    }
  }, [user]);

  // Load operational data when overview tab is loaded
  useEffect(() => {
    if (profile) {
      fetchServices();
      fetchBookings();
      fetchReviews();
    }
  }, [profile, activeMenu]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shelter/services`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shelter/bookings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shelter/reviews?shelterId=${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Realtime name check
  const checkNameAvailability = async (name) => {
    if (!name.trim()) {
      setNameAvailable(null);
      return;
    }
    setCheckingName(true);
    try {
      const res = await fetch(`${API_URL}/api/shelter/check-name?name=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      setNameAvailable(data.available);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingName(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (stepperStep === 1 && shelterName) {
        checkNameAvailability(shelterName);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [shelterName, stepperStep]);

  // Stepper steps submit / creation
  const handleSaveShelter = async (statusOverride = 'Pending Approval') => {
    try {
      const payload = {
        name: shelterName,
        logo: logo || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=150',
        description,
        phone,
        email,
        address,
        city,
        province,
        area,
        shelterTypes,
        acceptedSpecies,
        acceptedBreeds,
        capacity: parseInt(capacity),
        facilities,
        providesPickup,
        pickupServiceType,
        pickupRadius: parseFloat(pickupRadius),
        pickupFee: parseFloat(pickupFee),
        pickupFeeType,
        pickupFeePerKm: parseFloat(pickupFeePerKm),
        dailyRate: parseFloat(dailyRate),
        weeklyRate: parseFloat(weeklyRate),
        monthlyRate: parseFloat(monthlyRate),
        dayCareRate: parseFloat(dayCareRate),
        overnightRate: parseFloat(overnightRate),
        openingTime,
        closingTime,
        daysOpen,
        rules,
        status: statusOverride
      };

      const res = await fetch(`${API_URL}/api/shelter/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        alert(`Shelter successfully set as ${statusOverride}!`);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to save shelter profile');
      }
    } catch (err) {
      alert('Error updating shelter setup: ' + err.message);
    }
  };

  // Service creations
  const handleAddService = async () => {
    if (!serviceName.trim() || !serviceRate) {
      alert('Service Name and Daily Rate are required.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/shelter/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-id': user._id
        },
        body: JSON.stringify({
          name: serviceName,
          description: serviceDesc,
          dailyRate: parseFloat(serviceRate),
          maxCapacity: parseInt(serviceCapacity),
          acceptedPetTypes: acceptedSpecies,
          status: 'Active'
        })
      });
      if (res.ok) {
        fetchServices();
        setIsAddServiceOpen(false);
        setServiceName('');
        setServiceDesc('');
      }
    } catch (err) {
      alert('Error creating shelter service.');
    }
  };

  // Booking confirm/rejections
  const handleUpdateBooking = async (id, status, reason = '') => {
    try {
      const res = await fetch(`${API_URL}/api/shelter/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-id': user._id
        },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        fetchBookings();
        fetchProfile(); // Sync occupied spaces
        setIsRejectOpen(false);
      }
    } catch (err) {
      alert('Error transitioning booking status.');
    }
  };

  // Messages chat implementation
  const loadChat = async (booking) => {
    setActiveChatBooking(booking);
    try {
      const res = await fetch(`${API_URL}/api/shelter/messages/${booking.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatBooking) return;
    try {
      const res = await fetch(`${API_URL}/api/shelter/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-id': user._id
        },
        body: JSON.stringify({
          bookingId: activeChatBooking.id,
          receiverId: activeChatBooking.ownerId,
          message: newMessage.trim()
        })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages([...chatMessages, msg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stepper rendering helper
  const renderSetupStepper = () => {
    return (
      <div className="stepper-container">
        <div className="stepper-header">
          <Building2 size={32} color="var(--color-primary)" />
          <h2>Create Your Shelter Profile</h2>
          <p>Complete Pakistan's premier boarding and shelter setup guidelines.</p>
          <div className="stepper-progress">
            <div className="progress-bar" style={{ width: `${(stepperStep / 12) * 100}%` }}></div>
          </div>
          <span className="step-counter">Step {stepperStep} of 12</span>
        </div>

        <div className="stepper-body">
          {stepperStep === 1 && (
            <div className="step-card">
              <h3>Basic Shelter Info</h3>
              <label>Shelter Name (Must be unique)</label>
              <input 
                type="text" 
                value={shelterName} 
                onChange={(e) => setShelterName(e.target.value)} 
                placeholder="e.g. Happy Paws Shelter DHA"
              />
              {checkingName && <p className="status-checking">Checking availability...</p>}
              {nameAvailable === true && <p className="status-success">✓ Shelter name available</p>}
              {nameAvailable === false && <p className="status-error">That shelter name is already in use.</p>}

              <label style={{ marginTop: '16px' }}>Shelter Logo URL</label>
              <input 
                type="text" 
                value={logo} 
                onChange={(e) => setLogo(e.target.value)} 
                placeholder="https://..."
              />
            </div>
          )}

          {stepperStep === 2 && (
            <div className="step-card">
              <h3>Description & Contacts</h3>
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Tell pet owners about your shelter values..."
              />

              <label style={{ marginTop: '16px' }}>Contact Phone</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="e.g. 03001234567"
              />

              <label style={{ marginTop: '16px' }}>Contact Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="shelter@email.com"
              />
            </div>
          )}

          {stepperStep === 3 && (
            <div className="step-card">
              <h3>Shelter Location</h3>
              <label>Complete Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="e.g. Phase 5, DHA, Lahore"
              />

              <label style={{ marginTop: '16px' }}>City</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                placeholder="e.g. Lahore"
              />

              <label style={{ marginTop: '16px' }}>Province</label>
              <input 
                type="text" 
                value={province} 
                onChange={(e) => setProvince(e.target.value)} 
                placeholder="e.g. Punjab"
              />
            </div>
          )}

          {stepperStep === 4 && (
            <div className="step-card">
              <h3>Shelter Services Provided</h3>
              <p className="step-subtitle">Select all that apply:</p>
              {['Pet Boarding', 'Temporary Shelter', 'Day Care', 'Overnight Boarding'].map(t => (
                <label key={t} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={shelterTypes.includes(t)}
                    onChange={(e) => {
                      if (e.target.checked) setShelterTypes([...shelterTypes, t]);
                      else setShelterTypes(shelterTypes.filter(x => x !== t));
                    }}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          )}

          {stepperStep === 5 && (
            <div className="step-card">
              <h3>Accepted Species</h3>
              <p className="step-subtitle">Select species you accommodate:</p>
              {['Dog', 'Cat', 'Bird', 'Rabbit'].map(s => (
                <label key={s} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={acceptedSpecies.includes(s)}
                    onChange={(e) => {
                      if (e.target.checked) setAcceptedSpecies([...acceptedSpecies, s]);
                      else setAcceptedSpecies(acceptedSpecies.filter(x => x !== s));
                    }}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          )}

          {stepperStep === 6 && (
            <div className="step-card">
              <h3>Capacity Management</h3>
              <label>Maximum Shelter Capacity (Total spaces available)</label>
              <input 
                type="number" 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
              />
            </div>
          )}

          {stepperStep === 7 && (
            <div className="step-card">
              <h3>Facilities Available</h3>
              <p className="step-subtitle">Check facilities offered:</p>
              {['Indoor Area', 'Outdoor Play Space', 'Food Provided', 'Air Conditioning', 'CCTV Monitoring', '24/7 Veterinary Supervision'].map(f => (
                <label key={f} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={facilities.includes(f)}
                    onChange={(e) => {
                      if (e.target.checked) setFacilities([...facilities, f]);
                      else setFacilities(facilities.filter(x => x !== f));
                    }}
                  />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          )}

          {stepperStep === 8 && (
            <div className="step-card">
              <h3>Home Pickup Service</h3>
              <label className="checkbox-row">
                <input 
                  type="checkbox" 
                  checked={providesPickup} 
                  onChange={(e) => setProvidesPickup(e.target.checked)}
                />
                <span>We provide pet pickup from home</span>
              </label>

              {providesPickup && (
                <>
                  <label style={{ marginTop: '16px' }}>Pickup Service Type</label>
                  <select value={pickupServiceType} onChange={(e) => setPickupServiceType(e.target.value)}>
                    <option value="None">None</option>
                    <option value="Home Pickup">Home Pickup Only</option>
                    <option value="Home Drop-off">Home Drop-off Only</option>
                    <option value="Both">Both Pickup & Drop-off</option>
                  </select>

                  <label style={{ marginTop: '16px' }}>Pickup Radius (in KM)</label>
                  <input 
                    type="number" 
                    value={pickupRadius} 
                    onChange={(e) => setPickupRadius(e.target.value)} 
                  />

                  <label style={{ marginTop: '16px' }}>Pickup Fee Type</label>
                  <select value={pickupFeeType} onChange={(e) => setPickupFeeType(e.target.value)}>
                    <option value="Free">Free</option>
                    <option value="Paid">Flat Rate</option>
                    <option value="PerKM">Rate per KM</option>
                  </select>

                  {pickupFeeType === 'Paid' && (
                    <>
                      <label style={{ marginTop: '16px' }}>Flat Pickup Fee (PKR)</label>
                      <input type="number" value={pickupFee} onChange={(e) => setPickupFee(e.target.value)} />
                    </>
                  )}

                  {pickupFeeType === 'PerKM' && (
                    <>
                      <label style={{ marginTop: '16px' }}>Fee per KM (PKR)</label>
                      <input type="number" value={pickupFeePerKm} onChange={(e) => setPickupFeePerKm(e.target.value)} />
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {stepperStep === 9 && (
            <div className="step-card">
              <h3>General Pricing & Rates</h3>
              <label>Daily Boarding Rate (PKR)</label>
              <input 
                type="number" 
                value={dailyRate} 
                onChange={(e) => setDailyRate(e.target.value)} 
              />
            </div>
          )}

          {stepperStep === 10 && (
            <div className="step-card">
              <h3>Operating Hours</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label>Opening Time</label>
                  <input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Closing Time</label>
                  <input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {stepperStep === 11 && (
            <div className="step-card">
              <h3>Rules & Guidelines</h3>
              <p className="step-subtitle">Check standard guidelines enforced:</p>
              {['Vaccination Certificate Required', 'Aggressive Animals Not Accepted', 'Owner Must Provide Medication'].map(r => (
                <label key={r} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={rules.includes(r)}
                    onChange={(e) => {
                      if (e.target.checked) setRules([...rules, r]);
                      else setRules(rules.filter(x => x !== r));
                    }}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          )}

          {stepperStep === 12 && (
            <div className="step-card">
              <h3>Publish & Preview</h3>
              <div className="preview-box">
                <h4>{shelterName || 'Unnamed Shelter'}</h4>
                <p>{address}, {city}</p>
                <Separator style={{ margin: '8px 0' }} />
                <p><strong>Capacity:</strong> {capacity} spaces</p>
                <p><strong>Accepted Species:</strong> {acceptedSpecies.join(', ') || 'None'}</p>
                <p><strong>Pickup Service:</strong> {providesPickup ? `Yes (${pickupServiceType})` : 'No'}</p>
                <p><strong>Daily Rate:</strong> {dailyRate} PKR</p>
              </div>
            </div>
          )}
        </div>

        <div className="stepper-footer">
          {stepperStep > 1 && (
            <button className="stepper-btn-back" onClick={() => setStepperStep(stepperStep - 1)}>
              Back
            </button>
          )}
          {stepperStep < 12 ? (
            <button 
              className="stepper-btn-next" 
              onClick={() => setStepperStep(stepperStep + 1)}
              disabled={stepperStep === 1 && nameAvailable === false}
            >
              Next
            </button>
          ) : (
            <button className="stepper-btn-publish" onClick={() => handleSaveShelter('Published')}>
              Publish Shelter
            </button>
          )}
        </div>
      </div>
    );
  };

  // Main Dashboard Rendering
  if (loading) {
    return (
      <div className="loading-container">
        <ActivityIndicator size="large" color="var(--color-primary)" />
        <p>Loading your shelter board...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="setup-wrapper">
        {renderSetupStepper()}
      </div>
    );
  }

  // Calculate quick metrics
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const activeCount = bookings.filter(b => b.status === 'Active').length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const upcomingCount = bookings.filter(b => b.status === 'Accepted').length;

  return (
    <div className="shelter-dash-container">
      {/* Sidebar Nav */}
      <aside className="shelter-sidebar">
        <div className="sidebar-brand">
          <Building2 size={24} color="var(--color-primary)" />
          <h2 className="sidebar-title">Shelter Panel</h2>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            <Home size={18} />
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'services' ? 'active' : ''}`}
            onClick={() => setActiveMenu('services')}
          >
            <ClipboardList size={18} />
            <span>Shelter Services</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('bookings')}
          >
            <Calendar size={18} />
            <span>Booking Requests</span>
            {pendingCount > 0 && <span className="badge-pending">{pendingCount}</span>}
          </button>
          <button 
            className={`nav-item ${activeMenu === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveMenu('messages')}
          >
            <MessageSquare size={18} />
            <span>Client Messages</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveMenu('reviews')}
          >
            <Star size={18} />
            <span>Reviews</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={18} />
            <span>Shelter Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-signout" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="shelter-main-content">
        {/* Top welcome bar */}
        <header className="shelter-header-bar">
          <div>
            <h1 className="welcome-title">Welcome back, {profile.name}!</h1>
            <p className="welcome-subtitle">Manage your shelter services, bookings, availability and hosted pets.</p>
          </div>
          <div className="header-status-badge">
            <Badge variant="success">{profile.status}</Badge>
          </div>
        </header>

        {/* Dynamic Overview Menu */}
        {activeMenu === 'overview' && (
          <div className="menu-view">
            {/* Metric grid */}
            <div className="metrics-grid">
              <Card className="metric-box">
                <CardContent className="metric-inner">
                  <div className="metric-text">
                    <span className="metric-label">Total Capacity</span>
                    <span className="metric-value">{profile.capacity}</span>
                  </div>
                  <Building2 size={24} color="var(--color-primary)" />
                </CardContent>
              </Card>

              <Card className="metric-box">
                <CardContent className="metric-inner">
                  <div className="metric-text">
                    <span className="metric-label">Available Spaces</span>
                    <span className="metric-value">{Math.max(0, profile.capacity - profile.occupiedSpaces)}</span>
                  </div>
                  <Check size={24} color="#16A34A" />
                </CardContent>
              </Card>

              <Card className="metric-box">
                <CardContent className="metric-inner">
                  <div className="metric-text">
                    <span className="metric-label">Occupied Spaces</span>
                    <span className="metric-value">{profile.occupiedSpaces}</span>
                  </div>
                  <PawPrint size={24} color="#EAB308" />
                </CardContent>
              </Card>

              <Card className="metric-box">
                <CardContent className="metric-inner">
                  <div className="metric-text">
                    <span className="metric-label">Pending Requests</span>
                    <span className="metric-value">{pendingCount}</span>
                  </div>
                  <AlertCircle size={24} color="#EF4444" />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-row">
              <button className="action-btn" onClick={() => setIsAddServiceOpen(true)}>
                <Plus size={16} />
                <span>Add Shelter Service</span>
              </button>
              <button className="action-btn" onClick={() => setActiveMenu('services')}>
                <ClipboardList size={16} />
                <span>Manage Services</span>
              </button>
              <button className="action-btn" onClick={() => setActiveMenu('bookings')}>
                <Calendar size={16} />
                <span>View Booking Requests</span>
              </button>
              <button className="action-btn" onClick={() => setActiveMenu('messages')}>
                <MessageSquare size={16} />
                <span>Open Messages</span>
              </button>
            </div>

            {/* Stay details: Hosted pets currently staying */}
            <h3 className="section-title" style={{ marginTop: '24px' }}>Pets Currently in Shelter</h3>
            <Card>
              <CardContent className="stay-list-wrapper">
                {bookings.filter(b => b.status === 'Active').length === 0 ? (
                  <div className="empty-stay-box">
                    <PawPrint size={32} color="#94A3B8" />
                    <p>No pets currently staying at your shelter.</p>
                  </div>
                ) : (
                  <table className="stay-table">
                    <thead>
                      <tr>
                        <th>Pet</th>
                        <th>Owner</th>
                        <th>Service</th>
                        <th>Stay Period</th>
                        <th>Care Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.filter(b => b.status === 'Active').map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="pet-cell">
                              <img src={b.pet?.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=150'} alt="Pet" />
                              <div>
                                <span>{b.pet?.name}</span>
                                <small>{b.pet?.breed}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="owner-cell">
                              <span>{b.owner?.name}</span>
                              <small>{b.owner?.phone}</small>
                            </div>
                          </td>
                          <td>{b.service?.name}</td>
                          <td>
                            <small>{new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}</small>
                          </td>
                          <td>{b.specialInstructions || 'None'}</td>
                          <td>
                            <button className="btn-tbl-complete" onClick={() => handleUpdateBooking(b.id, 'Completed')}>
                              Complete Stay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Menu View */}
        {activeMenu === 'services' && (
          <div className="menu-view">
            <div className="menu-header">
              <h3 className="section-title">My Shelter Services</h3>
              <button className="btn-add-service" onClick={() => setIsAddServiceOpen(true)}>
                <Plus size={16} />
                <span>Create Service</span>
              </button>
            </div>

            <div className="services-grid">
              {services.length === 0 ? (
                <div className="empty-state-card">
                  <ClipboardList size={32} color="#94A3B8" />
                  <p>No services registered yet. Create one to list on pet discovery boards.</p>
                </div>
              ) : (
                services.map(s => (
                  <Card key={s.id} className="service-card">
                    <CardHeader>
                      <div className="service-title-row">
                        <CardTitle>{s.name}</CardTitle>
                        <Badge variant={s.status === 'Active' ? 'success' : 'secondary'}>{s.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="service-desc">{s.description || 'No description provided.'}</p>
                      <Separator style={{ margin: '12px 0' }} />
                      <div className="service-meta">
                        <span><strong>Rate:</strong> {s.dailyRate} PKR/day</span>
                        <span><strong>Capacity:</strong> {s.maxCapacity} pets</span>
                      </div>
                      <div className="service-card-actions">
                        <button className="btn-card-deactivate" onClick={() => handleUpdateServiceStatus(s.id, 'Inactive')}>
                          Deactivate
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bookings requests Board */}
        {activeMenu === 'bookings' && (
          <div className="menu-view">
            <h3 className="section-title">Booking Requests</h3>

            <div className="bookings-list">
              {bookings.length === 0 ? (
                <div className="empty-state-card">
                  <Calendar size={32} color="#94A3B8" />
                  <p>No booking requests found.</p>
                </div>
              ) : (
                bookings.map(b => (
                  <Card key={b.id} className="booking-req-card">
                    <CardContent className="booking-card-inner">
                      <div className="booking-pet-profile">
                        <img src={b.pet?.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=150'} alt="Pet" />
                        <div>
                          <h4>{b.pet?.name}</h4>
                          <span className="breed-badge">{b.pet?.breed}</span>
                          <p className="owner-desc">Owner: {b.owner?.name} | {b.owner?.phone}</p>
                        </div>
                      </div>

                      <div className="booking-stay-details">
                        <p><strong>Service:</strong> {b.service?.name}</p>
                        <p><strong>Dates:</strong> {new Date(b.checkInDate).toLocaleDateString()} - {new Date(b.checkOutDate).toLocaleDateString()}</p>
                        <p><strong>Duration:</strong> {b.duration} Days</p>
                        {b.pickupOption !== 'No Pickup' && (
                          <p className="pickup-tag">
                            <Truck size={14} />
                            <span>Pickup: {b.pickupOption} | {b.pickupAddress}</span>
                          </p>
                        )}
                        {b.specialInstructions && (
                          <p className="care-notes-warn">
                            <AlertTriangle size={14} />
                            <span>Care notes: {b.specialInstructions}</span>
                          </p>
                        )}
                      </div>

                      <div className="booking-total-price">
                        <span className="price-label">Total Amount</span>
                        <span className="price-val">{b.totalAmount} PKR</span>
                        <Badge variant="warning">{b.status}</Badge>
                      </div>

                      <div className="booking-req-actions">
                        {b.status === 'Pending' && (
                          <>
                            <button className="btn-accept" onClick={() => handleUpdateBooking(b.id, 'Accepted')}>
                              Accept
                            </button>
                            <button className="btn-reject" onClick={() => {
                              setSelectedBookingId(b.id);
                              setIsRejectOpen(true);
                            }}>
                              Reject
                            </button>
                          </>
                        )}
                        {b.status === 'Accepted' && (
                          <button className="btn-checkin" onClick={() => handleUpdateBooking(b.id, 'Active')}>
                            Check-In Pet
                          </button>
                        )}
                        {b.status === 'Active' && (
                          <button className="btn-tbl-complete" onClick={() => handleUpdateBooking(b.id, 'Completed')}>
                            Complete Stay
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messaging client */}
        {activeMenu === 'messages' && (
          <div className="menu-view message-client-wrapper">
            <div className="conversation-sidebar">
              <h4>Active Bookings</h4>
              <Separator />
              <div className="conv-list">
                {bookings.map(b => (
                  <div 
                    key={b.id} 
                    className={`conv-item ${activeChatBooking?.id === b.id ? 'active' : ''}`}
                    onClick={() => loadChat(b)}
                  >
                    <span>{b.pet?.name} ({b.owner?.name})</span>
                    <small>{b.service?.name}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-window">
              {activeChatBooking ? (
                <>
                  <div className="chat-header">
                    <h4>Chat with {activeChatBooking.owner?.name} regarding {activeChatBooking.pet?.name}</h4>
                  </div>
                  <div className="chat-messages-area">
                    {chatMessages.length === 0 ? (
                      <p className="no-msgs">No messages sent yet. Say hello to the pet owner!</p>
                    ) : (
                      chatMessages.map(m => (
                        <div key={m.id} className={`message-bubble ${m.senderId === user._id ? 'sender' : 'receiver'}`}>
                          <p>{m.message}</p>
                          <small>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="chat-input-row">
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder="Type a message..." 
                    />
                    <button onClick={handleSendMessage}>Send</button>
                  </div>
                </>
              ) : (
                <div className="chat-empty-state">
                  <MessageSquare size={32} color="#94A3B8" />
                  <p>Select an active booking conversation from the sidebar to message owners.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews View */}
        {activeMenu === 'reviews' && (
          <div className="menu-view">
            <h3 className="section-title">Client Reviews</h3>
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <div className="empty-state-card">
                  <Star size={32} color="#94A3B8" />
                  <p>No reviews received yet.</p>
                </div>
              ) : (
                reviews.map(r => (
                  <Card key={r.id} className="review-card-box">
                    <CardContent>
                      <div className="review-header-row">
                        <div className="reviewer-info">
                          <span>{r.user?.name}</span>
                          <div className="stars-row">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < r.rating ? '#F59E0B' : 'none'} color="#F59E0B" />
                            ))}
                          </div>
                        </div>
                        <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="review-comment">{r.comment}</p>
                      
                      {r.response ? (
                        <div className="provider-response-box">
                          <strong>Your response:</strong>
                          <p>{r.response}</p>
                        </div>
                      ) : (
                        <div className="reply-input-box">
                          <input 
                            type="text" 
                            placeholder="Write a response..." 
                            id={`reply-input-${r.id}`}
                          />
                          <button onClick={() => {
                            const val = document.getElementById(`reply-input-${r.id}`).value;
                            if (val.trim()) {
                              handleRespondToReview(r.id, val.trim());
                            }
                          }}>Reply</button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings profile view */}
        {activeMenu === 'settings' && (
          <div className="menu-view">
            <h3 className="section-title">Shelter Profile Settings</h3>
            <div className="settings-profile-form">
              <label>Shelter Name</label>
              <input type="text" value={shelterName} onChange={(e) => setShelterName(e.target.value)} />

              <label style={{ marginTop: '16px' }}>Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />

              <label style={{ marginTop: '16px' }}>Email</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label style={{ marginTop: '16px' }}>Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />

              <label style={{ marginTop: '16px' }}>Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />

              <button className="btn-save-settings" onClick={() => handleSaveShelter('Published')}>
                Save Profile Changes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Dialog for Add Service */}
      {isAddServiceOpen && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>Create Shelter Service</h3>
              <button onClick={() => setIsAddServiceOpen(false)}><X size={16} /></button>
            </div>
            <div className="dialog-body">
              <label>Service Name</label>
              <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Daily Boarding Care" />

              <label style={{ marginTop: '12px' }}>Description</label>
              <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} placeholder="Detail the care, exercise, and diet included..." />

              <label style={{ marginTop: '12px' }}>Daily Rate (PKR)</label>
              <input type="number" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} />

              <label style={{ marginTop: '12px' }}>Maximum Capacity</label>
              <input type="number" value={serviceCapacity} onChange={(e) => setServiceCapacity(e.target.value)} />
            </div>
            <div className="dialog-footer">
              <button className="btn-cancel" onClick={() => setIsAddServiceOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddService}>Add Service</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for Rejection Reason */}
      {isRejectOpen && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <h3>Reject Booking Request</h3>
              <button onClick={() => setIsRejectOpen(false)}><X size={16} /></button>
            </div>
            <div className="dialog-body">
              <label>Specify Reason for Rejection</label>
              <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>
                <option value="Availability issue">Availability issue</option>
                <option value="Service unavailable">Service unavailable</option>
                <option value="Date unavailable">Date unavailable</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="dialog-footer">
              <button className="btn-cancel" onClick={() => setIsRejectOpen(false)}>Cancel</button>
              <button className="btn-save-reject" onClick={() => handleUpdateBooking(selectedBookingId, 'Rejected', rejectionReason)}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Review reply logic
  async function handleRespondToReview(id, replyText) {
    try {
      const res = await fetch(`${API_URL}/api/shelter/reviews/${id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-id': user._id
        },
        body: JSON.stringify({ response: replyText })
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Deactivate service helper
  async function handleUpdateServiceStatus(id, status) {
    try {
      const res = await fetch(`${API_URL}/api/shelter/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-id': user._id
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Simple React Native fallback loader wrapper
function ActivityIndicator({ size, color }) {
  return <div className="spinner-loader" style={{ borderColor: color }}></div>;
}
