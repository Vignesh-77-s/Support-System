import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuditLog, AuditLogAction } from '../types';
import { apiClient, useAuth, useToast } from '../App';
import { Search, Download } from 'lucide-react';
import { AUDIT_ACTION_COLORS, ROLE_COLORS } from '../constants';
import { Navigate } from 'react-router-dom';

const AuditLogPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    // ... other filter states
    
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get('/audit-logs');
                setLogs(data);
            } catch (error) {
                addToast('Failed to fetch audit logs.', 'error');
            } finally {
                setLoading(false);
            }
        };
        if(user?.role === 'Admin') fetchLogs();
    }, [addToast, user]);

    if (user?.role !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    if(loading) return <div>Loading audit logs...</div>;

    const renderLogDetails = (details: string) => {
        const ticketIdMatch = details.match(/(TK\d+)/);
        if (ticketIdMatch) {
            const ticketId = ticketIdMatch[0];
            const parts = details.split(ticketId);
            return (
                <span>{parts[0]}
                    <button onClick={() => navigate('/tickets', { state: { openTicketId: ticketId } })}
                        className="font-semibold text-neokred-primary hover:underline">{ticketId}</button>
                    {parts[1]}
                </span>
            );
        }
        return details;
    };
    
    const formatAction = (action: AuditLogAction) => action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
             {/* ... Header and filters UI */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="bg-white border-b">
                                <td className="px-6 py-4">{log.timestamp}</td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold">{log.user.name}</p>
                                    <span className={`w-fit mt-1 px-2 py-0.5 text-xs rounded-full ${ROLE_COLORS[log.user.role]}`}>{log.user.role}</span>
                                </td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${AUDIT_ACTION_COLORS[log.action]}`}>{formatAction(log.action)}</span></td>
                                <td className="px-6 py-4 text-gray-600">{renderLogDetails(log.details)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;
