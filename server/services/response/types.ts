export interface Response {
  content: string;
  raw: { [key: string]: any };
  searchQueries: string[];
  urls: string[];
}
