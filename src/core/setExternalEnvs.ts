import { setExternalEnvs as setExternalEnvsInMemory } from '../config/envHandler';

export const setExternalEnvs = (envs: Record<string, any>) => {
  setExternalEnvsInMemory(envs);
};
