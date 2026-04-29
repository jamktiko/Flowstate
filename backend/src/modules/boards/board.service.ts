/**
 * board.service.ts — STUB
 * TODO: Implement these functions. Tests in board.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { IBoard } from './board.model';

export async function createBoard(
  _userId: Types.ObjectId,
  _name: string,
): Promise<IBoard> {
  throw new Error('Not implemented: createBoard');
}

export async function getBoardsByUser(_userId: Types.ObjectId): Promise<IBoard[]> {
  throw new Error('Not implemented: getBoardsByUser');
}

export async function getBoardById(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<IBoard> {
  throw new Error('Not implemented: getBoardById');
}

export async function renameBoard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _name: string,
): Promise<IBoard> {
  throw new Error('Not implemented: renameBoard');
}

export async function deleteBoard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
): Promise<void> {
  throw new Error('Not implemented: deleteBoard');
}

export async function addColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colData: { id: string; name: string; order: number },
): Promise<IBoard> {
  throw new Error('Not implemented: addColumn');
}

export async function deleteColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colId: string,
): Promise<IBoard> {
  throw new Error('Not implemented: deleteColumn');
}

export async function renameColumn(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _colId: string,
  _name: string,
): Promise<IBoard> {
  throw new Error('Not implemented: renameColumn');
}
