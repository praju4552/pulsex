import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Layers, Trophy,
    Users, Settings, LogOut, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface SidebarProps {
    isCollapsed?: boolean;
}

export function AdminSidebar({ isCollapsed = false }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const SUPER_ADMIN_EMAIL = 'prajwalshetty4552@gmail.com';
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { id: 'project-templates', label: 'Project Templates', icon: Layers, path: '/admin/project-templates' },
        { id: 'skills', label: 'Skills', icon: Trophy, path: '/admin/skills' },
        { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
        ...(isSuperAdmin ? [
            { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
            { id: 'prototyping', label: 'Prototyping Services', icon: Layers, path: '/admin/prototyping-services' }
        ] : []),
        { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    return (
        <div className={`h-screen bg-black text-text-secondary flex flex-col border-r border-border-glass transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="p-6 border-b border-border-glass flex items-center justify-center">
                <h1 className={`font-black text-text-primary transition-all duration-300 ${isCollapsed ? 'text-xs text-center' : 'text-xl tracking-tighter'}`}>
                    {isCollapsed ? 'CMS' : 'ADMIN CMS'}
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                : 'hover:bg-surface-100 hover:text-text-primary'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-semibold text-sm">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border-glass">
                <button
                    onClick={logout}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-semibold text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );
}
