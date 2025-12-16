import { Pipe, PipeTransform } from '@angular/core';

/**
 * CurrencyStringPipe -  Optimized
 * 
 * Formats numbers into Indian currency format (Lakhs, Crores)
 * 
 * Usage:
 * {{ 150000 | currencyString }}           // Output: "1.5 Lakhs"
 * {{ 15000000 | currencyString }}         // Output: "1.5 Crores"
 * {{ 15000000 | currencyString:0 }}       // Output: "2 Crores" (rounded)
 * {{ 50000 | currencyString }}            // Output: "50,000"
 * 
 * Features:
 * - Supports Lakhs (1,00,000+)
 * - Supports Crores (1,00,00,000+)
 * - Proper singular/plural handling
 * - Configurable decimal places
 * - Indian number formatting with commas
 */
@Pipe({
  name: 'currencyString',
  standalone: true,
  pure: true  // Pure pipe for better performance
})
export class CurrencyStringPipe implements PipeTransform {
  /**
   * Format value in Lakhs
   */
  private formatLakhs(value: number, fractionSize: number): string {
    if (value >= 100000) {
      const lakhsValue = value / 100000;
      const formattedValue = 
        lakhsValue % 1 === 0 
          ? lakhsValue.toFixed(0) 
          : lakhsValue.toFixed(fractionSize);
      
      // Proper singular/plural handling
      const unit = Math.abs(lakhsValue) === 1 ? 'Lakh' : 'Lakhs';
      return `${formattedValue} ${unit}`;
    }

    return value.toFixed(fractionSize);
  }

  /**
   * Format value in Crores
   */
  private formatCrores(value: number, fractionSize: number): string {
    const croresValue = value / 10000000;
    const formattedValue = 
      croresValue % 1 === 0 
        ? croresValue.toFixed(0) 
        : croresValue.toFixed(fractionSize);
    
    // Proper singular/plural handling
    const unit = Math.abs(croresValue) === 1 ? 'Crore' : 'Crores';
    return `${formattedValue} ${unit}`;
  }

  /**
   * Format value with Indian number system (commas)
   */
  private formatThousands(value: number): string {
    return Number(value).toLocaleString('en-IN');
  }

  /**
   * Transform number to formatted currency string
   * 
   * @param value - The number to format
   * @param fractionSize - Number of decimal places (default: 2)
   * @returns Formatted string in Lakhs/Crores or with commas
   */
  transform(value: number | null | undefined, fractionSize: number = 2): string {
    // Handle null, undefined, 0, NaN
    if (value == null || isNaN(value) || value === 0) {
      return '0';
    }

    // Handle negative numbers
    const isNegative = value < 0;
    const absoluteValue = Math.abs(value);

    let result: string;

    if (absoluteValue >= 10000000) {
      // 1 Crore or more
      result = this.formatCrores(absoluteValue, fractionSize);
    } else if (absoluteValue >= 100000) {
      // 1 Lakh or more
      result = this.formatLakhs(absoluteValue, fractionSize);
    } else {
      // Less than 1 Lakh - show with commas
      result = this.formatThousands(absoluteValue);
    }

    return isNegative ? `-${result}` : result;
  }
}

/**
 * Extended version with currency symbol support
 * 
 * Usage:
 * {{ 150000 | currencyStringWithSymbol }}        // Output: "₹1.5 Lakhs"
 * {{ 150000 | currencyStringWithSymbol:'$' }}    // Output: "$1.5 Lakhs"
 */
@Pipe({
  name: 'currencyStringWithSymbol',
  standalone: true,
  pure: true
})
export class CurrencyStringWithSymbolPipe extends CurrencyStringPipe {
  /**
   * Transform with currency symbol
   */
  override transform(
    value: number | null | undefined, 
    fractionSize: number = 2,
    symbol: string = '₹'
  ): string {
    const formatted = super.transform(value, fractionSize);
    
    if (formatted === '0') {
      return `${symbol}0`;
    }
    
    return `${symbol}${formatted}`;
  }
}