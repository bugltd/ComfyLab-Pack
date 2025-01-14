import { fetchApi } from './utils.js';
export async function parseConfig(raw) {
    return await fetchApi('config_parse', 'POST', { raw });
}
