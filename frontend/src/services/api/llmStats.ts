/**
 * API functions for LLM usage statistics endpoints
 */

import { API_BASE } from '../../constants';
import { createAuthHeaders } from './client';
import type {
  LLMStatsSummary,
  TimeSeriesResponse,
  ModuleDistributionResponse,
  ModelDistributionResponse,
  ConversationLLMStatsResponse,
  ModulesListResponse,
  ModelsListResponse,
  ToolDistributionResponse,
  ToolsListResponse,
} from '../../types/llmStats';

/**
 * Get aggregated LLM usage summary
 */
export async function getLLMStatsSummary(
  token: string,
  startDate?: string,
  endDate?: string,
  conversationId?: string
): Promise<LLMStatsSummary> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (conversationId) params.append('conversation_id', conversationId);

  const queryString = params.toString();
  const url = `${API_BASE}/llm-stats/summary${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取统计概览失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get LLM usage time series data
 */
export async function getLLMStatsTimeSeries(
  token: string,
  days: number = 7,
  granularity: 'day' | 'hour' = 'day',
  moduleName?: string,
  modelName?: string
): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams({
    days: days.toString(),
    granularity,
  });
  if (moduleName) params.append('module_name', moduleName);
  if (modelName) params.append('model_name', modelName);

  const response = await fetch(`${API_BASE}/llm-stats/time-series?${params}`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取统计时间序列失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get LLM usage distribution by module
 */
export async function getLLMStatsDistributionByModule(
  token: string,
  startDate?: string,
  endDate?: string
): Promise<ModuleDistributionResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const queryString = params.toString();
  const url = `${API_BASE}/llm-stats/distribution/by-module${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取模块分布失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get LLM usage distribution by model
 */
export async function getLLMStatsDistributionByModel(
  token: string,
  startDate?: string,
  endDate?: string
): Promise<ModelDistributionResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const queryString = params.toString();
  const url = `${API_BASE}/llm-stats/distribution/by-model${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取模型分布失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get LLM usage for a specific conversation
 */
export async function getConversationLLMStats(
  token: string,
  conversationId: string,
  limit: number = 100
): Promise<ConversationLLMStatsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  const response = await fetch(
    `${API_BASE}/llm-stats/conversation/${conversationId}?${params}`,
    {
      headers: createAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error(`获取对话统计失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get list of available modules
 */
export async function getLLMStatsModules(token: string): Promise<ModulesListResponse> {
  const response = await fetch(`${API_BASE}/llm-stats/modules`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取模块列表失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get list of available models
 */
export async function getLLMStatsModels(token: string): Promise<ModelsListResponse> {
  const response = await fetch(`${API_BASE}/llm-stats/models`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取模型列表失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get list of available tools
 */
export async function getLLMStatsTools(token: string): Promise<ToolsListResponse> {
  const response = await fetch(`${API_BASE}/llm-stats/tools`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取工具列表失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get LLM usage distribution by tool
 */
export async function getLLMStatsDistributionByTool(
  token: string,
  startDate?: string,
  endDate?: string,
  modelName?: string,
  moduleName?: string
): Promise<ToolDistributionResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (modelName) params.append('model_name', modelName);
  if (moduleName) params.append('module_name', moduleName);

  const queryString = params.toString();
  const url = `${API_BASE}/llm-stats/distribution/by-tool${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取工具分布失败，状态码：${response.status}`);
  }

  return response.json();
}

/**
 * Get tool usage time series data
 */
export async function getLLMStatsToolTimeSeries(
  token: string,
  days: number = 7,
  granularity: 'day' | 'hour' = 'day',
  modelName?: string,
  moduleName?: string
): Promise<TimeSeriesResponse> {
  const params = new URLSearchParams({
    days: days.toString(),
    granularity,
  });
  if (modelName) params.append('model_name', modelName);
  if (moduleName) params.append('module_name', moduleName);

  const response = await fetch(`${API_BASE}/llm-stats/time-series/tools?${params}`, {
    headers: createAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`获取工具时间序列失败，状态码：${response.status}`);
  }

  return response.json();
}
