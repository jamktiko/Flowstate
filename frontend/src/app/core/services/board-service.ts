import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { Board } from '../models/board-model'; // Adjust the import path if this lives elsewhere

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private http = inject(HttpClient);
  // Assuming your backend routes are prefixed with '/boards'
  private apiUrl = `${environment.apiBaseUrl}/boards`;

  // CREATE: Add a new board
  async createBoard(name: string): Promise<Board> {
    const res = await firstValueFrom(this.http.post<ApiResponse<Board>>(this.apiUrl, { name }));
    return res.data;
  }

  // READ: Get all boards for the logged-in user
  async getBoards(): Promise<Board[]> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Board[]>>(this.apiUrl));
    return res.data;
  }

  // READ: Get a specific board by its ID
  async getBoardById(id: string): Promise<Board> {
    const res = await firstValueFrom(this.http.get<ApiResponse<Board>>(`${this.apiUrl}/${id}`));
    return res.data;
  }

  // UPDATE: Modify an existing board (e.g., rename, update columns/cards)
  async updateBoard(id: string, boardData: Partial<Board>): Promise<Board> {
    const res = await firstValueFrom(
      this.http.patch<ApiResponse<Board>>(`${this.apiUrl}/${id}`, boardData),
    );
    return res.data;
  }

  // DELETE: Remove a board
  async deleteBoard(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }

  // CREATE: Add a new column to a board
  async addColumn(
    boardId: string,
    columnData: { id: string; name: string; order: number },
  ): Promise<Board> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<Board>>(`${this.apiUrl}/${boardId}/columns`, columnData),
    );
    return res.data;
  }
}
