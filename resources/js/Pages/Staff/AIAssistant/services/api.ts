import { ChatMessage, ChatSession } from "../types";

class ApiService {
  private baseUrl = '/api';

  private getHeaders(isFormData: boolean = false) {
    const authToken = localStorage.getItem("auth_token");

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };

    // Only add JSON headers if not sending FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async sendMessage(message: string, sessionId?: string, documentIds?: number[]): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/ai/send-message`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ 
        message, 
        conversation_id: sessionId,
        document_ids: documentIds
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Message send failed');
    }
    
    return response.json();
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${this.baseUrl}/ai/chat-history/${sessionId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }
    
    return response.json();
  }

  async getChatSessions(): Promise<ChatSession[]> {
    const response = await fetch(`${this.baseUrl}/ai/conversations`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat sessions');
    }
    
    return response.json();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai/conversations/${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  }

  async starSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai/conversations/${sessionId}/star`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to star session');
    }
  }

  async unstarSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai/conversations/${sessionId}/unstar`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unstar session');
    }
  }

  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: this.getHeaders(true), // true → skip Content-Type
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }

  async getDocuments(search?: string): Promise<any[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${this.baseUrl}/documents${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  }

  async deleteDocument(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) throw new Error('Delete failed');
  }
}

export const apiService = new ApiService();