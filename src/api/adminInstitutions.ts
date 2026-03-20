import { API_BASE_URL } from './config';

export const getInstitutions = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/institutions`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch institutions');
    return response.json();
};

export const updateInstitution = async (id: string, data: any, token: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update institution');
    return response.json();
};
export const approveInstitution = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}/approve`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve institution');
    }
    return response.json();
};

export const rejectInstitution = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject institution');
    }
    return response.json();
};

export const updateInstitutionPassword = async (id: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/institutions/${id}/password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update password');
    }
    return response.json();
};
