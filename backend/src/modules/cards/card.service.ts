/**
 * card.service.ts — STUB
 * TODO: Implement these functions. Tests in card.service.spec.ts are already written
 * and will go green as each function is implemented correctly.
 */
import { Types } from 'mongoose';
import { IBoard, ICard } from '../boards/board.model';

export async function createCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _columnId: string,
  _cardData: Partial<ICard>,
): Promise<IBoard> {
  throw new Error('Not implemented: createCard');
}

export async function updateCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _columnId: string,
  _cardId: Types.ObjectId,
  _updates: Partial<ICard>,
): Promise<IBoard> {
  throw new Error('Not implemented: updateCard');
}

export async function deleteCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _columnId: string,
  _cardId: Types.ObjectId,
): Promise<IBoard> {
  throw new Error('Not implemented: deleteCard');
}

export async function moveCard(
  _boardId: Types.ObjectId,
  _userId: Types.ObjectId,
  _sourceColId: string,
  _targetColId: string,
  _cardId: Types.ObjectId,
  _newOrder: number,
): Promise<IBoard> {
  throw new Error('Not implemented: moveCard');
}
