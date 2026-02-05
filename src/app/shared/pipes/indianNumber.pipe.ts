import { Pipe, PipeTransform } from '@angular/core';

/**
 * IndianNumberPipe - Angular 20 Optimized
 * 
 * Formats numbers according to Indian numbering system (Lakhs and Crores)
 * Uses Indian locale for proper comma placement
 * 
 * Usage:
 * {{ 1000 | indianNumber }}           // Output: "1,000"
 * {{ 100000 | indianNumber }}         // Output: "1,00,000"
 * {{ 10000000 | indianNumber }}       // Output: "1,00,00,000"
 * {{ 123456789 | indianNumber }}      // Output: "12,34,56,789"
 * 
 * Features:
 * - Proper Indian comma placement (XX,XX,XXX)
 * - Handles null/undefined safely
 * - Type-safe implementation
 * - Pure pipe for optimal performance
 */
@Pipe({
  name: 'indianNumber',
  standalone: true,
  pure: true 
  
})
export class IndianNumberPipe implements PipeTransform {
  /**
   * Transform a number to Indian numbering format
   * 
   * @param value - The number to format (can be number, string, null, or undefined)
   * @returns Formatted string with Indian comma placement, or empty string for invalid input
   */
  transform(value: number | string | null | undefined): string {
    // Handle null, undefined, empty string
    if (value == null || value === '') {
      return '';
    }

    // Convert to number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Handle NaN or invalid numbers
    if (isNaN(numValue)) {
      return '';
    }

    // Format using Indian locale
    const formattedValue = numValue.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });

    return formattedValue;
  }
}

/**
 * IndianNumberWithDecimalsPipe - Extended version with decimal control
 * 
 * Usage:
 * {{ 1234.56 | indianNumberWithDecimals }}       // Output: "1,234.56"
 * {{ 1234.567 | indianNumberWithDecimals:2 }}    // Output: "1,234.57"
 * {{ 1234.5 | indianNumberWithDecimals:2:2 }}    // Output: "1,234.50"
 */
@Pipe({
  name: 'indianNumberWithDecimals',
  standalone: true,
  pure: true
})
export class IndianNumberWithDecimalsPipe implements PipeTransform {
  /**
   * Transform with decimal place control
   * 
   * @param value - The number to format
   * @param maxDecimals - Maximum decimal places (default: 2)
   * @param minDecimals - Minimum decimal places (default: 0)
   * @returns Formatted string with controlled decimals
   */
  transform(
    value: number | string | null | undefined,
    maxDecimals: number = 2,
    minDecimals: number = 0
  ): string {
    if (value == null || value === '') {
      return '';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '';
    }

    const formattedValue = numValue.toLocaleString('en-IN', {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: minDecimals
    });

    return formattedValue;
  }
}

/**
 * IndianCurrencyPipe - Currency formatting with Rupee symbol
 * 
 * Usage:
 * {{ 1000 | indianCurrency }}              // Output: "₹1,000"
 * {{ 100000 | indianCurrency }}            // Output: "₹1,00,000"
 * {{ 1234.56 | indianCurrency:2 }}         // Output: "₹1,234.56"
 */
@Pipe({
  name: 'indianCurrency',
  standalone: true,
  pure: true
})
export class IndianCurrencyPipe implements PipeTransform {
  /**
   * Transform with currency symbol
   * 
   * @param value - The number to format
   * @param decimals - Decimal places (default: 0)
   * @param symbol - Currency symbol (default: '₹')
   * @returns Formatted currency string
   */
  transform(
    value: number | string | null | undefined,
    decimals: number = 0,
    symbol: string = '₹'
  ): string {
    if (value == null || value === '') {
      return `${symbol}0`;
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return `${symbol}0`;
    }

    const formattedValue = numValue.toLocaleString('en-IN', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    });

    return `${symbol}${formattedValue}`;
  }
}