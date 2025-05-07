declare module 'ml-regression' {
  export class LinearRegression {
    constructor(x: number[], y: number[]);
    predict(x: number): number;
    score(x: number[], y: number[]): number;
    slope: number;
  }
} 