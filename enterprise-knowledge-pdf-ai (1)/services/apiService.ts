import { DocumentKnowledge } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const fetchDocuments = async (): Promise<DocumentKnowledge[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/documents`);
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
};

export const saveDocument = async (doc: DocumentKnowledge): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(doc),
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving document:', error);
        return false;
    }
};

export const fetchHistory = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
};

export const saveHistory = async (query: string, results: any[]): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, results }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving history:', error);
        return false;
    }
};

export const clearHistoryData = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        return false;
    }
}
