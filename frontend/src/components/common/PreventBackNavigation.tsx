import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PreventBackNavigation: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Push state to disable the back button
    window.history.pushState(null, document.title, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, document.title, window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  return null;
};

export default PreventBackNavigation;
