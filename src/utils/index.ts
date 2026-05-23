// src\utils\index.ts
export function formatDollarToToman(value: number, showCurrency: boolean = true): string {
    const toman = Math.floor(value * 10000); 
    const formatted = toman.toLocaleString('fa');
    return showCurrency ? formatted + ' تومان' : formatted;
  }