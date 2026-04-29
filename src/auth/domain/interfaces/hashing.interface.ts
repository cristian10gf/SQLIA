export const HASHING_SERVICE = 'HASHING_SERVICE';

export interface IHashingService {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, hash: string): Promise<boolean>;
}
