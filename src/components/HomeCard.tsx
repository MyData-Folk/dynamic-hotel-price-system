
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";

type HomeCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color?: string;
};

const HomeCard = ({ title, description, icon, to, color = "bg-white" }: HomeCardProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center p-6 rounded-xl card-shadow animate-hover",
        "hover:translate-y-[-5px] hover:shadow-lg",
        color
      )}
    >
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-center text-muted-foreground">{description}</p>
    </Link>
  );
};

export default HomeCard;
