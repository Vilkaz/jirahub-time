import { useState } from 'react';
import { Clock, User, Settings, LogOut, Zap, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { config } from '../../config/env';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

interface HeaderProps {
  className?: string;
}

export const Header = ({ className }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useState(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  });

  const handleLogout = () => {
    logout();
    // In production, this would redirect to Okta logout
    window.location.href = '/login';
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-card-border',
      'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'shadow-sm',
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {config.APP_NAME}
              </h1>
              <p className="text-xs text-muted-foreground">
                Production Time Tracker
              </p>
            </div>
          </div>

          {/* Center - Current Time */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                {currentTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentTime.toLocaleDateString([], { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Right Side - Status & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Jira Connection Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className="text-xs flex items-center space-x-1"
              >
                <Zap className="h-3 w-3" />
                <span>Jira Connected</span>
              </Badge>
              <Badge 
                variant="outline"
                className="text-xs flex items-center space-x-1"
              >
                <CheckCircle className="h-3 w-3" />
                <span>API Online</span>
              </Badge>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:bg-secondary"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={user?.avatar} 
                      alt={user?.name || user?.email || 'User'} 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};