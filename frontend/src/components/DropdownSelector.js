import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const DropdownSelector = ({ options, currentValue, onSelect, placeholder = "Select...", searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOptions = searchable ? options.filter(o => o.toLowerCase().includes(searchTerm.toLowerCase())) : options;

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '200px'
        }}
      >
        <span>{currentValue || placeholder}</span>
        <span style={{ marginLeft: '8px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          width: '100%',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 30px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <FaSearch style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }} />
              </div>
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: option === currentValue ? '#f0f0f0' : 'white',
                ':hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownSelector;