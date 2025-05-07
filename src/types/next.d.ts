import { NextRequest } from 'next/server';

declare module 'next/server' {
  interface RouteContext {
    params: {
      [key: string]: string;
    };
  }
}

export {}; 