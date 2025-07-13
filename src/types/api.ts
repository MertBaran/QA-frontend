export interface ApiResponse<T> {
  data: T;
  [key: string]: any;
}
