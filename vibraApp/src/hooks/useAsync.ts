/**
 * Hook genérico para operaciones asíncronas
 *
 * Maneja automáticamente los estados de:
 * - loading (cargando)
 * - error (error)
 * - data (datos)
 *
 * Útil para cualquier operación async (fetch, promises, etc.)
 */

import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Estado de una operación asíncrona
 */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Retorno del hook useAsync
 */
interface UseAsyncReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | void>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Hook para manejar operaciones asíncronas
 *
 * @param asyncFunction - Función asíncrona a ejecutar
 * @param immediate - Si debe ejecutarse inmediatamente (default: false)
 * @returns Estado y funciones de control
 *
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useAsync(
 *   () => musicService.getAllSongs(20, 0)
 * );
 *
 * // Ejecutar manualmente
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseAsyncReturn<T, Args> {
  // Estado inicial
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Función para ejecutar la operación async
  const execute = useCallback(
    async (...args: Args): Promise<T | void> => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await asyncFunction(...args);
        setState({ data: response, loading: false, error: null });
        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        throw err; // Re-throw para que el componente pueda manejarlo si quiere
      }
    },
    [asyncFunction]
  );

  // Función para resetear el estado
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Función para setear data manualmente
  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook para operaciones asíncronas que se ejecutan inmediatamente
 *
 * @param asyncFunction - Función asíncrona a ejecutar
 * @param deps - Dependencias para re-ejecutar
 * @returns Estado y funciones de control
 *
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useAsyncImmediate(
 *   () => musicService.getAllSongs(20, 0),
 *   [] // Se ejecuta solo una vez al montar
 * );
 * ```
 */
export function useAsyncImmediate<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = []
): UseAsyncReturn<T, []> & { refetch: () => Promise<T | void> } {
  const asyncState = useAsync(asyncFunction, true);

  // Ejecutar cuando cambien las dependencias
  React.useEffect(() => {
    asyncState.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...asyncState,
    refetch: asyncState.execute,
  };
}

export default useAsync;
