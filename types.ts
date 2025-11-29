export enum Dynasty {
  TANG = '唐',
  SONG = '宋',
  OTHER = '其他'
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: Dynasty | string;
  content: string[]; // Array of strings for lines, or paragraphs
  tags?: string[];
  translation?: string; // Optional translation
  analysis?: string; // Optional analysis
}

export interface AIResponseState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  structuredPoem?: Poem | null;
}

export enum Tab {
  HOME = 'home',
  LIBRARY = 'library',
  SCHOLAR = 'scholar', // The AI interface
  GAMES = 'games',
}
