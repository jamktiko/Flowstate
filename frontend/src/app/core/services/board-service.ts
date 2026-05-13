import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { Board } from '../models/board-model'; // Adjust the import path if this lives elsewhere

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private http = inject(HttpClient);
  // Assuming your backend routes are prefixed with '/boards'
  private apiUrl = `${environment.apiBaseUrl}/boards`;

  // CREATE: Add a new board
  async createBoard(name: string): Promise<Board> {
    return await firstValueFrom(this.http.post<Board>(this.apiUrl, { name }));
  }

  // READ: Get all boards for the logged-in user
  async getBoards(): Promise<Board[]> {
    return await firstValueFrom(this.http.get<Board[]>(this.apiUrl));
  }

  // READ: Get a specific board by its ID
  async getBoardById(id: string): Promise<Board> {
    return await firstValueFrom(this.http.get<Board>(`${this.apiUrl}/${id}`));
  }

  // UPDATE: Modify an existing board (e.g., rename, update columns/cards)
  async updateBoard(id: string, boardData: Partial<Board>): Promise<Board> {
    return await firstValueFrom(this.http.put<Board>(`${this.apiUrl}/${id}`, boardData));
  }

  // DELETE: Remove a board
  async deleteBoard(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
