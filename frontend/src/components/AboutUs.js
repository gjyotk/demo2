import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { color } from '@mui/system';
import './AboutUs.css';
import ctop from '../assets/images/ctopicon.png';
import scrc from '../assets/images/scrc.gif';
import humanImg from '../assets/images/human.jpg';




const CombinedSection = () => {
  const navigate = useNavigate(); // Hook for navigation

  const handleReadMore = () => {
    window.open('https://smartcitylivinglab.iiit.ac.in/', '_blank');
  };

  const handleClick = () => {
    navigate('/create-user'); // Navigate to /create-user
  };





  return (
    <div className='about-us-container'>
      {/* Pentaho Section */}
      <div className="scrolling-text-wrapper">
      <button
        type="button"  // Explicit type attribute added
        className="scrolling-text"
        onClick={handleClick} // Handle click to navigate
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { // Enable keyboard navigation (Enter/Space)
            handleClick();
          }
        }}
        role="link" // Use appropriate role for accessibility
        tabIndex="0" // Make sure it's focusable by keyboard
      >
        🌟 Welcome to Our Platform - To register as vendor&nbsp;
        <span style={{ color: 'blue', textDecoration: 'underline' }}>click here</span>🌟
      </button>
    </div>

      <div className="pentaho-container">
        <div className="text-section">
          <div className="header-content">
            {/* <img className='ctopicon-image'
              src="/logo512.png"
              alt="Factory Illustration"
            /> */}
            <h1>
              CITY IoT<br />
              <span className="bold">OPERATING PLATFORM</span>
              
            </h1>
          </div>
          <p>
          The City IoT Operating Platform is a lightweight oneM2M wrapper internally named ctOP designed to enhance interoperability and simplify IoT device integration for smart city deployments.
          </p>
          {/* <p>
          ctOP serves as an intermediary system providing user authentication and access control for oneM2M-based IoT ecosystems. It offers an intuitive interface for users to manage their IoT devices and network security. ctOP includes the following features that would be incorporated in Phase I. Once deployed, the features can be added, and the module optimized as per the requirements. This ctOP platform may serve as the underlying sensory data layer in any city that can be part of the smart Cities Mission’s City Operations Platform (COP).

          </p> */}
        </div>
        <div className="image-section">
          <img className='ctopiconmain'
            src={ctop}
            alt="Factory Illustration"
          />
        </div>
      </div>

      {/* Connect & Collect Data Section */}
      <div className="connect-collect-container">
        <div className="text-content">
          <h2>Smart City Living Lab</h2>
          {/* <h4>at IIIT Hyderabad</h4> */}
          <p>
            In the face of rapidly increasing urbanization and the consequent challenges it brings, Smart Cities have emerged as beacons of sustainability, efficiency, and improved quality of life. The Smart City Living Lab at IIIT Hyderabad, supported by the MEITY (Government of India), Smart City Mission, and the Government of Telangana, is at the forefront of transforming these concepts into realities. This facility is part of the broader Smart City Research Center which also includes collaborations with the EBTC and Amsterdam Innovation Arena.

            The Living Lab is not merely a testbed for new technologies but a dynamic ecosystem designed to foster innovations that are fine-tuned. It focuses on integrating Internet of Things (IoT) technologies across various domains of urban development, from energy to transportation, thereby enhancing the quality of life of its residents.

          </p>
        
          <button type="button" className="read-more-button" onClick={handleReadMore}>
            Read More
          </button>
        </div>
        <div className="image-content">
          <img
            src={scrc}
            alt="Connect and Collect Illustration"
          />
        </div>
      </div>

      {/* Team Profiles Section */}
      <div className="team-profiles-section">
        <h2>Team Profile</h2>

        <div className="profile-cards">
          <div className="profile-card">
          <div className="profile-image">
            <img src={humanImg} alt="Member 1" />
          </div>

          <p className="member-name">Member 1</p>
          <p className="member-designation">Designation 1</p>
          </div>
          <div className="profile-card">
            <div className="profile-image">
            <img src={humanImg} alt="Member 1" />
            </div>
            <p className="member-name">Member 1</p>
    <p className="member-designation">Designation 1</p>
          </div>
          <div className="profile-card">
            <div className="profile-image">
            <img src={humanImg} alt="Member 1" />
            </div>
            <p className="member-name">Member 1</p>
    <p className="member-designation">Designation 1</p>
          </div>
          <div className="profile-card">
            <div className="profile-image">
            <img src={humanImg} alt="Member 1" />
            </div>
            <p className="member-name">Member 1</p>
    <p className="member-designation">Designation 1</p>
          </div>
          <div className="profile-card">
            <div className="profile-image">
            <img src={humanImg} alt="Member 1" />
            </div>
            <p className="member-name">Member 1</p>
    <p className="member-designation">Designation 1</p>
          </div>
      </div>
      </div>

      {/* Power of Pentaho Platform Section */}
      <div className="power-platform-section">
        <h1>
        Onboarding
          
        </h1>
        <p className="subtitle">
        Getting started is easy! Fill the onboarding form below, and our team will guide you through the next steps.

        </p>
        <button type="button" className="learn-more-btn" 
        onClick={handleClick}
        >
        👉 Fill Your Details
        </button>
      </div>
    </div>
  );
};

export default CombinedSection;






