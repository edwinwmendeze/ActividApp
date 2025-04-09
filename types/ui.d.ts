// types/ui.d.ts
export interface FormErrors {
    [key: string]: string;
  }
  
  export interface FilterOptions {
    busqueda: string;
    tipo: string;
    disponibilidad: string;
  }
  
  export interface DateFormatOptions {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
  }