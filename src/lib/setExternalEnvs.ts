import { setExternalEnvs as setExternalEnvsInMemory } from '../config/envHandler';

/**
 * @param envs
 */
export const setExternalEnvs = (envs: Record<string, any>): void => {
  setExternalEnvsInMemory(envs);
};
