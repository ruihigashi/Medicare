import React from 'react';
import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AccountLogin from './components/AccountLogin';
import SymptomSelection from './components/SymptomSelection';
import PatientRegistration from './components/PatientRegistration';
import AppointmentBooking from './components/AppointmentBooking';
import WaitingRoom from './components/WaitingRoom';
import DoctorAIConsultation from './components/DoctorAIConsultation';
import PharmacySelection from './components/PharmacySelection';
import PrescriptionFaxConfirmation from './components/PrescriptionFaxConfirmation';
import ConsultationResults from './components/ConsultationResults';
import { Patient, Appointment } from './types';
import { AuthUser, getPatientData, savePatientData } from './lib/auth';
import { getUserProfile } from './lib/userProfile';
import ProfilePage from './components/ProfilePage';

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
}

function App() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'symptoms' | 'registration' | 'booking' | 'waiting' | 'consultation' | 'pharmacy' | 'fax' | 'results' | 'profile'>('landing');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string>('');
  const [userAccount, setUserAccount] = useState<AuthUser | null>(null);
  const [savedPatientData, setSavedPatientData] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleGetStarted = () => {
    setCurrentStep('symptoms');
  };

  const handleLogin = (user: AuthUser, patientData?: any) => {
    setUserAccount(user);
    if (patientData) {
      setSavedPatientData(patientData);
    } else {
      // Load patient data after login if not provided
      loadPatientDataAfterLogin(user);
    }
    setShowLogin(false);
  };

  const loadPatientDataAfterLogin = async (user: AuthUser) => {
    try {
      const { data } = await getPatientData(user.id);
      if (data) {
        setSavedPatientData(data);
      } else {
        // If no patient data, try to load from user profile
        const { data: profileData } = await getUserProfile();
        if (profileData) {
          // Convert user profile to patient data format
          const convertedData = {
            name: profileData.display_name,
            birth_date: profileData.date_of_birth,
            gender: profileData.gender,
            phone: profileData.phone,
            email: user.email,
            address: profileData.address,
            insurance_type: '国民健康保険', // Default value
            insurance_number: '', // Will need to be filled
            emergency_contact_name: profileData.emergency_contact_name,
            emergency_contact_phone: profileData.emergency_contact_phone,
            emergency_contact_relationship: profileData.emergency_contact_relationship,
          };
          setSavedPatientData(convertedData);
        }
      }
    } catch (error) {
      console.error('Failed to load patient data after login:', error);
    }
  };
  const handleLogout = () => {
    setUserAccount(null);
    setSavedPatientData(null);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleSymptomsSelected = (symptoms: string[], additional: string) => {
    setSelectedSymptoms(symptoms);
    setAdditionalSymptoms(additional);
    setCurrentStep('registration');
  };

  const handleRegistrationComplete = async (patientData: Patient) => {
    setPatient(patientData);
    
    // ログイン済みユーザーの場合、患者情報を保存
    if (userAccount) {
      try {
        await savePatientData(userAccount.id, patientData);
        setSavedPatientData(patientData);
      } catch (error) {
        console.error('Failed to save patient data:', error);
      }
    }
    
    setCurrentStep('booking');
  };

  const handleAppointmentBooked = (appointmentData: Appointment) => {
    setAppointment(appointmentData);
    setCurrentStep('waiting'); // 初期待機画面（問診前）
  };

  const handleConsultationStart = () => {
    setCurrentStep('consultation');
  };

  const handleConsultationComplete = () => {
    setCurrentStep('pharmacy');
  };

  const handlePharmacySelected = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setCurrentStep('fax');
  };

  const handleFaxComplete = () => {
    setCurrentStep('results');
  };

  const handleBackToLanding = () => {
    setCurrentStep('landing');
    // Scroll to top when returning to landing page
    window.scrollTo(0, 0);
  };

  const handleShowProfile = () => {
    setCurrentStep('profile');
  };

  // Login modal overlay
  if (showLogin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <AccountLogin 
            onLogin={handleLogin}
            onBack={handleCloseLogin}
          />
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 'landing':
      return (
        <LandingPage 
          onGetStarted={handleGetStarted} 
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
          onShowProfile={handleShowProfile}
        />
      );
    
    case 'profile':
      return userAccount ? (
        <ProfilePage
          userAccount={userAccount}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          onBack={handleBackToLanding}
        />
      ) : (
        <LandingPage 
          onGetStarted={handleGetStarted} 
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
          onShowProfile={handleShowProfile}
        />
      );
    
    case 'symptoms':
      return (
        <SymptomSelection 
          onSymptomsSelected={handleSymptomsSelected}
          onBack={handleBackToLanding}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
        />
      );
    
    case 'registration':
      return (
        <PatientRegistration 
          onRegistrationComplete={handleRegistrationComplete} 
          onBack={() => setCurrentStep('symptoms')}
          selectedSymptoms={selectedSymptoms}
          additionalSymptoms={additionalSymptoms}
          savedPatientData={savedPatientData}
          userAccount={userAccount}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
        />
      );
    
    case 'booking':
      return patient ? (
        <AppointmentBooking 
          patient={patient} 
          onAppointmentBooked={handleAppointmentBooked} 
          onBack={() => setCurrentStep('registration')}
          selectedSymptoms={selectedSymptoms}
          additionalSymptoms={additionalSymptoms}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
        />
      ) : null;
    
    case 'waiting':
      return patient && appointment ? (
        <WaitingRoom 
          patient={patient}
          appointment={appointment}
          onConsultationStart={handleConsultationStart}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
        />
      ) : null;
    
    case 'consultation':
      return patient && appointment ? (
        <DoctorAIConsultation 
          patient={patient}
          appointment={appointment}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
          onConsultationComplete={handleConsultationComplete}
        />
      ) : null;
    
    case 'pharmacy':
      return patient ? (
        <PharmacySelection
          patientAddress={patient.address}
          onPharmacySelected={handlePharmacySelected}
          onBack={() => setCurrentStep('consultation')}
        />
      ) : null;
    
    case 'fax':
      return patient && selectedPharmacy ? (
        <PrescriptionFaxConfirmation
          selectedPharmacy={selectedPharmacy}
          patientName={patient.name}
          onComplete={handleFaxComplete}
          onBack={() => setCurrentStep('pharmacy')}
        />
      ) : null;
    
    case 'results':
      return patient && appointment ? (
        <ConsultationResults 
          patient={patient}
          appointment={appointment}
          onShowLogin={handleShowLogin}
          onLogout={handleLogout}
          userAccount={userAccount}
          onBackToLanding={handleBackToLanding}
        />
      ) : null;
    
    default:
      return null;
  }
}

export default App;