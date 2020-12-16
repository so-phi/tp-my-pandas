import { renderHook } from '@testing-library/react-hooks';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { ReactNode } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import usePandaDetails from '.';
import pandas from '../../mocks/pandas.json';

// Création d'un wrapper React Query

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const ReactQueryWrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const axiosMock = new MockAdapter(axios);

describe('usePandaDetails', () => {
  beforeEach(() => {
    // Attention à bien vider le cache avant chaque test sinon on aura des données même en cas d'erreur !
    queryClient.getQueryCache().clear();
  });

  afterEach(() => {
    axiosMock.reset();
  });

  test('request was successful', async () => {
    axiosMock.onGet('http://localhost:3004/pandas/1').reply(200, pandas[0]);

    const { result, waitFor } = renderHook(() => usePandaDetails('1'), {
      wrapper: ReactQueryWrapper,
    });
    expect(result.current.isLoading).toBeTruthy();

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).not.toBeUndefined();
    expect(result.current.data).toEqual(pandas[0]);
    expect(result.current.isLoading).toBeFalsy();
  });

  test('request failed', async () => {
    axiosMock.onGet('http://localhost:3004/pandas/1').networkError();

    const { result, waitFor } = renderHook(() => usePandaDetails('1'), {
      wrapper: ReactQueryWrapper,
    });
    expect(result.current.isLoading).toBeTruthy();

    await waitFor(() => result.current.isError);

    expect(result.current.data).toBeUndefined();
    expect(result.current.error?.message).toEqual('Network Error');
    expect(result.current.isLoading).toBeFalsy();
  });
});
