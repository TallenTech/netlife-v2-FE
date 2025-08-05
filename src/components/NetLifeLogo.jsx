import React from 'react';

const NetLifeLogo = ({ className = "w-16 h-16" }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img src="https://horizons-cdn.hostinger.com/02085c95-d17b-4c93-8d43-4078c737ce37/3a2ec98b7d841544ca31880a0f714013.jpg" alt="NetLife Logo" className="w-full h-full object-contain" />
    </div>
  );
};

export default NetLifeLogo;