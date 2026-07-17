import type { AsyncState } from '@react-hookz/web';

export function isError<T>(state: AsyncState<T>): state is Extract<AsyncState<T>, { status: 'error' }> {
  return state.status === 'error';
}

export function isSuccess<T>(state: AsyncState<T>): state is Extract<AsyncState<T>, { status: 'success' }> {
  return state.status === 'success';
}

export function isUninitialized<T>(state: AsyncState<T>): state is Extract<AsyncState<T>, { status: 'not-executed' }> {
  return state.status === 'not-executed';
}

export function isLoading<T>(state: AsyncState<T>): state is Extract<AsyncState<T>, { status: 'loading' }> {
  return state.status === 'loading';
}
