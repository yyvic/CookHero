import { apiGet } from './client';

export interface RecipeBrief {
  id: string;
  dish_name: string;
  category: string;
  difficulty: string;
  excerpt: string;
}

export interface RecipeDetail extends RecipeBrief {
  source: string;
  content: string;
}

export interface RecipeFacet {
  value: string;
  count: number;
}

export interface RecipeFilters {
  categories: RecipeFacet[];
  difficulties: RecipeFacet[];
}

export interface RecipeListResult {
  items: RecipeBrief[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListRecipesParams {
  keyword?: string;
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(params: ListRecipesParams): string {
  const qs = new URLSearchParams();
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.category) qs.set('category', params.category);
  if (params.difficulty) qs.set('difficulty', params.difficulty);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  const q = qs.toString();
  return q ? '?' + q : '';
}

export function getRecipeFilters(token?: string): Promise<RecipeFilters> {
  return apiGet<RecipeFilters>('/recipes/filters', token);
}

export function listRecipes(
  params: ListRecipesParams,
  token?: string
): Promise<RecipeListResult> {
  return apiGet<RecipeListResult>('/recipes' + buildQuery(params), token);
}

export function getRecipe(id: string, token?: string): Promise<RecipeDetail> {
  return apiGet<RecipeDetail>('/recipes/' + encodeURIComponent(id), token);
}
