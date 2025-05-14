
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import UserMenu from './UserMenu';

const NavBar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Calculer un Tarif', path: '/calculate-rate' },
    { name: 'Vérifier une Réservation', path: '/verify-booking' },
    { name: 'Suivi des Tarifs', path: '/track-rates' },
    { name: 'Yield Management', path: '/yield-management' },
  ];

  return (
    <nav className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <span className="text-xl font-bold">HotelRate Pro</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium animate-hover",
                location.pathname === item.path 
                  ? "bg-secondary text-secondary-foreground" 
                  : "hover:bg-primary-foreground/10"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="mt-4 sm:mt-0">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
