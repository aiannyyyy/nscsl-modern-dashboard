import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    username: string;
    fullName?: string;
    email?: string;
    role?: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                // 🔧 TODO: Replace with your actual auth endpoint
                // Example: const response = await fetch('/api/auth/current-user');
                
                // TEMPORARY: Get from localStorage or session
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    // Set a default user - REMOVE THIS in production
                    setUser({ username: 'SYSTEM', fullName: 'System User' });
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                setUser({ username: 'SYSTEM' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};